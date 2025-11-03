import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { IScript, visibleAsNumber } from "babylonjs-editor-tools";
import "@babylonjs/loaders/glTF";

// Simple seeded random number generator
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    // Generate next random number (0 to 1)
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    // Generate random number in range [min, max)
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }
}

export default class TreeGeneratorComponent implements IScript {
    @visibleAsNumber("Seed", {
        min: -1,
        max: 1000,
    })
    private _seed: number = -1;

    @visibleAsNumber("Max Trees", {
        min: 0,
        max: 100,
    })
    private _maxTrees: number = 0;

    private trees: AbstractMesh[] = [];
    private treeModelLoaded: boolean = false;
    private treeRootMesh: AbstractMesh | null = null;
    private isGenerating: boolean = false;

    public constructor(public mesh: Mesh) { }

    public async onStart(): Promise<void> {
        // Prevent multiple simultaneous generations
        if (this.isGenerating) {
            console.warn("Tree generation already in progress, skipping");
            return;
        }
        this.isGenerating = true;
        try {
            await this.generateTrees();
        } finally {
            this.isGenerating = false;
        }
    }

    private async generateTrees(): Promise<void> {
        const scene = this.mesh.getScene();
        
        // Get mesh bounding box to determine size
        const boundingInfo = this.mesh.getBoundingInfo();
        const min = boundingInfo.boundingBox.minimumWorld;
        const max = boundingInfo.boundingBox.maximumWorld;
        
        // Calculate mesh dimensions
        const width = max.x - min.x;
        const depth = max.z - min.z;
        const centerX = (min.x + max.x) / 2;
        const centerZ = (min.z + max.z) / 2;
        
        // Calculate number of trees based on area (roughly 1 tree per 100 square units)
        const area = width * 2.3;
        let treeCount = Math.max(1, Math.floor(area / 100));
        
        // Apply max trees limit if set (0 means unlimited)
        if (this._maxTrees > 0 && treeCount > this._maxTrees) {
            treeCount = this._maxTrees;
        }
        
        // Load tree model
        const treeRoot = "./models/forest/";
        const treeName = "tree1.glb";
        
        try {
            const result = await SceneLoader.ImportMeshAsync(
                "",
                treeRoot,
                treeName,
                scene
            );
            
            if (result.meshes.length > 0) {
                // Find the root mesh (usually the first one or a transform node)
                // GLB files often have a root transform node with child meshes
                this.treeRootMesh = result.meshes[0] as AbstractMesh;
                
                // Ensure world matrix is updated to get accurate bounding info
                this.treeRootMesh.computeWorldMatrix(true);
                
                // Get tree bounding box to understand its dimensions
                const treeBoundingInfo = this.treeRootMesh.getBoundingInfo();
                const treeMinY = treeBoundingInfo.boundingBox.minimumWorld.y;
                const treeHeight = treeBoundingInfo.boundingBox.maximumWorld.y - treeMinY;
                
                // Calculate ground level - use mesh max Y as the surface
                const groundLevel = max.y;
                
                // Initialize seeded random generator
                // If seed is -1 or undefined, use a random seed; otherwise use the provided seed (0 is valid)
                const seedToUse = (this._seed === undefined || this._seed === -1) ? Math.floor(Math.random() * 1000000) : this._seed;
                const rng = new SeededRandom(seedToUse);
                
                // Create tree instances in batches to prevent freezing
                const batchSize = 10; // Create trees in batches
                const batchDelay = 5; // Delay between batches in ms

                for (let i = 0; i < treeCount; i++) {
                    // Clone the entire tree hierarchy (pass false to clone children)
                    const treeInstance = this.treeRootMesh.clone(`tree_${i}`, null, false)!;
                    
                    // Random position within mesh bounds (using seeded random)
                    const randomX = centerX + (rng.range(-0.5, 0.5)) * width;
                    const randomZ = centerZ + (rng.range(-0.5, 0.5)) * depth;
                    
                    // Position tree so its bottom aligns with the ground
                    // If treeMinY is negative, the pivot is below the model's base
                    // If treeMinY is 0 or positive, we need to adjust
                    const yPosition = groundLevel - treeMinY;
                    
                    treeInstance.position = new Vector3(randomX, yPosition, randomZ);
                    
                    // Random rotation for variety (using seeded random)
                    treeInstance.rotation.y = rng.range(0, Math.PI * 2);
                    
                    // Random scale variation (0.8 to 1.2) (using seeded random)
                    const scale = rng.range(0.8, 1.2) * 100;
                    treeInstance.scaling = new Vector3(scale, scale, scale);
                    
                    // Make sure all child meshes are also enabled
                    treeInstance.getChildMeshes().forEach(child => {
                        child.setEnabled(true);
                    });
                    
                    treeInstance.setEnabled(true);
                    this.trees.push(treeInstance);
                    
                    // Yield to prevent blocking - batch processing
                    if ((i + 1) % batchSize === 0 && i + 1 < treeCount) {
                        await new Promise(resolve => setTimeout(resolve, batchDelay));
                    }

                    console.log(`Tree ${i} positioned at: (${randomX.toFixed(2)}, ${yPosition.toFixed(2)}, ${randomZ.toFixed(2)}), scale: ${scale.toFixed(2)}`); 
                    // return; 
                }
                
                // Update world matrices once after all trees are created
                this.trees.forEach(tree => {
                    tree.computeWorldMatrix(true);
                    tree.getChildMeshes().forEach(child => {
                        child.computeWorldMatrix(true);  
                    });
                });
                
                // Hide the original loaded mesh after cloning
                this.treeRootMesh.setEnabled(false);
                
                this.treeModelLoaded = true;
                const usedSeed = (this._seed === undefined || this._seed === -1) ? "random" : this._seed;
                const limitInfo = this._maxTrees > 0 ? ` (limited to ${this._maxTrees})` : "";
                console.log(`Successfully loaded tree model from: ${treeRoot}${treeName}, created ${treeCount} trees${limitInfo} with seed: ${usedSeed}`);
                console.log(`Mesh bounds: min(${min.x.toFixed(2)}, ${min.y.toFixed(2)}, ${min.z.toFixed(2)}), max(${max.x.toFixed(2)}, ${max.y.toFixed(2)}, ${max.z.toFixed(2)})`);
            }
        } catch (error: any) {
            console.error(`Failed to load tree model from ${treeRoot}${treeName}:`, error?.message || error);
        }
    }

    public onUpdate(): void {
        // Optional: Add subtle wind animation or other effects
    }

    public onDestroy(): void {
        // Clean up tree instances
        this.trees.forEach(tree => tree.dispose());
        if (this.treeRootMesh) {
            this.treeRootMesh.dispose();
        }
        this.trees = [];
    }
}
