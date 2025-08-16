"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"

export default function SocketTest() {
  const [status, setStatus] = useState("Connecting...")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log("[SocketTest]", message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
    addLog(`Attempting to connect to: ${socketUrl}`)
    addLog(`Environment variable NEXT_PUBLIC_SOCKET_URL: ${process.env.NEXT_PUBLIC_SOCKET_URL}`)

    const socket = io(socketUrl, {
      query: { userType: "company", userId: "test_company" },
    })

    socket.on("connect", () => {
      addLog(`Connected! Socket ID: ${socket.id}`)
      setStatus("Connected")
    })

    socket.on("disconnect", () => {
      addLog("Disconnected")
      setStatus("Disconnected")
    })

    socket.on("connect_error", (error) => {
      addLog(`Connection error: ${error.message}`)
      setStatus("Connection Error")
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Socket.IO Test</h1>
      <p className="mb-4">Status: <strong>{status}</strong></p>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Logs:</h2>
        {logs.map((log, index) => (
          <div key={index} className="text-sm font-mono">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
