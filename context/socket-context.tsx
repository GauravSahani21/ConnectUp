"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket, disconnectSocket } from '@/lib/socket'

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        const socketInstance = getSocket()
        setSocket(socketInstance)

        const handleConnect = () => {
            console.log('Socket connected in context')
            setIsConnected(true)
        }

        const handleDisconnect = () => {
            console.log('Socket disconnected in context')
            setIsConnected(false)
        }

        socketInstance.on('connect', handleConnect)
        socketInstance.on('disconnect', handleDisconnect)

        // Set initial connection state
        setIsConnected(socketInstance.connected)

        return () => {
            socketInstance.off('connect', handleConnect)
            socketInstance.off('disconnect', handleDisconnect)
            disconnectSocket()
        }
    }, [])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}

export function useSocket() {
    const context = useContext(SocketContext)
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider')
    }
    return context
}
