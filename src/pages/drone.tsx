import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'

interface ClientData {
  clientId: string
  color: string
  position: number | null
}

const Drone: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([])
  const s = useRef(null as Socket | null)

  useEffect(() => {
    const socket = io('localhost:4000', {
      transports: ['websocket'], // Enable only WebSocket transport
    })
    if (s && socket && typeof socket !== 'undefined') {
      s.current = socket
    }
    s.current!.on('connect', () => {
      console.log('WebSocket connected')
    })

    s.current!.on('message', function (e) {
      console.log('data:', e, e.data)
    })

    s.current!.on('updateClients', (updatedClients) => {
      console.log('Received updated client positions:', updatedClients)
      setClients(updatedClients)
    })

    s.current!.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })
    return () => {
      s.current!.disconnect()
    }
  }, [])
  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.post('/api/register', {
          clientId: 'droneClientId',
          isDrone: true,
        })
        console.log('Drone Client registered successfully')
      } catch (error) {
        console.error('Failed to register client:', error)
      }

      try {
        const response = await axios.get<ClientData[]>('/api/getclients')
        const clients = response.data
        console.log('Client positions:', clients)
        setClients(clients)
      } catch (error) {
        console.error('Failed to get client positions:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <h1>Drone Control Panel</h1>
      <h2>Client positions:</h2>
      <ul>
        {clients.map(({ clientId, color, position }) => (
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
            Client ID: {clientId}, Color: {color}, Position: {position}
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          s.current?.send({ type: 'updateClients', data: clients })
        }}
      >
        Set Color Blue
      </button>
    </div>
  )
}

export default Drone
