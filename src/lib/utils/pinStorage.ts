import { browser } from '$app/environment';
import { APP_CONFIG, ERROR_MESSAGES } from '$lib/constants';
import { logger, AppError, handleSyncError } from '$lib/utils/logger';

export enum PinType {
    Shit = 'shit',
    Cum = 'cum',
    Piss = 'piss'
}

export interface Pin {
	id: string;
	lat: number;
	lng: number;
	title: string;
	description?: string;
	type: string; // Primary type for backward compatibility
	types?: string[]; // Multiple types array
	createdAt: Date;
}

// Type for serialized pin (with string createdAt)
interface SerializedPin extends Omit<Pin, 'createdAt'> {
	createdAt: string;
}

const { PIN_STORAGE_KEY } = APP_CONFIG.STORAGE;
const { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, ID_LENGTH } = APP_CONFIG.PINS;

export class PinStorage {
	static savePins(pins: Pin[]): void {
		if (!browser) return;
		
		return handleSyncError(
			() => {
				const serializedPins: SerializedPin[] = pins.map(pin => ({
					...pin,
					createdAt: pin.createdAt.toISOString()
				}));
				localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(serializedPins));
				logger.debug(`Saved ${pins.length} pins to localStorage`);
			},
			ERROR_MESSAGES.STORAGE_SAVE_FAILED,
			'STORAGE_SAVE_ERROR'
		) || undefined;
	}

	static loadPins(): Pin[] {
		if (!browser) return [];
		
		return handleSyncError(
			() => {
				const stored = localStorage.getItem(PIN_STORAGE_KEY);
				if (!stored) {
					logger.debug('No pins found in localStorage');
					return [];
				}

				const parsed = JSON.parse(stored) as SerializedPin[];
				const pins = parsed.map((pin) => ({
					...pin,
					createdAt: new Date(pin.createdAt)
				}));
				
				logger.debug(`Loaded ${pins.length} pins from localStorage`);
				return pins;
			},
			ERROR_MESSAGES.STORAGE_LOAD_FAILED,
			'STORAGE_LOAD_ERROR'
		) || [];
	}

	static addPin(pin: Omit<Pin, 'id' | 'createdAt'>): Pin {
		// Validate input
		if (!pin.title.trim() || pin.title.length > MAX_TITLE_LENGTH) {
			throw new AppError('Invalid pin title', 'INVALID_PIN_TITLE');
		}
		
		if (pin.description && pin.description.length > MAX_DESCRIPTION_LENGTH) {
			throw new AppError('Pin description too long', 'INVALID_PIN_DESCRIPTION');
		}

		const newPin: Pin = {
			...pin,
			id: this.generateId(),
			createdAt: new Date(),
			title: pin.title.trim(),
			description: pin.description?.trim() || undefined
		};

		const pins = this.loadPins();
		pins.push(newPin);
		this.savePins(pins);

		logger.info(`Created new pin: ${newPin.title}`, { id: newPin.id });
		return newPin;
	}

	private static generateId(): string {
		return Date.now().toString() + Math.random().toString(36).substr(2, ID_LENGTH - 13);
	}

	static updatePin(updatedPin: Pin): void {
		const pins = this.loadPins();
		const index = pins.findIndex(p => p.id === updatedPin.id);
		
		if (index === -1) {
			throw new AppError('Pin not found', 'PIN_NOT_FOUND', { pinId: updatedPin.id });
		}
		
		// Validate updated pin
		if (!updatedPin.title.trim() || updatedPin.title.length > MAX_TITLE_LENGTH) {
			throw new AppError('Invalid pin title', 'INVALID_PIN_TITLE');
		}
		
		pins[index] = {
			...updatedPin,
			title: updatedPin.title.trim(),
			description: updatedPin.description?.trim() || undefined
		};
		this.savePins(pins);
		
		logger.info(`Updated pin: ${updatedPin.title}`, { id: updatedPin.id });
	}

	static deletePin(pinId: string): void {
		if (!pinId) {
			throw new AppError('Invalid pin ID', 'INVALID_PIN_ID');
		}
		
		const pins = this.loadPins();
		const initialLength = pins.length;
		const filtered = pins.filter(p => p.id !== pinId);
		
		if (filtered.length === initialLength) {
			logger.warn(`Attempted to delete non-existent pin: ${pinId}`);
			return;
		}
		
		this.savePins(filtered);
		logger.info(`Deleted pin: ${pinId}`);
	}

	static clearAllPins(): void {
		if (!browser) return;
		
		const pinCount = this.loadPins().length;
		localStorage.removeItem(PIN_STORAGE_KEY);
		logger.info(`Cleared all pins (${pinCount} pins deleted)`);
	}

	static exportPins(): string {
		const pins = this.loadPins();
		return JSON.stringify(pins, null, 2);
	}

	static importPins(jsonData: string): Pin[] {
		try {
			const parsed = JSON.parse(jsonData);
			const pins = parsed.map((pin: any) => ({
				...pin,
				createdAt: new Date(pin.createdAt)
			}));
			this.savePins(pins);
			return pins;
		} catch (error) {
			console.error('Failed to import pins:', error);
			throw new Error('Invalid pin data format');
		}
	}

	static getPinsByDate(ascending: boolean = false): Pin[] {
		const pins = this.loadPins();
		return pins.sort((a, b) => {
			const timeA = a.createdAt.getTime();
			const timeB = b.createdAt.getTime();
			return ascending ? timeA - timeB : timeB - timeA;
		});
	}

	static getPinsByDateGrouped(): { [date: string]: Pin[] } {
		const pins = this.getPinsByDate(false); // Most recent first
		const grouped: { [date: string]: Pin[] } = {};

		pins.forEach(pin => {
			const dateKey = pin.createdAt.toLocaleDateString();
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(pin);
		});

		return grouped;
	}
}
