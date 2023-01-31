import ChatRoom from "./chat.js";

const app = () => {
    const roomId = location.pathname.slice(1);
    if (roomId) {
        new ChatRoom(roomId);
    }
}

// TODO(panmar): This event is problematic;
// it fires (on Safari) when I am typing in the navigation bar
// it seems the browser is prefetching whole page before it is visible
document.addEventListener("DOMContentLoaded", app);