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
  console.log('eyyy', clientId, droneClientId)

  const clientToUpdate = cache.get(clientId) as Client

  if (clientToUpdate) {
    clientToUpdate.color = color
    clientToUpdate.position = position
    cache.put(clientId, clientToUpdate)
    res.status(200).end()
  } else {
    res.status(403).end()
  }
}
