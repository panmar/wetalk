import Message, { isMessageValid } from "./message.js";
import ChatLayout from "./chatLayout.js";

export default class Chat {
    constructor() {
        this.userId = Math.floor(Math.random() * 10000);
        this.layout = new ChatLayout(this.userId);
        this.messagesToAck = [];
        this.socket = io.connect("", { query: `userId=${this.userId}` });

        this.socket.on("connect", this.onConnectEvent);
        this.socket.on("disconnect", this.onDisconnectEvent);
        this.socket.on("history", this.onHistoryEvent);
        this.socket.on("message", this.onMessageEvent);
        this.socket.on("message-ack", this.onMessageAckEvent);
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        this.layout.addSendMessageCallback(this.onSendMessage);
    }

    onConnectEvent = () => {
        this.layout.onConnect();
    }

    onDisconnectEvent = () => {
        this.layout.onDisconnect();
    }

    onHistoryEvent = (messages) => {
        for (const message of messages) {
            if (!isMessageValid(message)) {
                return;
            }
        }
        this.layout.clearChatMessages();
        this.layout.displayMessages(messages);
    }

    onMessageEvent = (message) => {
        console.log(JSON.stringify(message, null, 4));
        if (!isMessageValid(message) || (message.userId === this.userId)) {
            return;
        }

        this.layout.displayMessage(message);

        if (document.hidden) {
            this.messagesToAck.push(message);
        } else {
            this.socket.emit("message-ack", this.userId, message.messageId);
        }
    }

    onMessageAckEvent = (x) => {
        console.log(`User: ${x.userId} have seen ${x.messageId}`);
        this.layout.updateReceivedMessageAvatar(x.userId, x.messageId);
    }

    onVisibilityChange = () => {
        if (document.hidden) {
            return;
        }

        for (const message of this.messagesToAck) {
            this.socket.emit("message-ack", this.userId, message.messageId);
        }

        this.messagesToAck = [];
    }

    onSendMessage = (messageText) => {
        const message = new Message(this.userId, messageText);
        this.socket.emit("message", message);
        console.log(`Message: ${JSON.stringify(message)}`);
        return message;
    }
}