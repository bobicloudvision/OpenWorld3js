import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ReflectionProbe } from "@babylonjs/core/Probes/reflectionProbe";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { BaseScene } from "../core/BaseScene";
import { PhysicsManager } from "../core/PhysicsManager";
import { CharacterController } from "../entities/CharacterController";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core";

export class MainScene extends BaseScene {
	private _characterController: CharacterController | null = null;
	private _defaultCamera: ArcRotateCamera | null = null;
	private _shadowGenerator: ShadowGenerator | null = null;
	private _sunLight: DirectionalLight | null = null;

	constructor(engine: Engine, canvas: HTMLCanvasElement, physicsManager: PhysicsManager) {
		super("main", engine, canvas, physicsManager, true);
	}

	protected async setupScene(scene: Scene): Promise<void> {
		this.createCamera(scene);
		this.createLighting(scene);
		this.createShadows(scene);
		await this.loadHDRSky(scene);
		await this.loadWorldModel(scene);
		await this.loadCharacter(scene);
	}

	private createCamera(scene: Scene): void {
		// Create default camera (will be replaced by character camera if character loads)
		this._defaultCamera = new ArcRotateCamera(
			"camera",
			-Math.PI / 2,
			Math.PI / 2.5,
			45,
			new Vector3(0, 0, 0),
			scene
		);
		this._defaultCamera.attachControl(this._canvas, true);
		scene.activeCamera = this._defaultCamera;
	}

	private createLighting(scene: Scene): void {
		// Create directional light (sun)
		this._sunLight = new DirectionalLight("sun", new Vector3(-5, -10, 5).normalize(), scene);
		this._sunLight.position = this._sunLight.direction.negate().scaleInPlace(40);

		// Create hemispheric light for ambient
		const hemiLight = new HemisphericLight("hemi", Vector3.Up(), scene);
		hemiLight.intensity = 0.4;
	}

	private createShadows(scene: Scene): void {
		if (!this._sunLight) return;

		this._shadowGenerator = new ShadowGenerator(1024, this._sunLight);
		this._shadowGenerator.useExponentialShadowMap = true;
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
			
			// Create reflection probe for better reflections
			const reflectionProbe = new ReflectionProbe("reflectionProbe", 512, scene);
			
			// Create skybox mesh to display the HDR sky
			const skybox = this.createSkybox(scene, hdrTexture);
			if (skybox && reflectionProbe.renderList) {
				reflectionProbe.renderList.push(skybox);
			}
			
			// Use reflection probe for environment texture
			scene.environmentTexture = reflectionProbe.cubeTexture;
			scene.environmentIntensity = 1.0;
			
			console.log("HDR sky loaded successfully");
		} catch (error) {
			console.error("Error loading HDR sky:", error);
		}
	}

	private createSkybox(scene: Scene, hdrTexture: HDRCubeTexture): any {
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
		return skybox;
	}

	private async loadWorldModel(scene: Scene): Promise<void> {
		try {
			const assetContainer = await LoadAssetContainerAsync("/models/world1.glb", scene);
			
			// Add all assets from the container to the scene
			assetContainer.addAllToScene();
			
			// Enable physics on all meshes
			for (const mesh of assetContainer.meshes) {
				// Skip helper meshes and meshes without geometry
				if (mesh.getTotalVertices() === 0) continue;
				
				mesh.position.y = -1;
				// Create static physics body (mass: 0 means immovable)

				new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 });
			}
			
			console.log("World model loaded successfully", {
				meshes: assetContainer.meshes.length,
				animations: assetContainer.animationGroups.length,
				skeletons: assetContainer.skeletons.length,
				physicsEnabled: true
			});
		} catch (error) {
			console.error("Error loading world model:", error);
		}
	}

	private async loadCharacter(scene: Scene): Promise<void> {
		try {
			// Replace with your character model path
			const characterPath = "/models/avatars/Avatar1.glb"; // Adjust path as needed
			this._characterController = await CharacterController.CreateAsync(scene, characterPath, this._canvas);
			
			// Set character position
			if (this._characterController) {
				this._characterController.getTransform().position.y = 3;
				
				// Add character to shadow caster
				if (this._shadowGenerator) {
					this._shadowGenerator.addShadowCaster(this._characterController.model);
				}
			}
			
			// Switch to character camera if character loaded successfully
			if (this._characterController && scene.activeCamera === this._defaultCamera) {
				scene.activeCamera = this._characterController.thirdPersonCamera;
				if (this._defaultCamera) {
					this._defaultCamera.detachControl();
				}
			}
			
			console.log("Character loaded successfully");
		} catch (error) {
			console.error("Error loading character (continuing without character):", error);
			// Continue without character if it fails to load
		}
	}

	protected update(deltaTime: number): void {
		if (this._characterController) {
			this._characterController.update(deltaTime);
		}
	}

	public dispose(): void {
		if (this._characterController) {
			this._characterController.dispose();
		}
		super.dispose();
	}
}

