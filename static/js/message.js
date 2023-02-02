export default class Message {
    static lastMessageSeqNo = -1;

    constructor(userId, userName, roomId, text) {
        this.userId = userId;
        this.userName = userName;
        this.roomId = roomId;
        this.text = text;
        this.messageId = `message-id-${userId}-${++Message.lastMessageSeqNo}`;
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