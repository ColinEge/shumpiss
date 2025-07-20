<script lang="ts">
	export let hidden = false;
</script>

<button 
	class="date-fab"
	class:hidden
	on:click
	title="Switch to Date View"
	aria-label="Switch to Date View"
>
	<svg viewBox="0 0 24 24" fill="currentColor">
		<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
	</svg>
</button>

<style>
	.date-fab {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: #1a73e8;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
		z-index: 1000;
		/* Match the transition from search controls */
		transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
		flex-shrink: 0;
	}
	
	.date-fab.hidden {
		opacity: 0;
		transform: translateY(-10px);
		pointer-events: none;
	}
	
	.date-fab:hover {
		background: #1557b0;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5);
	}
	
	.date-fab:active {
		transform: scale(1.02);
	}
	
	.date-fab svg {
		width: 20px;
		height: 20px;
	}
	
	@media (max-width: 768px) {
		.date-fab {
			width: 44px;
			height: 44px;
		}
		
		.date-fab svg {
			width: 18px;
			height: 18px;
		}
	}
</style>
