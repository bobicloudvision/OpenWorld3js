import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
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

		// Load HDR environment texture for sky
		try {
			// Parameters: url, scene, size, noMipmap, generateHarmonics, gammaSpace, prefilterOnLoad
			const hdrTexture = new HDRCubeTexture(
				"/models/night.hdr",
				scene,
				512,      // size
				false,    // noMipmap
				true,     // generateHarmonics (for PBR lighting)
				false,    // gammaSpace (PBR uses linear space)
				false     // prefilterOnLoad
			);
			
			// Set environment texture for PBR materials
			scene.environmentTexture = hdrTexture;
			scene.environmentIntensity = 1.0;
			
			// Create skybox mesh to display the HDR sky
			const skybox = MeshBuilder.CreateBox("skybox", { size: 1000 }, scene);
			const skyboxMaterial = new StandardMaterial("skyboxMaterial", scene);
			skyboxMaterial.backFaceCulling = false;
			skyboxMaterial.disableLighting = true;
			skyboxMaterial.reflectionTexture = hdrTexture.clone();
			if (skyboxMaterial.reflectionTexture) {
				skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
			}
			skybox.material = skyboxMaterial;
			skybox.infiniteDistance = true;
			
			console.log("HDR sky loaded successfully");
		} catch (error) {
			console.error("Error loading HDR sky:", error);
		}

		// Load world model
		try {
			const result = await SceneLoader.ImportMeshAsync("", "/models/", "world1.glb", scene);
			console.log("World model loaded successfully", result);
		} catch (error) {
			console.error("Error loading world model:", error);
		}
	}
}

