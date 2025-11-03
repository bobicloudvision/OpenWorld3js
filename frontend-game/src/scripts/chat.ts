import { Mesh } from "@babylonjs/core/Meshes/mesh";

interface ChatMessage {
    username: string;
    message: string;
    timestamp: string;
}

export default class ChatComponent {
    private chatContainer: HTMLElement;
    private messagesContainer: HTMLElement;
    private chatInput: HTMLInputElement;
    private sendButton: HTMLButtonElement;
    private minimizeButton: HTMLButtonElement;
    private chatContent: HTMLElement;
    private headerDiv: HTMLElement;
    private chatForm: HTMLElement;
    private scene: any;
    private messages: ChatMessage[] = [];
    private isMinimized: boolean = false;
    private currentUsername: string = 'Player';
    private isInitialized: boolean = false;
    private eventListeners: Array<{ element: HTMLElement | HTMLFormElement | HTMLInputElement | HTMLButtonElement; event: string; handler: EventListener }> = [];
    private escapeDiv: HTMLDivElement | null = null;

    public constructor(public mesh: Mesh) { }

    private getChatTemplate(): string {
        return `
            <style>
                .chat-messages-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-messages-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .chat-messages-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }
                .chat-messages-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            </style>
            <div class="fixed bottom-5 left-5 w-[350px] max-w-[calc(100vw-40px)] z-[1000] pointer-events-auto transition-all duration-300 max-h-[500px] max-md:w-[calc(100vw-40px)] max-md:max-h-[400px]" id="chat-container">
                <div class="bg-gradient-to-b from-amber-900/5 to-amber-950/5 p-6 rounded-md border-2 border-amber-700/50 flex flex-col transition-all duration-300 max-h-[500px]" id="chat-content" style="box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 10px inset, rgba(217, 119, 6, 0.3) 0px 0px 15px;">
                    <div class="text-amber-200 mb-4 text-sm font-semibold uppercase tracking-wider" id="chat-header" style="text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">
                        <div class="flex justify-between items-center w-full cursor-pointer select-none">
                            <span class="text-amber-400 font-bold text-base" style="text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">Chat</span>
                            <button id="chat-minimize-btn" class="bg-transparent border-none text-amber-400 text-xl font-bold cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-200 hover:bg-amber-400/20 hover:text-amber-300" style="text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">−</button>
                        </div>
                    </div>
                    <div class="chat-messages-scroll flex-1 overflow-y-auto p-2.5 min-h-[200px] max-h-[350px] flex flex-col gap-2 max-md:max-h-[250px] max-md:min-h-[150px]" id="chat-messages" style="scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);"></div>
                    <form id="chat-form" class="flex gap-2 pt-2.5 mt-2.5 border-t border-amber-600/30">
                        <div class="flex flex-col gap-2 flex-1">
                            <input id="chat-input" type="text" placeholder="Type a message... (Enter to send)" maxlength="500" class="w-full px-4 py-3 bg-amber-950/50 border-2 border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20 rounded-lg text-amber-200 placeholder-amber-600/50 focus:outline-none transition-all duration-200" style="text-shadow: rgba(0, 0, 0, 0.5) 1px 1px 2px; box-shadow: rgba(0, 0, 0, 0.3) 0px 2px 4px inset;" />
                        </div>
                        <button type="submit" id="chat-send-btn" disabled class="relative font-bold text-amber-950 border-2 border-amber-600 rounded cursor-pointer transition-all duration-200 uppercase tracking-wider py-2 px-6 text-sm opacity-50 cursor-not-allowed flex-shrink-0 whitespace-nowrap" style="background: linear-gradient(rgb(251, 191, 36), rgb(217, 119, 6), rgb(180, 83, 9)); box-shadow: rgba(0, 0, 0, 0.6) 0px 4px 8px, rgba(255, 255, 255, 0.3) 0px 1px 0px inset, rgba(0, 0, 0, 0.3) 0px -1px 0px inset; text-shadow: rgba(255, 255, 255, 0.3) 0px 1px 2px;">Send</button>
                    </form>
                </div>
            </div>
        `;
    }

