import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";

export class SceneManager {
	private _scenes: Map<string, Scene> = new Map();
	private _activeSceneName: string | null = null;
	private _engine: Engine;
	private _canvas: HTMLCanvasElement;

	constructor(engine: Engine, canvas: HTMLCanvasElement) {
		this._engine = engine;
		this._canvas = canvas;
	}

	public addScene(name: string, scene: Scene): void {
		if (this._scenes.has(name)) {
			throw new Error(`Scene "${name}" already exists.`);
		}

		this._scenes.set(name, scene);
	}

	public removeScene(name: string): boolean {
		const scene = this._scenes.get(name);
		if (!scene) {
			return false;
		}

		// If this is the active scene, switch to another scene or clear active
		if (this._activeSceneName === name) {
			const remainingScenes = Array.from(this._scenes.keys()).filter(n => n !== name);
			if (remainingScenes.length > 0) {
				this.switchScene(remainingScenes[0]);
			} else {
				this._activeSceneName = null;
			}
		}

		scene.dispose();
		this._scenes.delete(name);
		return true;
	}

	public switchScene(name: string): boolean {
		if (!this._scenes.has(name)) {
			return false;
		}

		const newScene = this._scenes.get(name)!;

		// Detach controls from previous scene's camera
		const previousScene = this.getActiveScene();
		if (previousScene?.activeCamera) {
			previousScene.activeCamera.detachControl();
		}

		// Attach controls to new scene's camera
		if (newScene.activeCamera) {
			newScene.activeCamera.attachControl(this._canvas, true);
		}

		this._activeSceneName = name;
		return true;
	}

	public getScene(name: string): Scene | undefined {
		return this._scenes.get(name);
	}

	public getActiveScene(): Scene | null {
		if (!this._activeSceneName) {
			return null;
		}
		return this._scenes.get(this._activeSceneName) || null;
	}

	public getActiveSceneName(): string | null {
		return this._activeSceneName;
	}

	public getAllSceneNames(): string[] {
		return Array.from(this._scenes.keys());
	}

	public hasScene(name: string): boolean {
		return this._scenes.has(name);
	}

	public dispose(): void {
		this._scenes.forEach((scene) => {
			scene.dispose();
		});
		this._scenes.clear();
		this._activeSceneName = null;
	}
}

