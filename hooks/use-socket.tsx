"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Socket } from "socket.io-client"
import SocketService from "@/lib/socket"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connect: (userType: "company" | "vendor", userId: string) => void
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = (userType: "company" | "vendor", userId: string) => {
    const socketService = SocketService.getInstance()
    const newSocket = socketService.connect(userType, userId)
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("  Socket provider connected")
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      console.log("  Socket provider disconnected")
      setIsConnected(false)
    })
  }

  const disconnect = () => {
    const socketService = SocketService.getInstance()
    socketService.disconnect()
    setSocket(null)
    setIsConnected(false)
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>{children}</SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
