// index.tsx (clients)

import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import styles from '../pages/styles.module.css'
import cache from 'memory-cache'

interface ClientData {
  clientId: string
  color: string
  position: number | null
}
interface Client {
  clientId: string
  color: string
  position: number | null
}

export const getServerSideProps = () => {
  const clients = cache
    .keys()
    .filter((key) => key !== 'droneClientId')
    .filter((key) => key !== 'Blade')
    .map((key) => {
      const client: Client = {
        clientId: key,
        ...cache.get(key),
      }
      return client
    })
  return {
    props: {
      clientsyz: clients
    }
  }
}

const Home = ({
  clientsyz
}: {
  clientsyz: any
}) => {
  const [clientId, setClientId] = useState('Blade')
  const [innerClientId, setInnerClientId] = useState(clientId)
  const [clients, setClients] = useState<ClientData[]>(clientsyz.filter((key: any) => key !== 'droneClientId')
    .filter((key: any) => key !== 'Blade'))
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
      if (isMounted) {
        setClients(updatedClients)
      }
    })
    socket.on('updatedClients', (updatedClients: ClientData[]) => {
      console.log('Received updated client positions:', updatedClients)
      if (isMounted) {
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
    socket.on('positionChange', (updatedData: ClientData) => {
      console.log('YES',updatedData)
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
      s.current?.emit('register', innerClientId)
    }
    fetchData()
  }, [innerClientId])

  const updateColor = async (color: string) => {
    try {
      const updatedClients = clients.map((client) =>
        client.clientId === innerClientId ? { ...client, color } : client
      )
      if (updatedClients.length > 0) {setClients(updatedClients)}
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

  const clearClient = async (clientId: string) => {
    s.current?.emit('clearClient', clientId)
  }

  console.log(clients)

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Clients</h2>
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
          {clients.sort((a,b) => (a.position || 0) - (b.position || 0)).map((client) => (
            <li
              key={client.clientId}
              style={{ backgroundColor: client.color }}
              className={styles.clientItem}
              onClick={()=>{
                setInnerClientId(client.clientId)
                setClientId(client.clientId)
              }}
            >
              {client.clientId} - {client.position}
              {innerClientId === client.clientId && (
                <>
                  <div className={styles.colorContainer}>
                    <div
                      style={{
                        border: '2px solid #DDD',
                        marginRight: '0.5rem',
                        height: '28px',
                        borderRadius: '4px',
                      }}
                    >
                      <input
                        className={styles.iconpicker}
                        style={{ backgroundColor: client.color }}
                        type='color'
                        defaultValue={client.color}
                        onChange={(e) => updateColor(e.target.value)}
                      />
                    </div>
                    <button
                      className={styles.button}
                      onClick={() => clearClient(client.clientId)}
                    >
                      X
                    </button>
                  </div>
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
