import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import styles from './styles.module.css' // Import CSS module styles

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
      s.current?.emit('colorUpdate', {
        data: { clientId: innerClientId, color },
      })
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
    <div className={styles.container}>
      <h2 className={styles.title}>Client</h2>
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <h3 className={styles.subtitle}>Client ID:</h3>
          <input
            type='text'
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.button}
            onClick={() => setInnerClientId(clientId)}
          >
            Set
          </button>
        </div>
        <ul className={styles.clientList}>
          {clients.map((client) => (
            <li
              key={client.clientId}
              style={{ backgroundColor: client.color }}
              className={styles.clientItem}
            >
              {client.clientId}
              {innerClientId === client.clientId && (
                <>
                  <div className={styles.colorContainer}>
                    <button
                      className={`${styles.colorButton} ${styles.red}`}
                      onClick={() => updateColor('red')}
                    >
                      Red
                    </button>
                    <button
                      className={`${styles.colorButton} ${styles.green}`}
                      onClick={() => updateColor('green')}
                    >
                      Green
                    </button>
                    <button
                      className={`${styles.colorButton} ${styles.blue}`}
                      onClick={() => updateColor('blue')}
                    >
                      Blue
                    </button>
                  </div>
                  <button
                    className={styles.button}
                    onClick={() => clearClient(client.clientId)}
                  >
                    Clear
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.messageContainer}>
        <h3 className={styles.subtitle}>Send Message:</h3>
        <input
          type='text'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={styles.input}
        />
        <button className={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  )
}

export default Home
