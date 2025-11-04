import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ActionManager, ExecuteCodeAction } from "@babylonjs/core/Actions";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { moveTowards } from "../utils/mathUtils";

export class CharacterController {
	readonly model: AbstractMesh;
	private readonly impostorMesh: AbstractMesh;
	readonly physicsAggregate: PhysicsAggregate;
	readonly moveSpeed = 1.8;
	readonly rotationSpeed = 6;
	readonly animationBlendSpeed = 4.0;
	readonly walkAnim: AnimationGroup | null;
	readonly sambaAnim: AnimationGroup | null;
	readonly idleAnim: AnimationGroup | null;
	private targetAnim: AnimationGroup | null;
	readonly nonIdleAnimations: AnimationGroup[];
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

		// Try to find walk animation with multiple possible names
		this.walkAnim = this.findAnimationGroup(scene, ["Walking", "Walk", "Walk1", "PohodkaTarikat"]);
		if (this.walkAnim) {
			this.walkAnim.weight = 0;
		} else {
			console.warn("Walk animation not found - character will move without walk animation");
		}

		// Try to find idle animation with multiple possible names
		this.idleAnim = this.findAnimationGroup(scene, ["Idle", "ManIdle1", "ManIdle4", "WomanIdle1"]);
		if (this.idleAnim) {
			this.idleAnim.weight = 1;
			this.idleAnim.play(true);
		} else {
			console.warn("Idle animation not found - character will work without idle animation");
		}

		// Try to find samba/dance animation (optional)
		this.sambaAnim = this.findAnimationGroup(scene, ["SambaDancing", "Samba", "Dance"]);
		if (this.sambaAnim) {
			this.sambaAnim.weight = 0;
		}

		this.targetAnim = this.idleAnim;
		this.nonIdleAnimations = [this.walkAnim, this.sambaAnim].filter(anim => anim !== null) as AnimationGroup[];

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

	private findAnimationGroup(scene: Scene, names: string[]): AnimationGroup | null {
		for (const name of names) {
			const anim = scene.getAnimationGroupByName(name);
			if (anim !== null) {
				return anim;
			}
		}
		return null;
	}

	public getTransform(): TransformNode {
		return this.impostorMesh;
	}

	public update(deltaSeconds: number): void {
		this.targetAnim = this.idleAnim;

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
			if (this.walkAnim) {
				this.targetAnim = this.walkAnim;
			}

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

		if (this.inputMap.get("b") && this.sambaAnim) {
			this.targetAnim = this.sambaAnim;
		}

		let weightSum = 0;
		for (const animation of this.nonIdleAnimations) {
			if (animation === this.targetAnim) {
				animation.weight = moveTowards(animation.weight, 1, this.animationBlendSpeed * deltaSeconds);
			} else {
				animation.weight = moveTowards(animation.weight, 0, this.animationBlendSpeed * deltaSeconds);
			}
			if (animation.weight > 0 && !animation.isPlaying) animation.play(true);
			if (animation.weight === 0 && animation.isPlaying) animation.pause();

			weightSum += animation.weight;
		}

		if (this.idleAnim) {
			this.idleAnim.weight = moveTowards(this.idleAnim.weight, Math.min(Math.max(1 - weightSum, 0.0), 1.0), this.animationBlendSpeed * deltaSeconds);
		}
	}

	public dispose(): void {
		this.impostorMesh.dispose();
		this.model.dispose();
		this.physicsAggregate.dispose();
	}
}

