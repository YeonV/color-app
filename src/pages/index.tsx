import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'

interface ClientData {
  clientId: string
  color: string
}

const Home: React.FC = () => {
  const [clientId, setClientId] = useState('')
  const [innerClientId, setInnerClientId] = useState(clientId)
  const [clients, setClients] = useState<ClientData[]>([])
  const s = useRef(null as Socket | null)

  useEffect(() => {
    const socket = io('localhost:4000', {
      transports: ['websocket'], // Enable only WebSocket transport
    })
    if (s && socket && typeof socket !== 'undefined') {
      s.current = socket
    }
    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('updateClients', (updatedClients: ClientData[]) => {
      console.log('Received updated client positions:', updatedClients)
      setClients(updatedClients)
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })
    socket.on('message', function (e) {
      console.log('data:', e, e.data)
    })

    return () => {
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
        const clients = response.data
        console.log('Client positions:', clients)
        setClients(clients)
        s.current?.send(clients)
      } catch (error) {
        console.error('Failed to get client positions:', error)
      }
    }

    fetchData()
  }, [clientId])

  const updateColor = async (color: string) => {
    try {
      await axios.post('/api/setcolor', { clientId: innerClientId, color })
      console.log(`Color set to ${color}`)
      const updatedClients = clients.map((client) =>
        client.clientId === innerClientId ? { ...client, color } : client
      )
      setClients(updatedClients)
    } catch (error) {
      console.error('Failed to set color:', error)
    }
  }

  return (
    <div>
      <h2>Client</h2>
      <label>Client ID: </label>
      <input
        type='text'
        value={innerClientId}
        onChange={(e) => setInnerClientId(e.target.value)}
        onBlur={(e) => setClientId(innerClientId)}
      />
      <br />
      <h3>Client positions:</h3>
      <ul>
        {clients.map(({ clientId, color }) => (
          <li
            key={clientId}
            style={{
              backgroundColor: color,
              padding: '1rem',
              marginBottom: '0.5rem',
              borderRadius: '4px',
              color: '#fff',
            }}
          >
            Client ID: {clientId}, Color: {color}
          </li>
        ))}
      </ul>
      <div>
        <h3>Change Color:</h3>
        <button onClick={() => updateColor('red')}>Set Color Red</button>
        <button onClick={() => updateColor('green')}>Set Color Green</button>
        <button onClick={() => updateColor('blue')}>Set Color Blue</button>

        <button
          onClick={() => {
            s.current?.send({ type: 'updateClients', data: clients })
          }}
        >
          Set Color Blue
        </button>
      </div>
    </div>
  )
}

export default Home
