import { Engine } from "@babylonjs/core/Engines/engine";

export interface EngineOptions {
	stencil?: boolean;
	antialias?: boolean;
	audioEngine?: boolean;
	adaptToDeviceRatio?: boolean;
	disableWebGL2Support?: boolean;
	useHighPrecisionFloats?: boolean;
	powerPreference?: "default" | "high-performance" | "low-power";
	failIfMajorPerformanceCaveat?: boolean;
}

export class EngineManager {
	private _engine: Engine | null = null;
	private _canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		this._canvas = canvas;
	}

	public initialize(options?: EngineOptions): Engine {
		if (this._engine) {
			return this._engine;
		}

		const defaultOptions: Required<EngineOptions> = {
			stencil: true,
			antialias: true,
			audioEngine: true,
			adaptToDeviceRatio: true,
			disableWebGL2Support: false,
			useHighPrecisionFloats: true,
			powerPreference: "high-performance",
			failIfMajorPerformanceCaveat: false,
		};

		const mergedOptions = { ...defaultOptions, ...options };

		this._engine = new Engine(this._canvas, true, mergedOptions);

		// Handle window resize
		window.addEventListener("resize", () => {
			this._engine?.resize();
		});

		return this._engine;
	}

	public getEngine(): Engine {
		if (!this._engine) {
			throw new Error("Engine not initialized. Call initialize() first.");
		}
		return this._engine;
	}

	public startRenderLoop(renderCallback: () => void): void {
		const engine = this.getEngine();
		engine.runRenderLoop(renderCallback);
	}

	public dispose(): void {
		this._engine?.dispose();
		this._engine = null;
	}
}

