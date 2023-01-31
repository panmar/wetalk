import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.static("../static"));
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });
let roomMessages = new Map();

app.get("/:roomId", (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    res.sendFile(path.join(__dirname, "/../static/index.html"));
});

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    const roomId = socket.handshake.query.roomId;
    socket.join(roomId);
    if (!roomMessages.has(roomId)) {
        roomMessages.set(roomId, []);
    }

    console.log(`Connected #${userId} to room ${roomId}`);

    socket.emit("history", roomMessages.get(roomId));

    socket.on("message", (message) => {
        console.log(`Message received: ${JSON.stringify(message)}`);
        roomMessages.get(message.roomId).push(message);
        io.to(message.roomId).emit("message", message);
    });

    socket.on("message-ack", (userId, roomId, messageId) => {
        console.log(`Message ack: ${userId} ${messageId}`);
        io.to(roomId).emit("message-ack", { userId, messageId });
    });

    socket.on("disconnect", (reason) => {
        console.log(`Disconnected #${socket.handshake.query.userId}: ${reason}`);
    });
});

httpServer.listen(3000, "127.0.0.1");