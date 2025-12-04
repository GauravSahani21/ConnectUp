const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  })

  // Store active typing users per chat
  const typingUsers = new Map() // chatId -> Set of userIds
  
  // Store user socket mappings for direct calls (must be outside connection handler)
  const userSockets = new Map() // userId -> socketId

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join user to their chat rooms
    socket.on('join-chat', (chatId) => {
      socket.join(`chat:${chatId}`)
      console.log(`Socket ${socket.id} joined chat:${chatId}`)
    })

    // Leave chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat:${chatId}`)
      console.log(`Socket ${socket.id} left chat:${chatId}`)
    })

    // Handle typing event
    socket.on('typing', ({ chatId, userId, userName }) => {
      // Add user to typing set for this chat
      if (!typingUsers.has(chatId)) {
        typingUsers.set(chatId, new Set())
      }
      typingUsers.get(chatId).add(userId)

      // Broadcast to other users in the chat
      socket.to(`chat:${chatId}`).emit('userTyping', { 
        chatId, 
        userId, 
        userName 
      })
      console.log(`User ${userName} (${userId}) is typing in chat ${chatId}`)
    })

    // Handle stop typing event
    socket.on('stopTyping', ({ chatId, userId, userName }) => {
      // Remove user from typing set
      if (typingUsers.has(chatId)) {
        typingUsers.get(chatId).delete(userId)
        if (typingUsers.get(chatId).size === 0) {
          typingUsers.delete(chatId)
        }
      }

      // Broadcast to other users in the chat
      socket.to(`chat:${chatId}`).emit('userStoppedTyping', { 
        chatId, 
        userId 
      })
      console.log(`User ${userName} (${userId}) stopped typing in chat ${chatId}`)
    })

    // ========== CALL EVENTS ==========
    
    // Register user
    socket.on('register-user', (userId) => {
      userSockets.set(userId, socket.id)
      console.log(`User ${userId} registered with socket ${socket.id}`)
    })

    // Initiate call
    socket.on('call:initiate', ({ callId, callerId, receiverId, callerName, callType }) => {
      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        io.to(receiverSocket).emit('call:incoming', {
          callId,
          callerId,
          callerName,
          callType
        })
        console.log(`Call initiated: ${callerId} -> ${receiverId} (${callType})`)
      }
    })

    // Answer call
    socket.on('call:answer', ({ callId, callerId }) => {
      const callerSocket = userSockets.get(callerId)
      if (callerSocket) {
        io.to(callerSocket).emit('call:answered', { callId })
        console.log(`Call answered: ${callId}`)
      }
    })

    // Reject call
    socket.on('call:reject', ({ callId, callerId }) => {
      const callerSocket = userSockets.get(callerId)
      if (callerSocket) {
        io.to(callerSocket).emit('call:rejected', { callId })
        console.log(`Call rejected: ${callId}`)
      }
    })

    // End call
    socket.on('call:end', ({ callId, userId, otherUserId }) => {
      const otherSocket = userSockets.get(otherUserId)
      if (otherSocket) {
        io.to(otherSocket).emit('call:ended', { callId })
        console.log(`Call ended: ${callId}`)
      }
    })

    // WebRTC signaling - offer
    socket.on('call:offer', ({ callId, receiverId, offer }) => {
      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        io.to(receiverSocket).emit('call:offer', { callId, offer })
        console.log(`Call offer sent to ${receiverId}`)
      }
    })

    // WebRTC signaling - answer
    socket.on('call:answer-sdp', ({ callId, callerId, answer }) => {
      const callerSocket = userSockets.get(callerId)
      if (callerSocket) {
        io.to(callerSocket).emit('call:answer-sdp', { callId, answer })
        console.log(`Call answer sent to ${callerId}`)
      }
    })

    // WebRTC signaling - ICE candidate
    socket.on('call:ice-candidate', ({ callId, userId, otherUserId, candidate }) => {
      const otherSocket = userSockets.get(otherUserId)
      if (otherSocket) {
        io.to(otherSocket).emit('call:ice-candidate', { callId, candidate })
        console.log(`ICE candidate sent from ${userId} to ${otherUserId}`)
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      // Clean up typing status for disconnected user
      // (In a production app, you'd want to track socket.id to userId mapping)
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
