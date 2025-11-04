import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { PhysicsManager } from "./PhysicsManager";

export abstract class BaseScene {
	protected _name: string;
	protected _scene: Scene | null = null;
	protected _engine: Engine;
	protected _canvas: HTMLCanvasElement;
	protected _physicsManager: PhysicsManager;
	protected _enablePhysics: boolean = true;

	constructor(
		name: string,
		engine: Engine,
		canvas: HTMLCanvasElement,
		physicsManager: PhysicsManager,
		enablePhysics: boolean = true
	) {
		this._name = name;
		this._engine = engine;
		this._canvas = canvas;
		this._physicsManager = physicsManager;
		this._enablePhysics = enablePhysics;
	}

	public getName(): string {
		return this._name;
	}

	public getScene(): Scene | null {
		return this._scene;
	}

	public async create(): Promise<Scene> {
		this._scene = new Scene(this._engine);

		if (this._enablePhysics && this._physicsManager.isInitialized()) {
			this._physicsManager.enablePhysics(this._scene);
		}

		// Subclasses override this to set up cameras, lights, meshes, etc.
		await this.setupScene(this._scene);

		// Set up update loop when scene is ready
		this._scene.executeWhenReady(() => {
			this._engine.loadingScreen.hideLoadingUI();
			
			// Set up update loop for scene-specific updates
			const updateScene = () => {
				const deltaSeconds = this._engine.getDeltaTime() / 1000;
				this.update(deltaSeconds);
			};

			this._scene!.onBeforeRenderObservable.add(() => updateScene());
		});

		return this._scene;
	}

	public dispose(): void {
		this._scene?.dispose();
		this._scene = null;
	}

	protected abstract setupScene(scene: Scene): Promise<void> | void;

	protected update(deltaTime: number): void {
		// Override in subclasses to add update logic
	}
}

