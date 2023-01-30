export default class ChatLayout {
    static sendMessageInputId = "send-message-input";
    static chatId = "chat";
    static senderNameClass = "sender-name";

    constructor(ownerId) {
        this.ownerId = ownerId;
        this.sendMessageCallback = (_message) => { };
        this.createSendMessageHandler();
    }

    addSendMessageCallback(callback) {
        this.sendMessageCallback = callback;
    }

    onConnect() {
        let input = document.getElementById(ChatLayout.sendMessageInputId);
        input.style.backgroundColor = "darkgrey";
    }

    onDisconnect() {
        let input = document.getElementById(ChatLayout.sendMessageInputId);
        input.style.backgroundColor = "rgb(172, 83, 83)";
    }

    createSendMessageHandler() {
        let element = document.getElementById(ChatLayout.sendMessageInputId);
        element.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();

                let messageText = element.value.trim();
                element.value = "";
                if (!messageText) {
                    return;
                }

                if (this.sendMessageCallback) {
                    const message = this.sendMessageCallback(messageText);
                    this.displayMessage(message);
                }
            }
        });
    }

    displayMessages(messages) {
        for (const message of messages) {
            this.displayMessage(message);
        }
    }

    displayMessage(message) {
        let element = this.createChatEntryElement(message);
        document.getElementById(ChatLayout.chatId).appendChild(element);

        if (this.ownerId !== message.userId) {
            this.updateSentMessageAvatar(element, message.userId);
            this.updateReceivedMessageAvatar(message.userId, message.messageId);
        }

        // NOTE(panmar): This is probablly not what we want for all messages
        element.scrollIntoView();
    }

    createChatEntryElement(message) {
        let html = "";
        if (this.ownerId === message.userId) {
            html = this.createChatEntryFromMeHtml();
        } else {
            html = this.createChatEntryFromOtherHtml();
        }

        let element = document.createElement("div");
        element.classList.add("chat-entry")
        element.innerHTML = html;
        element.id = message.messageId;

        if (this.ownerId !== message.userId) {
            let senderNameElement = element.getElementsByClassName("sender-name")[0];
            if (message.userId !== this.getLastDisplayedMessageUserId()) {
                const senderName = `User #${message.userId}`;
                senderNameElement.textContent = senderName;
            } else {
                senderNameElement.remove();
            }
        }

        let messageElement = element.getElementsByClassName("message-text")[0];
        messageElement.textContent = message.text;

        return element;
    }

    createChatEntryFromMeHtml() {
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
                        <div class="message-text message-text-me"></div>
                    </div>
                </div>
                <div class="message-single-receiver-area"></div>
            </div>
            <div class="message-multiple-receivers-area"></div>`;

        return html;
    }

    createChatEntryFromOtherHtml() {
        const html = `
            <div class="message-from-other">
                <div class="sender-avatar-area"></div>
                <div class="message-main-area">
                    <div class="sender-name"></div>
                    <div class="message-text-area">
                        <div class="message-text message-text-other"></div>
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

    updateSentMessageAvatar(chatEntryElement, userId) {
        const id = `last-sent-avatar-${userId}`;
        let element = document.getElementById(id);
        if (element) {
            element.remove();
        }

        {
            const [red, green, blue] = this.computeUserColor(userId);
            const color = `rgb(${red}, ${green}, ${blue})`;
            let avatar = document.createElement("div");
            avatar.classList.add("sender-avatar");
            avatar.style.backgroundColor = color;
            avatar.id = id;
            chatEntryElement.getElementsByClassName("sender-avatar-area")[0].appendChild(avatar);
        }
    }

    updateReceivedMessageAvatar(userId, messageId) {
        const id = `last-received-avatar-${userId}`;

        {
            const lastAvatarEntry = document.querySelector(`chat-entry #${id}`);
            const ackEntry = document.querySelector(`chat-entry #${messageId}`);

            if (lastAvatarEntry && ackEntry) {
                const result = lastAvatarEntry.compareDocumentPosition(ackEntry);
                if (result & Node.DOCUMENT_POSITION_PRECEDING) {
                    return;
                }
            }
        }

        const lastAvatar = document.getElementById(id);
        if (lastAvatar) {
            lastAvatar.remove();
        }

        {
            let messageElement = document.getElementById(messageId);
            let avatarCellElement = messageElement.getElementsByClassName("message-multiple-receivers-area")[0];
            const avatarElement = document.createElement("div");
            const [red, green, blue] = this.computeUserColor(userId);
            avatarElement.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
            avatarElement.classList.add("receiver-avatar");
            avatarElement.id = id;
            avatarCellElement.appendChild(avatarElement);
        }
    }

    computeUserColor(userId) {
        const red = 0;
        const green = userId % 256;
        const blue = (userId.toString().split("").reverse().join("")) % 256;
        return [red, green, blue];
    }

    clearChatMessages() {
        let chatElement = document.getElementById(ChatLayout.chatId);
        chatElement.replaceChildren();
    }

    getLastDisplayedMessageUserId() {
        let chatUserNameElements = document.getElementById(ChatLayout.chatId)
            .getElementsByClassName(ChatLayout.senderNameClass);
        if (chatUserNameElements.length === 0) {
            return -1;
        }

        const lastChatUserNameText = chatUserNameElements[chatUserNameElements.length - 1].innerHTML;
        // NOTE(panmar): Text is of `User #123456`
        const userIdStartingIndex = lastChatUserNameText.indexOf("#") + 1;
        const lastChatUserId = lastChatUserNameText.slice(userIdStartingIndex);
        return parseInt(lastChatUserId);
    }
}