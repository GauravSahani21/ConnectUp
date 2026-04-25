const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const mongoose = require('mongoose')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Global Socket.IO instance so API routes can emit events
let io

const getIO = () => io
module.exports.getIO = getIO

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  io = new Server(httpServer, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.engine.on('connection_error', (err) => {
    console.log('Socket.IO Connection Error:', err.req?.url, err.code, err.message)
  })

  // Bidirectional maps: userId <-> socketId
  const userSockets = new Map()   // userId -> socketId
  const socketUsers = new Map()   // socketId -> userId

  // Update user status in MongoDB
  async function setUserStatus(userId, status) {
    try {
      const dbUrl = process.env.MONGODB_URI
      if (!dbUrl || !userId) return

      // Only update if mongoose is connected
      if (mongoose.connection.readyState !== 1) return

      const User = mongoose.models.User
      if (!User) return

      const update = { status }
      if (status === 'offline') {
        update.lastSeen = new Date()
      }
      await User.findByIdAndUpdate(userId, update)
    } catch (err) {
      // Non-fatal: don't crash the server
      console.error('Status update error:', err.message)
    }
  }

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id)

    // ─── User registration ───────────────────────────────────────────────────
    socket.on('register-user', async (userId) => {
      if (!userId) return
      userSockets.set(userId, socket.id)
      socketUsers.set(socket.id, userId)
      console.log(`User ${userId} registered with socket ${socket.id}`)

      // Mark online
      await setUserStatus(userId, 'online')

      // Broadcast online status to all connected clients
      io.emit('user:status', { userId, status: 'online' })
    })

    // ─── Chat rooms ──────────────────────────────────────────────────────────
    socket.on('join-chat', (chatId) => {
      socket.join(`chat:${chatId}`)
    })

    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat:${chatId}`)
    })

    // ─── Typing indicators ───────────────────────────────────────────────────
    socket.on('typing', ({ chatId, userId, userName }) => {
      socket.to(`chat:${chatId}`).emit('userTyping', { chatId, userId, userName })
    })

    socket.on('stopTyping', ({ chatId, userId, userName }) => {
      socket.to(`chat:${chatId}`).emit('userStoppedTyping', { chatId, userId, userName })
    })

    // ─── Real-time message delivery ──────────────────────────────────────────
    // Called from API route after saving to DB
    socket.on('message:send', ({ chatId, message }) => {
      // Broadcast to everyone in the room except the sender
      socket.to(`chat:${chatId}`).emit('message:new', { chatId, message })
    })

    // ─── Delete for everyone ─────────────────────────────────────────────────
    socket.on('message:deleteForEveryone', ({ chatId, messageId }) => {
      socket.to(`chat:${chatId}`).emit('message:deletedForEveryone', { chatId, messageId })
    })

    // ─── Message reactions ─────────────────────────────────────────────────
    socket.on('message:reaction', ({ chatId, messageId, userId, emoji }) => {
      socket.to(`chat:${chatId}`).emit('message:reaction', { chatId, messageId, userId, emoji })
    })

    // ─── Read receipts ───────────────────────────────────────────────────────
    socket.on('message:read', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('message:read', { chatId, userId })
    })

    // ─── WebRTC Calls ────────────────────────────────────────────────────────
    socket.on('call:initiate', ({ callId, callerId, receiverId, callerName, callType }) => {
      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        io.to(receiverSocket).emit('call:incoming', { callId, callerId, callerName, callType })
        console.log(`Call initiated: ${callerId} -> ${receiverId} (${callType})`)
      }
    })

    socket.on('call:answer', ({ callId, callerId }) => {
      const callerSocket = userSockets.get(callerId)
      if (callerSocket) {
        io.to(callerSocket).emit('call:answered', { callId })
      }
    })

    socket.on('call:reject', ({ callId, callerId }) => {
      const callerSocket = userSockets.get(callerId)
      if (callerSocket) {
        io.to(callerSocket).emit('call:rejected', { callId })
      }
    })

    socket.on('call:end', ({ callId, userId, otherUserId }) => {
      const otherSocket = userSockets.get(otherUserId)
      if (otherSocket) {
        io.to(otherSocket).emit('call:ended', { callId })
      }
    })

    socket.on('call:offer', ({ callId, receiverId, offer }) => {
      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        io.to(receiverSocket).emit('call:offer', { callId, offer })
      }
    })

    socket.on('call:answer-sdp', ({ callId, callerId, answer }) => {
      const callerSocket = userSockets.get(callerId)
      if (callerSocket) {
        io.to(callerSocket).emit('call:answer-sdp', { callId, answer })
      }
    })

    socket.on('call:ice-candidate', ({ callId, userId, otherUserId, candidate }) => {
      const otherSocket = userSockets.get(otherUserId)
      if (otherSocket) {
        io.to(otherSocket).emit('call:ice-candidate', { callId, candidate })
      }
    })

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id)

      const userId = socketUsers.get(socket.id)
      if (userId) {
        userSockets.delete(userId)
        socketUsers.delete(socket.id)

        // Mark offline in DB
        await setUserStatus(userId, 'offline')

        // Broadcast offline status to all clients
        io.emit('user:status', { userId, status: 'offline', lastSeen: new Date() })
        console.log(`User ${userId} marked offline`)
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server running`)
    })
})
