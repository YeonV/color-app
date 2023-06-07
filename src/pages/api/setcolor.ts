/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from 'next'
import cache from 'memory-cache'
import { WebSocketServer } from 'ws'

interface Client {
  clientId: string
  color: string
  position: number | null
  ws?: WebSocket
}

let wss: WebSocketServer | null = null

export default (req: NextApiRequest, res: NextApiResponse): void => {
  const { clientId, color, position } = req.body

  const droneClientId = cache.get('droneClientId')

  const clientToUpdate = cache.get(clientId) as Client

  if (clientToUpdate) {
    clientToUpdate.color = color
    clientToUpdate.position = position
    cache.put(clientId, clientToUpdate)

    // Notify connected clients about the color and position changes
    if (wss) {
      const message = JSON.stringify({ clientId, color, position })
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    }

    res.status(200).end()
  } else {
    res.status(403).end()
  }
}

export const setWebSocketServer = (server: WebSocketServer) => {
  wss = server
}
