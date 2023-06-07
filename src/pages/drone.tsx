// drone.tsx

import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface ClientData {
  clientId: string
  color: string
  position: number | null
}

const Drone: React.FC = () => {
  const droneClientId = 'droneClientId'
  const [clients, setClients] = useState<ClientData[]>([])

  useEffect(() => {
    // Fetch the positions of all clients
    const fetchClientPositions = async () => {
      try {
        const response = await axios.get<ClientData[]>('/api/getclients')
        const clients = response.data
        console.log('Client positions:', clients)
        setClients(clients)
      } catch (error) {
        console.error('Failed to get client positions:', error)
      }
    }

    // Register drone client and fetch client positions
    axios
      .post('/api/register', { clientId: droneClientId, isDrone: true })
      .then(() => {
        console.log('Drone client registered successfully')
        fetchClientPositions()
      })
      .catch((error) =>
        console.error('Failed to register drone client:', error)
      )

    // Update individual client positions every 5 seconds
    const interval = setInterval(async () => {
      try {
        for (const client of clients) {
          const { clientId, position } = client
          await axios.post('/api/setposition', { clientId, position })
        }
        fetchClientPositions()
      } catch (error) {
        console.error('Failed to update client positions:', error)
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const updateColor = async (
    clientId: string,
    color: string,
    position: number | null
  ) => {
    try {
      await axios.post('/api/setcolor', {
        clientId,
        color,
        position,
      })
      console.log(`Color set to ${color} and position set to ${position}`)
      const updatedClients = clients.map((client) =>
        client.clientId === clientId ? { ...client, color, position } : client
      )
      setClients(updatedClients)
    } catch (error) {
      console.error('Failed to set color and position:', error)
    }
  }

  return (
    <div>
      <h2>Drone</h2>
      <h3>Client positions:</h3>
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
            Client ID: {clientId}, Position: {position}
            <div>
              <button onClick={() => updateColor(clientId, 'red', 1)}>
                Set Color Red, Position 1
              </button>
              <button onClick={() => updateColor(clientId, 'green', 2)}>
                Set Color Green, Position 2
              </button>
              <button onClick={() => updateColor(clientId, 'blue', 3)}>
                Set Color Blue, Position 3
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Drone
