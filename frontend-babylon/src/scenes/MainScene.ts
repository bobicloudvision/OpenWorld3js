import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { BaseScene } from "../core/BaseScene";
import { PhysicsManager } from "../core/PhysicsManager";

export class MainScene extends BaseScene {
	constructor(engine: Engine, canvas: HTMLCanvasElement, physicsManager: PhysicsManager) {
		super("main", engine, canvas, physicsManager, true);
	}

	protected setupScene(scene: Scene): void {
		// Create camera
		const camera = new ArcRotateCamera(
			"camera",
			-Math.PI / 2,
			Math.PI / 2.5,
			10,
			new Vector3(0, 0, 0),
			scene
		);
		camera.attachControl(this._canvas, true);
		scene.activeCamera = camera;

		// Create light
		const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
		light.intensity = 0.7;

		// Create ground
		const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);

		// Create a box
		const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
		box.position.y = 1;

		// Create a sphere
		const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
		sphere.position.x = -3;
		sphere.position.y = 1;

		// Create a cylinder
		const cylinder = MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, scene);
		cylinder.position.x = 3;
		cylinder.position.y = 1;

	}
}

