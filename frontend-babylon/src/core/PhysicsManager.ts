import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import HavokPhysics from "@babylonjs/havok";

export class PhysicsManager {
	private _havokPlugin: HavokPlugin | null = null;
	private _initialized: boolean = false;

	public async initialize(): Promise<void> {
		if (this._initialized) {
			return;
		}

		const havok = await HavokPhysics();
		this._havokPlugin = new HavokPlugin(true, havok);
		this._initialized = true;
	}

	public enablePhysics(scene: Scene, gravity: Vector3 = new Vector3(0, -9.81, 0)): void {
		if (!this._havokPlugin) {
			throw new Error("Physics not initialized. Call initialize() first.");
		}

		if (!scene.isPhysicsEnabled()) {
			scene.enablePhysics(gravity, this._havokPlugin);
		}
	}

	public getPlugin(): HavokPlugin | null {
		return this._havokPlugin;
	}

	public isInitialized(): boolean {
		return this._initialized;
	}
}

