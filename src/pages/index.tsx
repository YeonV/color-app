// index.tsx

import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface ClientData {
  clientId: string
  color: string
  position: number | null
}

const Home: React.FC = () => {
  const [clientId, setClientId] = useState('')
  const [innerClientId, setInnerClientId] = useState(clientId)
  const [clients, setClients] = useState<ClientData[]>([])

  useEffect(() => {
    // Register client
    clientId !== '' &&
      axios
        .post('/api/register', { clientId, isDrone: false })
        .then(() => console.log('Client registered successfully'))
        .catch((error) => console.error('Failed to register client:', error))

    // Get the positions of all clients
    axios
      .get<ClientData[]>('/api/getclients')
      .then((response) => {
        const clients = response.data
        console.log('Client positions:', clients)
        setClients(clients)
      })
      .catch((error) => console.error('Failed to get client positions:', error))
  }, [clientId])

  const updateColor = async (color: string, position: number | null) => {
    try {
      await axios.post('/api/setcolor', {
        clientId: innerClientId,
        color,
        position,
      })
      console.log(`Color set to ${color} and position set to ${position}`)
      const updatedClients = clients.map((client) =>
        client.clientId === innerClientId
          ? { ...client, color, position }
          : client
      )
      setClients(updatedClients)
    } catch (error) {
      console.error('Failed to set color and position:', error)
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
          </li>
        ))}
      </ul>
      <div>
        <h3>Change Color and Position:</h3>
        <button onClick={() => updateColor('red', 1)}>
          Set Color Red, Position 1
        </button>
        <button onClick={() => updateColor('green', 2)}>
          Set Color Green, Position 2
        </button>
        <button onClick={() => updateColor('blue', 3)}>
          Set Color Blue, Position 3
        </button>
      </div>
    </div>
  )
}

export default Home
