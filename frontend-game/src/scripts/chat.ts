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
    private scene: any;
    private messages: ChatMessage[] = [];
    private isMinimized: boolean = false;
    private currentUsername: string = 'Player';

    public constructor(public mesh: Mesh) { }

    private createCustomScrollbarStyles(): HTMLStyleElement {
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        return style;
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

    private createMessageElement(msg: ChatMessage): HTMLElement {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'relative p-3 rounded-md transition-all duration-200 border-l-[3px] bg-gradient-to-r from-amber-950/30 to-amber-900/20 border-l-amber-600/60 hover:from-amber-950/40 hover:to-amber-900/30';
        messageDiv.style.boxShadow = 'rgba(0, 0, 0, 0.4) 0px 1px 3px inset, rgba(0, 0, 0, 0.2) 0px 1px 2px';
        messageDiv.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center mb-1.5 relative z-10';

        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'font-bold text-[13px] uppercase tracking-wide text-amber-400';
        usernameSpan.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';
        usernameSpan.textContent = msg.username.toUpperCase();

        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-xs text-amber-600/80';
        timeSpan.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';
        timeSpan.textContent = msg.timestamp;

        headerDiv.appendChild(usernameSpan);
        headerDiv.appendChild(timeSpan);

        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = 'text-sm leading-normal break-words font-sans relative z-10 text-amber-200';
        messageContentDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
        messageContentDiv.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';
        messageContentDiv.textContent = msg.message;

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(messageContentDiv);

        return messageDiv;
    }

    private renderMessages(): void {
        this.messagesContainer.innerHTML = '';
        this.messages.forEach(msg => {
            const messageEl = this.createMessageElement(msg);
            this.messagesContainer.appendChild(messageEl);
        });
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    private toggleMinimize(): void {
        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) {
            this.chatContent.style.display = 'none';
            this.minimizeButton.textContent = '+';
        } else {
            this.chatContent.style.display = 'flex';
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
        // Get scene from mesh - access internal _scene property
        this.scene = (this.mesh as any)._scene || this.mesh.getEngine()?.scenes[0];
        
        if (!this.scene) {
            console.error("Could not access scene from mesh");
            return;
        }

        // Add custom scrollbar styles
        document.head.appendChild(this.createCustomScrollbarStyles());

        // Create main container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'fixed bottom-5 left-5 w-[350px] max-w-[calc(100vw-40px)] z-[1000] pointer-events-auto transition-all duration-300 max-h-[500px] max-md:w-[calc(100vw-40px)] max-md:max-h-[400px]';

        // Create inner content container
        this.chatContent = document.createElement('div');
        this.chatContent.className = 'bg-gradient-to-b from-amber-900/5 to-amber-950/5 p-6 rounded-md border-2 border-amber-700/50 flex flex-col transition-all duration-300 max-h-[500px]';
        this.chatContent.style.boxShadow = 'rgba(0, 0, 0, 0.5) 0px 2px 10px inset, rgba(217, 119, 6, 0.3) 0px 0px 15px';

        // Create header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'text-amber-200 mb-4 text-sm font-semibold uppercase tracking-wider';
        headerDiv.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';

        const headerContent = document.createElement('div');
        headerContent.className = 'flex justify-between items-center w-full cursor-pointer select-none';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'text-amber-400 font-bold text-base';
        titleSpan.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';
        titleSpan.textContent = 'Chat';

        this.minimizeButton = document.createElement('button');
        this.minimizeButton.className = 'bg-transparent border-none text-amber-400 text-xl font-bold cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-200 hover:bg-amber-400/20 hover:text-amber-300';
        this.minimizeButton.style.textShadow = 'rgba(0, 0, 0, 0.8) 1px 1px 2px';
        this.minimizeButton.textContent = '−';
        this.minimizeButton.addEventListener('click', () => this.toggleMinimize());

        headerContent.appendChild(titleSpan);
        headerContent.appendChild(this.minimizeButton);
        headerDiv.appendChild(headerContent);

        // Create messages container
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'chat-messages-scroll flex-1 overflow-y-auto p-2.5 min-h-[200px] max-h-[350px] flex flex-col gap-2 max-md:max-h-[250px] max-md:min-h-[150px]';
        this.messagesContainer.style.scrollbarWidth = 'thin';
        this.messagesContainer.style.scrollbarColor = 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)';

        // Create form
        const form = document.createElement('form');
        form.className = 'flex gap-2 pt-2.5 mt-2.5 border-t border-amber-600/30';
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSend();
        });

        const inputContainer = document.createElement('div');
        inputContainer.className = 'flex flex-col gap-2 flex-1';

        this.chatInput = document.createElement('input');
        this.chatInput.id = 'fantasy-input-hzlblyfdr';
        this.chatInput.type = 'text';
        this.chatInput.placeholder = 'Type a message... (Enter to send)';
        this.chatInput.maxLength = 500;
        this.chatInput.className = 'w-full px-4 py-3 bg-amber-950/50 border-2 border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20 rounded-lg text-amber-200 placeholder-amber-600/50 focus:outline-none transition-all duration-200';
        this.chatInput.style.textShadow = 'rgba(0, 0, 0, 0.5) 1px 1px 2px';
        this.chatInput.style.boxShadow = 'rgba(0, 0, 0, 0.3) 0px 2px 4px inset';
        this.chatInput.addEventListener('input', () => this.updateSendButton());

        inputContainer.appendChild(this.chatInput);

        this.sendButton = document.createElement('button');
        this.sendButton.type = 'submit';
        this.sendButton.disabled = true;
        this.sendButton.className = 'relative font-bold text-amber-950 border-2 border-amber-600 rounded cursor-pointer transition-all duration-200 uppercase tracking-wider py-2 px-6 text-sm opacity-50 cursor-not-allowed flex-shrink-0 whitespace-nowrap';
        this.sendButton.style.background = 'linear-gradient(rgb(251, 191, 36), rgb(217, 119, 6), rgb(180, 83, 9))';
        this.sendButton.style.boxShadow = 'rgba(0, 0, 0, 0.6) 0px 4px 8px, rgba(255, 255, 255, 0.3) 0px 1px 0px inset, rgba(0, 0, 0, 0.3) 0px -1px 0px inset';
        this.sendButton.style.textShadow = 'rgba(255, 255, 255, 0.3) 0px 1px 2px';
        this.sendButton.textContent = 'Send';

        form.appendChild(inputContainer);
        form.appendChild(this.sendButton);

        // Assemble structure
        this.chatContent.appendChild(headerDiv);
        this.chatContent.appendChild(this.messagesContainer);
        this.chatContent.appendChild(form);
        this.chatContainer.appendChild(this.chatContent);

        // Add to body
        document.body.appendChild(this.chatContainer);

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
        // Clean up when component is removed
        if (this.chatContainer && this.chatContainer.parentNode) {
            this.chatContainer.parentNode.removeChild(this.chatContainer);
        }
    }
}
