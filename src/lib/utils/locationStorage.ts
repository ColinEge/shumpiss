import { browser } from '$app/environment';
import { APP_CONFIG, ERROR_MESSAGES } from '$lib/constants';
import { logger, AppError, handleSyncError } from '$lib/utils/logger';
import { PinType } from './pinStorage';
import type { Location, Instance, SerializedLocation, SerializedInstance, LocationCreationData, InstanceCreationData } from '$lib/types';

const { PIN_STORAGE_KEY } = APP_CONFIG.STORAGE;
const LOCATIONS_STORAGE_KEY = 'map-locations'; // New storage key for locations
const { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, ID_LENGTH } = APP_CONFIG.PINS;

export class LocationStorage {
	// Location management
	static saveLocations(locations: Location[]): void {
		if (!browser) return;
		
		return handleSyncError(
			() => {
				const serializedLocations: SerializedLocation[] = locations.map(location => ({
					...location,
					createdAt: location.createdAt.toISOString(),
					instances: location.instances.map(instance => ({
						...instance,
						createdAt: instance.createdAt.toISOString()
					}))
				}));
				localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(serializedLocations));
				logger.debug(`Saved ${locations.length} locations with ${locations.reduce((sum, loc) => sum + loc.instances.length, 0)} total instances`);
			},
			ERROR_MESSAGES.STORAGE_SAVE_FAILED,
			'LOCATIONS_SAVE_ERROR'
		) || undefined;
	}

	static loadLocations(): Location[] {
		if (!browser) return [];
		
		return handleSyncError(
			() => {
				const stored = localStorage.getItem(LOCATIONS_STORAGE_KEY);
				if (!stored) {
					logger.debug('No locations found in localStorage');
					return [];
				}

				const parsed = JSON.parse(stored) as SerializedLocation[];
				const locations = parsed.map((location) => ({
					...location,
					createdAt: new Date(location.createdAt),
					instances: location.instances.map(instance => ({
						...instance,
						createdAt: new Date(instance.createdAt)
					}))
				}));
				
				logger.debug(`Loaded ${locations.length} locations with ${locations.reduce((sum, loc) => sum + loc.instances.length, 0)} total instances`);
				return locations;
			},
			ERROR_MESSAGES.STORAGE_LOAD_FAILED,
			'LOCATIONS_LOAD_ERROR'
		) || [];
	}

	static addLocation(locationData: LocationCreationData): Location {
		// Validate input
		if (!locationData.name.trim() || locationData.name.length > MAX_TITLE_LENGTH) {
			throw new AppError('Invalid location name', 'INVALID_LOCATION_NAME');
		}

		const newLocation: Location = {
			...locationData,
			id: this.generateId(),
			createdAt: new Date(),
			name: locationData.name.trim(),
			address: locationData.address?.trim() || undefined,
			instances: []
		};

		const locations = this.loadLocations();
		locations.push(newLocation);
		this.saveLocations(locations);

		logger.info(`Created new location: ${newLocation.name}`, { id: newLocation.id });
		return newLocation;
	}

	static updateLocation(updatedLocation: Location): void {
		const locations = this.loadLocations();
		const index = locations.findIndex(l => l.id === updatedLocation.id);
		
		if (index === -1) {
			throw new AppError('Location not found', 'LOCATION_NOT_FOUND', { locationId: updatedLocation.id });
		}
		
		// Validate updated location
		if (!updatedLocation.name.trim() || updatedLocation.name.length > MAX_TITLE_LENGTH) {
			throw new AppError('Invalid location name', 'INVALID_LOCATION_NAME');
		}
		
		locations[index] = {
			...updatedLocation,
			name: updatedLocation.name.trim(),
			address: updatedLocation.address?.trim() || undefined
		};
		this.saveLocations(locations);
		
		logger.info(`Updated location: ${updatedLocation.name}`, { id: updatedLocation.id });
	}

	static deleteLocation(locationId: string): void {
		if (!locationId) {
			throw new AppError('Invalid location ID', 'INVALID_LOCATION_ID');
		}
		
		const locations = this.loadLocations();
		const initialLength = locations.length;
		const filtered = locations.filter(l => l.id !== locationId);
		
		if (filtered.length === initialLength) {
			logger.warn(`Attempted to delete non-existent location: ${locationId}`);
			return;
		}
		
		this.saveLocations(filtered);
		logger.info(`Deleted location: ${locationId}`);
	}

	// Instance management
	static addInstance(instanceData: InstanceCreationData): Instance {
		// Validate input
		if (!instanceData.types.length) {
			throw new AppError('At least one type must be selected', 'INVALID_INSTANCE_TYPES');
		}
		
		if (instanceData.description && instanceData.description.length > MAX_DESCRIPTION_LENGTH) {
			throw new AppError('Instance description too long', 'INVALID_INSTANCE_DESCRIPTION');
		}

		const newInstance: Instance = {
			...instanceData,
			id: this.generateId(),
			createdAt: new Date(),
			description: instanceData.description?.trim() || undefined
		};

		const locations = this.loadLocations();
		const locationIndex = locations.findIndex(l => l.id === instanceData.locationId);
		
		if (locationIndex === -1) {
			throw new AppError('Location not found', 'LOCATION_NOT_FOUND', { locationId: instanceData.locationId });
		}

		locations[locationIndex].instances.push(newInstance);
		this.saveLocations(locations);

		logger.info(`Created new instance at location: ${locations[locationIndex].name}`, { 
			instanceId: newInstance.id, 
			locationId: instanceData.locationId,
			types: instanceData.types 
		});
		return newInstance;
	}

	static updateInstance(updatedInstance: Instance): void {
		const locations = this.loadLocations();
		const location = locations.find(l => l.id === updatedInstance.locationId);
		
		if (!location) {
			throw new AppError('Location not found', 'LOCATION_NOT_FOUND', { locationId: updatedInstance.locationId });
		}
		
		const instanceIndex = location.instances.findIndex(i => i.id === updatedInstance.id);
		
		if (instanceIndex === -1) {
			throw new AppError('Instance not found', 'INSTANCE_NOT_FOUND', { instanceId: updatedInstance.id });
		}
		
		// Validate updated instance
		if (!updatedInstance.types.length) {
			throw new AppError('At least one type must be selected', 'INVALID_INSTANCE_TYPES');
		}
		
		location.instances[instanceIndex] = {
			...updatedInstance,
			description: updatedInstance.description?.trim() || undefined
		};
		this.saveLocations(locations);
		
		logger.info(`Updated instance: ${updatedInstance.id}`, { locationId: updatedInstance.locationId });
	}

	static deleteInstance(locationId: string, instanceId: string): void {
		if (!locationId || !instanceId) {
			throw new AppError('Invalid location or instance ID', 'INVALID_IDS');
		}
		
		const locations = this.loadLocations();
		const location = locations.find(l => l.id === locationId);
		
		if (!location) {
			throw new AppError('Location not found', 'LOCATION_NOT_FOUND', { locationId });
		}
		
		const initialLength = location.instances.length;
		location.instances = location.instances.filter(i => i.id !== instanceId);
		
		if (location.instances.length === initialLength) {
			logger.warn(`Attempted to delete non-existent instance: ${instanceId}`);
			return;
		}
		
		this.saveLocations(locations);
		logger.info(`Deleted instance: ${instanceId} from location: ${locationId}`);
	}

	// Utility methods
	static clearAllData(): void {
		if (!browser) return;
		
		const locations = this.loadLocations();
		const totalInstances = locations.reduce((sum, loc) => sum + loc.instances.length, 0);
		
		localStorage.removeItem(LOCATIONS_STORAGE_KEY);
		logger.info(`Cleared all data (${locations.length} locations, ${totalInstances} instances deleted)`);
	}

	static exportData(): string {
		const locations = this.loadLocations();
		return JSON.stringify(locations, null, 2);
	}

	static importData(jsonData: string): Location[] {
		try {
			const parsed = JSON.parse(jsonData) as SerializedLocation[];
			const locations = parsed.map((location) => ({
				...location,
				createdAt: new Date(location.createdAt),
				instances: location.instances.map(instance => ({
					...instance,
					createdAt: new Date(instance.createdAt)
				}))
			}));
			this.saveLocations(locations);
			return locations;
		} catch (error) {
			logger.error('Failed to import locations:', error);
			throw new AppError('Invalid location data format', 'INVALID_IMPORT_DATA');
		}
	}

	// Helper methods for working with the data
	static getAllInstances(): Instance[] {
		const locations = this.loadLocations();
		return locations.flatMap(location => location.instances);
	}

	static getInstancesByDate(ascending: boolean = false): Instance[] {
		const instances = this.getAllInstances();
		return instances.sort((a, b) => {
			const timeA = a.createdAt.getTime();
			const timeB = b.createdAt.getTime();
			return ascending ? timeA - timeB : timeB - timeA;
		});
	}

	static getLocationById(locationId: string): Location | null {
		const locations = this.loadLocations();
		return locations.find(l => l.id === locationId) || null;
	}

	static getInstanceById(instanceId: string): { location: Location; instance: Instance } | null {
		const locations = this.loadLocations();
		for (const location of locations) {
			const instance = location.instances.find(i => i.id === instanceId);
			if (instance) {
				return { location, instance };
			}
		}
		return null;
	}

	private static generateId(): string {
		return Date.now().toString() + Math.random().toString(36).substr(2, ID_LENGTH - 13);
	}
}

// Note: PinStorage and Pin are exported through the main lib index.ts
