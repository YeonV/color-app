// pages/[clientId]/client.tsx

import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import styles from '../styles.module.css'
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

export const getServerSideProps = (context: any) => {
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
      clientId: context.params.clientId,
      clientsyz: clients
    }
  }
}

const Home = ({
  clientId,
  clientsyz
}:{
  clientId: string,
  clientsyz: ClientData[]
}) => {
  const innerClientId = clientId
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

    socket.on('colorChange', (updatedData: ClientData) => {
      setClients((prevClients) =>
        prevClients.map((client) =>
          client.clientId === updatedData.clientId ? updatedData : client
        )
      )
    })
    socket.on('positionChange', (updatedData: ClientData) => {
      console.log("YES",updatedData)
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


  return (
        
    clients.filter((c,i) => c.clientId  === clientId).map((client) => (
      <div
        key={client.clientId}
        style={{ backgroundColor: client.color }}
        className={styles.container}
      >
        {/* {client.clientId} */}
        
      </div>
    ))
)
}

export default Home