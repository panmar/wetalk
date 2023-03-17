export default class Message {
    constructor(userId, userName, roomId, text) {
        this.userId = userId;
        this.userName = userName;
        this.roomId = roomId;
        this.text = text;
        this.messageId = "id-" + crypto.randomUUID();
    }
}

export function isMessageValid(message) {
    if (!message.userId.toString().match(/^[0-9a-zA-Z]+$/)) {
        return false;
    }

    if (!message.messageId.match(/^[0-9a-zA-Z-]+$/)) {
        return false;
    }

    return true;
}