import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface ClientData {
  clientId: string
  color: string
}

const Drone: React.FC = () => {
  const clientId = 'droneClientId'
  const [clients, setClients] = useState<ClientData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.post('/api/register', {
          clientId,
          isDrone: true,
        })
        console.log('Drone client registered successfully')
      } catch (error) {
        console.error('Failed to register drone client:', error)
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

  const updateColor = async (clientId: string, color: string) => {
    try {
      await axios.post('/api/setcolor', {
        clientId,
        color,
      })
      console.log(`Color set to ${color} for client ${clientId}`)
      const updatedClients = clients.map((client) =>
        client.clientId === clientId ? { ...client, color } : client
      )
      setClients(updatedClients)
    } catch (error) {
      console.error('Failed to set color:', error)
    }
  }

  return (
    <div>
      <h2>Drone</h2>
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
            <div>
              <h4>Change Color:</h4>
              <button onClick={() => updateColor(clientId, 'red')}>
                Set Color Red
              </button>
              <button onClick={() => updateColor(clientId, 'green')}>
                Set Color Green
              </button>
              <button onClick={() => updateColor(clientId, 'blue')}>
                Set Color Blue
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Drone
