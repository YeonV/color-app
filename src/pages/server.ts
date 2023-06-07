import { Server } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import cache from 'memory-cache'

interface Client {
  clientId: string
  color: string
  position: number | null
}

const clients: Client[] = []

export const initSocketIO = (io: Server): void => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('register', (clientId) => {
      console.log('Client registered:', clientId)
      clients.push({
        clientId,
        color: 'black',
        position: null,
      })
      socket.emit('updateClients', clients)
    })

    socket.on('setColor', ({ clientId, color }) => {
      console.log('Set color:', clientId, color)
      const client = clients.find((c) => c.clientId === clientId)
      if (client) {
        client.color = color
        io.emit('updateClients', clients)
      }
    })

    socket.on('setPosition', ({ clientId, position }) => {
      console.log('Set position:', clientId, position)
      const client = clients.find((c) => c.clientId === clientId)
      if (client) {
        client.position = position
        io.emit('updateClients', clients)
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      const index = clients.findIndex((c) => c.clientId === socket.id)
      if (index !== -1) {
        clients.splice(index, 1)
        io.emit('updateClients', clients)
      }
    })

    socket.emit('updateClients', clients)
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'POST') {
    const { clientId, isDrone } = req.body
    if (isDrone) {
      cache.put('droneClientId', clientId)
      console.log('Drone client ID:', clientId)
    }
    res.status(200).end()
  } else {
    res.status(404).end()
  }
}
