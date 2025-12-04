import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io('http://localhost:3000', {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        })

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket?.id)
        })

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason)
        })

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
        })
    }

    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

export default getSocket
