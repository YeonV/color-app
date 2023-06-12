"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const memory_cache_1 = __importDefault(require("memory-cache"));
const server = http_1.default.createServer();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'],
});
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
let clients = []; // Array to store client data
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('register', (clientId) => {
        console.log('Client registered:', clientId);
        socket.join(clientId);
        io.to(clientId).emit('hello');
        const previousState = memory_cache_1.default.get(clientId);
        const clientData = {
            clientId,
            color: previousState?.color || getRandomColor(),
            position: previousState?.position || 0,
        };
        memory_cache_1.default.put(clientId, clientData);
        const index = clients.findIndex((client) => client.clientId === clientId);
        if (index !== -1) {
            clients[index] = clientData;
        }
        else {
            clients.push(clientData);
        }
        io.emit('updateClients', filterClients()); // Emit filtered clients
    });
    socket.on('clearAll', () => {
        console.log('Clearing all clients:');
        memory_cache_1.default.clear();
        clients = [];
        io.emit('updateClients', filterClients()); // Emit filtered clients
    });
    socket.on('clearClient', (clientId) => {
        console.log('Clearing client:', clientId);
        memory_cache_1.default.del(clientId);
        clients = clients.filter((client) => client.clientId !== clientId);
        io.emit('updateClients', filterClients()); // Emit filtered clients
    });
    socket.on('colorUpdate', (data) => {
        console.log('Color update received:', data);
        const clientData = memory_cache_1.default.get(data.data.clientId);
        if (clientData) {
            if (data.data.color)
                clientData.color = data.data.color;
            if (data.data.position)
                clientData.position = data.data.position;
            memory_cache_1.default.put(data.data.clientId, clientData);
            io.emit('colorChange', clientData);
        }
        else {
            memory_cache_1.default.put(data.data.clientId, data.data);
            io.emit('colorChange', data.data);
        }
    });
    socket.on('positionUpdate', (data) => {
        console.log('Position update received:', data);
        const clientData = memory_cache_1.default.get(data.data.clientId);
        if (clientData) {
            clientData.position = data.data.position;
            memory_cache_1.default.put(data.data.clientId, clientData);
            io.emit('positionChange', clientData);
        }
    });
    socket.on('disconnect', () => {
        console.log('A client disconnected:', socket.id);
    });
    socket.on('message', (e) => {
        console.log('GotData:', e);
        io.emit('GotData:', e);
    });
});
function filterClients() {
    return clients.filter((client) => client.clientId !== 'droneClientId' && client.clientId !== 'Blade');
}
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
