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
        }, 1000);
    }

    private async switchToGamePlayScene(): Promise<void> {
        const currentScene = this.mesh.getScene();
        const engine = currentScene.getEngine() as Engine;
        
        if (!engine || !currentScene) {
            return;
        }

        // Clear all scene content but keep the scene object for render loop
        currentScene.dispose();

        // Create new scene with same engine
        const newScene = new Scene(engine);

        // Follow the exact pattern from App.ts _handleLoad
        const havok = await HavokPhysics();
        newScene.enablePhysics(new Vector3(0, -981, 0), new HavokPlugin(true, havok));

        SceneLoaderFlags.ForceFullSceneLoadingForIncremental = true;
        await loadScene("/scene/", "GamePlayScene.babylon", newScene, scriptsMap, {
            quality: "high",
        });

        if (newScene.activeCamera) {
            newScene.activeCamera.attachControl();
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