    private formatTime(): string {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${ampm}`;
    }

    private getMessageTemplate(msg: ChatMessage): string {
        return `
            <div class="relative p-3 rounded-md transition-all duration-200 border-l-[3px] bg-gradient-to-r from-amber-950/30 to-amber-900/20 border-l-amber-600/60 hover:from-amber-950/40 hover:to-amber-900/30" style="box-shadow: rgba(0, 0, 0, 0.4) 0px 1px 3px inset, rgba(0, 0, 0, 0.2) 0px 1px 2px; text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">
                <div class="flex justify-between items-center mb-1.5 relative z-10">
                    <span class="font-bold text-[13px] uppercase tracking-wide text-amber-400" style="text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">${msg.username.toUpperCase()}</span>
                    <span class="text-xs text-amber-600/80" style="text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">${msg.timestamp}</span>
                </div>
                <div class="text-sm leading-normal break-words font-sans relative z-10 text-amber-200" style="font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, sans-serif; text-shadow: rgba(0, 0, 0, 0.8) 1px 1px 2px;">${this.escapeHtml(msg.message)}</div>
            </div>
        `;
    }

    private escapeHtml(text: string): string {
        // Reuse a single div element to avoid creating new DOM elements
        if (!this.escapeDiv) {
            this.escapeDiv = document.createElement('div');
        }
        this.escapeDiv.textContent = text;
        return this.escapeDiv.innerHTML;
    }

    private renderMessages(): void {
        this.messagesContainer.innerHTML = this.messages.map(msg => this.getMessageTemplate(msg)).join('');
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    private toggleMinimize(): void {
        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) {
            // Hide messages and form, keep header visible
            this.messagesContainer.style.display = 'none';
            this.chatForm.style.display = 'none';
            this.chatContent.style.padding = '1rem';
            this.chatContent.style.maxHeight = 'auto';
            this.minimizeButton.textContent = '+';
        } else {
            // Show messages and form
            this.messagesContainer.style.display = 'flex';
            this.chatForm.style.display = 'flex';
            this.chatContent.style.padding = '1.5rem';
            this.chatContent.style.maxHeight = '500px';
            this.minimizeButton.textContent = '−';
        }
    }

    private handleSend(): void {
        const message = this.chatInput.value.trim();
        if (!message || message.length === 0) return;

        this.addMessage(this.currentUsername, message);
        this.chatInput.value = '';
        this.updateSendButton();
    }

    private updateSendButton(): void {
        const hasText = this.chatInput.value.trim().length > 0;
        if (hasText) {
            this.sendButton.disabled = false;
            this.sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
            this.sendButton.classList.add('hover:opacity-90', 'hover:scale-105');
        } else {
            this.sendButton.disabled = true;
            this.sendButton.classList.add('opacity-50', 'cursor-not-allowed');
            this.sendButton.classList.remove('hover:opacity-90', 'hover:scale-105');
        }
    }

    public onStart(): void {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.warn("Chat component already initialized, skipping");
            return;
        }

        // Get scene from mesh - access internal _scene property
        this.scene = (this.mesh as any)._scene || this.mesh.getEngine()?.scenes[0];
        
        if (!this.scene) {
            console.error("Could not access scene from mesh");
            return;
        }

        // Check if chat container already exists in DOM (prevent duplicates)
        const existingContainer = document.getElementById('chat-container');
        if (existingContainer) {
            console.warn("Chat container already exists in DOM, removing old one");
            existingContainer.remove();
        }

        // Create wrapper to inject HTML template
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.getChatTemplate();

        // Get references to elements
        this.chatContainer = wrapper.querySelector('#chat-container') as HTMLElement;
        this.chatContent = wrapper.querySelector('#chat-content') as HTMLElement;
        this.headerDiv = wrapper.querySelector('#chat-header') as HTMLElement;
        this.messagesContainer = wrapper.querySelector('#chat-messages') as HTMLElement;
        this.chatForm = wrapper.querySelector('#chat-form') as HTMLElement;
        this.chatInput = wrapper.querySelector('#chat-input') as HTMLInputElement;
        this.sendButton = wrapper.querySelector('#chat-send-btn') as HTMLButtonElement;
        this.minimizeButton = wrapper.querySelector('#chat-minimize-btn') as HTMLButtonElement;

        // Attach event listeners and store references for cleanup
        const minimizeHandler = () => this.toggleMinimize();
        const submitHandler = (e: Event) => {
            e.preventDefault();
            this.handleSend();
        };
        const inputHandler = () => this.updateSendButton();

        this.minimizeButton.addEventListener('click', minimizeHandler);
        this.chatForm.addEventListener('submit', submitHandler);
        this.chatInput.addEventListener('input', inputHandler);

        // Store event listeners for cleanup
        this.eventListeners.push(
            { element: this.minimizeButton, event: 'click', handler: minimizeHandler },
            { element: this.chatForm, event: 'submit', handler: submitHandler },
            { element: this.chatInput, event: 'input', handler: inputHandler }
        );

        // Add to body
        document.body.appendChild(this.chatContainer);

        this.isInitialized = true;
        console.log("Chat component initialized with fantasy theme");
    }

    public onUpdate(): void {
        // Update logic can be added here if needed
    }

    public addMessage(username: string, message: string): void {
        const chatMessage: ChatMessage = {
            username: username,
            message: message,
            timestamp: this.formatTime()
        };

        this.messages.push(chatMessage);
        
        // Keep only last 50 messages
        if (this.messages.length > 50) {
            this.messages.shift();
        }
        
        this.renderMessages();
    }

    public setUsername(username: string): void {
        this.currentUsername = username;
    }

    public remove(): void {
        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        // Clean up DOM elements
        if (this.chatContainer && this.chatContainer.parentNode) {
            this.chatContainer.parentNode.removeChild(this.chatContainer);
        }

        // Clean up escape div
        if (this.escapeDiv) {
            this.escapeDiv = null;
        }

        // Reset state
        this.isInitialized = false;
        this.messages = [];
    }
}
