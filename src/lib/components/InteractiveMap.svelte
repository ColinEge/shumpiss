<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';
	import MapComponent from './MapComponent.svelte';
	import LocationPanel from './LocationPanel.svelte';
	import { LocationStorage } from '$lib/utils/locationStorage';
	import type { LatLng, Map } from 'leaflet';
	import type { Location, Instance } from '$lib/types';

	const dispatch = createEventDispatcher<{
		locationCreated: { location: Location };
		instanceCreated: { instance: Instance };
		locationUpdated: { location: Location };
		instanceUpdated: { instance: Instance };
		locationDeleted: { locationId: string };
		instanceDeleted: { locationId: string; instanceId: string };
		controlVisibilityChange: { shouldHide: boolean };
	}>();

	export let initialCenter: [number, number] = [53.4076, -2.9921];
	export let initialZoom: number = 13;

	let mapComponent: MapComponent;
	let map: Map;
	let locations: Location[] = [];
	let searchQuery: string = '';
	let isSearching: boolean = false;
	let panelState: 'collapsed' | 'partial' | 'expanded' = 'collapsed';
	let selectedLocation: { lat: number; lng: number; address?: string } | null = null;
	let isCreatingLocation = false;
	let selectedLocationForInstance: Location | null = null;
	let isCreatingInstance = false;
	let isPopupOpen = false;

	// Determine if controls should be hidden
	$: shouldHideControls = isPopupOpen || panelState !== 'collapsed';
	
	// Dispatch control visibility changes to parent (with safeguard)
	$: if (browser) {
		dispatch('controlVisibilityChange', { shouldHide: shouldHideControls });
	}

	// Load locations from storage on mount
	onMount(() => {
		if (browser) {
			locations = LocationStorage.loadLocations();
			console.log('Loaded locations:', locations);
		}
	});

	// Handle map events
	function handleMapClick(event: CustomEvent<{ latlng: LatLng }>) {
		// Don't create new locations if we're currently creating one
		if (isCreatingLocation || isCreatingInstance) return;
		
		// Create a new location
		createPendingLocation(event.detail.latlng);
	}

	function handleMapReady(event: CustomEvent<{ map: Map }>) {
		map = event.detail.map;
	}

	function handlePopupOpen(event: CustomEvent<{ open: boolean }>) {
		isPopupOpen = event.detail.open;
	}

	function handleLocationClick(event: CustomEvent<{ location: Location }>) {
		// Select the location to add an instance to it
		selectedLocationForInstance = event.detail.location;
		selectedLocation = {
			lat: event.detail.location.lat,
			lng: event.detail.location.lng
		};
		
		// Show instance creation form
		isCreatingInstance = true;
		isCreatingLocation = false;
		panelState = 'expanded';
		
		// Focus the map on the location
		if (mapComponent) {
			mapComponent.panTo(event.detail.location.lat, event.detail.location.lng, 16);
		}
	}

	// Create a pending location that shows on map but isn't saved yet
	async function createPendingLocation(latlng: LatLng) {
		console.log('Creating pending location at:', latlng);
		
		selectedLocation = {
			lat: latlng.lat,
			lng: latlng.lng
		};

		// Show location creation form
		isCreatingLocation = true;
		isCreatingInstance = false;
		panelState = 'expanded';
		
		console.log('Location creation setup:', { isCreatingLocation, isCreatingInstance, panelState });
	}

	// Handle panel events
	function handlePanelStateChange(event: CustomEvent<{ state: 'collapsed' | 'partial' | 'expanded' }>) {
		panelState = event.detail.state;
		if (panelState === 'collapsed') {
			selectedLocation = null;
			selectedLocationForInstance = null;
			isCreatingLocation = false;
			isCreatingInstance = false;
		}
	}

	function handleCreateLocation(event: CustomEvent<{ name: string; address?: string }>) {
		if (!selectedLocation) return;
		
		// Create the location
		const newLocation = LocationStorage.addLocation({
			lat: selectedLocation.lat,
			lng: selectedLocation.lng,
			name: event.detail.name,
			address: event.detail.address
		});
		
		locations = [...locations, newLocation];
		dispatch('locationCreated', { location: newLocation });
		
		// Reset state
		isCreatingLocation = false;
		selectedLocation = null;
		panelState = 'collapsed';
	}

	function handleCancelLocation() {
		// Reset state
		isCreatingLocation = false;
		selectedLocation = null;
		panelState = 'collapsed';
	}

	function handleCreateInstance(event: CustomEvent<{ title: string; description?: string; types: string[] }>) {
		if (!selectedLocationForInstance) return;
		
		// Create the instance
		const newInstance = LocationStorage.addInstance({
			locationId: selectedLocationForInstance.id,
			title: event.detail.title,
			types: event.detail.types as any[],
			description: event.detail.description
		});
		
		// Reload locations to get updated data with new instance
		locations = LocationStorage.loadLocations();
		
		dispatch('instanceCreated', { instance: newInstance });
		
		// Reset state
		isCreatingInstance = false;
		selectedLocationForInstance = null;
		selectedLocation = null;
		panelState = 'collapsed';
	}

	function handleCancelInstance() {
		// Reset state
		isCreatingInstance = false;
		selectedLocationForInstance = null;
		selectedLocation = null;
		panelState = 'collapsed';
	}

	// Search functionality
	async function handleSearch() {
		if (!browser || !searchQuery.trim() || isSearching) return;
		
		isSearching = true;
		try {
			const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
			const results = await response.json();
			
			if (results.length > 0) {
				const result = results[0];
				const lat = parseFloat(result.lat);
				const lng = parseFloat(result.lon);
				
				// Pan to location
				if (mapComponent) {
					mapComponent.panTo(lat, lng, 15);
				}
				
				// Don't show location details panel for search results
				searchQuery = '';
			} else {
				alert('Location not found. Please try a different search term.');
			}
		} catch (error) {
			console.error('Search error:', error);
			alert('Search failed. Please try again.');
		} finally {
			isSearching = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	// Get current location
	function getCurrentLocation() {
		if (mapComponent) {
			mapComponent.getCurrentLocation();
		}
	}

	// Navigate to a specific location (and optionally instance) by ID
	export function navigateToLocation(locationId: string, instanceId?: string) {
		const location = locations.find(l => l.id === locationId);
		if (location && mapComponent) {
			mapComponent.panTo(location.lat, location.lng, 16);
			if (instanceId) {
				console.log(`Navigated to location ${locationId}, highlighting instance ${instanceId}`);
			}
		}
	}

	// Export function to get locations with instances sorted by date
	export function getLocationsByDate(ascending: boolean = false) {
		const allLocations = LocationStorage.loadLocations();
		return allLocations.sort((a, b) => {
			const dateA = new Date(a.createdAt);
			const dateB = new Date(b.createdAt);
			return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
		});
	}

	// Export function to get all instances grouped by date
	export function getInstancesByDateGrouped() {
		const allLocations = LocationStorage.loadLocations();
		const grouped: { [key: string]: (Instance & { location: Location })[] } = {};
		
		allLocations.forEach(location => {
			location.instances.forEach(instance => {
				const dateKey = new Date(instance.createdAt).toDateString();
				if (!grouped[dateKey]) {
					grouped[dateKey] = [];
				}
				grouped[dateKey].push({ ...instance, location });
			});
		});
		
		return grouped;
	}
</script>

<div class="map-wrapper">
	<MapComponent 
		bind:this={mapComponent}
		{initialCenter}
		{initialZoom}
		{locations}
		on:mapClick={handleMapClick}
		on:mapReady={handleMapReady}
		on:locationClick={handleLocationClick}
		on:popupOpen={handlePopupOpen}
	/>
	
	<!-- Floating controls -->
	<div class="map-controls" class:hidden={shouldHideControls}>
		<div class="search-box">
			<input 
				type="text" 
				placeholder="Search for a place..." 
				class="search-input"
				bind:value={searchQuery}
				on:keydown={handleKeydown}
				disabled={isSearching}
			/>
			<button 
				class="search-button"
				on:click={handleSearch}
				disabled={isSearching || !searchQuery.trim()}
				aria-label="Search location"
			>
				{#if isSearching}
					<div class="loading-spinner"></div>
				{:else}
					<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"/>
						<path d="m21 21-4.35-4.35"/>
					</svg>
				{/if}
			</button>
			<slot name="view-switcher"></slot>
		</div>
	</div>

	<!-- My Location button -->
	<div class="location-control" class:hidden={shouldHideControls}>
		<button 
			class="location-button"
			on:click={getCurrentLocation}
			aria-label="Get my location"
			title="Get my location"
		>
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
			</svg>
		</button>
	</div>

	<LocationPanel
		{panelState}
		{selectedLocation}
		{selectedLocationForInstance}
		{isCreatingLocation}
		{isCreatingInstance}
		on:panelStateChange={handlePanelStateChange}
		on:createLocation={handleCreateLocation}
		on:cancelLocation={handleCancelLocation}
		on:createInstance={handleCreateInstance}
		on:cancelInstance={handleCancelInstance}
	/>
</div>

<style>
	.map-wrapper {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}

	/* Map controls */
	.map-controls {
		position: absolute;
		top: 20px;
		left: 20px;
		right: 20px;
		z-index: 1000;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		gap: 16px;
		transition: opacity 0.3s ease, transform 0.3s ease;
	}

	.map-controls.hidden {
		opacity: 0;
		transform: translateY(-10px);
		pointer-events: none;
	}

	.search-box {
		display: flex;
		align-items: center;
		background: white;
		border-radius: 24px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.2);
		overflow: hidden;
		max-width: 400px;
		width: 100%;
	}

	.search-input {
		flex: 1;
		padding: 12px 16px;
		border: none;
		outline: none;
		font-size: 14px;
		background: transparent;
	}

	.search-input::placeholder {
		color: #9aa0a6;
	}

	.search-button {
		width: 48px;
		height: 48px;
		border: none;
		background: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #5f6368;
	}

	.search-button:hover:not(:disabled) {
		background: #f8f9fa;
	}

	.search-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.search-icon {
		width: 20px;
		height: 20px;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #f3f3f3;
		border-top: 2px solid #5f6368;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* My Location control */
	.location-control {
		position: absolute;
		bottom: 120px;
		right: 20px;
		z-index: 1000;
		transition: opacity 0.3s ease, transform 0.3s ease;
	}

	.location-control.hidden {
		opacity: 0;
		transform: translateY(10px);
		pointer-events: none;
	}

	.location-button {
		width: 48px;
		height: 48px;
		background: white;
		border: none;
		border-radius: 50%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #5f6368;
		transition: all 0.3s ease;
	}

	.location-button:hover {
		background: #f8f9fa;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}
	
	.location-button:active {
		transform: scale(1.02);
	}

	.location-button svg {
		width: 20px;
		height: 20px;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.map-controls {
			left: 10px;
			right: 10px;
		}

		.search-box {
			max-width: none;
		}

		.location-control {
			bottom: 100px;
			right: 10px;
		}

		.location-button {
			width: 44px;
			height: 44px;
		}
		
		.location-button svg {
			width: 18px;
			height: 18px;
		}

		.location-button {
			width: 44px;
			height: 44px;
		}
	}
</style>
