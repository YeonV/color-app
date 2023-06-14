"use strict";
// server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const memory_cache_1 = __importDefault(require("memory-cache"));
const helpers_1 = require("./src/utils/helpers");
const server = http_1.default.createServer();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'],
});
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
            color: previousState?.color || (0, helpers_1.getRandomColor)(),
            position: previousState?.position || filterClients().length + 1,
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
    socket.on('clientsUpdate', (newClients) => {
        console.log('Updating client:', newClients);
        clients = newClients;
        // io.emit('updateClients', filterClients()) // Emit filtered clients
    });
    socket.on('colorUpdate', (data) => {
        console.log('Color update received:', data);
        const clientData = memory_cache_1.default.get(data.data.clientId);
        if (clientData) {
            if (data.data.color) {
                clientData.color = data.data.color;
            }
            if (data.data.position) {
                clientData.position = data.data.position;
            }
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
        // const index = filterClients().findIndex((client) => client.clientId === data.data.clientId)
        // const oldP = (filterClients()[index]?.position || 0) - 1 
        // const newP = data.data.position - 1
        // let c = filterClients().sort((a,b) => a.position! - b.position!)
        // c = array_move(c, oldP, newP)
        // c = c.map((c,i) => ({
        //   ...c,
        //   position: i + 1,
        //   color: cache.get(c.clientId)?.color || c.color
        // }))
        // console.log('not happening', c)
        // io.emit('updateClients', c)
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
