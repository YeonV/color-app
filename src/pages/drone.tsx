// drone.tsx

import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import styles from '../pages/styles.module.css'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import cache from 'memory-cache'

interface ClientData {
  clientId: string;
  color: string;
  position: number | null;
}

interface Client {
  clientId: string;
  color: string;
  position: number | null;
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
      clientsyz: clients,
    },
  }
}

const Drone = ({ clientsyz }: { clientsyz: any }) => {
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
      if (isMounted) {
        setClients(updatedClients)
      }
    })

    socket.on('colorChange', (clientData: ClientData) => {
      console.log('colorChange', clientData)
      if (isMounted && clientData) {
        setClients((prevClients) =>
          prevClients.map((client) =>
            client.clientId === clientData.clientId
              ? { ...client, color: clientData.color } // Only update the color, not the position
              : client
          )
        )
      }
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('message', (e) => {
      console.log('Received message:', e)
    })

    const fetchClients = async () => {
      s.current?.emit('register', 'droneClientId')
    }

    fetchClients()

    return () => {
      isMounted = false
      socket.disconnect()
    }
  }, [])

  const clearClients = async () => {
    s.current?.emit('clearAll')
  }

  const clearClient = async (clientId: string) => {
    s.current?.emit('clearClient', clientId)
  }

  const updateColor = (clientId: string, color: string) => {
    const updatedClient = clients.find((client) => client.clientId === clientId)
  
    if (updatedClient) {
      const updatedClients = clients.map((client) =>
        client.clientId === clientId ? { ...client, color } : client
      )
  
      setClients(updatedClients)
  
      s.current?.emit('colorUpdate', {
        data: {
          clientId,
          color,
          position: updatedClient.position, // Send the current position along with the color update
        },
      })
  
      console.log(`Updated color of client ${clientId} to ${color}`)
    }
  }
  
  

  // const updatePosition = async (clientId: string, newPosition: number) => {
  //   s.current?.emit('positionUpdate', {
  //     data: {
  //       clientId,
  //       position: newPosition,
  //     },
  //   });
  //   setClients((prevClients) =>
  //     prevClients.map((client) =>
  //       client.clientId === clientId ? { ...client, position: newPosition } : client
  //     )
  //   );
  //   console.log(`Updated position of client ${clientId} to ${newPosition}`);
  // };
  const updatePosition = async (clientId: string, newPosition: number) => {
    const clientToUpdate = clients.find((client) => client.clientId === clientId)
  
    if (clientToUpdate) {
      const updatedClient = { ...clientToUpdate, position: newPosition }
      s.current?.emit('positionUpdate', { data: updatedClient })
  
      setClients((prevClients) =>
        prevClients.map((client) => (client.clientId === clientId ? updatedClient : client))
      )
  
      console.log(`Updated position of client ${clientId} to ${newPosition}`)
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {return}
  
    const { source, destination } = result
  
    if (source.index === destination.index) {return}
  
    const newClients = Array.from(clients)
    const [draggedClient] = newClients.splice(source.index, 1)
    newClients.splice(destination.index, 0, draggedClient)
  
    const updatedClients = newClients.map((client, index) => ({
      ...client,
      position: index + 1,
    }))
  
    setClients(updatedClients)
  
    updatedClients.forEach((client, index) => {
      if (client.clientId !== draggedClient.clientId) {
        let newPosition = client.position
  
        if (destination.index < source.index) {
          // Moving upwards
          if (index >= destination.index && index < source.index) {
            newPosition += 1
          } else if (index >= source.index && index < destination.index) {
            newPosition -= 1
          }
        } else {
          // Moving downwards
          if (index > source.index && index <= destination.index) {
            newPosition -= 1
          } else if (index > destination.index && index <= source.index) {
            newPosition += 1
          }
        }
  
        updatePosition(client.clientId, newPosition)
      }
    })
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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="client-list">
            {(provided) => (
              <ul className={styles.clientList} {...provided.droppableProps} ref={provided.innerRef}>
                {clients.map((client, index) => (
                  <Draggable key={client.clientId} draggableId={client.clientId} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className={styles.clientItem} style={{ backgroundColor: client.color }}>
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
                                style={{ backgroundColor: client?.color }}
                                type="color"
                                value={client.color}
                                onChange={(e) => updateColor(client.clientId, e.target.value)}
                              />
                            </div>
                            <select
                              onChange={(e) =>
                                updatePosition(client.clientId, parseInt(e.target.value, 10))
                              }
                              className={styles.button}
                              style={{ padding: '7px 16px' }}
                              value={client.position || ''}
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
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div></div>
    </div>
  )
}

export default Drone