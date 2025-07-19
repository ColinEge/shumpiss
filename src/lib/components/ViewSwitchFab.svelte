<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher<{
		switchView: { view: 'map' | 'date' };
	}>();
	
	export let currentView: 'map' | 'date' = 'map';
	export let pinCount: number = 0;
	
	function switchView() {
		const newView = currentView === 'map' ? 'date' : 'map';
		dispatch('switchView', { view: newView });
	}
</script>

<button 
	class="fab"
	on:click={switchView}
	title="Switch to {currentView === 'map' ? 'Date' : 'Map'} View"
>
	{#if currentView === 'map'}
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
		</svg>
	{/if}
	
	{#if pinCount > 0}
		<span class="badge">{pinCount}</span>
	{/if}
</button>

<style>
	.fab {
		position: fixed;
		bottom: 24px;
		right: 24px;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: none;
		background: #1a73e8;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
		transition: all 0.3s ease;
		z-index: 1000;
		position: relative;
		overflow: visible;
	}
	
	.fab:hover {
		background: #1557b0;
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5);
	}
	
	.fab:active {
		transform: scale(1.05);
	}
	
	.fab svg {
		width: 24px;
		height: 24px;
	}
	
	.badge {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #ea4335;
		color: white;
		border-radius: 50%;
		min-width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 600;
		border: 2px solid white;
	}
	
	@media (max-width: 768px) {
		.fab {
			bottom: 16px;
			right: 16px;
			width: 48px;
			height: 48px;
		}
		
		.fab svg {
			width: 20px;
			height: 20px;
		}
		
		.badge {
			min-width: 18px;
			height: 18px;
			font-size: 9px;
		}
	}
</style>
