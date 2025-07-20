<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type { Map, Marker, LatLng } from 'leaflet';
	import type { Location } from '$lib/types';

	export let initialCenter: [number, number] = [53.4076, -2.9921];
	export let initialZoom: number = 13;
	export let locations: Location[] = [];

	const dispatch = createEventDispatcher<{
		mapClick: { latlng: LatLng };
		mapReady: { map: Map };
		locationClick: { location: Location };
		popupOpen: { open: boolean };
	}>();

	let mapContainer: HTMLDivElement;
	let map: Map;
	let L: typeof import('leaflet');
	let markers: Marker[] = [];
	let isPopupOpen = false;

	onMount(async () => {
		if (!browser || !mapContainer) return;
		
		// Clear the container first to prevent reuse issues
		if (mapContainer) {
			mapContainer.innerHTML = '';
		}
		
		// Add a small delay to ensure DOM is ready
		await new Promise(resolve => setTimeout(resolve, 10));
		
		// Check if component is still mounted
		if (!mapContainer || !mapContainer.parentNode) return;
		
		// Dynamic import to avoid SSR issues
		L = await import('leaflet');
		
		// Import Leaflet CSS
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
		document.head.appendChild(link);

		// Initialize map
		try {
			// Double check container is still available
			if (!mapContainer || !mapContainer.parentNode) return;
			
			map = L.map(mapContainer, {
				center: initialCenter,
				zoom: initialZoom,
				zoomControl: false,
				attributionControl: false
			});

		// Add tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: ''
		}).addTo(map);

		// Add click handler
		map.on('click', (e: any) => {
			dispatch('mapClick', { latlng: e.latlng });
		});			// Add popup event listeners
			map.on('popupopen', () => {
				isPopupOpen = true;
				dispatch('popupOpen', { open: true });
			});

			map.on('popupclose', () => {
				isPopupOpen = false;
				dispatch('popupOpen', { open: false });
			});

			// Add attribution control
			L.control.attribution({
				position: 'bottomleft',
				prefix: false
			}).addAttribution('© OpenStreetMap contributors').addTo(map);

			// Notify that map is ready
			dispatch('mapReady', { map });
			
			// Set up global functions for popup interactions
			setupPopupGlobalFunctions();
		} catch (error) {
			console.error('Failed to initialize map:', error);
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	// React to locations changes
	$: if (map && L && locations) {
		updateMarkers();
	}

	function updateMarkers() {
		console.log('Updating markers, locations:', locations);
		// Clear existing markers
		markers.forEach(marker => map.removeLayer(marker));
		markers = [];

		// Add new markers for locations
		locations.forEach(location => {
			const customIcon = L.divIcon({
				className: `custom-location-pin`,
				html: `
					<div class="location-pin-container">
						<div class="location-pin-body"></div>
						<div class="location-pin-point"></div>
						${location.instances.length > 0 ? `<div class="instance-count">${location.instances.length}</div>` : ''}
					</div>
				`,
				iconSize: [32, 40],
				iconAnchor: [16, 40],
				popupAnchor: [0, -40]
			});

			// Sort instances by date (most recent first)
			const sortedInstances = [...location.instances].sort((a, b) => 
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

			const marker = L.marker([location.lat, location.lng], { icon: customIcon })
				.addTo(map)
				.bindPopup(createLocationPopupHTML(location, sortedInstances), {
					maxWidth: 350,
					className: 'location-popup'
				});

			// Don't add automatic locationClick handler - let the Add Event button handle it
			// Store location ID with marker for easy lookup
			(marker as any).locationId = location.id;
			markers.push(marker);
		});
	}

	function createLocationPopupHTML(location: Location, sortedInstances: any[]): string {
		return `
			<div class="popup-content" data-location-id="${location.id}">
				<div class="popup-header">
					<h3 class="popup-title">${location.name}</h3>
				</div>
				${location.address ? `<p class="popup-address">${location.address}</p>` : ''}
				
				${sortedInstances.length === 0 ? `
					<div class="popup-instances">
						<p class="no-instances">No events yet</p>
						<button class="add-event-btn" onclick="window.addEventToLocation('${location.id}')">
							<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
								<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
							</svg>
							Add First Event
						</button>
					</div>
				` : `
					<div class="popup-instances">
						<div class="instance-header">
							<span class="instance-counter">
								<span class="current-instance">1</span> / ${sortedInstances.length}
							</span>
							<div class="instance-controls">
								${sortedInstances.length > 1 ? `
									<button class="nav-btn" onclick="window.navigateInstance('${location.id}', -1)" title="Previous event">
										<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
											<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
										</svg>
									</button>
									<button class="nav-btn" onclick="window.navigateInstance('${location.id}', 1)" title="Next event">
										<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
											<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
										</svg>
									</button>
								` : ''}
								<button class="add-event-btn small" onclick="window.addEventToLocation('${location.id}')" title="Add event">
									<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
										<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
									</svg>
								</button>
							</div>
						</div>
						<div class="current-instance-display" data-current-index="0">
							${createInstanceHTML(sortedInstances[0])}
						</div>
					</div>
				`}
				
				<div class="popup-footer">
					<div class="popup-date">Location created: ${location.createdAt.toLocaleDateString()}</div>
					<p class="popup-coords">
						${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
					</p>
				</div>
			</div>
		`;
	}

	function createInstanceHTML(instance: any): string {
		return `
			<div class="instance-item current">
				<div class="instance-title">${instance.title}</div>
				${instance.description ? `<div class="instance-description">${instance.description}</div>` : ''}
				<div class="instance-types">${instance.types.join(', ')}</div>
				<div class="instance-date">${instance.createdAt.toLocaleDateString()} at ${instance.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
			</div>
		`;
	}

	function setupPopupGlobalFunctions() {
		if (!browser) return;

		// Function to add event to location (opens panel)
		(window as any).addEventToLocation = (locationId: string) => {
			const location = locations.find(l => l.id === locationId);
			if (location) {
				map.closePopup();
				setTimeout(() => {
					dispatch('locationClick', { location });
				}, 10);
			}
		};

		// Function to navigate between instances in popup
		(window as any).navigateInstance = (locationId: string, direction: number) => {
			const location = locations.find(l => l.id === locationId);
			if (!location || location.instances.length <= 1) return;

			const popupContent = document.querySelector(`[data-location-id="${locationId}"]`);
			if (!popupContent) return;

			const currentDisplay = popupContent.querySelector('.current-instance-display') as HTMLElement;
			const currentIndexStr = currentDisplay?.getAttribute('data-current-index') || '0';
			let currentIndex = parseInt(currentIndexStr, 10);
			
			// Calculate new index with wrapping
			const totalInstances = location.instances.length;
			currentIndex = (currentIndex + direction + totalInstances) % totalInstances;
			
			// Sort instances by date (most recent first) - same as in popup creation
			const sortedInstances = [...location.instances].sort((a, b) => 
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
			
			// Update the display
			currentDisplay.setAttribute('data-current-index', currentIndex.toString());
			currentDisplay.innerHTML = createInstanceHTML(sortedInstances[currentIndex]);
			
			// Update counter
			const counter = popupContent.querySelector('.current-instance');
			if (counter) {
				counter.textContent = (currentIndex + 1).toString();
			}
		};
	}

	// Expose map methods
	export function panTo(lat: number, lng: number, zoom?: number) {
		if (map) {
			const currentZoom = zoom || map.getZoom();
			
			// First, center the map on the target location
			map.setView([lat, lng], currentZoom);
			
			// Then pan the map up so the pin appears in the lower third of the screen
			const mapSize = map.getSize();
			const offsetY = mapSize.y * 0.25; // Move up by 25% of screen height
			
			map.panBy([0, offsetY], { animate: true, duration: 0.3 });
		}
	}

	export function getCurrentLocation() {
		if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const lat = position.coords.latitude;
					const lng = position.coords.longitude;
					panTo(lat, lng, 16);
					dispatch('mapClick', { latlng: L.latLng(lat, lng) });
				},
				(error) => {
					console.error('Geolocation error:', error);
					alert('Could not get your location. Please make sure location access is enabled.');
				}
			);
		} else {
			alert('Geolocation is not supported by this browser.');
		}
	}

	// Method to get marker for a specific location (useful for programmatic popup opening)
	export function getMarkerForLocation(location: Location): Marker | null {
		return markers.find(marker => (marker as any).locationId === location.id) || null;
	}

	onDestroy(() => {
		// Clean up global functions
		if (browser) {
			if ((window as any).addEventToLocation) {
				delete (window as any).addEventToLocation;
			}
			if ((window as any).navigateInstance) {
				delete (window as any).navigateInstance;
			}
		}

		if (map && map.getContainer()) {
			try {
				// Check if the container is still attached to this map instance
				const container = map.getContainer();
				if (container && container.parentNode) {
					map.off(); // Remove all event listeners
					map.remove(); // Remove the map instance
				}
			} catch (error: unknown) {
				// Silently handle the error - this is expected when switching views quickly
				console.debug('Map cleanup handled (view switch):', (error as Error).message);
			} finally {
				map = null as any;
			}
		}
		
		// Clear markers array
		markers = [];
		
		// Clear the container if it exists and isn't being used
		if (mapContainer && mapContainer.parentNode) {
			try {
				mapContainer.innerHTML = '';
			} catch (error: unknown) {
				console.debug('Container cleanup handled:', (error as Error).message);
			}
		}
	});
