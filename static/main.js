class Message {
    constructor(userId, text, messageSeqNo, socketId) {
        this.userId = userId;
        this.text = text;
        this.messageId = `message-id-#${userId}@${messageSeqNo}`;
        this.socketId = socketId;
    }
}

function setup() {
    window.userId = Math.floor(Math.random() * 10000);
    window.lastMessageSeqNo = -1;

    if (!window.socket) {
        window.socket = io.connect("", { query: `userId=${window.userId}` });
    }

    window.socket.on("connect", onConnectEvent);
    window.socket.on("disconnect", onDisconnectEvent);
    window.socket.on("history", onHistoryEvent);
    window.socket.on("message", onMessageEvent);
    window.socket.on("message-ack", onMessageAckEvent);

    hookSendMessageInput(document.getElementById("send-message-input"));
}

function onConnectEvent() {
    let input = document.getElementById("send-message-input");
    input.style.backgroundColor = "darkgrey";
}

function onDisconnectEvent() {
    let input = document.getElementById("send-message-input");
    input.style.backgroundColor = "rgb(172, 83, 83)";
}

function onHistoryEvent(messages) {
    console.log(`Received history: ${JSON.stringify(messages)}`);
    clearChatMessages();
    messages.forEach((message) => { showMessage(message); });
}

function onMessageEvent(message) {
    if (message.userId === window.userId) {
        return;
    }
    showMessage(message);

    window.socket.emit("message-ack", window.userId, message.messageId);
}

function onMessageAckEvent(x) {
    console.log(`User: ${x.userId} have seen ${x.messageId}`);
    updateReceivedMessageAvatar(x.userId, x.messageId);
}

function updateReceivedMessageAvatar(userId, messageId) {
    const id = `last-received-avatar-${userId}`;

    const lastAvatar = document.getElementById(id);
    if (lastAvatar) {
        lastAvatar.remove();
    }

    {
        let messageElement = document.getElementById(messageId);
        let avatarCellElement = messageElement.getElementsByClassName("message-multiple-receivers-area")[0];
        const avatarElement = document.createElement("div");
        const [red, green, blue] = computeUserColor(userId);
        avatarElement.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
        avatarElement.classList.add("receiver-avatar");
        avatarElement.id = id;
        avatarCellElement.appendChild(avatarElement);
    }
}

function showMessage(message) {
    let element = createChatEntryElement(message);
    document.getElementById("chat").appendChild(element);

    if (window.userId !== message.userId) {
        updateSentMessageAvatar(element, message.userId);
    }

    // NOTE(panmar): This is probablly not what we want for all messages
    element.scrollIntoView();
}


function createChatEntryElement(message) {
    let html = "";
    if (window.userId === message.userId) {
        html = createChatEntryFromMeHtml(message);
    } else {
        html = createChatEntryFromOtherHtml(message);
    }

    let element = document.createElement("div");
    element.classList.add("chat-entry")
    element.innerHTML = html;
    element.id = message.messageId;
    return element;
}

function createChatEntryFromMeHtml(message) {
    const html = `
        <div class="message-from-me">
            <div class="sender-avatar-area"></div>
            <div class="message-main-area">
                <div class="message-text-area right">
                    <div class="message-buttons hide">
                        <div class="message-button"></div>
                        <div class="message-button"></div>
                        <div class="message-button"></div>
                    </div>
                    <div class="message-text message-text-me">${message.text}</div>
                </div>
            </div>
            <div class="message-single-receiver-area"></div>
        </div>
        <div class="message-multiple-receivers-area"></div>`;

    return html;
}

function createChatEntryFromOtherHtml(message) {
    let userNameHtml = "";

    if (message.userId !== getLastDisplayedMessageUserId()) {
        console.log(`${message.userId} !== ${getLastDisplayedMessageUserId()}`);
        userNameHtml = `<div class="sender-name">User #${message.userId}</div>`;
    }

    const html = `
        <div class="message-from-other">
            <div class="sender-avatar-area"></div>
            <div class="message-main-area">
                ${userNameHtml}
                <div class="message-text-area">
                    <div class="message-text message-text-other">${message.text}</div>
                    <div class="message-buttons hide">
                        <div class="message-button"></div>
                        <div class="message-button"></div>
                        <div class="message-button"></div>
                    </div>
                </div>
            </div>
            <div class="message-single-receiver-area"></div>
        </div>
        <div class="message-multiple-receivers-area"></div>`;

    return html;
}

function updateSentMessageAvatar(chatEntryElement, userId) {
    const id = `last-sent-avatar-${userId}`;
    let element = document.getElementById(id);
    if (element) {
        element.remove();
    }

    {
        const [red, green, blue] = computeUserColor(userId);
        const color = `rgb(${red}, ${green}, ${blue})`;
        let avatar = document.createElement("div");
        avatar.classList.add("sender-avatar");
        avatar.style.backgroundColor = color;
        avatar.id = id;
        chatEntryElement.getElementsByClassName("sender-avatar-area")[0].appendChild(avatar);
    }
}

function computeUserColor(userId) {
    const red = 0;
    const green = userId % 256;
    const blue = (userId.toString().split("").reverse().join("")) % 256;
    return [red, green, blue];
}

function getLastDisplayedMessageUserId() {
    let chatUserNameElements = document.getElementById("chat").getElementsByClassName("sender-name");
    if (chatUserNameElements.length === 0) {
        return -1;
    }

    const lastChatUserNameText = chatUserNameElements[chatUserNameElements.length - 1].innerHTML;
    // NOTE(panmar): Text is of `User #123456`
    const userIdStartingIndex = lastChatUserNameText.indexOf("#") + 1;
    const lastChatUserId = lastChatUserNameText.slice(userIdStartingIndex);
    return parseInt(lastChatUserId);
}

function clearChatMessages() {
    let chatElement = document.getElementById("chat");
    chatElement.replaceChildren();
}

function hookSendMessageInput(element) {
    element.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            let messageText = element.value;
            if (!messageText) {
                return;
            }

            const message = new Message(window.userId, messageText, ++window.lastMessageSeqNo, window.socket.id);

            {
                showMessage(message);
                window.socket.emit("message", message);
            }

            element.value = "";

            console.log(`Message: ${JSON.stringify(message)}`);
        }
    });
}

setup();

// NOTE(panmar): This would prevent losing input focus, but would prevent copy chat text
// document.onmousedown = (e) => { e.preventDefault(); };