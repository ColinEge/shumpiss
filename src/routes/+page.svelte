<script lang="ts">
	import InteractiveMap from '$lib/components/InteractiveMap.svelte';
	import DateView from '$lib/components/DateView.svelte';
	import { LocationStorage } from '$lib/utils/locationStorage';
	import { APP_CONFIG, KEYBOARD_SHORTCUTS } from '$lib/constants';
	import { logger } from '$lib/utils/logger';
	import type { ViewType, Location, Instance } from '$lib/types';
	import { onMount } from 'svelte';
	
	// Component state
	let mapComponent: InteractiveMap;
	let locations: Location[] = [];
	let currentView: ViewType = 'map';
	
	// Load data on mount and keep them synchronized
	onMount(() => {
		loadData();
		setupStorageListener();
		setupKeyboardShortcuts();
	});
	
	function loadData(): void {
		try {
			locations = LocationStorage.loadLocations();
			logger.debug(`Loaded ${locations.length} locations in main page`);
		} catch (error) {
			logger.error('Failed to load data in main page', error);
			locations = [];
		}
	}
	
	function setupStorageListener(): () => void {
		const handleStorageChange = () => {
			logger.debug('Storage changed, reloading data');
			loadData();
		};
		
		window.addEventListener('storage', handleStorageChange);
		
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}

	// Handle navigation to location from date view
	function handleNavigateToLocation(event: CustomEvent<{ locationId: string; instanceId?: string }>): void {
		logger.debug(`Navigating to location: ${event.detail.locationId}, instance: ${event.detail.instanceId}`);
		currentView = 'map';
		
		// Small delay to ensure map is rendered before navigation
		setTimeout(() => {
			mapComponent?.navigateToLocation(event.detail.locationId, event.detail.instanceId);
		}, APP_CONFIG.UI.ANIMATION_DURATION / 3);
	}
	
	// Refresh data when they change (called after operations)
	function refreshData(): void {
		loadData();
	}
	
	// Switch between views
	function switchView(view: ViewType): void {
		if (currentView === view) return;
		
		logger.debug(`Switching view from ${currentView} to ${view}`);
		currentView = view;
		
		if (view === 'date') {
			refreshData();
		}
	}
	
	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent): void {
		const { altKey, key } = event;
		
		// Alt + D for Date view
		if (altKey && key === 'd') {
			event.preventDefault();
			switchView('date');
			return;
		}
		
		// Alt + M for Map view
		if (altKey && key === 'm') {
			event.preventDefault();
			switchView('map');
			return;
		}
	}

	// Setup keyboard shortcuts
	function setupKeyboardShortcuts(): void {
		logger.debug('Setting up keyboard shortcuts');
	}

	// Calculate total item count (instances only)
	$: totalItems = locations.reduce((sum, loc) => sum + loc.instances.length, 0);
</script>

<svelte:head>
	<title>Shumpiss</title>
	<meta name="description" content="Interactive map to track bodily functions and see date-based views" />
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="app-container">
	<!-- View switcher -->
	<div class="view-switcher">
		<div class="view-controls">
			<button 
				class="view-btn {currentView === 'map' ? 'active' : ''}"
				on:click={() => switchView('map')}
				title="Map View ({KEYBOARD_SHORTCUTS.SWITCH_TO_MAP_VIEW})"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
					<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
				</svg>
				Map View
			</button>
			<button 
				class="view-btn {currentView === 'date' ? 'active' : ''}"
				on:click={() => switchView('date')}
				title="Date View ({KEYBOARD_SHORTCUTS.SWITCH_TO_DATE_VIEW})"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
					<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
				</svg>
				Date View
			</button>
		</div>
		
		<div class="pin-count">
			{totalItems} item{totalItems === 1 ? '' : 's'}
			{#if locations.length > 0}
				<span class="count-breakdown">({locations.length} location{locations.length === 1 ? '' : 's'})</span>
			{/if}
		</div>
	</div>
	
	<!-- Main content -->
	<div class="content">
		{#if currentView === 'map'}
			{#key currentView}
				<InteractiveMap 
					bind:this={mapComponent}
					initialCenter={APP_CONFIG.MAP.DEFAULT_CENTER} 
					initialZoom={APP_CONFIG.MAP.DEFAULT_ZOOM}
					on:locationCreated={refreshData}
					on:instanceCreated={refreshData}
					on:locationDeleted={refreshData}
					on:instanceDeleted={refreshData}
				/>
			{/key}
		{:else}
			<DateView 
				{locations}
				on:navigateToLocation={handleNavigateToLocation}
			/>
		{/if}
	</div>
</div>

<style>
	.app-container {
		width: 100vw;
		height: 100vh;
		margin: 0;
		padding: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.view-switcher {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		border-bottom: 1px solid #e8eaed;
		padding: 12px 20px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		z-index: 1001;
		position: relative;
	}
	
	.view-controls {
		display: flex;
		gap: 8px;
	}
	
	.view-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: none;
		border: 1px solid #e8eaed;
		border-radius: 24px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		color: #5f6368;
		transition: all 0.2s ease;
		position: relative;
	}
	
	.view-btn:hover {
		background: #f8f9fa;
		border-color: #dadce0;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	
	.view-btn.active {
		background: #1a73e8;
		border-color: #1a73e8;
		color: white;
		box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
	}
	
	.view-btn.active:hover {
		background: #1557b0;
		transform: translateY(-1px);
	}
	
	.pin-count {
		font-size: 14px;
		color: #5f6368;
		font-weight: 500;
		padding: 8px 12px;
		background: #f8f9fa;
		border-radius: 16px;
		border: 1px solid #e8eaed;
	}

	.count-breakdown {
		font-size: 12px;
		opacity: 0.8;
		margin-left: 4px;
	}
	
	.content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.view-switcher {
			padding: 8px 12px;
			flex-wrap: wrap;
			gap: 8px;
		}
		
		.view-controls {
			flex: 1;
			justify-content: center;
		}
		
		.view-btn {
			padding: 8px 14px;
			font-size: 13px;
			flex: 1;
			justify-content: center;
			max-width: 140px;
		}
		
		.pin-count {
			font-size: 12px;
			padding: 6px 10px;
		}
	}
	
	/* Ensure body styling */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	:global(html) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
