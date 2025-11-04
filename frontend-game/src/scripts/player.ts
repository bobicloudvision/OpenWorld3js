import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { KeyboardEventTypes, KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";

import { onKeyboardEvent, visibleAsString } from "babylonjs-editor-tools";

export default class Player {

    @visibleAsString("Text", {
        description: "Defines the text drawn in the textblock."
    })
    private _text: string = "";


    private pressedKeys: Set<string> = new Set();
    private speed: number = 105.0;
    private physicsAggregate: PhysicsAggregate | null = null;

    public constructor(public mesh: Mesh) { }

    public onStart(): void {
        // Get existing physics aggregate from the mesh or its transform node
        // Physics aggregate is typically stored on the transform node in Babylon.js
        const node = this.mesh.parent || this.mesh;
        
        // Try to get physics aggregate from transform node (most common location)
        if ((node as any).physicsBody) {
            this.physicsAggregate = (node as any).physicsBody;
        } else if ((node as any).physicsAggregate) {
            this.physicsAggregate = (node as any).physicsAggregate;
        } else if (this.mesh.metadata?.physicsAggregate) {
            // Try metadata as fallback
            this.physicsAggregate = this.mesh.metadata.physicsAggregate;
        }
    }

    @onKeyboardEvent([
        KeyboardEventTypes.KEYUP,
        KeyboardEventTypes.KEYDOWN
    ])
    public handleKeyboard(info: KeyboardInfo): void {
        const key = info.event.key.toLowerCase();
        
        if (info.type === KeyboardEventTypes.KEYDOWN) {
            this.pressedKeys.add(key);
        } else if (info.type === KeyboardEventTypes.KEYUP) {
            this.pressedKeys.delete(key);
        }
    }

    public onUpdate(): void {
        if (!this.physicsAggregate) {
            return;
        }

        // Try different ways to access the physics body
        let physicsBody = null;
        
        // Method 1: Direct body property
        if (this.physicsAggregate.body) {
            physicsBody = this.physicsAggregate.body;
        } 
        // Method 2: Maybe it's stored differently
        else if ((this.physicsAggregate as any).transformNode?.physicsBody) {
            physicsBody = (this.physicsAggregate as any).transformNode.physicsBody;
        }
        // Method 3: Maybe the aggregate itself is the body
        else if (typeof (this.physicsAggregate as any).setLinearVelocity === 'function') {
            physicsBody = this.physicsAggregate as any;
        }
        
        if (!physicsBody) {
            return;
        }

        // Get forward direction based on mesh rotation
        const forward = new Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        );

        // Get right direction (perpendicular to forward)
        const right = new Vector3(
            Math.cos(this.mesh.rotation.y),
            0,
            -Math.sin(this.mesh.rotation.y)
        );

        const moveVector = Vector3.Zero();

        // W - Forward
        if (this.pressedKeys.has('w')) {
            moveVector.addInPlace(forward.scale(this.speed));
        }

        // S - Backward
        if (this.pressedKeys.has('s')) {
            moveVector.addInPlace(forward.scale(-this.speed));
        }

        // A - Left
        if (this.pressedKeys.has('a')) {
            moveVector.addInPlace(right.scale(-this.speed));
        }

        // D - Right
        if (this.pressedKeys.has('d')) {
            moveVector.addInPlace(right.scale(this.speed));
        }

        // For a ball, apply movement using physics velocity
        // This allows the ball to roll naturally with physics
        if (!moveVector.equals(Vector3.Zero())) {
            // Get current velocity
            const currentVelocity = physicsBody.getLinearVelocity();
            
            // Smoothly interpolate to target velocity for smoother ball movement
            const targetVelocity = new Vector3(
                moveVector.x,
                currentVelocity.y, // Preserve vertical velocity for gravity
                moveVector.z
            );
            
            // Apply velocity with slight smoothing for natural ball rolling
            const lerpFactor = 0.1;
            const smoothedVelocity = Vector3.Lerp(currentVelocity, targetVelocity, lerpFactor);
            physicsBody.setLinearVelocity(new Vector3(
                smoothedVelocity.x,
                currentVelocity.y, // Always preserve Y for gravity
                smoothedVelocity.z
            )); 
        } else {
            // Gradually stop horizontal movement when no keys pressed
            // This creates natural deceleration for the ball
            const currentVelocity = physicsBody.getLinearVelocity();
            const dampingFactor = 0.9; // Reduce velocity by 10% each frame
            physicsBody.setLinearVelocity(new Vector3(
                currentVelocity.x * dampingFactor,
                currentVelocity.y, // Preserve Y for gravity
                currentVelocity.z * dampingFactor
            ));
        }
    }
}
