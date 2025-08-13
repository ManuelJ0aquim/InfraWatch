"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
let io = null;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // Trocar em produção
        },
    });
    io.on('connection', (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);
        socket.emit("teste", "ok");
        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error("Socket.io não foi inicializado ainda!");
    }
    return io;
}
