import { ILoadingScreen } from "@babylonjs/core/Loading/loadingScreen";

/**
 * Custom loading screen implementation
 */
export class CustomLoadingScreen implements ILoadingScreen {
	public loadingUIBackgroundColor: string = "#1a1a1a";
	public loadingUIText: string = "Loading...";

	private _loadingDiv: HTMLDivElement | null = null;
	private _progressBar: HTMLDivElement | null = null;
	private _progressFill: HTMLDivElement | null = null;
	private _loadingText: HTMLDivElement | null = null;

	constructor() {
		this._createLoadingUI();
	}

	private _createLoadingUI(): void {
		// Create container
		this._loadingDiv = document.createElement("div");
		this._loadingDiv.id = "babylonjs-loading-screen";
		this._loadingDiv.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			opacity: 1;
			transition: opacity 0.5s ease-out;
		`;

		// Create logo/icon area (you can add an image here)
		const logoContainer = document.createElement("div");
		logoContainer.style.cssText = `
			margin-bottom: 40px;
			opacity: 0.9;
		`;
		
		const logoText = document.createElement("div");
		logoText.textContent = "OpenWorld3js";
		logoText.style.cssText = `
			font-size: 48px;
			font-weight: bold;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 10px;
		`;
		logoContainer.appendChild(logoText);

		// Create loading text
		this._loadingText = document.createElement("div");
		this._loadingText.textContent = this.loadingUIText;
		this._loadingText.style.cssText = `
			color: #e5e7eb;
			font-size: 18px;
			margin-bottom: 30px;
			text-align: center;
		`;

		// Create progress bar container
		const progressContainer = document.createElement("div");
		progressContainer.style.cssText = `
			width: 300px;
			height: 6px;
			background-color: rgba(255, 255, 255, 0.1);
			border-radius: 3px;
			overflow: hidden;
			margin-bottom: 20px;
		`;

		// Create progress fill
		this._progressFill = document.createElement("div");
		this._progressFill.style.cssText = `
			height: 100%;
			width: 0%;
			background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
			border-radius: 3px;
			transition: width 0.3s ease;
		`;
		progressContainer.appendChild(this._progressFill);
		this._progressBar = progressContainer;

		// Create spinner
		const spinner = document.createElement("div");
		spinner.style.cssText = `
			width: 40px;
			height: 40px;
			border: 4px solid rgba(102, 126, 234, 0.2);
			border-top: 4px solid #667eea;
			border-radius: 50%;
			animation: spin 1s linear infinite;
		`;

		// Add keyframes animation
		const style = document.createElement("style");
		style.textContent = `
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
			@keyframes fadeOut {
				from { opacity: 1; }
				to { opacity: 0; }
			}
		`;
		document.head.appendChild(style);

		// Assemble UI
		this._loadingDiv.appendChild(logoContainer);
		this._loadingDiv.appendChild(this._loadingText);
		this._loadingDiv.appendChild(this._progressBar);
		this._loadingDiv.appendChild(spinner);

		document.body.appendChild(this._loadingDiv);
	}

	public displayLoadingUI(): void {
		if (this._loadingDiv) {
			this._loadingDiv.style.display = "flex";
		}
	}

	public hideLoadingUI(): void {
		if (this._loadingDiv) {
			// Use opacity transition for smoother fade
			this._loadingDiv.style.opacity = "0";
			this._loadingDiv.style.transition = "opacity 0.5s ease-out";
			
			setTimeout(() => {
				if (this._loadingDiv) {
					this._loadingDiv.style.display = "none";
				}
			}, 500);
		}
	}

	public updateLoadingText(text: string): void {
		this.loadingUIText = text;
		if (this._loadingText) {
			this._loadingText.textContent = text;
		}
	}

	public updateProgress(progress: number): void {
		if (this._progressFill) {
			this._progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
		}
	}
}

