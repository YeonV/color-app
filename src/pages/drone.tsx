import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'

interface ClientData {
  clientId: string
  color: string
}

const Drone: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([])
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

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('message', (e: any) => {
      console.log('Received message:', e)
    })

    const fetchClients = async () => {
      try {
        const response = await axios.get('/api/getclients')
        const initialClients: ClientData[] = response.data
        if (isMounted && initialClients.length > 0) {
          setClients(initialClients)
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      }
    }

    fetchClients()

    return () => {
      isMounted = false
      socket.disconnect()
    }
  }, [])

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
      console.log(`Cleared client: ${clientId}`)
    } catch (error) {
      console.error(`Failed to clear client: ${clientId}`, error)
    }
  }

  const updateColor = async (clientId: string, color: string) => {
    s.current?.emit('colorUpdate', { data: { clientId, color } })
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.clientId === clientId ? { ...client, color } : client
      )
    )
    console.log(`Updated color of client ${clientId} to ${color}`)

    // try {
    //   await axios.post('/api/updatecolor', { clientId, color })
    //   setClients((prevClients) =>
    //     prevClients.map((client) =>
    //       client.clientId === clientId ? { ...client, color } : client
    //     )
    //   )
    //   console.log(`Updated color of client ${clientId} to ${color}`)
    // } catch (error) {
    //   console.error(`Failed to update color of client ${clientId}:`, error)
    // }
  }

  const updatePosition = async (clientId: string, position: number) => {
    s.current?.emit('positionUpdate', { data: { clientId, position } })
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.clientId === clientId ? { ...client, position } : client
      )
    )
    console.log(`Updated position of client ${clientId} to ${position}`)

    // try {
    //   await axios.post('/api/updateposition', { clientId, position })
    //   setClients((prevClients) =>
    //     prevClients.map((client) =>
    //       client.clientId === clientId ? { ...client, position } : client
    //     )
    //   )
    //   console.log(`Updated position of client ${clientId} to ${position}`)
    // } catch (error) {
    //   console.error(`Failed to update position of client ${clientId}:`, error)
    // }
  }

  return (
    <div>
      <h2>Drone</h2>
      <button onClick={clearClients}>Clear Clients</button>
      <ul>
        {clients.map((client) => (
          <li
            key={client.clientId}
            style={{ backgroundColor: client.color, padding: '5px' }}
          >
            {client.clientId}
            <button onClick={() => clearClient(client.clientId)}>Clear</button>
            <button onClick={() => updateColor(client.clientId, 'red')}>
              Set Red
            </button>
            <button onClick={() => updateColor(client.clientId, 'green')}>
              Set Green
            </button>
            <button onClick={() => updateColor(client.clientId, 'blue')}>
              Set Blue
            </button>
            <button onClick={() => updatePosition(client.clientId, 1)}>
              Set Position 1
            </button>
            <button onClick={() => updatePosition(client.clientId, 2)}>
              Set Position 2
            </button>
            <button onClick={() => updatePosition(client.clientId, 3)}>
              Set Position 3
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Drone
