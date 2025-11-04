import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import HavokPhysics from "@babylonjs/havok";

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

		this._scene = new Scene(this._engine);

		// Create a basic scene
		this._createScene();

		// Initialize physics
		const havok = await HavokPhysics();
		this._scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));

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

	private _createScene(): void {
		if (!this._scene) return;

		// Create camera
		const camera = new ArcRotateCamera(
			"camera",
			-Math.PI / 2,
			Math.PI / 2.5,
			10,
			new Vector3(0, 0, 0),
			this._scene
		);
		camera.attachControl(this._canvas, true);
		this._scene.activeCamera = camera;

		// Create light
		const light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);
		light.intensity = 0.7;

		// Create ground
		const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this._scene);

		// Create a box
		const box = MeshBuilder.CreateBox("box", { size: 2 }, this._scene);
		box.position.y = 1;

		// Create a sphere
		const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, this._scene);
		sphere.position.x = -3;
		sphere.position.y = 1;

		// Create a cylinder
		const cylinder = MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, this._scene);
		cylinder.position.x = 3;
		cylinder.position.y = 1;
	}

	public dispose(): void {
		this._scene?.dispose();
		this._engine?.dispose();
	}
}
