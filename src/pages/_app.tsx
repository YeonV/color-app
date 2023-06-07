import { AppProps } from 'next/app'
import { Server } from 'http'
import { WebSocketServer } from 'ws'
import { setWebSocketServer as setSetColorWebSocketServer } from '../pages/api/setcolor'
import { setWebSocketServer as setRegisterWebSocketServer } from '../pages/api/register'

let wss: WebSocketServer | null = null

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export function setWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      const data = JSON.parse(message.toString())

      if (data.type === 'registerClient') {
        setRegisterWebSocketServer(wss!)
      } else if (data.type === 'updateColor') {
        setSetColorWebSocketServer(wss!)
      }
    })
  })
}

export default MyApp
