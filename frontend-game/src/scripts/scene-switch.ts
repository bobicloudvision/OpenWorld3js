import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SceneLoaderFlags } from "@babylonjs/core/Loading/sceneLoaderFlags";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { loadScene } from "babylonjs-editor-tools";
import { scriptsMap } from "../scripts";

export default class SceneSwitchComponent {
    private sceneSwitchTimeout: number | null = null;
    
    public constructor(public mesh: Mesh) { }

    public onStart(): void {
        // Switch to GamePlayScene after 5 seconds
        this.sceneSwitchTimeout = window.setTimeout(() => {
            this.switchToGamePlayScene();
        }, 5000);
    }

    private async switchToGamePlayScene(): Promise<void> {
        try {
            const currentScene = this.mesh.getScene();
            const engine = currentScene.getEngine() as Engine;
            
            if (!engine) {
                console.error("Could not access engine");
                return;
            }
            console.log("Engine accessed"); 

            // Store engine reference before clearing
            // Clear all meshes, lights, cameras, etc. from current scene
            const meshes = [...currentScene.meshes];
            meshes.forEach(mesh => {
                try {
                    mesh.dispose();
                } catch (e) {
                    console.warn("Error disposing mesh:", e);
                }
            });

            // Clear lights
            const lights = [...currentScene.lights];
            lights.forEach(light => {
                try {
                    light.dispose();
                } catch (e) {
                    console.warn("Error disposing light:", e);
                }
            });

            // Clear cameras (but detach first)
            const cameras = [...currentScene.cameras];
            cameras.forEach(cam => {
                try {
                    cam.detachControl();
                    cam.dispose();
                } catch (e) {
                    console.warn("Error disposing camera:", e);
                }
            });

            // Clear materials
            currentScene.materials.forEach(mat => {
                try {
                    mat.dispose();
                } catch (e) {
                    console.warn("Error disposing material:", e);
                }
            });

            // Clear textures
            currentScene.textures.forEach(tex => {
                try {
                    tex.dispose();
                } catch (e) {
                    console.warn("Error disposing texture:", e);
                }
            });

            // Disable physics on old scene
            if (currentScene.physicsEnabled) {
                currentScene.disablePhysicsEngine();
            }

            // Set up physics for new scene
            const havok = await HavokPhysics();
            currentScene.enablePhysics(new Vector3(0, -981, 0), new HavokPlugin(true, havok));

            // Load GamePlayScene into the same scene object
            SceneLoaderFlags.ForceFullSceneLoadingForIncremental = true;
            
            // Construct absolute URL to ensure proper path resolution
            const baseUrl = window.location.origin;
            const scenePath = "/scene/";
            const sceneFile = "GamePlayScene.babylon";
            const fullPath = baseUrl + scenePath + sceneFile;
            
            console.log("Loading scene from:", fullPath);
            console.log("Base path:", scenePath);
            console.log("Scene file:", sceneFile);
            
            try {
                await loadScene(scenePath, sceneFile, currentScene, scriptsMap, {
                    quality: "high",
                });
            } catch (loadError) {
                console.error("Detailed load error:", loadError);
                throw loadError;
            }

            // Attach camera if available
            if (currentScene.activeCamera) {
                currentScene.activeCamera.attachControl();
            }

            console.log("Switched to GamePlayScene");  
        } catch (error) {
            console.error("Error switching scene:", error);
        }
    }

    public onUpdate(): void {
        // Removed rotation update as it's no longer needed
    }

    public onDestroy(): void {
        // Clean up timeout if component is destroyed before scene switch
        if (this.sceneSwitchTimeout !== null) {
            clearTimeout(this.sceneSwitchTimeout);
        }
    }
}
