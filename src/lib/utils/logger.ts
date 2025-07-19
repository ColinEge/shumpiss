import { browser } from '$app/environment';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

class Logger {
	private level: LogLevel = LogLevel.INFO;
	
	constructor() {
		// Set log level based on environment
		if (browser && typeof window !== 'undefined') {
			const isDev = window.location.hostname === 'localhost' || 
						  window.location.hostname === '127.0.0.1';
			this.level = isDev ? LogLevel.DEBUG : LogLevel.WARN;
		}
	}
	
	private shouldLog(level: LogLevel): boolean {
		return level >= this.level;
	}
	
	private formatMessage(level: string, message: string, context?: any): string {
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [${level}]`;
		return context ? `${prefix} ${message}` : `${prefix} ${message}`;
	}
	
	debug(message: string, context?: any): void {
		if (!this.shouldLog(LogLevel.DEBUG)) return;
		console.debug(this.formatMessage('DEBUG', message), context || '');
	}
	
	info(message: string, context?: any): void {
		if (!this.shouldLog(LogLevel.INFO)) return;
		console.info(this.formatMessage('INFO', message), context || '');
	}
	
	warn(message: string, context?: any): void {
		if (!this.shouldLog(LogLevel.WARN)) return;
		console.warn(this.formatMessage('WARN', message), context || '');
	}
	
	error(message: string, error?: Error | any): void {
		if (!this.shouldLog(LogLevel.ERROR)) return;
		console.error(this.formatMessage('ERROR', message), error || '');
	}
}

export const logger = new Logger();

// Error handling utilities
export class AppError extends Error {
	constructor(
		message: string,
		public code: string,
		public context?: any
	) {
		super(message);
		this.name = 'AppError';
	}
}

export function handleAsyncError<T>(
	operation: () => Promise<T>,
	errorMessage: string,
	errorCode: string
): Promise<T | null> {
	return operation().catch((error) => {
		logger.error(`${errorMessage}: ${error.message}`, error);
		throw new AppError(errorMessage, errorCode, error);
	});
}

export function handleSyncError<T>(
	operation: () => T,
	errorMessage: string,
	errorCode: string
): T | null {
	try {
		return operation();
	} catch (error) {
		logger.error(`${errorMessage}: ${(error as Error).message}`, error);
		throw new AppError(errorMessage, errorCode, error);
	}
}
