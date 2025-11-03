import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";

export default class ChatComponent {
    private advancedTexture: AdvancedDynamicTexture;
    private chatContainer: Rectangle;
    private chatText: TextBlock;

    public constructor(public mesh: Mesh) { }

    public onStart(): void {
        // Get scene from mesh - access internal _scene property
        const scene = (this.mesh as any)._scene || this.mesh.getEngine()?.scenes[0];
        
        if (!scene) {
            console.error("Could not access scene from mesh");
            return;
        }

        // Create fullscreen UI
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("ChatUI", true, scene);

        // Create chat container
        this.chatContainer = new Rectangle("chatContainer");
        this.chatContainer.width = "400px";
        this.chatContainer.height = "200px";
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
        this.chatText.fontSize = 18;
        this.chatText.fontWeight = "bold";
        this.chatText.textWrapping = true;
        this.chatText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.chatText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.chatText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.chatText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.chatText.width = 1.0;
        this.chatText.height = 1.0;
        this.chatText.paddingLeft = "15px";
        this.chatText.paddingTop = "15px";
        this.chatText.paddingRight = "15px";
        this.chatText.paddingBottom = "15px";
        this.chatText.isHitTestVisible = false;
        this.chatContainer.addControl(this.chatText);
        
        console.log("Chat component initialized", {
            container: this.chatContainer,
            text: this.chatText,
            texture: this.advancedTexture
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
