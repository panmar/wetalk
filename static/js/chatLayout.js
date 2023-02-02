export default class ChatLayout {
    static sendMessageInputId = "send-message-input";
    static chatId = "chat";
    static senderNameClass = "sender-name";

    constructor(user) {
        this.user = user;
        this.registerSettingsWindow();
        this.sendMessageCallback = (_message) => { };
        this.createSendMessageHandler();
        this.lastMessageUserId = "";
    }

    isSelfMessage(message) {
        return message.userId === this.user.getId();
    }

    registerSettingsWindow() {
        let settingsWindow = document.getElementById("settings-window");
        let usernameInput = document.getElementById("change-username-input");
        let publicKeyInput = document.getElementById("public-key-input");
        let settingsSaveBtn = document.getElementById("settings-save-btn");
        let settingsCancelBtn = document.getElementById("settings-cancel-btn");

        settingsSaveBtn.onclick = () => {
            let username = usernameInput.value.trim();
            usernameInput.value = "";
            if (!username) {
                return;
            }
            this.user.setName(username);
            settingsWindow.style.display = "none";
        };

        settingsCancelBtn.onclick = () => {
            settingsWindow.style.display = "none";
        };

        let settings = document.getElementById("settings");
        settings.onclick = () => {
            settingsWindow.style.display = "block";
            usernameInput.value = this.user.getName();
            publicKeyInput.value = nacl.util.encodeBase64(this.user.getPublicKey());
        };
    }

    setSendMessageCallback(callback) {
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

        if (!(this.isSelfMessage(message))) {
            this.updateSentMessageAvatar(element, message.userId);
            this.updateReceivedMessageAvatar(message.userId, message.messageId);
        }

        // NOTE(panmar): This is probablly not what we want for all messages
        element.scrollIntoView();
        this.lastMessageUserId = message.userId;
    }

    createChatEntryElement(message) {
        let html = "";
        if (this.isSelfMessage(message)) {
            html = this.createChatEntryFromMeHtml();
        } else {
            html = this.createChatEntryFromOtherHtml();
        }

        let element = document.createElement("div");
        element.classList.add("chat-entry")
        element.innerHTML = html;
        element.id = message.messageId;

        if (!(this.isSelfMessage(message))) {
            let senderNameElement = element.getElementsByClassName("sender-name")[0];
            if (message.userId !== this.lastMessageUserId) {
                const senderName = `${message.userName}`;
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
            if (this.lastMessageUserId === userId) {
                console.log(`lastMessageId = ${this.lastMessageUserId} the same as ${userId}`);
                element.remove();
            } else {
                element.removeAttribute("id");
            }
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
        const id = parseInt(nacl.util.decodeBase64(userId));
        console.log(`Id for color = ${id}`);
        const red = 0;
        const green = id % 256;
        const blue = (id.toString().split("").reverse().join("")) % 256;
        return [red, green, blue];
    }

    clearChatMessages() {
        let chatElement = document.getElementById(ChatLayout.chatId);
        chatElement.replaceChildren();
    }
}