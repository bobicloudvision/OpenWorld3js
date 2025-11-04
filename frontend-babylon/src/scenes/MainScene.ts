import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { BaseScene } from "../core/BaseScene";
import { PhysicsManager } from "../core/PhysicsManager";

export class MainScene extends BaseScene {
	constructor(engine: Engine, canvas: HTMLCanvasElement, physicsManager: PhysicsManager) {
		super("main", engine, canvas, physicsManager, true);
	}

	protected async setupScene(scene: Scene): Promise<void> {
		// Create camera
		const camera = new ArcRotateCamera(
			"camera",
			-Math.PI / 2,
			Math.PI / 2.5,
			45,
			new Vector3(0, 0, 0),
			scene
		);
		camera.attachControl(this._canvas, true);
		scene.activeCamera = camera;

		// Create light
		const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
		light.intensity = 0.7;

		// Load world model
		try {
			const result = await SceneLoader.ImportMeshAsync("", "/models/", "world1.glb", scene);
			console.log("World model loaded successfully", result);
		} catch (error) {
			console.error("Error loading world model:", error);
		}
	}
}

