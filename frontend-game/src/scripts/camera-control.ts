import { Mesh } from "@babylonjs/core/Meshes/mesh";

export default class CameraControlComponent {
    public constructor(public mesh: Mesh) { }

    public onStart(): void {
        // Do something when the script is loaded
    }

    public onUpdate(): void {
        this.mesh.rotation.y += 0.04 * this.mesh.getScene().getAnimationRatio();
    }
}
