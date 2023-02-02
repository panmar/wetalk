import Message, { isMessageValid } from "./message.js";
import ChatLayout from "./chatLayout.js";
import User from "./user.js"

export default class ChatRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.user = User.tryLoad();
        this.messagesToAck = [];
        this.socket = io.connect("", { query: { userId: this.user.getId(), roomId: roomId } });

        this.socket.on("connect", this.onConnectEvent);
        this.socket.on("disconnect", this.onDisconnectEvent);
        this.socket.on("history", this.onHistoryEvent);
        this.socket.on("message", this.onMessageEvent);
        this.socket.on("message-ack", this.onMessageAckEvent);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        this.layout = new ChatLayout(this.user);
        this.layout.setSendMessageCallback(this.onSendMessage);
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
        if (!isMessageValid(message) || (message.userId === this.user.getId())) {
            return;
        }

        this.layout.displayMessage(message);

        if (document.hidden) {
            this.messagesToAck.push(message);
        } else {
            this.socket.emit("message-ack", this.user.getId(), this.roomId, message.messageId);
        }
    }

    onMessageAckEvent = ({userId, messageId}) => {
        console.log(`User: ${userId} have seen ${messageId}`);
        this.layout.updateReceivedMessageAvatar(userId, messageId);
    }

    onVisibilityChange = () => {
        if (document.hidden) {
            return;
        }

        for (const message of this.messagesToAck) {
            this.socket.emit("message-ack", this.user.getId(), this.roomId, message.messageId);
        }

        this.messagesToAck = [];
    }

    onSendMessage = (messageText) => {
        const message = new Message(this.user.getId(), this.user.getName(), this.roomId, messageText);
        this.socket.emit("message", message);
        console.log(`Message: ${JSON.stringify(message)}`);
        return message;
    }
}