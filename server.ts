import http from 'http'
import { Server as SocketServer } from 'socket.io'
import cache from 'memory-cache'

interface ClientData {
  clientId: string
  color: string
  position: number | null
}

const server = http.createServer()
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'], // Enable only WebSocket transport
})

function getRandomColor(): string {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id)

  socket.on('register', (clientId: string) => {
    console.log('Client registered:', clientId)
    socket.join(clientId)
    io.to(clientId).emit('hello') // Send 'hello' event to the client
    const previousState = cache.get(clientId)
    cache.put(clientId, {
      clientId,
      color: previousState?.color || getRandomColor(),
      position: null,
    })
    let clients = [
      ...Array.from(cache.keys())
        .map((key) => cache.get(key)),
    ]
    io.emit('updateClients', clients)
  })
  socket.on('clearAll', () => {
    console.log('clearAll Clients:')
    cache.clear()
    io.emit('updateClients', [])
  })
  socket.on('clearClient', (clientId: string) => {
    console.log('clearAll Clients:')
    let clients = [
      ...Array.from(cache.keys())
        .filter((key) => key !== clientId)
        .map((key) => cache.get(key)),
    ]
    cache.del(clientId)
    io.emit('updateClients', clients)    
  })

  socket.on('colorUpdate', (data) => {
    console.log('Color update received:', data)
    const clientData = cache.get(data.data.clientId)

    if (clientData) {
      clientData.color = data.data.color
      cache.put(data.data.clientId, clientData)
      io.emit('colorChange', clientData)
    } else {
      cache.put(data.data.clientId, data.data)
      // io.emit('colorChange', data.data)
    }
  })

  socket.on(
    'positionUpdate',
    (data: { clientId: string; position: number }) => {
      console.log('Position update received:', data)
      const clientData = cache.get(data.clientId)
      if (clientData) {
        clientData.position = data.position
        cache.put(data.clientId, clientData)
        io.emit('positionChange', clientData) // Emit the updated client data to all clients
      }
    }
  )

  socket.on('updateClients', (clientId: string) => {
    if (clientId) {
      console.log('Update clients received:', clientId)
      let clients = [
        ...Array.from(cache.keys())
          // .filter((key) => key !== clientId)
          .map((key) => cache.get(key)),
      ]
      
      io.emit('updateClients', clients) // Emit the updated clients list to the emitting client
      socket.emit('updateClients', clients) // Emit the updated clients list to the emitting client
      socket.send('updateClients', clients) // Emit the updated clients list to the emitting client
      socket.broadcast.emit('updateClients', clients) // Emit the updated clients list to all other clients
    }
  })

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id)
  })

  socket.on('message', (e: any) => {
    console.log('GotData:', e)
    io.emit('GotData:', e)
  })
})

const PORT = 4000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
