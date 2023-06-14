// server.ts

import http from 'http'
import { Server as SocketServer } from 'socket.io'
import cache from 'memory-cache'
import { array_move, getRandomColor } from './src/utils/helpers'

interface ClientData {
  clientId: string;
  color: string;
  position: number | null;
}

const server = http.createServer()
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
})



let clients: ClientData[] = [] // Array to store client data

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id)

  socket.on('register', (clientId: string) => {
    console.log('Client registered:', clientId)
    socket.join(clientId)
    io.to(clientId).emit('hello')

    const previousState = cache.get(clientId)
    const clientData: ClientData = {
      clientId,
      color: previousState?.color || getRandomColor(),
      position: previousState?.position || filterClients().length + 1,
    }
    cache.put(clientId, clientData)

    const index = clients.findIndex((client) => client.clientId === clientId)
    if (index !== -1) {
      clients[index] = clientData
    } else {
      clients.push(clientData)
    }

    io.emit('updateClients', filterClients()) // Emit filtered clients
  })

  socket.on('clearAll', () => {
    console.log('Clearing all clients:')
    cache.clear()
    clients = []
    io.emit('updateClients', filterClients()) // Emit filtered clients
  })

  socket.on('clearClient', (clientId: string) => {
    console.log('Clearing client:', clientId)
    cache.del(clientId)

    clients = clients.filter((client) => client.clientId !== clientId)
    io.emit('updateClients', filterClients()) // Emit filtered clients
  })
  socket.on('clientsUpdate', (newClients: ClientData[]) => {
    console.log('Updating client:', newClients)
    clients = newClients
    // io.emit('updateClients', filterClients()) // Emit filtered clients
  })

  socket.on('colorUpdate', (data) => {
    console.log('Color update received:', data)
    const clientData = cache.get(data.data.clientId)

    if (clientData) {
      if (data.data.color) {clientData.color = data.data.color}
      if (data.data.position) {clientData.position = data.data.position}
      cache.put(data.data.clientId, clientData)
      io.emit('colorChange', clientData)
    } else {
      cache.put(data.data.clientId, data.data)
      io.emit('colorChange', data.data)
    }
  })

  socket.on('positionUpdate', (data) => {
    console.log('Position update received:', data)

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
    
  })

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id)
  })

  socket.on('message', (e) => {
    console.log('GotData:', e)
    io.emit('GotData:', e)
  })
})

function filterClients(): ClientData[] {
  return clients.filter((client) => client.clientId !== 'droneClientId' && client.clientId !== 'Blade')
}

const PORT = 4000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})