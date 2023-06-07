import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'

interface ClientData {
  clientId: string
  color: string
}

const Home: React.FC = () => {
  const [clientId, setClientId] = useState('')
  const [innerClientId, setInnerClientId] = useState(clientId)
  const [clients, setClients] = useState<ClientData[]>([])
  const [message, setMessage] = useState('')
  const s = useRef<Socket | null>(null)

  useEffect(() => {
    let isMounted = true

    const socket = io('localhost:4000', {
      transports: ['websocket'],
    })

    if (s && socket && typeof socket !== 'undefined') {
      s.current = socket
    }

    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('updateClients', (updatedClients: ClientData[]) => {
      console.log('Received updated client positions:', updatedClients)
      if (isMounted && updatedClients.length > 0) {
        setClients(updatedClients)
      }
    })

    socket.on('colorChange', (updatedData: ClientData) => {
      setClients((prevClients) =>
        prevClients.map((client) =>
          client.clientId === updatedData.clientId ? updatedData : client
        )
      )
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('message', (e: any) => {
      console.log('Received message:', e)
    })

    return () => {
      isMounted = false
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.post('/api/register', {
          clientId: innerClientId,
          isDrone: false,
        })
        console.log('Client registered successfully')
      } catch (error) {
        console.error('Failed to register client:', error)
      }

      try {
        const response = await axios.get<ClientData[]>('/api/getclients')
        const clientsres = response.data
        console.log('Client positions:', clientsres)
        if (clientsres.length) setClients(clientsres)
        s.current?.emit('updateClients', innerClientId)
      } catch (error) {
        console.error('Failed to get client positions:', error)
      }
    }

    fetchData()
  }, [innerClientId])

  const updateColor = async (color: string) => {
    try {
      const updatedClients = clients.map((client) =>
        client.clientId === innerClientId ? { ...client, color } : client
      )
      if (updatedClients.length > 0) setClients(updatedClients)
      s.current?.emit('colorUpdate', { clientId: innerClientId, color })
      console.log(`Color set to ${color}`)
    } catch (error) {
      console.error('Failed to set color:', error)
    }
  }

  const sendMessage = () => {
    s.current?.emit('message', message)
    setMessage('')
  }

  const clearClients = async () => {
    try {
      await axios.post('/api/clearclients')
      setClients([])
      console.log('Cleared all clients')
    } catch (error) {
      console.error('Failed to clear clients:', error)
    }
  }

  const clearClient = async (clientId: string) => {
    try {
      await axios.post('/api/clearclient', { clientId })
      setClients((prevClients) =>
        prevClients.filter((client) => client.clientId !== clientId)
      )
      console.log(`Cleared client with ID: ${clientId}`)
    } catch (error) {
      console.error('Failed to clear client:', error)
    }
  }

  return (
    <div>
      <h2>Home</h2>
      <h3>Client ID:</h3>
      <input
        type='text'
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <button onClick={() => setInnerClientId(clientId)}>Set</button>
      <ul>
        {clients.map((client) => (
          <li
            key={client.clientId}
            style={{ backgroundColor: client.color, padding: '5px' }}
          >
            {client.clientId}
            {innerClientId === client.clientId && (
              <button onClick={() => clearClient(client.clientId)}>
                Clear
              </button>
            )}
          </li>
        ))}
      </ul>
      <h3>Color:</h3>
      <button onClick={() => updateColor('red')}>Red</button>
      <button onClick={() => updateColor('green')}>Green</button>
      <button onClick={() => updateColor('blue')}>Blue</button>
      <br />
      <h3>Send Message:</h3>
      <input
        type='text'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  )
}

export default Home
