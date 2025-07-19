import { PinType } from '$lib/utils/pinStorage';

// Location-based data structure
export interface Location {
	id: string;
	lat: number;
	lng: number;
	name: string; // User-defined name like "Home", "Office", "Park bathroom"
	address?: string;
	createdAt: Date;
	instances: Instance[];
}

export interface Instance {
	id: string;
	locationId: string;
	title: string; // Name of the event/instance
	description?: string;
	types: PinType[];
	createdAt: Date;
}

// Legacy Pin interface for backward compatibility during migration
export interface Pin {
	id: string;
	lat: number;
	lng: number;
	title: string;
	description?: string;
	type: string;
	types?: string[];
	createdAt: Date;
}

// Serialized versions for localStorage
export interface SerializedLocation extends Omit<Location, 'createdAt' | 'instances'> {
	createdAt: string;
	instances: SerializedInstance[];
}

export interface SerializedInstance extends Omit<Instance, 'createdAt'> {
	createdAt: string;
}

// View types
export type ViewType = 'map' | 'date';

// Panel state types
export type PanelState = 'collapsed' | 'partial' | 'expanded';

// Sort order types
export type SortOrder = 'asc' | 'desc';

// Coordinate types
export interface Coordinates {
	lat: number;
	lng: number;
}

// Location creation data (what we receive from map clicks)
export interface LocationCreationData {
	lat: number;
	lng: number;
	name: string;
	address?: string;
}

// Instance creation data (what we receive from forms)
export interface InstanceCreationData {
	locationId: string;
	title: string;
	types: PinType[];
	description?: string;
}

// Pin type utilities
export function getTypeDisplayName(type: string): string {
	switch (type) {
		case PinType.Shit: return 'Shit';
		case PinType.Cum: return 'Cum';
		case PinType.Piss: return 'Piss';
		default: return 'Unknown';
	}
}

export function getPinTypeEmoji(type: string): string {
	switch (type) {
		case PinType.Shit: return '💩';
		case PinType.Cum: return '🍆';
		case PinType.Piss: return '💦';
		default: return '📍';
	}
}

export function getAllPinTypes(): string[] {
	return Object.values(PinType);
}

// Validation utilities
export function isValidCoordinates(coords: any): coords is Coordinates {
	return (
		typeof coords === 'object' &&
		coords !== null &&
		typeof coords.lat === 'number' &&
		typeof coords.lng === 'number' &&
		coords.lat >= -90 &&
		coords.lat <= 90 &&
		coords.lng >= -180 &&
		coords.lng <= 180
	);
}

export function isValidPinType(type: string): type is PinType {
	return Object.values(PinType).includes(type as PinType);
}

// Color utilities for pin types
export function getPinTypeColor(type: string): { main: string; accent: string } {
	switch (type) {
		case PinType.Shit:
			return { main: '#8B4513', accent: '#654321' };
		case PinType.Cum:
			return { main: '#F5F5DC', accent: '#D2B48C' };
		case PinType.Piss:
			return { main: '#FFD700', accent: '#DAA520' };
		default:
			return { main: '#ea4335', accent: '#c1351d' };
	}
}
