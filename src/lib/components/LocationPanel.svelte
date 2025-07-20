<script lang="ts">
	import { PinType } from '$lib/utils/pinStorage';
	import type { Location } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	export let panelState: 'collapsed' | 'partial' | 'expanded' = 'collapsed';
	export let selectedLocation: { lat: number; lng: number; address?: string } | null = null;
	export let selectedLocationForInstance: Location | null = null;
	export let isCreatingLocation = false;
	export let isCreatingInstance = false;

	const dispatch = createEventDispatcher<{
		panelStateChange: { state: 'collapsed' | 'partial' | 'expanded' };
		createLocation: { name: string; address?: string };
		cancelLocation: void;
		createInstance: { title: string; description?: string; types: string[] };
		cancelInstance: void;
	}>();

	let panelElement: HTMLDivElement;
	let isDragging = false;
	let startY = 0;
	let startHeight = 0;

	// Instance creation form
	let newInstanceTitle = '';
	let newInstanceDescription = '';
	let selectedPinTypes = new Set([PinType.Shit]); // Allow multiple selections

	// Location creation form
	let newLocationName = '';
	let newLocationAddress = '';

	function setPanelState(state: 'collapsed' | 'partial' | 'expanded') {
		panelState = state;
		dispatch('panelStateChange', { state });
	}

	function handlePanelDragStart(event: MouseEvent | TouchEvent) {
		isDragging = true;
		startY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		
		const rect = panelElement.getBoundingClientRect();
		startHeight = window.innerHeight - rect.top;

		document.addEventListener('mousemove', handlePanelDrag, { passive: false });
		document.addEventListener('mouseup', handlePanelDragEnd);
		document.addEventListener('touchmove', handlePanelDrag, { passive: false });
		document.addEventListener('touchend', handlePanelDragEnd);
	}

	function handlePanelDrag(event: MouseEvent | TouchEvent) {
		if (!isDragging) return;

		// Prevent default to avoid scrolling issues, but only if we're actually dragging
		event.preventDefault();

		const currentY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		const deltaY = startY - currentY;
		const newHeight = Math.max(60, Math.min(window.innerHeight * 0.8, startHeight + deltaY));

		panelElement.style.transform = `translateY(${window.innerHeight - newHeight}px)`;
	}

	function handlePanelDragEnd() {
		if (!isDragging) return;
		isDragging = false;

		const rect = panelElement.getBoundingClientRect();
		const currentHeight = window.innerHeight - rect.top;

		if (currentHeight < 120) {
			setPanelState('collapsed');
		} else if (currentHeight < window.innerHeight * 0.4) {
			setPanelState('partial');
		} else {
			setPanelState('expanded');
		}

		panelElement.style.transform = '';

		document.removeEventListener('mousemove', handlePanelDrag);
		document.removeEventListener('mouseup', handlePanelDragEnd);
		document.removeEventListener('touchmove', handlePanelDrag);
		document.removeEventListener('touchend', handlePanelDragEnd);
	}

	function handleCreateInstance() {
		if (!selectedLocationForInstance || !newInstanceTitle.trim() || selectedPinTypes.size === 0) return;
		
		dispatch('createInstance', {
			title: newInstanceTitle.trim(),
			description: newInstanceDescription.trim() || undefined,
			types: Array.from(selectedPinTypes)
		});

		// Reset form
		newInstanceTitle = '';
		newInstanceDescription = '';
		selectedPinTypes = new Set([PinType.Shit]);
	}

	function handleCancelInstance() {
		// Reset form
		newInstanceTitle = '';
		newInstanceDescription = '';
		selectedPinTypes = new Set([PinType.Shit]);
		dispatch('cancelInstance');
	}

	function togglePinType(type: string) {
		const pinType = type as PinType;
		if (selectedPinTypes.has(pinType)) {
			selectedPinTypes.delete(pinType);
		} else {
			selectedPinTypes.add(pinType);
		}
		selectedPinTypes = new Set(selectedPinTypes); // Trigger reactivity
	}

	// Location creation handlers
	function handleCreateLocation() {
		if (!selectedLocation || !newLocationName.trim()) return;
		
		dispatch('createLocation', {
			name: newLocationName.trim(),
			address: newLocationAddress.trim() || undefined
		});

		// Reset form
		newLocationName = '';
		newLocationAddress = '';
	}

	function handleCancelLocation() {
		// Reset form
		newLocationName = '';
		newLocationAddress = '';
		dispatch('cancelLocation');
	}
</script>

<div 
	class="bottom-panel {panelState}"
	bind:this={panelElement}
