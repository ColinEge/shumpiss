<script lang="ts">
	import { PinStorage, type Pin } from '$lib/utils/pinStorage';
	import { LocationStorage } from '$lib/utils/locationStorage';
	import { createEventDispatcher } from 'svelte';
	import { getTypeDisplayName, getAllPinTypes } from '$lib/types';
	import { formatPinDateTime, formatDateGroupHeader, getDateKey } from '$lib/utils/dateHelpers';
	import { logger } from '$lib/utils/logger';
	import type { Location, Instance } from '$lib/types';
	
	const dispatch = createEventDispatcher<{
		navigateToPin: { pinId: string };
		navigateToLocation: { locationId: string; instanceId?: string };
		switchView: { view: 'map' | 'date' };
	}>();
	
	export let pins: Pin[] = [];
	export let locations: Location[] = [];
	export let totalItems: number = 0;
	
	let sortOrder: 'desc' | 'asc' = 'desc';
	let searchTerm: string = '';
	let selectedTypes: string[] = [];
	let dateAfter: string = '';
	let dateBefore: string = '';
	
	// Available pin types for filtering
	const availableTypes = getAllPinTypes();

	// Create unified items from both pins and instances
	type UnifiedItem = {
		id: string;
		title: string;
		description?: string;
		types: string[];
		createdAt: Date;
		lat: number;
		lng: number;
		source: 'pin' | 'instance';
		locationId?: string;
		locationName?: string;
	};

	$: unifiedItems = createUnifiedItems(pins, locations);
	$: groupedItems = getFilteredAndGroupedItems(unifiedItems, searchTerm, selectedTypes, sortOrder, dateAfter, dateBefore);

	function createUnifiedItems(pins: Pin[], locations: Location[]): UnifiedItem[] {
		const items: UnifiedItem[] = [];

		// Add legacy pins
		pins.forEach(pin => {
			items.push({
				id: pin.id,
				title: pin.title,
				description: pin.description,
				types: pin.types || [pin.type],
				createdAt: pin.createdAt,
				lat: pin.lat,
				lng: pin.lng,
				source: 'pin'
			});
		});

		// Add instances from locations
		locations.forEach(location => {
			location.instances.forEach(instance => {
				items.push({
					id: instance.id,
					title: location.name,
					description: instance.description,
					types: instance.types,
					createdAt: instance.createdAt,
					lat: location.lat,
					lng: location.lng,
					source: 'instance',
					locationId: location.id,
					locationName: location.name
				});
			});
		});

		return items;
	}
	
	function getFilteredAndGroupedItems(
		items: UnifiedItem[], 
		searchTerm: string, 
		selectedTypes: string[], 
		sortOrder: 'desc' | 'asc',
		dateAfter: string,
		dateBefore: string
	) {
		console.log('Filtering items:', { items: items.length, searchTerm, selectedTypes, sortOrder, dateAfter, dateBefore });
		
		// Filter items based on search term, selected types, and date range
		let filteredItems = items.filter(item => {
			const matchesSearch = !searchTerm || 
				item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
			
			const matchesType = selectedTypes.length === 0 || 
				selectedTypes.some(type => item.types.includes(type));
			
			// Date range filtering
			const itemDate = new Date(item.createdAt.getFullYear(), item.createdAt.getMonth(), item.createdAt.getDate());
			
			const matchesAfterDate = !dateAfter || itemDate >= new Date(dateAfter);
			const matchesBeforeDate = !dateBefore || itemDate <= new Date(dateBefore);
			
			return matchesSearch && matchesType && matchesAfterDate && matchesBeforeDate;
		});
		
		console.log('After filtering:', filteredItems.length);
		
		// Sort items
		filteredItems.sort((a, b) => {
			const timeA = a.createdAt.getTime();
			const timeB = b.createdAt.getTime();
			return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
		});
		
		// Group by date
		const grouped: { [date: string]: UnifiedItem[] } = {};
		filteredItems.forEach(item => {
			const dateKey = getDateKey(item.createdAt);
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(item);
		});
		
		logger.debug(`Grouped items into ${Object.keys(grouped).length} date groups`);
		return grouped;
	}
	
	function handleItemClick(item: UnifiedItem) {
		logger.debug(`Item clicked in date view: ${item.id} (source: ${item.source})`);
		
		if (item.source === 'pin') {
			dispatch('navigateToPin', { pinId: item.id });
		} else if (item.source === 'instance') {
			dispatch('navigateToLocation', { 
				locationId: item.locationId!, 
				instanceId: item.id 
			});
		}
	}
	
	function formatDate(dateString: string): string {
		return formatDateGroupHeader(dateString);
	}
	
	function toggleTypeFilter(type: string) {
		if (selectedTypes.includes(type)) {
			selectedTypes = selectedTypes.filter(t => t !== type);
		} else {
			selectedTypes = [...selectedTypes, type];
		}
		logger.debug(`Type filter toggled: ${type}, active filters:`, selectedTypes);
	}
	
	function clearAllFilters() {
		searchTerm = '';
		selectedTypes = [];
		dateAfter = '';
		dateBefore = '';
		logger.debug('All filters cleared');
	}
	
	function handleBackToMap() {
		dispatch('switchView', { view: 'map' });
	}
	
	// Count total filtered pins
	$: totalFilteredItems = Object.values(groupedItems).flat().length;
