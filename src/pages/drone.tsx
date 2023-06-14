// drone.tsx

import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import styles from '../pages/styles.module.css'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import cache from 'memory-cache'
import { colorShades, calculateContrastColor } from '@/utils/colors'
import ShadeGenerator from 'shade-generator'

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
  const [grid, setGrid] = useState(false)
  const [generalColor, setGeneralColor] = useState('#800000')
  const [shades, setShades] = useState(colorShades(generalColor, clients.length))
  const s = useRef<Socket | null>(null)
  const colorMap = ShadeGenerator.hue('#ff0000').shadesMap('hex')

  console.log('YOOO', colorMap)
  useEffect(() => {
    setShades(colorShades(generalColor, clients.length))  
  }, [generalColor, clients.length])
  
  useEffect(() => {
    let isMounted = true

    const socket = io('192.168.1.2:4000', {
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
              ? { ...client, color: clientData.color } 
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

    s.current?.emit('register', 'droneClientId')

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
          position: updatedClient.position, 
        },
      })
      s.current?.emit('clientsUpdate', updatedClients)
  
      console.log(`Updated color of client ${clientId} to ${color}`)
    }
  }
  

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
    s.current?.emit('clientsUpdate', updatedClients)

  
    // updatedClients.forEach((client, index) => {
    //   if (client.clientId !== draggedClient.clientId) {
    //     let newPosition = client.position
  
    //     if (destination.index < source.index) {
    //       // Moving upwards
    //       if (index >= destination.index && index < source.index) {
    //         newPosition += 1
    //       } else if (index >= source.index && index < destination.index) {
    //         newPosition -= 1
    //       }
    //     } else {
    //       // Moving downwards
    //       if (index > source.index && index <= destination.index) {
    //         newPosition -= 1
    //       } else if (index > destination.index && index <= source.index) {
    //         newPosition += 1
    //       }
    //     }
  
    //     updatePosition(client.clientId, newPosition)
    //   }
    // })
    // updatePosition(result.draggableId, destination.index + 1)
  }       
  

  return (
    <div className={grid ? styles.grid : styles.container}>
      <h2 className={styles.title}>Control</h2>
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <button className={styles.button} onClick={clearClients}>
            Clear Clients
          </button>
          <button disabled={!grid} className={styles.button} style={{ backgroundColor: !grid ? '' : 'grey', borderRadius: '4px 0 0 4px'}} onClick={()=> setGrid(false)}>
            ☰
          </button>
          <button disabled={grid} className={styles.button} style={{ backgroundColor: !grid ? 'grey' : '', borderRadius: '0 4px 4px 0'}} onClick={()=> setGrid(true)}>
            ∷
          </button>
          <div style={{display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-start'}}>
            <div
              style={{
                border: '0px solid #DDD',
                margin: '0 0.5rem',
                height: '37px',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <input
                className={styles.iconpicker}
                style={{ width: grid ? '80px' : '', margin: grid ? 0 : '', height: '37px', borderRadius: '10px' }}
                type="color"
                value={generalColor}
                onChange={(e) => {
                  setGeneralColor(e.target.value)
                  clients.map((c, i) => {
                    updateColor(c.clientId, shades[i].hex)
                  })
                }}
              />
            </div>
            <div style={{display: 'flex', width: '200px', border: '2px solid #FFF', boxSizing : 'border-box', opacity: 0}} onClick={()=>{
              clients.map((c, i) => {
                updateColor(c.clientId, shades[i].hex)
              })
            }}>
              {shades.map((s:any, i: number)=><div key={i} style={{ backgroundColor: s.hex, height: 25, flex: 1}} />)}
            </div>
          </div>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="client-list" direction={grid ? 'horizontal' : 'vertical'}>
            {(provided) => (
              <div className={styles.clientList} {...provided.droppableProps} ref={provided.innerRef}>
                {clients.map((client, index) => (
                  <Draggable key={client.clientId} draggableId={client.clientId} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className={styles.clientItem} 
                          style={{ backgroundColor: client.color, color: calculateContrastColor(client.color) }}>
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
                                marginRight: grid ? 0 : '0.5rem',
                                height: '28px',
                                borderRadius: '4px',
                              }}
                            >
                              <input
                                className={styles.iconpicker}
                                style={{ backgroundColor: client?.color, width: grid ? '80px' : '', margin: grid ? 0 : '' }}
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
                              style={{ padding: '7px 16px', width: grid ? '89px' : '', margin: grid ? '0.25rem 0' : 0 }}
                              value={client.position || ''}
                            >
                              {clients.map((c, i) => (
                                <option key={i} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                            <div style={{ display: 'flex'}}>
                              <button
                                disabled={client.position === 0}
                                className={styles.button}
                                style={{ marginLeft: grid ? 0 : '0.5rem', backgroundColor: client.position === 1 ? 'grey' : '', borderRadius: grid ? '4px 0 0 4px' : '4px' }}
                                onClick={() => updatePosition(client.clientId, (client.position || 0) - 1)}
                              >
                                { grid ? '🠈' : '🠉' }
                              </button>
                              <button
                                disabled={client.position === clients.length}
                                className={styles.button}
                                style={{ marginLeft: grid ? 0 : '0.5rem', backgroundColor: client.position === clients.length ? 'grey' : '', borderRadius: grid ? '0 4px 4px 0' : '4px'  }}
                                onClick={() => updatePosition(client.clientId, (client.position || 0) + 1)}
                              >
                                { grid ? '🠊' : '🠋' }
                              </button>
                            </div>
                            <button
                              className={styles.button}
                              style={{ marginLeft: '0.5rem', marginTop: grid ? '0.25rem' : 0 }}
                              onClick={() => clearClient(client.clientId)}
                            >
                              X
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div></div>
    </div>
  )
}

export default Drone