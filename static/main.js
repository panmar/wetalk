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
    let element = createChatEntryElement(message);
    document.getElementById("chat").appendChild(element);

    if (window.userId !== message.userId) {
        updateSentMessageAvatar(element, message.userId);
    }

    // NOTE(panmar): This is probablly not what we want for all messages
    element.scrollIntoView();
}

function createChatEntryElement(message) {
    let chatEntryClass = "chat-entry-me";
    let chatMessageClasses = ["chat-message-me-cell", "chat-message-me"];
    let messageUserId = undefined;

    if (window.userId !== message.userId) {
        chatEntryClass = "chat-entry-other";
        chatMessageClasses = ["chat-message-other-cell", "chat-message-other"];
    }

    if ((message.userId !== window.userId) && (message.userId !== getLastDisplayedMessageUserId())) {
        messageUserId = message.userId;
    }

    let element = buildChatEntryElement(chatEntryClass, chatMessageClasses, message.text, messageUserId);

    return element;
}

function buildChatEntryElement(chatEntryClass, chatMessageClasses, messageText, userId) {
    let element = document.createElement("div");
    element.classList.add("chat-entry", chatEntryClass);

    {
        let ch = document.createElement("div");
        ch.classList.add("chat-sent-avatar-cell");
        element.appendChild(ch);
    }

    if (!userId) {
        let ch = document.createElement("div");
        ch.classList.add(...chatMessageClasses);
        ch.append(messageText);
        element.appendChild(ch);
    } else {
        let container = document.createElement("div");
        container.classList.add("chat-message-with-user");

        {
            let ch = document.createElement("div");
            ch.classList.add("chat-user-name");
            ch.append(`User #${userId}`);
            container.appendChild(ch);
        }

        {
            let ch = document.createElement("div");
            ch.classList.add(...chatMessageClasses);
            ch.append(messageText);
            container.appendChild(ch);
        }

        element.appendChild(container);
    }

    {
        let ch = document.createElement("div");
        ch.classList.add("chat-received-avatar-cell");
        element.appendChild(ch);
    }

    return element;
}

function updateSentMessageAvatar(chatEntryElement, userId) {
    const id = `last-sent-avatar-${userId}`;
    let element = document.getElementById(id);
    if (element) {
        element.remove();
    }

    {
        let avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.id = id;
        const green = userId % 256;
        const blue = (userId.toString().split("").reverse().join("")) % 256;
        avatar.style.backgroundColor = `rgb(0, ${green}, ${blue})`;
        chatEntryElement.getElementsByClassName("chat-sent-avatar-cell")[0].appendChild(avatar);
    }
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