// getclients.ts

/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from 'next'
import cache from 'memory-cache'

interface Client {
  clientId: string
  color: string
  position: number | null
}

export default (req: NextApiRequest, res: NextApiResponse): void => {
  const clients = cache
    .keys()
    .filter((key) => key !== 'droneClientId')
    .map((key) => {
      const client: Client = {
        clientId: key,
        ...cache.get(key),
      }
      return client
    })

  res.status(200).json(clients)
}
