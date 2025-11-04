import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ActionManager, ExecuteCodeAction } from "@babylonjs/core/Actions";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export class CharacterController {
	readonly model: AbstractMesh;
	private readonly impostorMesh: AbstractMesh;
	readonly physicsAggregate: PhysicsAggregate;
	readonly moveSpeed = 1.8;
	readonly rotationSpeed = 6;
	readonly inputMap: Map<string, boolean>;
	readonly thirdPersonCamera: ArcRotateCamera;
	keyForward = "w";
	keyBackward = "s";
	keyLeft = "a";
	keyRight = "d";

	static async CreateAsync(scene: Scene, characterPath: string, canvas: HTMLCanvasElement): Promise<CharacterController> {
		const assetContainer = await LoadAssetContainerAsync(characterPath, scene);
		assetContainer.addAllToScene();

		const model = assetContainer.meshes[0];
		if (!model) {
			throw new Error("Character model not found in asset container");
		}

		const cameraAttachPoint = new TransformNode("cameraAttachPoint", scene);
		cameraAttachPoint.parent = model;
		cameraAttachPoint.position = new Vector3(0, 1.5, 0);

		const camera = new ArcRotateCamera("thirdPersonCamera", -1.5, 1.2, 5, Vector3.Zero(), scene);
		camera.attachControl(canvas, true);

		camera.setTarget(cameraAttachPoint);
		camera.wheelPrecision = 200;
		camera.lowerRadiusLimit = 3;
		camera.upperBetaLimit = Math.PI / 2 + 0.2;

		return new CharacterController(model, camera, scene);
	}

	private constructor(characterMesh: AbstractMesh, thirdPersonCamera: ArcRotateCamera, scene: Scene) {
		this.impostorMesh = MeshBuilder.CreateCapsule("CharacterTransform", { height: 2, radius: 0.5 }, scene);
		this.impostorMesh.visibility = 0.1;
		this.impostorMesh.rotationQuaternion = Quaternion.Identity();

		this.model = characterMesh;
		this.model.parent = this.impostorMesh;
		this.model.rotate(Vector3.Up(), Math.PI);
		this.model.position.y = -1;

		this.thirdPersonCamera = thirdPersonCamera;

		this.inputMap = new Map();
		scene.actionManager = new ActionManager(scene);
		scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (e) => {
				this.inputMap.set(e.sourceEvent.key.toLowerCase(), e.sourceEvent.type === "keydown");
			})
		);
		scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
				this.inputMap.set(e.sourceEvent.key.toLowerCase(), e.sourceEvent.type === "keydown");
			})
		);

		this.physicsAggregate = new PhysicsAggregate(this.getTransform(), PhysicsShapeType.CAPSULE, { mass: 1, friction: 0.5 });

		this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
		this.physicsAggregate.body.setAngularDamping(100);
		this.physicsAggregate.body.setLinearDamping(10);
	}

	public getTransform(): TransformNode {
		return this.impostorMesh;
	}

	public update(deltaSeconds: number): void {
		const angle180 = Math.PI;
		const angle45 = angle180 / 4;
		const angle90 = angle180 / 2;
		const angle135 = angle45 + angle90;
		const direction = this.thirdPersonCamera.getForwardRay().direction;
		const forward = new Vector3(direction.x, 0, direction.z).normalize();
		const rot = Quaternion.FromLookDirectionLH(forward, Vector3.Up());

		let rotation = 0;
		if (this.inputMap.get(this.keyBackward) && !this.inputMap.get(this.keyRight) && !this.inputMap.get(this.keyLeft)) {
			rotation = angle180;
		}
		if (this.inputMap.get(this.keyLeft) && !this.inputMap.get(this.keyForward) && !this.inputMap.get(this.keyBackward)) {
			rotation = -angle90;
		}
		if (this.inputMap.get(this.keyRight) && !this.inputMap.get(this.keyForward) && !this.inputMap.get(this.keyBackward)) {
			rotation = angle90;
		}
		if (this.inputMap.get(this.keyForward) && this.inputMap.get(this.keyRight)) {
			rotation = angle45;
		}
		if (this.inputMap.get(this.keyForward) && this.inputMap.get(this.keyLeft)) {
			rotation = -angle45;
		}
		if (this.inputMap.get(this.keyBackward) && this.inputMap.get(this.keyRight)) {
			rotation = angle135;
		}
		if (this.inputMap.get(this.keyBackward) && this.inputMap.get(this.keyLeft)) {
			rotation = -angle135;
		}

		rot.multiplyInPlace(Quaternion.RotationAxis(Vector3.Up(), rotation));

		if (this.inputMap.get(this.keyForward) || this.inputMap.get(this.keyBackward) || this.inputMap.get(this.keyLeft) || this.inputMap.get(this.keyRight)) {
			const quaternion = rot;
			const impostorQuaternion = this.impostorMesh.rotationQuaternion;
			if (impostorQuaternion === null) {
				throw new Error("Impostor quaternion is null");
			}
			Quaternion.SlerpToRef(
				impostorQuaternion,
				quaternion,
				this.rotationSpeed * deltaSeconds,
				impostorQuaternion
			);
			this.impostorMesh.translate(new Vector3(0, 0, -1), this.moveSpeed * deltaSeconds);
			this.physicsAggregate.body.setTargetTransform(this.impostorMesh.absolutePosition, impostorQuaternion);
		}
	}

	public dispose(): void {
		this.impostorMesh.dispose();
		this.model.dispose();
		this.physicsAggregate.dispose();
	}
}

