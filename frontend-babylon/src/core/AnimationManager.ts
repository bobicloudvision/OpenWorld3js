import { Scene } from "@babylonjs/core/scene";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";

export interface AnimationInfo {
	name: string;
	path: string;
	animationGroup: AnimationGroup;
}

export class AnimationManager {
	private _animations: Map<string, AnimationInfo> = new Map();
	private _isLoaded: boolean = false;
	private _loadingPromise: Promise<void> | null = null;

	/**
	 * Load all animations from the animations directory
	 * @param scene - The Babylon.js scene
	 * @param basePath - Base path to animations directory (default: "/models/animations")
	 */
	public async loadAll(scene: Scene, basePath: string = "/models/animations"): Promise<void> {
		if (this._isLoaded) {
			return Promise.resolve();
		}

		if (this._loadingPromise) {
			return this._loadingPromise;
		}

		this._loadingPromise = this._loadAnimations(scene, basePath);
		return this._loadingPromise;
	}

	private async _loadAnimations(scene: Scene, basePath: string): Promise<void> {
		const animationFiles = [
			"Attack1.glb",
			"Attack2.glb",
			"FallingForwardDeath.glb",
			"Jump.glb",
			"ManIdle1.glb",
			"ManIdle4.glb",
			"PohodkaTarikat.glb",
			"Punching.glb",
			"Walk1.glb",
			"WomanIdle1.glb"
		];

		const loadPromises = animationFiles.map(async (filename) => {
			try {
				const fullPath = `${basePath}/${filename}`;
				const assetContainer = await LoadAssetContainerAsync(fullPath, scene);
				
				// Extract animation name from filename (remove .glb extension)
				const animationName = filename.replace(/\.glb$/i, "");
				
				// Get animation groups from the asset container
				if (assetContainer.animationGroups.length > 0) {
					// Clone the animation group so we can use it multiple times
					const animationGroup = assetContainer.animationGroups[0].clone(`${animationName}_original`);
					
					const animationInfo: AnimationInfo = {
						name: animationName,
						path: fullPath,
						animationGroup: animationGroup
					};
					
					this._animations.set(animationName, animationInfo);
					console.log(`Loaded animation: ${animationName}`);
				} else {
					console.warn(`No animation groups found in ${filename}`);
				}
			} catch (error) {
				console.error(`Error loading animation ${filename}:`, error);
			}
		});

		await Promise.all(loadPromises);
		this._isLoaded = true;
		console.log(`AnimationManager: Loaded ${this._animations.size} animations`);
	}

	/**
	 * Get an animation by name
	 * @param name - Animation name (without .glb extension)
	 * @returns AnimationInfo or undefined if not found
	 */
	public getAnimation(name: string): AnimationInfo | undefined {
		return this._animations.get(name);
	}

	/**
	 * Get all loaded animations
	 * @returns Map of all animations
	 */
	public getAllAnimations(): Map<string, AnimationInfo> {
		return this._animations;
	}

	/**
	 * Get list of all animation names
	 * @returns Array of animation names
	 */
	public getAnimationNames(): string[] {
		return Array.from(this._animations.keys());
	}

	/**
	 * Check if animations are loaded
	 * @returns true if loaded, false otherwise
	 */
	public isLoaded(): boolean {
		return this._isLoaded;
	}

	/**
	 * Play an animation on a target mesh
	 * @param name - Animation name
	 * @param targetMesh - Target mesh to apply animation to (optional, required if animation needs to be retargeted)
	 * @param loop - Whether to loop the animation (default: false)
	 * @param speedRatio - Animation speed ratio (default: 1.0)
	 * @returns AnimationGroup or undefined if not found
	 */
	public playAnimation(
		name: string,
		targetMesh?: AbstractMesh,
		loop: boolean = false,
		speedRatio: number = 1.0
	): AnimationGroup | undefined {
		const animationInfo = this.getAnimation(name);
		if (!animationInfo) {
			console.warn(`Animation "${name}" not found`);
			return undefined;
		}

		// Clone the animation group
		const clonedGroup = animationInfo.animationGroup.clone(`${name}_instance`, undefined, true);
		clonedGroup.loopAnimation = loop;
		clonedGroup.speedRatio = speedRatio;

		// If target mesh is provided, retarget the animation to that mesh
		if (targetMesh) {
			this._retargetAnimation(clonedGroup, targetMesh);
		}

		clonedGroup.play(true);
		
		return clonedGroup;
	}

	/**
	 * Retarget animation to a different mesh/skeleton
	 * @param animationGroup - Animation group to retarget
	 * @param targetMesh - Target mesh with skeleton
	 */
	private _retargetAnimation(animationGroup: AnimationGroup, targetMesh: AbstractMesh): void {
		if (!targetMesh.skeleton) {
			console.warn(`Target mesh "${targetMesh.name}" has no skeleton, cannot retarget animation`);
			return;
		}

		const targetSkeleton = targetMesh.skeleton;
		
		// Update animation targets to point to the new skeleton's bones
		for (const animatable of animationGroup.targetedAnimations) {
			const animation = animatable.animation;
			const target = animatable.target;
			
			if (target && target instanceof Skeleton) {
				// Find matching bone in target skeleton
				// Try to get bone name from the original skeleton
				const originalBoneName = target.bones[0]?.name;
				if (originalBoneName) {
					const boneIndex = targetSkeleton.getBoneIndexByName(originalBoneName);
					if (boneIndex >= 0) {
						const targetBone = targetSkeleton.bones[boneIndex];
						// Update the animation target
						animatable.target = targetBone;
					}
				}
			}
		}
	}

	/**
	 * Stop all animations
	 */
	public stopAllAnimations(): void {
		for (const animationInfo of this._animations.values()) {
			animationInfo.animationGroup.stop();
		}
	}

	/**
	 * Check if a specific animation exists
	 * @param name - Animation name
	 * @returns true if animation exists, false otherwise
	 */
	public hasAnimation(name: string): boolean {
		return this._animations.has(name);
	}

	/**
	 * Dispose of all animations
	 */
	public dispose(): void {
		for (const animationInfo of this._animations.values()) {
			animationInfo.animationGroup.dispose();
		}
		this._animations.clear();
		this._isLoaded = false;
		this._loadingPromise = null;
	}
}