>
	<!-- Drag handle -->
	<div 
		class="panel-handle"
		on:mousedown={handlePanelDragStart}
		on:touchstart={handlePanelDragStart}
		role="button"
		tabindex="0"
		aria-label="Drag to resize panel"
	>
		<div class="handle-bar"></div>
	</div>

	<!-- Panel content -->
	<div class="panel-content">
		{#if isCreatingInstance && selectedLocationForInstance}
			<div class="location-header">
				<h2 class="location-title">Add Instance to {selectedLocationForInstance.name}</h2>
				<button 
					class="close-button"
					on:click={() => setPanelState('collapsed')}
					aria-label="Close panel"
				>
					×
				</button>
			</div>

			<!-- Instance creation form -->
			<div class="pin-form">
				<!-- Instance Types - First and on single line -->
				<div class="form-group">
					<span class="form-label">Instance Types * (select one or more)</span>
					<div class="checkbox-group">
						<label class="checkbox-option">
							<input 
								type="checkbox" 
								checked={selectedPinTypes.has(PinType.Shit)}
								on:change={() => togglePinType(PinType.Shit)}
							/>
							<span class="checkbox-label">💩 Shit</span>
						</label>
						<label class="checkbox-option">
							<input 
								type="checkbox" 
								checked={selectedPinTypes.has(PinType.Cum)}
								on:change={() => togglePinType(PinType.Cum)}
							/>
							<span class="checkbox-label">🍆 Cum</span>
						</label>
						<label class="checkbox-option">
							<input 
								type="checkbox" 
								checked={selectedPinTypes.has(PinType.Piss)}
								on:change={() => togglePinType(PinType.Piss)}
							/>
							<span class="checkbox-label">💦 Piss</span>
						</label>
					</div>
				</div>

				<div class="form-group">
					<label for="instance-title" class="form-label">Instance Title *</label>
					<input 
						id="instance-title"
						type="text" 
						bind:value={newInstanceTitle}
						placeholder="Enter a title for this instance..."
						class="form-input"
						maxlength="100"
					/>
				</div>
				
				<div class="form-group">
					<label for="instance-description" class="form-label">Description (optional)</label>
					<textarea 
						id="instance-description"
						bind:value={newInstanceDescription}
						placeholder="Add a description or notes..."
						class="form-textarea"
						rows="3"
						maxlength="500"
					></textarea>
				</div>

				<div class="form-actions">
					<button 
						class="action-button secondary"
						on:click={handleCancelInstance}
					>
						Cancel
					</button>
					<button 
						class="action-button primary"
						on:click={handleCreateInstance}
						disabled={!newInstanceTitle.trim() || selectedPinTypes.size === 0}
					>
						Save Instance
					</button>
				</div>
			</div>
		{:else if isCreatingLocation}
			<div class="location-header">
				<h2 class="location-title">Create New Location</h2>
				<button 
					class="close-button"
					on:click={() => setPanelState('collapsed')}
					aria-label="Close panel"
				>
					×
				</button>
			</div>

			<!-- Location creation form -->
			<div class="pin-form">
				<div class="form-group">
					<label class="form-label" for="location-name">Location Name *</label>
					<input 
						id="location-name"
						type="text" 
						bind:value={newLocationName}
						placeholder="e.g., McDonald's Downtown" 
						class="form-input"
						maxlength="100"
					/>
				</div>

				<div class="form-group">
					<label class="form-label" for="location-address">Address (optional)</label>
					<input 
						id="location-address"
						type="text" 
						bind:value={newLocationAddress}
						placeholder="Enter address or description"
						class="form-input"
						maxlength="200"
					/>
				</div>

				{#if selectedLocation}
					<div class="coordinates">
						📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
					</div>
				{/if}

				<!-- Action buttons -->
				<div class="form-buttons">
					<button 
						class="cancel-btn" 
						on:click={handleCancelLocation}
					>
						Cancel
					</button>
					<button 
						class="create-btn" 
						on:click={handleCreateLocation}
						disabled={!newLocationName.trim()}
					>
						Create Location
					</button>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<h3>Tap on the map</h3>
				<p>Click anywhere on the map to create a new location, or click an existing location to add an instance</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.bottom-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: white;
		border-radius: 16px 16px 0 0;
		box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
		z-index: 1001;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		max-height: 80vh;
		overflow: hidden;
	}

	.bottom-panel.collapsed {
		transform: translateY(calc(100% - 60px));
	}

	.bottom-panel.partial {
		transform: translateY(calc(100% - 200px));
	}

	.bottom-panel.expanded {
		transform: translateY(10vh);
	}

	.panel-handle {
		padding: 12px 0 8px;
		display: flex;
		justify-content: center;
		cursor: grab;
		user-select: none;
	}

	.panel-handle:active {
		cursor: grabbing;
	}

	.handle-bar {
		width: 40px;
		height: 4px;
		background: #dadce0;
		border-radius: 2px;
	}

	.panel-content {
		padding: 0 20px 20px;
		height: calc(80vh - 60px);
		overflow-y: auto;
	}

	.location-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.location-title {
		margin: 0;
		font-size: 20px;
		font-weight: 500;
		color: #202124;
	}

	.close-button {
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		color: #5f6368;
	}

	.close-button:hover {
		background: #f1f3f4;
	}

	/* Pin creation form */
	.pin-form {
		margin-bottom: 24px;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-label {
		display: block;
		font-size: 12px;
		color: #5f6368;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 6px;
		font-weight: 500;
	}

	.mode-switcher {
		display: flex;
		gap: 8px;
		margin-top: 6px;
	}

	.mode-btn {
		flex: 1;
		padding: 8px 16px;
		background: #f8f9fa;
		border: 1px solid #e8eaed;
		border-radius: 8px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.mode-btn:hover {
		background: #f1f3f4;
		border-color: #dadce0;
	}

	.mode-btn.active {
		background: #1a73e8;
		border-color: #1a73e8;
		color: white;
	}

	.coordinates {
		font-size: 12px;
		color: #5f6368;
		padding: 8px;
		background: #f8f9fa;
		border-radius: 6px;
		text-align: center;
		margin-bottom: 16px;
	}

	.form-input, .form-textarea {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #dadce0;
		border-radius: 8px;
		font-size: 14px;
		color: #202124;
		background: white;
		outline: none;
		transition: border-color 0.2s;
	}

	.form-input:focus, .form-textarea:focus {
		border-color: #1a73e8;
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.checkbox-group {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border: 2px solid transparent;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}

	.checkbox-option:has(input[type="checkbox"]:checked) {
		background-color: rgb(59 130 246 / 0.1);
		border-color: rgb(59 130 246);
	}

	.checkbox-option input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		accent-color: rgb(59 130 246);
	}

	.checkbox-option label {
		cursor: pointer;
		font-weight: 500;
		margin: 0;
	}

	.radio-label {
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		padding: 8px 0;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		cursor: pointer;
		padding: 8px 12px;
		border: 1px solid #dadce0;
		border-radius: 8px;
		transition: all 0.2s;
		background: white;
		flex: 0 0 auto;
	}

	.checkbox-option:hover {
		background: #f8f9fa;
		border-color: #c4c7c5;
	}

	.checkbox-option input[type="checkbox"] {
		margin: 0 8px 0 0;
		accent-color: #1a73e8;
		cursor: pointer;
	}

	.checkbox-option:has(input[type="checkbox"]:checked) {
		background: #e8f0fe;
		border-color: #1a73e8;
		color: #1a73e8;
	}

	.checkbox-label {
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		user-select: none;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 24px;
		flex-wrap: wrap;
	}

	/* Action buttons */
	.action-button {
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		outline: none;
		min-width: 100px;
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-button.primary {
		background: #1a73e8;
		color: white;
		border: 2px solid #1a73e8;
	}

	.action-button.primary:hover:not(:disabled) {
		background: #1557b0;
		border-color: #1557b0;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
	}

	.action-button.secondary {
		background: white;
		color: #5f6368;
		border: 2px solid #dadce0;
	}

	.action-button.secondary:hover:not(:disabled) {
		background: #f8f9fa;
		border-color: #5f6368;
		color: #202124;
	}

	/* Form buttons for location creation */
	.form-buttons {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 24px;
		flex-wrap: wrap;
	}

	.cancel-btn, .create-btn {
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		outline: none;
		min-width: 100px;
	}

	.cancel-btn {
		background: white;
		color: #5f6368;
		border: 2px solid #dadce0;
	}

	.cancel-btn:hover {
		background: #f8f9fa;
		border-color: #5f6368;
		color: #202124;
	}

	.create-btn {
		background: #1a73e8;
		color: white;
		border: 2px solid #1a73e8;
	}

	.create-btn:hover:not(:disabled) {
		background: #1557b0;
		border-color: #1557b0;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
	}

	.create-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Location details */
	.location-details {
		margin-bottom: 24px;
	}

	.detail-row {
		display: flex;
		flex-direction: column;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid #f1f3f4;
	}

	.detail-row:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.detail-label {
		font-size: 12px;
		color: #5f6368;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
		font-weight: 500;
	}

	.detail-value {
		font-size: 16px;
		color: #202124;
		font-weight: 400;
		word-break: break-all;
	}

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: 40px 20px;
	}

	.empty-state h3 {
		margin: 0 0 8px;
		font-size: 18px;
		color: #202124;
	}

	.empty-state p {
		margin: 0;
		font-size: 14px;
		color: #5f6368;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.bottom-panel.expanded {
			transform: translateY(8vh); /* Conservative approach for mobile */
		}

		.panel-content {
			height: calc(92vh - 60px);
			padding-bottom: 40px; /* Extra padding for buttons */
		}

		.location-title {
			font-size: 18px;
		}

		.form-actions {
			flex-direction: column;
			gap: 8px;
			margin-top: 16px;
			position: sticky;
			bottom: 0;
			background: white;
			padding: 16px 0;
			border-top: 1px solid #f1f3f4;
			margin-left: -20px;
			margin-right: -20px;
			padding-left: 20px;
			padding-right: 20px;
		}

		.action-button {
			padding: 14px 16px;
			font-size: 16px;
			width: 100%;
			border-radius: 12px;
		}

		.checkbox-group {
			gap: 8px;
		}

		.checkbox-option {
			flex: 1 1 auto;
			min-width: 0;
			justify-content: center;
		}

		.checkbox-label {
			font-size: 13px;
		}
	}
</style>
