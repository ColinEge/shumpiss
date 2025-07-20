<script lang="ts">
	import InteractiveMap from '$lib/components/InteractiveMap.svelte';
	import DateView from '$lib/components/DateView.svelte';
	import DateSwitchFab from '$lib/components/DateSwitchFab.svelte';
	import { LocationStorage } from '$lib/utils/locationStorage';
	import { APP_CONFIG } from '$lib/constants';
	import { logger } from '$lib/utils/logger';
	import type { ViewType, Location, Instance } from '$lib/types';
	import { onMount } from 'svelte';

	// Component state
	let mapComponent: InteractiveMap;
	let locations: Location[] = [];
	let currentView: ViewType = 'map';
	let shouldHideMapControls: boolean = false;

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
	function handleNavigateToLocation(
		event: CustomEvent<{ locationId: string; instanceId?: string }>
	): void {
		logger.debug(
			`Navigating to location: ${event.detail.locationId}, instance: ${event.detail.instanceId}`
		);
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
		console.log('switchView called with:', view, 'current:', currentView);
		if (currentView === view) return;

		logger.debug(`Switching view from ${currentView} to ${view}`);
		currentView = view;

		if (view === 'date') {
			refreshData();
		}
	}

	// Handle FAB click
	function handleSwitchToDate(): void {
		switchView('date');
	}

	// Handle control visibility changes from map
	function handleControlVisibilityChange(event: CustomEvent<{ shouldHide: boolean }>): void {
		shouldHideMapControls = event.detail.shouldHide;
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

		// Escape to go back to map from date view
		if (key === 'Escape' && currentView === 'date') {
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
	<meta
		name="description"
		content="Interactive map to track bodily functions and see date-based views"
	/>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="app-container">
	{#if currentView === 'map'}
		<InteractiveMap
			bind:this={mapComponent}
			initialCenter={APP_CONFIG.MAP.DEFAULT_CENTER}
			initialZoom={APP_CONFIG.MAP.DEFAULT_ZOOM}
			on:locationCreated={refreshData}
			on:instanceCreated={refreshData}
			on:locationDeleted={refreshData}
			on:instanceDeleted={refreshData}
			on:controlVisibilityChange={handleControlVisibilityChange}
		>
			<div slot="view-switcher">
				<DateSwitchFab on:click={handleSwitchToDate} />
			</div>
		</InteractiveMap>
	{:else}
		<DateView
			{locations}
			{totalItems}
			on:navigateToLocation={handleNavigateToLocation}
			on:switchView={(e) => switchView(e.detail.view)}
		/>
	{/if}
</div>

<style>
	.app-container {
		width: 100vw;
		height: 100vh;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	/* Ensure body styling */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	:global(html) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
