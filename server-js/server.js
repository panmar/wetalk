import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.static("../static"));
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });
let messages = [];

app.get("/", (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    res.sendFile(path.join(__dirname, "/../static/index.html"));
});

io.on("connection", (socket) => {
    console.log(`Connected #${socket.handshake.query.userId}`);

    socket.emit("history", messages);

    socket.on("message", (message) => {
        console.log(`Message received: ${JSON.stringify(message)}`);
        messages.push(message);
        socket.broadcast.emit("message", message);
    });

    socket.on("message-ack", (userId, messageId) => {
        console.log(`Message ack: ${userId} ${messageId}`);
        socket.broadcast.emit("message-ack", { userId, messageId });
        // let message = messages.find((message) => {
        //     return message.messageId === messageId;
        // });
        // io.to(message.socketId).emit("message-ack", messageId);
    });

    socket.on("disconnect", (reason) => {
        console.log(`Disconnected #${socket.handshake.query.userId}: ${reason}`);
    });
});



httpServer.listen(3000, "127.0.0.1");