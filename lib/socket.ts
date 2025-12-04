import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
    if (!socket) {
        const url = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        socket = io(url, {
            path: '/socket.io',
            addTrailingSlash: false,
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
