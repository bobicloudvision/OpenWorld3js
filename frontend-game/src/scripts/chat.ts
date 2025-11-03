import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";

export default class ChatComponent {
    private advancedTexture: AdvancedDynamicTexture;
    private chatContainer: Rectangle;
    private chatText: TextBlock;
    private scene: any;

    public constructor(public mesh: Mesh) { }

    private getResolution(): { width: number; height: number } {
        const engine = this.scene.getEngine();
        return {
            width: engine.getRenderWidth(),
            height: engine.getRenderHeight()
        };
    }

    private updateChatSize(): void {
        const resolution = this.getResolution();
        
        // Calculate container size as percentage of screen (30% width, 20% height)
        const containerWidth = resolution.width * 0.3;
        const containerHeight = resolution.height * 0.2;
        
        // Update container size
        this.chatContainer.width = `${containerWidth}px`;
        this.chatContainer.height = `${containerHeight}px`;
        
        // Calculate font size based on resolution (scale with height)
        const baseFontSize = 16;
        const scaleFactor = resolution.height / 1080; // Base on 1080p
        const fontSize = Math.max(12, Math.min(24, baseFontSize * scaleFactor));
        this.chatText.fontSize = fontSize;
        
        // Update padding based on resolution
        const padding = Math.max(10, 15 * scaleFactor);
        this.chatText.paddingLeft = `${padding}px`;
        this.chatText.paddingTop = `${padding}px`;
        this.chatText.paddingRight = `${padding}px`;
        this.chatText.paddingBottom = `${padding}px`;
    }

    public onStart(): void {
        // Get scene from mesh - access internal _scene property
        this.scene = (this.mesh as any)._scene || this.mesh.getEngine()?.scenes[0];
        
        if (!this.scene) {
            console.error("Could not access scene from mesh");
            return;
        }

        // Create fullscreen UI
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("ChatUI", true, this.scene);

        // Create chat container
        this.chatContainer = new Rectangle("chatContainer");
        this.chatContainer.cornerRadius = 10;
        this.chatContainer.color = "white";
        this.chatContainer.thickness = 2;
        this.chatContainer.background = "rgba(0, 0, 0, 0.8)";
        this.chatContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.chatContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.chatContainer.left = "20px";
        this.chatContainer.top = "-20px";
        this.chatContainer.isHitTestVisible = false;
        this.chatContainer.isPointerBlocker = false;
        this.advancedTexture.addControl(this.chatContainer);

        // Create text block for chat
        this.chatText = new TextBlock("chatText");
        this.chatText.text = "Welcome to the chat!\nPress Enter to type...";
        this.chatText.color = "#FFFFFF";
        this.chatText.fontWeight = "bold";
        this.chatText.textWrapping = true;
        this.chatText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.chatText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.chatText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.chatText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.chatText.width = 1.0;
        this.chatText.height = 1.0;
        this.chatText.isHitTestVisible = false;
        this.chatContainer.addControl(this.chatText);
        
        // Set initial size based on resolution
        this.updateChatSize();
        
        // Listen for window resize to update chat size
        const engine = this.scene.getEngine();
        window.addEventListener("resize", () => {
            this.updateChatSize();
        });
        
        console.log("Chat component initialized", {
            resolution: this.getResolution(),
            container: this.chatContainer,
            text: this.chatText
        });
    }

    public onUpdate(): void {
        // Update logic can be added here if needed
    }

    public addMessage(message: string): void {
        const currentText = this.chatText.text;
        const lines = currentText.split('\n');
        lines.push(message);
        
        // Keep only last 8 lines
        if (lines.length > 8) {
            lines.shift();
        }
        
        this.chatText.text = lines.join('\n');
    }
}
