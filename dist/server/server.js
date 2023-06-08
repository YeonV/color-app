"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const memory_cache_1 = __importDefault(require("memory-cache"));
const server = http_1.default.createServer();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'], // Enable only WebSocket transport
});
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('register', (clientId) => {
        console.log('Client registered:', clientId);
        socket.join(clientId);
        io.to(clientId).emit('hello'); // Send 'hello' event to the client
        memory_cache_1.default.put(clientId, {
            color: 'white',
            position: null,
        });
    });
    socket.on('colorUpdate', (data) => {
        console.log('Color update received:', data);
        const clientData = memory_cache_1.default.get(data.data.clientId);
        if (clientData) {
            clientData.color = data.data.color;
            memory_cache_1.default.put(data.data.clientId, clientData);
            console.log('wtf', clientData);
            io.emit('colorChange', clientData); // Emit the updated client data to all clients
            // socket.emit('colorChange', clientData) // Emit the updated clients list to the emitting client
            // socket.send('colorChange', clientData) // Emit the updated clients list to the emitting client
            // socket.broadcast.emit('colorChange', clientData)
        }
        else {
            io.emit('colorChange', data.data); // Emit the updated client data to all clients
            // socket.emit('colorChange', data.data) // Emit the updated clients list to the emitting client
            // socket.send('colorChange', data.data) // Emit the updated clients list to the emitting client
            // socket.broadcast.emit('colorChange', data.data)
        }
    });
    socket.on('positionUpdate', (data) => {
        console.log('Position update received:', data);
        const clientData = memory_cache_1.default.get(data.clientId);
        if (clientData) {
            clientData.position = data.position;
            memory_cache_1.default.put(data.clientId, clientData);
            io.emit('positionChange', clientData); // Emit the updated client data to all clients
        }
    });
    socket.on('updateClients', (clientId) => {
        if (clientId) {
            console.log('Update clients received:', clientId);
            let clients = [
                ...Array.from(memory_cache_1.default.keys())
                    .filter((key) => key !== clientId)
                    .map((key) => memory_cache_1.default.get(key)),
            ];
            // if (clients.length < 1 && clientId) {
            //   clients = [
            //     {
            //       clientId: clientId,
            //       color: '#800000',
            //       position: 1,
            //     },
            //   ]
            // }
            // cache.keys().map((k) =>
            //   cache.put(k, {
            //     clientId: k,
            //     color: cache.get(k).color,
            //     position: cache.get(k).position,
            //   })
            // )
            console.log('yy', clients, clientId, memory_cache_1.default.keys());
            io.emit('updateClients', clients); // Emit the updated clients list to the emitting client
            socket.emit('updateClients', clients); // Emit the updated clients list to the emitting client
            socket.send('updateClients', clients); // Emit the updated clients list to the emitting client
            socket.broadcast.emit('updateClients', clients); // Emit the updated clients list to all other clients
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
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
