import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";

import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/loaders/glTF";

import "@babylonjs/core/Cameras/universalCamera";
import "@babylonjs/core/Meshes/groundMesh";
import "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Physics";
import "@babylonjs/materials/sky";

import { EngineManager, EngineOptions } from "./core/EngineManager";
import { PhysicsManager } from "./core/PhysicsManager";
import { SceneManager } from "./core/SceneManager";
import { BaseScene } from "./core/BaseScene";
import { MainScene } from "./scenes/MainScene";

export class App {
	private _canvas: HTMLCanvasElement;
	private _engineManager: EngineManager;
	private _physicsManager: PhysicsManager;
	private _sceneManager: SceneManager | null = null;

	constructor() {
		const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
		if (!canvasElement) {
			throw new Error('Canvas element not found');
		}
		this._canvas = canvasElement;
		this._engineManager = new EngineManager(this._canvas);
		this._physicsManager = new PhysicsManager();
	}

	public async init(engineOptions?: EngineOptions): Promise<void> {
		// Initialize engine
		this._engineManager.initialize(engineOptions);
		const engine = this._engineManager.getEngine();

		// Initialize physics
		await this._physicsManager.initialize();

		// Initialize managers
		this._sceneManager = new SceneManager(engine, this._canvas);

		// Create first scene
		await this.createFirstScene(engine);

		// Start render loop
		this._engineManager.startRenderLoop(() => {
			const activeScene = this._sceneManager?.getActiveScene();
			if (activeScene) {
				activeScene.render();
			}
		});
	}

	private async createFirstScene(engine: Engine): Promise<void> {
		if (!this._sceneManager) {
			throw new Error('App not initialized. Call init() first.');
		}

		const mainScene = new MainScene(engine, this._canvas, this._physicsManager);
		await this.createSceneFromClass(mainScene);
	}

	public async createSceneFromClass(sceneClass: BaseScene): Promise<Scene> {
		if (!this._sceneManager) {
			throw new Error('App not initialized. Call init() first.');
		}

		const name = sceneClass.getName();

		if (this._sceneManager.hasScene(name)) {
			throw new Error(`Scene "${name}" already exists.`);
		}

		const scene = await sceneClass.create();
		this._sceneManager.addScene(name, scene);

		// Set as active if no active scene
		if (!this._sceneManager.getActiveScene()) {
			this._sceneManager.switchScene(name);
		}

		return scene;
	}


	public removeScene(name: string): boolean {
		if (!this._sceneManager) {
			return false;
		}
		return this._sceneManager.removeScene(name);
	}

	public switchScene(name: string): boolean {
		if (!this._sceneManager) {
			return false;
		}
		return this._sceneManager.switchScene(name);
	}

	public getScene(name: string): Scene | undefined {
		return this._sceneManager?.getScene(name);
	}

	public getActiveScene(): Scene | null {
		return this._sceneManager?.getActiveScene() || null;
	}

	public getActiveSceneName(): string | null {
		return this._sceneManager?.getActiveSceneName() || null;
	}

	public getAllSceneNames(): string[] {
		return this._sceneManager?.getAllSceneNames() || [];
	}

	public getEngineManager(): EngineManager {
		return this._engineManager;
	}

	public getPhysicsManager(): PhysicsManager {
		return this._physicsManager;
	}

	public getSceneManager(): SceneManager | null {
		return this._sceneManager;
	}

	public dispose(): void {
		this._sceneManager?.dispose();
		this._engineManager.dispose();
	}
}
