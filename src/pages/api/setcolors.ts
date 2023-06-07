// setcolor.ts

/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from 'next'
import cache from 'memory-cache'

interface Client {
  color: string
  position: number | null
}

export default (req: NextApiRequest, res: NextApiResponse): void => {
  const { clientId, color, position } = req.body

  const droneClientId = cache.get('droneClientId')
  // console.log('eyyy', clientId, droneClientId)
  if (clientId === droneClientId) {
    const clients = cache
      .keys()
      .filter((key) => key !== droneClientId)
      .map((key) => cache.get(key) as Client)

    clients.forEach((client) => {
      client.color = color
      client.position = position
    })

    res.status(200).end()
  } else {
    res.status(403).end()
  }
}
