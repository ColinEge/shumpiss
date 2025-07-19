import { APP_CONFIG } from '$lib/constants';

const { TIME, SHORT_DATE, FULL_DATE } = APP_CONFIG.DATE_FORMAT;

/**
 * Formats a date as time (e.g., "3:45 PM")
 */
export function formatTime(date: Date): string {
	return date.toLocaleTimeString([], TIME);
}

/**
 * Formats a date for pin display - "Today @ Time" or "Date @ Time"
 */
export function formatPinDateTime(date: Date): string {
	const today = new Date();
	const isToday = date.toDateString() === today.toDateString();
	
	if (isToday) {
		return `Today @ ${formatTime(date)}`;
	} else {
		const dateStr = date.toLocaleDateString([], SHORT_DATE);
		const timeStr = formatTime(date);
		return `${dateStr} @ ${timeStr}`;
	}
}

/**
 * Formats a date for date group headers
 */
export function formatDateGroupHeader(dateString: string): string {
	const date = new Date(dateString + 'T00:00:00');
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	
	if (date.toDateString() === today.toDateString()) {
		return 'Today';
	} else if (date.toDateString() === yesterday.toDateString()) {
		return 'Yesterday';
	} else {
		return date.toLocaleDateString([], FULL_DATE);
	}
}

/**
 * Gets the date key for grouping pins by date
 */
export function getDateKey(date: Date): string {
	return date.toLocaleDateString();
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return date.toDateString() === today.toDateString();
}

/**
 * Checks if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return date.toDateString() === yesterday.toDateString();
}

/**
 * Gets relative date string (Today, Yesterday, or formatted date)
 */
export function getRelativeDateString(date: Date): string {
	if (isToday(date)) return 'Today';
	if (isYesterday(date)) return 'Yesterday';
	return date.toLocaleDateString([], FULL_DATE);
}
