class Message {
    constructor(userId, text) {
        this.userId = userId;
        this.text = text;
    }
}

function setup() {
    window.userId = Math.floor(Math.random() * 10000);

    if (!window.socket) {
        window.socket = io.connect("", { query: `userId=${window.userId}` });
    }

    window.socket.on("connect", onConnectEvent);
    window.socket.on("disconnect", onDisconnectEvent);
    window.socket.on("history", onHistoryEvent);
    window.socket.on("message", onMessageEvent);

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
}

function showMessage(message) {
    let chatEntryElement = createChatEntryElement(message);
    let chatElement = document.getElementById("chat");
    chatElement.appendChild(chatEntryElement);

    // NOTE(panmar): This is probablly not what we want for all messages
    chatEntryElement.scrollIntoView();
}

function createChatEntryElement(message) {
    let chatEntryElement = document.createElement("div");
    chatEntryElement.classList.add("chat-entry");

    if ((message.userId !== window.userId) && (message.userId !== getLastDisplayedMessageUserId())) {
        let chatUserNameElement = document.createElement("div");
        chatUserNameElement.classList.add("chat-user-name");
        chatUserNameElement.append(`User #${message.userId}`);
        chatEntryElement.appendChild(chatUserNameElement);
    }

    let chatCloudElement = document.createElement("div");
    let className = "chat-entry-me";
    if (message.userId !== window.userId) {
        className = "chat-entry-other";
    }
    chatCloudElement.classList.add(className);
    chatCloudElement.append(message.text);
    chatEntryElement.appendChild(chatCloudElement);

    return chatEntryElement;
}

function getLastDisplayedMessageUserId() {
    let chatUserNameElements = document.getElementById("chat").getElementsByClassName("chat-user-name");
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

            const message = new Message(window.userId, messageText);

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