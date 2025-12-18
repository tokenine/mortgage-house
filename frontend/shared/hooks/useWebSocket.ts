"use client"

import { useEffect, useRef, useState } from "react"

interface WebSocketOptions {
  url: string
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (data: any) => void
  reconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket(options: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = () => {
    try {
      const ws = new WebSocket(options.url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        options.onOpen?.()
      }

      ws.onclose = () => {
        setIsConnected(false)
        options.onClose?.()
        
        if (options.reconnect) {
          reconnectTimeoutRef.current = setTimeout(
            connect,
            options.reconnectInterval ?? 3000
          )
        }
      }

      ws.onerror = (error) => {
        options.onError?.(error)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        options.onMessage?.(data)
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [options.url])

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return {
    isConnected,
    lastMessage,
    sendMessage,
  }
}

// Hook for marketplace real-time updates
export function useMarketplaceWebSocket() {
  const { lastMessage, isConnected, sendMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8545",
    onOpen: () => {
      console.log("Connected to marketplace updates")
      sendMessage({ type: "subscribe", channel: "marketplace" })
    },
    reconnect: true,
    reconnectInterval: 5000,
  })

  return {
    isConnected,
    lastMarketUpdate: lastMessage,
  }
}