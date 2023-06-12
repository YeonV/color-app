import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import styles from './styles.module.css' // Import CSS module styles
import cache from 'memory-cache'

interface ClientData {
  clientId: string
  color: string
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

const Drone = ({
  clientsyz
}: {
  clientsyz: any
}) => {
  const [clients, setClients] = useState<ClientData[]>(clientsyz)
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
    socket.on('colorChange', (clientData: ClientData) => {
      console.log('colorChange', clientData)
      if (isMounted && clientData) {
        // setClients([...clients, clientData])
        setClients((prevClients) =>
        prevClients.map((client) =>
          client.clientId === clientData.clientId ? clientData : client
        )
      )
      }
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('message', (e: any) => {
      console.log('Received message:', e)
    })

    const fetchClients = async () => {
      // try {
      //   await axios.post('/api/register', {
      //     clientId: 'droneClientId',
      //     isDrone: false,
      //   })
      //   console.log('Client registered successfully')
      // } catch (error) {
      //   console.error('Failed to register client:', error)
      // }
      // try {
      //   const response = await axios.get('/api/getclients')
      //   const initialClients: ClientData[] = response.data
      //   console.log('OOOOO', initialClients)
      //   console.log('res', response)
      //   if (isMounted && initialClients.length > 0) {
      //     setClients(initialClients)
      //   }
      // } catch (error) {
      //   console.error('Failed to fetch clients:', error)
      // }
    }

    fetchClients()
    console.log("PLZ-drone", clientsyz)


    return () => {
      isMounted = false
      socket.disconnect()
    }
  }, [])

  const clearClients = async () => {
    // try {
    //   await axios.post('/api/clearclients')
    //   setClients([])
    //   console.log('Cleared all clients')
    // } catch (error) {
    //   console.error('Failed to clear clients:', error)
    // }
  }

  const clearClient = async (clientId: string) => {
    // try {
    //   await axios.post('/api/clearclient', { clientId })
    //   setClients((prevClients) =>
    //     prevClients.filter((client) => client.clientId !== clientId)
    //   )
    //   console.log(`Cleared client: ${clientId}`)
    // } catch (error) {
    //   console.error(`Failed to clear client: ${clientId}`, error)
    // }
  }

  const updateColor = async (clientId: string, color: string) => {
    s.current?.emit('colorUpdate', { data: { clientId, color } })
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.clientId === clientId ? { ...client, color } : client
      )
    )
    console.log(`Updated color of client ${clientId} to ${color}`)
  }

  const updatePosition = async (clientId: string, position: number) => {
    s.current?.emit('positionUpdate', { data: { clientId, position } })
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.clientId === clientId ? { ...client, position } : client
      )
    )
    console.log(`Updated position of client ${clientId} to ${position}`)
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Control</h2>
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <button className={styles.button} onClick={clearClients}>
            Clear Clients
          </button>
        </div>
        <ul className={styles.clientList}>
          {clients.map((client, index) => (
            <li
              className={styles.clientItem}
              key={client.clientId}
              style={{ backgroundColor: client.color }}
            >
              <span className={styles.clientId}>{client.clientId}</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
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
                    onChange={(e) =>
                      updateColor(client.clientId, e.target.value)
                    }
                  />
                </div>
                <select
                  onChange={(e) =>
                    updatePosition(client.clientId, JSON.parse(e.target.value))
                  }
                  className={styles.button}
                  style={{ padding: '7px 16px' }}
                  defaultValue={index + 1}
                >
                  {clients.map((c, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <button
                  className={styles.button}
                  style={{ marginLeft: '0.5rem' }}
                  onClick={() => clearClient(client.clientId)}
                >
                  X
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div></div>
    </div>
  )
}

export default Drone
