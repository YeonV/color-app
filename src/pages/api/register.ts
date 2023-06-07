/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from 'next'
import cache from 'memory-cache'

interface Client {
  clientId: string
  color: string
  position: number | null
}

const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

export default (req: NextApiRequest, res: NextApiResponse): void => {
  const { clientId, isDrone } = req.body
  const client: Client = { clientId, color: getRandomColor(), position: null }

  console.log(clientId, isDrone, client)
  cache.put(clientId, client)

  if (isDrone) {
    cache.put('droneClientId', clientId)
  }

  res.status(200).end()
}
