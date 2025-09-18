import { useEffect, useState, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
    })

    socketInstance.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('message', (message: WebSocketMessage) => {
      setLastMessage(message)
    })

    socketInstance.on('meeting-updated', (data: any) => {
      setLastMessage({
        type: 'meeting-updated',
        data,
        timestamp: new Date().toISOString()
      })
    })

    socketInstance.on('workflow-status', (data: any) => {
      setLastMessage({
        type: 'workflow-status',
        data,
        timestamp: new Date().toISOString()
      })
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.close()
    }
  }, [])

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && isConnected) {
      socket.emit('message', { type, data })
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage
  }
}