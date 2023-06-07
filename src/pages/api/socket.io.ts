// src/pages/api/socket.io.ts
import { Server } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import http from 'http'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // if (req.method === 'POST') {
  // Create an HTTP server
  const server = http.createServer()

  // Initialize socket.io with the server instance
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket'], // Enable only WebSocket transport
  })

  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id)

    socket.on('register', (clientId) => {
      console.log('Client registered:', clientId)
      socket.join(clientId)
      // You can add your own logic to handle client registration
      socket.emit('Ohh yes')
    })

    socket.on('colorUpdate', (data) => {
      console.log('Color update received:', data)
      // You can add your own logic to handle color updates
      io.to(data.clientId).emit('colorChange', data.color)
    })

    socket.on('disconnect', () => {
      console.log('A client disconnected:', socket.id)
      // You can add your own logic to handle client disconnection
    })
    socket.on('Hello', () => {
      console.log('Broo', socket.id)
      // You can add your own logic to handle client disconnection
    })
  })

  server.listen(4000, () => {
    console.log('Socket.io server is running on port 4000')
  })

  res.statusCode = 200
  res.end()
  // }
  //  else {
  //   res.statusCode = 404
  //   res.end()
  // }
}