</script>

<div class="date-view">
	<!-- Back button -->
	<div class="back-header">
		<button 
			class="back-btn"
			on:click={handleBackToMap}
			title="Back to Map"
			aria-label="Back to Map"
		>
			<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
				<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
			</svg>
		</button>
		<h1 class="page-title">Timeline</h1>
		<div class="item-count">
			{totalItems} item{totalItems === 1 ? '' : 's'}
		</div>
	</div>

	
	<!-- Search and filters -->
	<div class="controls">
		<div class="search-bar">
			<svg viewBox="0 0 24 24" fill="currentColor" class="search-icon">
				<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
			</svg>
			<input
				type="text"
				placeholder="Search pins..."
				bind:value={searchTerm}
				class="search-input"
			/>
			{#if searchTerm}
				<button 
					class="clear-search" 
					on:click={() => searchTerm = ''}
					aria-label="Clear search"
				>
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
					</svg>
				</button>
			{/if}
		</div>
		
		<div class="filters">
			<div class="sort-control">
				<button 
					class="sort-btn {sortOrder === 'desc' ? 'active' : ''}"
					on:click={() => sortOrder = 'desc'}
					title="Newest first"
				>
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path d="M7 14l5-5 5 5z"/>
					</svg>
					Newest
				</button>
				<button 
					class="sort-btn {sortOrder === 'asc' ? 'active' : ''}"
					on:click={() => sortOrder = 'asc'}
					title="Oldest first"
				>
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path d="M7 10l5 5 5-5z"/>
					</svg>
					Oldest
				</button>
			</div>
			
			<div class="type-filters">
				{#each availableTypes as type}
					<button
						class="type-filter {selectedTypes.includes(type) ? 'active' : ''} type-{type}"
						on:click={() => toggleTypeFilter(type)}
						title="Filter by {getTypeDisplayName(type)}"
					>
						{getTypeDisplayName(type)}
					</button>
				{/each}
			</div>
			
			<div class="date-filters">
				<div class="date-filter-group">
					<label for="date-after" class="date-label">After:</label>
					<input 
						id="date-after"
						type="date" 
						bind:value={dateAfter}
						class="date-input"
						title="Show pins created after this date"
					/>
				</div>
				<div class="date-filter-group">
					<label for="date-before" class="date-label">Before:</label>
					<input 
						id="date-before"
						type="date" 
						bind:value={dateBefore}
						class="date-input"
						title="Show pins created before this date"
					/>
				</div>
			</div>
			
			{#if searchTerm || selectedTypes.length > 0 || dateAfter || dateBefore}
				<button class="clear-filters" on:click={clearAllFilters}>
					Clear Filters
				</button>
			{/if}
		</div>
	</div>
	
	<!-- Item groups -->
	<div class="pin-groups">
		{#each Object.entries(groupedItems) as [date, dateItems]}
			<div class="date-group">
				<h3 class="date-header">
					{formatDate(date)}
					<span class="pin-count">{dateItems.length} item{dateItems.length === 1 ? '' : 's'}</span>
				</h3>
				
				<div class="pins-grid">
					{#each dateItems as item}
						<button 
							class="pin-item" 
							on:click={() => handleItemClick(item)}
							title="Click to navigate to {item.source === 'pin' ? 'pin' : 'location'} on map"
						>
							<div class="pin-info">
								<div class="pin-title">
									{item.title}
									{#if item.source === 'instance'}
										<span class="source-indicator">@{item.locationName}</span>
									{/if}
								</div>
								<div class="pin-time">{formatPinDateTime(item.createdAt)}</div>
								{#if item.description}
									<div class="pin-description">{item.description}</div>
								{/if}
								<div class="pin-coordinates">
									{item.lat.toFixed(4)}, {item.lng.toFixed(4)}
								</div>
							</div>
							<div class="pin-types">
								{#each item.types as type}
									<span class="type-badge type-{type}">
										{getTypeDisplayName(type)}
									</span>
								{/each}
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/each}
		
		{#if Object.keys(groupedItems).length === 0}
			<div class="empty-state">
				{#if pins.length === 0 && locations.length === 0}
					<div class="empty-icon">📍</div>
					<h3>No items yet</h3>
					<p>Switch to Map View to create your first location or pin!</p>
				{:else}
					<div class="empty-icon">🔍</div>
					<h3>No matching items</h3>
					<p>Try adjusting your search or filters</p>
					<button class="clear-filters" on:click={clearAllFilters}>
						Clear All Filters
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.back-header {
		display: flex;
		align-items: center;
		background: white;
		border-bottom: 1px solid #e8eaed;
		padding: 12px 20px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		position: sticky;
		top: 0;
		z-index: 100;
		margin: -20px -20px 20px -20px;
		gap: 16px;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: none;
		border: 1px solid #e8eaed;
		border-radius: 50%;
		cursor: pointer;
		color: #5f6368;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}
	
	.back-btn:hover {
		background: #f8f9fa;
		border-color: #dadce0;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	
	.page-title {
		font-size: 24px;
		font-weight: 500;
		color: #202124;
		margin: 0;
		flex: 1;
	}
	
	.item-count {
		font-size: 14px;
		color: #5f6368;
		font-weight: 400;
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

	.date-view {
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
		height: 100%;
		overflow-y: auto;
	}
	
	.header {
		margin-bottom: 24px;
		text-align: center;
	}
	
	.title {
		font-size: 28px;
		font-weight: 600;
		color: #202124;
		margin: 0 0 8px 0;
	}
	
	.subtitle {
		font-size: 14px;
		color: #5f6368;
		font-weight: 500;
	}
	
	.controls {
		background: white;
		border: 1px solid #e8eaed;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 24px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		transition: all 0.3s ease;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.sticky-spacer {
		height: 140px; /* Approximate height of controls */
		margin-bottom: 24px;
	}
	
	.search-bar {
		position: relative;
		margin-bottom: 16px;
	}
	
	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 20px;
		height: 20px;
		color: #5f6368;
	}
	
	.search-input {
		width: 100%;
		padding: 12px 16px 12px 44px;
		border: 1px solid #e8eaed;
		border-radius: 8px;
		font-size: 14px;
		background: #f8f9fa;
		transition: all 0.2s ease;
	}
	
	.search-input:focus {
		outline: none;
		border-color: #1a73e8;
		background: white;
		box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
	}
	
	.clear-search {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		color: #5f6368;
		border-radius: 4px;
	}
	
	.clear-search:hover {
		background: #f1f3f4;
	}
	
	.clear-search svg {
		width: 20px;
		height: 20px;
	}
	
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
	}
	
	.sort-control {
		display: flex;
		background: #f8f9fa;
		border-radius: 8px;
		padding: 4px;
		gap: 2px;
	}
	
	.sort-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		color: #5f6368;
		border-radius: 6px;
		transition: all 0.2s ease;
	}
	
	.sort-btn.active {
		background: white;
		color: #1a73e8;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.sort-btn svg {
		width: 16px;
		height: 16px;
	}
	
	.type-filters {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	
	.type-filter {
		padding: 6px 12px;
		border: 1px solid #e8eaed;
		border-radius: 16px;
		background: white;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		transition: all 0.2s ease;
	}
	
	.type-filter.type-shit {
		color: #8B4513;
		border-color: #8B4513;
	}
	
	.type-filter.type-shit.active {
		background: #8B4513;
		color: white;
	}
	
	.type-filter.type-cum {
		color: #B8860B;
		border-color: #B8860B;
	}
	
	.type-filter.type-cum.active {
		background: #F5F5DC;
		color: #8B4513;
		border-color: #8B4513;
	}
	
	.type-filter.type-piss {
		color: #B8860B;
		border-color: #B8860B;
	}
	
	.type-filter.type-piss.active {
		background: #FFD700;
		color: #B8860B;
	}
	
	.clear-filters {
		padding: 6px 12px;
		background: #f1f3f4;
		border: 1px solid #dadce0;
		border-radius: 16px;
		cursor: pointer;
		font-size: 12px;
		color: #5f6368;
		transition: all 0.2s ease;
	}
	
	.clear-filters:hover {
		background: #e8eaed;
	}
	
	.date-filters {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
	}
	
	.date-filter-group {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	
	.date-label {
		font-size: 12px;
		font-weight: 500;
		color: #5f6368;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		min-width: 40px;
	}
	
	.date-input {
		padding: 6px 10px;
		border: 1px solid #e8eaed;
		border-radius: 8px;
		font-size: 12px;
		background: white;
		color: #202124;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 120px;
	}
	
	.date-input:focus {
		outline: none;
		border-color: #1a73e8;
		box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
	}
	
	.date-input:hover {
		border-color: #dadce0;
	}
	
	.pin-groups {
		flex: 1;
	}
	
	.date-group {
		margin-bottom: 32px;
	}
	
	.date-header {
		font-size: 18px;
		font-weight: 600;
		color: #202124;
		margin: 0 0 16px 0;
		padding-bottom: 8px;
		border-bottom: 2px solid #f1f3f4;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.pin-count {
		font-size: 12px;
		font-weight: 500;
		color: #5f6368;
		background: #f8f9fa;
		padding: 4px 8px;
		border-radius: 12px;
	}
	
	.pins-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	}
	
	.pin-item {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 16px;
		background: white;
		border: 1px solid #e8eaed;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		position: relative;
		overflow: hidden;
	}
	
	.pin-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #1a73e8, #4285f4);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
	}
	
	.pin-item:hover {
		border-color: #1a73e8;
		box-shadow: 0 4px 16px rgba(26, 115, 232, 0.15);
		transform: translateY(-2px);
	}
	
	.pin-item:hover::before {
		transform: scaleX(1);
	}
	
	.pin-info {
		flex: 1;
		min-width: 0;
	}
	
	.pin-title {
		font-size: 16px;
		font-weight: 500;
		color: #202124;
		margin-bottom: 6px;
		word-break: break-word;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}

	.source-indicator {
		font-size: 12px;
		font-weight: 400;
		color: #5f6368;
		background: #f1f3f4;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #e8eaed;
	}
	
	.pin-time {
		font-size: 12px;
		color: #1a73e8;
		font-weight: 500;
		margin-bottom: 6px;
	}
	
	.pin-description {
		font-size: 14px;
		color: #5f6368;
		line-height: 1.4;
		margin-bottom: 6px;
		word-break: break-word;
	}
	
	.pin-coordinates {
		font-size: 11px;
		color: #9aa0a6;
		font-family: monospace;
	}
	
	.pin-types {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-left: 16px;
		align-items: flex-end;
	}
	
	.type-badge {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		white-space: nowrap;
	}
	
	.type-badge.type-shit {
		background: #8B4513;
		color: white;
	}
	
	.type-badge.type-cum {
		background: #F5F5DC;
		color: #8B4513;
	}
	
	.type-badge.type-piss {
		background: #FFD700;
		color: #B8860B;
	}
	
	.empty-state {
		text-align: center;
		padding: 48px 20px;
		color: #5f6368;
	}
	
	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}
	
	.empty-state h3 {
		font-size: 20px;
		margin: 0 0 8px 0;
		color: #202124;
	}
	
	.empty-state p {
		font-size: 14px;
		margin: 0 0 16px 0;
		line-height: 1.5;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.back-header {
			padding: 8px 12px;
			margin: -12px -12px 12px -12px;
		}
		
		.back-btn {
			width: 40px;
			height: 40px;
		}
		
		.page-title {
			font-size: 20px;
		}
		
		.item-count {
			font-size: 12px;
		}
		
		.date-view {
			padding: 12px;
		}
		
		.controls {
			padding: 16px;
			margin-left: -12px;
			margin-right: -12px;
			width: calc(100% + 24px);
			border-radius: 0;
		}
		
		.filters {
			gap: 8px;
		}
		
		.date-filters {
			flex-direction: column;
			gap: 8px;
			align-items: stretch;
		}
		
		.date-filter-group {
			justify-content: space-between;
		}
		
		.date-input {
			min-width: 100px;
			flex: 1;
		}
		
		.pins-grid {
			grid-template-columns: 1fr;
		}
		
		.pin-item {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}
		
		.pin-types {
			margin-left: 0;
			flex-direction: row;
			align-items: flex-start;
			justify-content: flex-start;
			flex-wrap: wrap;
		}
		
		.date-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}
	}
</style>
