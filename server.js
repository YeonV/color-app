'use strict'

var http = require('http')
var _require = require('socket.io'),
  Server = _require.Server
var cache = require('memory-cache')
var server = http.createServer()
var io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'], // Enable only WebSocket transport
})

io.on('connection', function (socket) {
  console.log('A client connected:', socket.id)
  socket.on('register', function (clientId) {
    console.log('Client registered:', clientId)
    socket.join(clientId)
    io.emit('hello')
    cache.put(clientId, {
      color: 'white',
      position: null,
    })
  })
  socket.on('colorUpdate', function (data) {
    console.log('Color update received:', data)
    var clientData = cache.get(data.clientId)
    if (clientData) {
      clientData.color = data.color
      cache.put(data.clientId, clientData)
      io.to(data.clientId).emit('colorChange', data.color)
    }
  })
  socket.on('updateClients', function (...clients) {
    console.log('Clients update received:', clients)
    cache.put(data, clients)
  })
  socket.on('disconnect', function () {
    console.log('A client disconnected:', socket.id)
  })
  socket.on('message', function (e) {
    console.log('GotData:')
    io.emit('GotData:', e)
  })
})
var PORT = 4000
server.listen(PORT, function () {
  console.log('Server is running on port '.concat(PORT))
})
