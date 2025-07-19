// Application constants
export const APP_CONFIG = {
	// Map configuration
	MAP: {
		DEFAULT_CENTER: [53.4084, -2.9916] as [number, number],
		DEFAULT_ZOOM: 13,
		MAX_ZOOM: 19,
	},
	
	// Storage configuration
	STORAGE: {
		PIN_STORAGE_KEY: 'map-pins',
		STORAGE_VERSION: 1, // For future migrations
	},
	
	// UI configuration
	UI: {
		PANEL_HEIGHTS: {
			COLLAPSED: 60,
			PARTIAL: 200,
			EXPANDED_OFFSET: 0.2, // 20vh from top
		},
		ANIMATION_DURATION: 300,
		SEARCH_DEBOUNCE: 300,
	},
	
	// Pin configuration
	PINS: {
		MAX_TITLE_LENGTH: 100,
		MAX_DESCRIPTION_LENGTH: 500,
		ID_LENGTH: 16,
	},
	
	// Date formatting
	DATE_FORMAT: {
		TIME: { hour: '2-digit', minute: '2-digit' } as const,
		SHORT_DATE: { month: 'short', day: 'numeric' } as const,
		FULL_DATE: { 
			weekday: 'long', 
			month: 'long', 
			day: 'numeric', 
			year: 'numeric' 
		} as const,
	},
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
	SWITCH_TO_DATE_VIEW: 'Alt+D',
	SWITCH_TO_MAP_VIEW: 'Alt+M',
	ESCAPE: 'Escape',
} as const;

// Error messages
export const ERROR_MESSAGES = {
	STORAGE_SAVE_FAILED: 'Failed to save pins',
	STORAGE_LOAD_FAILED: 'Failed to load pins',
	INVALID_PIN_DATA: 'Invalid pin data format',
	GEOLOCATION_FAILED: 'Could not get your location. Please make sure location access is enabled.',
	GEOLOCATION_UNSUPPORTED: 'Geolocation is not supported by this browser.',
} as const;
