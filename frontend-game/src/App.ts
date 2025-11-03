import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SceneLoaderFlags } from "@babylonjs/core/Loading/sceneLoaderFlags";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import HavokPhysics from "@babylonjs/havok";

import { CustomLoadingScreen } from "./CustomLoadingScreen";

import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";

import "@babylonjs/core/Cameras/universalCamera";

import "@babylonjs/core/Meshes/groundMesh";

import "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/XR/features/WebXRDepthSensing";

import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";

import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";

import "@babylonjs/core/Physics";

import "@babylonjs/materials/sky";

import { loadScene } from "babylonjs-editor-tools";

/**
 * We import the map of all scripts attached to objects in the editor.
 * This will allow the loader from `babylonjs-editor-tools` to attach the scripts to the
 * loaded objects (scene, meshes, transform nodes, lights, cameras, etc.).
 */
import { scriptsMap } from "./scripts";

export class App {
	private _canvas: HTMLCanvasElement;
	private _engine: Engine | null = null;
	private _scene: Scene | null = null;

	constructor() {
		const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
		if (!canvasElement) {
			throw new Error('Canvas element not found');
		}
		this._canvas = canvasElement;
	}

	public async init(): Promise<void> {
		// Create and set custom loading screen
		const loadingScreen = new CustomLoadingScreen();
		
		this._engine = new Engine(this._canvas, true, {
			stencil: true,
			antialias: true,
			audioEngine: true,
			adaptToDeviceRatio: true,
			disableWebGL2Support: false,
			useHighPrecisionFloats: true,
			powerPreference: "high-performance",
			failIfMajorPerformanceCaveat: false,
		});

		// Set custom loading screen
		this._engine.loadingScreen = loadingScreen;
		this._engine.displayLoadingUI();

		this._scene = new Scene(this._engine);

		await this._handleLoad();

		// Hide loading screen when done
		this._engine.hideLoadingUI();

		// Handle window resize
		const handleResize = () => {
			this._engine?.resize();
		};

		window.addEventListener("resize", handleResize);

		// Start render loop
		this._engine.runRenderLoop(() => {
			this._scene?.render();
		});
	}

	private async _handleLoad(): Promise<void> {
		if (!this._engine || !this._scene) {return;}

		const loadingScreen = this._engine.loadingScreen as CustomLoadingScreen;

		// Update progress through different loading phases
		if (loadingScreen) {
			loadingScreen.updateProgress(10);
			loadingScreen.updateLoadingText("Initializing physics...");
		}

		const havok = await HavokPhysics();
		this._scene.enablePhysics(new Vector3(0, -981, 0), new HavokPlugin(true, havok));

		if (loadingScreen) {
			loadingScreen.updateProgress(30);
			loadingScreen.updateLoadingText("Loading scene assets...");
		}

		SceneLoaderFlags.ForceFullSceneLoadingForIncremental = true;

		await loadScene("/scene/", "example.babylon", this._scene, scriptsMap, {
			quality: "high",
		});

		// Update to 100% only once at the end
		if (loadingScreen) {
			loadingScreen.updateProgress(100);
			loadingScreen.updateLoadingText("Finalizing...");
		}

		if (this._scene.activeCamera) {
			this._scene.activeCamera.attachControl();
		}

		// Small delay to ensure smooth transition before hiding
		await new Promise(resolve => setTimeout(resolve, 300));
	}

	public dispose(): void {
		this._scene?.dispose();
		this._engine?.dispose();
	}
} 