</script>

<div class="map-container" bind:this={mapContainer} id="map-{Math.random().toString(36).substr(2, 9)}"></div>

<style>
	.map-container {
		width: 100%;
		height: 100%;
	}

	/* Custom location pin styles */
	:global(.custom-location-pin) {
		background: transparent;
		border: none;
	}

	:global(.location-pin-container) {
		position: relative;
		width: 32px;
		height: 40px;
	}

	:global(.location-pin-body) {
		width: 24px;
		height: 24px;
		background: #3b82f6;
		border: 3px solid white;
		border-radius: 50%;
		position: absolute;
		top: 0;
		left: 4px;
		box-shadow: 0 2px 6px rgba(0,0,0,0.3);
	}

	:global(.location-pin-point) {
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 12px solid #3b82f6;
		position: absolute;
		bottom: 0;
		left: 10px;
	}

	:global(.instance-count) {
		position: absolute;
		top: -4px;
		right: -4px;
		background: #ef4444;
		color: white;
		font-size: 10px;
		font-weight: bold;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0,0,0,0.3);
	}
	/* Popup styles */
	:global(.popup-content) {
		text-align: center;
		min-width: 200px;
		max-width: 300px;
	}

	:global(.popup-header) {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
	}

	:global(.popup-title) {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		color: #202124;
		flex: 1;
		text-align: left;
	}

	:global(.popup-address) {
		margin: 0 0 12px 0;
		font-size: 13px;
		color: #5f6368;
		text-align: left;
		font-style: italic;
	}

	:global(.popup-instances) {
		text-align: left;
		margin: 12px 0;
	}

	:global(.popup-instances strong) {
		font-size: 14px;
		color: #202124;
	}

	:global(.instance-header) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid #e8eaed;
	}

	:global(.instance-counter) {
		font-size: 12px;
		color: #5f6368;
		font-weight: 500;
	}

	:global(.current-instance) {
		color: #1a73e8;
		font-weight: bold;
	}

	:global(.instance-controls) {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	:global(.nav-btn) {
		background: none;
		border: 1px solid #e8eaed;
		border-radius: 4px;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		color: #5f6368;
		width: 24px;
		height: 24px;
	}

	:global(.nav-btn:hover) {
		background: #f8f9fa;
		border-color: #dadce0;
		color: #1a73e8;
	}

	:global(.add-event-btn) {
		background: #1a73e8;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		transition: all 0.2s;
		margin-top: 8px;
		width: 100%;
		justify-content: center;
	}

	:global(.add-event-btn:hover) {
		background: #1557b0;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
	}

	:global(.add-event-btn.small) {
		padding: 4px 6px;
		font-size: 12px;
		width: auto;
		margin-top: 0;
		border-radius: 4px;
	}

	:global(.current-instance-display) {
		transition: opacity 0.2s ease;
	}

	:global(.instance-item) {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 12px;
		margin: 8px 0;
		border-left: 3px solid #3b82f6;
		transition: all 0.2s ease;
	}

	:global(.instance-item.current) {
		background: linear-gradient(135deg, #f8f9ff 0%, #f1f3ff 100%);
		border-left-color: #1a73e8;
		box-shadow: 0 2px 8px rgba(26, 115, 232, 0.1);
	}

	:global(.instance-title) {
		font-weight: 500;
		color: #202124;
		margin-bottom: 4px;
		font-size: 14px;
	}

	:global(.instance-description) {
		color: #5f6368;
		font-size: 13px;
		margin-bottom: 4px;
	}

	:global(.instance-types) {
		font-size: 12px;
		color: #1a73e8;
		font-weight: 500;
		margin-bottom: 4px;
	}

	:global(.instance-date) {
		font-size: 11px;
		color: #9aa0a6;
	}

	:global(.no-instances) {
		color: #5f6368;
		font-style: italic;
		margin: 8px 0;
		font-size: 13px;
	}

	:global(.popup-action-btn.delete:hover) {
		background: #fce8e6;
		color: #d93025;
	}

	:global(.popup-edit-btn) {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		color: #5f6368;
		margin-left: 8px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	:global(.popup-edit-btn:hover) {
		background: #f1f3f4;
		color: #1a73e8;
	}

	:global(.popup-description) {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #5f6368;
		text-align: left;
	}

	:global(.popup-coords) {
		margin: 0;
		font-size: 12px;
		color: #5f6368;
	}

	:global(.popup-type) {
		margin: 4px 0 8px 0;
		font-size: 12px;
		color: #1a73e8;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	:global(.popup-date) {
		margin: 4px 0 8px 0;
		font-size: 12px;
		color: #5f6368;
		font-style: italic;
		text-align: left;
	}

	:global(.popup-footer) {
		border-top: 1px solid #e8eaed;
		padding-top: 8px;
		margin-top: 12px;
	}

	/* Zoom control styling */
	:global(.leaflet-control-zoom) {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.2);
		border: none;
	}

	:global(.leaflet-control-zoom a) {
		background: white;
		color: #5f6368;
		border: none;
		width: 40px;
		height: 40px;
		line-height: 40px;
		font-size: 18px;
		font-weight: bold;
	}

	:global(.leaflet-control-zoom a:hover) {
		background: #f8f9fa;
	}

	:global(.leaflet-control-zoom a:first-child) {
		border-radius: 8px 8px 0 0;
	}

	:global(.leaflet-control-zoom a:last-child) {
		border-radius: 0 0 8px 8px;
	}

	/* Attribution styling */
	:global(.leaflet-control-attribution) {
		background: rgba(255, 255, 255, 0.8);
		padding: 4px 8px;
		font-size: 11px;
		border-radius: 4px;
	}
</style>
