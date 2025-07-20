<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let isVisible = true;
	export let title = '';
	export let ariaLabel = '';
	export let top = '80px';
	export let right = '20px';
	export let backgroundColor = '#1a73e8';
	export let hoverBackgroundColor = '#1557b0';
	export let clickEvent: string;
	
	const dispatch = createEventDispatcher();
	
	function handleClick() {
		dispatch(clickEvent);
	}
</script>

{#if true}
	<button 
		class="toggleable-fab"
		class:hidden={!isVisible}
		on:click={handleClick}
		{title}
		aria-label={ariaLabel}
		style="
			top: {top}; 
			right: {right};
			--bg-color: {backgroundColor};
			--hover-bg-color: {hoverBackgroundColor};
		"
	>
		<slot />
	</button>
{/if}

<style>
	.toggleable-fab {
		position: absolute;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: var(--bg-color, #1a73e8);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
		z-index: 1000;
		
		/* Smooth transition for show/hide */
		transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
		opacity: 1;
		transform: translateY(0);
	}
	
	.toggleable-fab.hidden {
		opacity: 0;
		transform: translateY(-10px);
		pointer-events: none;
	}
	
	.toggleable-fab:hover {
		background: var(--hover-bg-color, #1557b0);
		transform: translateY(0) scale(1.05);
		box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5);
	}
	
	.toggleable-fab:active {
		transform: translateY(0) scale(1.02);
	}
	
	.toggleable-fab :global(svg) {
		width: 20px;
		height: 20px;
	}
	
	@media (max-width: 768px) {
		.toggleable-fab {
			width: 44px;
			height: 44px;
			right: 16px;
		}
		
		.toggleable-fab :global(svg) {
			width: 18px;
			height: 18px;
		}
	}
</style>
