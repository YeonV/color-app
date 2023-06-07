const http = require('http')
const { Server } = require('socket.io')
const cache = require('memory-cache')

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'], // Enable only WebSocket transport
})

io.on('connection', (socket: any) => {
  console.log('A client connected:', socket.id)

  socket.on('register', (clientId: any) => {
    console.log('Client registered:', clientId)
    socket.join(clientId)
    cache.put(clientId, { color: 'white', position: null })
  })

  socket.on('colorUpdate', (data: any) => {
    console.log('Color update received:', data)
    const clientData = cache.get(data.clientId)
    if (clientData) {
      clientData.color = data.color
      cache.put(data.clientId, clientData)
      io.to(data.clientId).emit('colorChange', data.color)
    }
  })

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id)
  })
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
