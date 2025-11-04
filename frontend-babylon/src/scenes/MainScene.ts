import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
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
		this.createCamera(scene);
		this.createLighting(scene);
		await this.loadHDRSky(scene);
		await this.loadWorldModel(scene);
	}

	private createCamera(scene: Scene): void {
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
	}

	private createLighting(scene: Scene): void {
		const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
		light.intensity = 0.3;
	}

	private async loadHDRSky(scene: Scene): Promise<void> {
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
			this.createSkybox(scene, hdrTexture);
			
			console.log("HDR sky loaded successfully");
		} catch (error) {
			console.error("Error loading HDR sky:", error);
		}
	}

	private createSkybox(scene: Scene, hdrTexture: HDRCubeTexture): void {
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
	}

	private async loadWorldModel(scene: Scene): Promise<void> {
		try {
			const assetContainer = await LoadAssetContainerAsync("/models/world1.glb", scene);
			
			// Add all assets from the container to the scene
			assetContainer.addAllToScene();
			
			console.log("World model loaded successfully", {
				meshes: assetContainer.meshes.length,
				animations: assetContainer.animationGroups.length,
				skeletons: assetContainer.skeletons.length
			});
		} catch (error) {
			console.error("Error loading world model:", error);
		}
	}
}

