/**
 * Seed script — creates demo users and a sample chat for testing
 * Run with: node scripts/seed.js
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/connectup'

// Inline schemas for seeding
const UserSchema = new mongoose.Schema({
    name: String, email: String, password: String, avatar: String,
    bio: String, phone: String, status: { type: String, default: 'offline' },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true })

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { text: String, senderId: mongoose.Schema.Types.ObjectId, timestamp: Date, read: Boolean },
    unreadCounts: { type: Map, of: Number, default: {} },
    pinnedBy: [mongoose.Schema.Types.ObjectId],
    mutedBy: [{ userId: mongoose.Schema.Types.ObjectId, until: Date }],
    archivedBy: [mongoose.Schema.Types.ObjectId],
    clearedAt: { type: Map, of: Date }
}, { timestamps: true })

const MessageSchema = new mongoose.Schema({
    chatId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    text: String,
    type: { type: String, default: 'text' },
    status: { type: String, default: 'delivered' },
    deletedFor: [mongoose.Schema.Types.ObjectId],
    deletedForEveryone: Boolean,
    starredBy: [mongoose.Schema.Types.ObjectId],
    reactions: [{ userId: mongoose.Schema.Types.ObjectId, emoji: String }],
}, { timestamps: true })

async function seed() {
    console.log('🌱 Connecting to MongoDB...')
    console.log('URI:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'))

    await mongoose.connect(MONGODB_URI, { bufferCommands: false })
    console.log('✅ Connected!')

    const User = mongoose.models.User || mongoose.model('User', UserSchema)
    const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema)
    const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema)

    // Create demo users
    const hashedPass = await bcrypt.hash('password', 10)

    const demoUsers = [
        {
            name: 'Demo User',
            email: 'demo@example.com',
            password: hashedPass,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
            bio: 'Hey there! I am using ConnectUp.',
            phone: '+1 555 0001',
            status: 'online'
        },
        {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            password: hashedPass,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            bio: 'Coffee lover ☕ | Designer',
            phone: '+1 555 0002',
            status: 'online'
        },
        {
            name: 'Bob Smith',
            email: 'bob@example.com',
            password: hashedPass,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
            bio: 'Building things 🛠️',
            phone: '+1 555 0003',
            status: 'offline'
        },
        {
            name: 'Carol White',
            email: 'carol@example.com',
            password: hashedPass,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
            bio: 'Traveler ✈️',
            phone: '+1 555 0004',
            status: 'offline'
        }
    ]

    console.log('\n👤 Creating demo users...')
    const createdUsers = []
    for (const u of demoUsers) {
        let user = await User.findOne({ email: u.email })
        if (!user) {
            user = await User.create(u)
            console.log('  ✅ Created:', u.email)
        } else {
            console.log('  ⏭️  Already exists:', u.email)
        }
        createdUsers.push(user)
    }

    const [demo, alice, bob, carol] = createdUsers

    // Create chats
    console.log('\n💬 Creating sample chats...')
    const chatPairs = [
        [demo._id, alice._id],
        [demo._id, bob._id],
        [demo._id, carol._id],
    ]

    const sampleMessages = [
        ['Hey! How are you doing?', 'Great to hear from you!', 'Let\'s catch up soon 🙌'],
        ['Did you see the game last night?', 'Yeah it was insane!', 'We should watch the next one together'],
        ['Can you share those files?', 'Sure, sending them now!', 'Thanks so much! 🙏'],
    ]

    for (let i = 0; i < chatPairs.length; i++) {
        const [a, b] = chatPairs[i]
        const msgs = sampleMessages[i]

        let chat = await Chat.findOne({ participants: { $all: [a, b], $size: 2 } })
        if (!chat) {
            chat = await Chat.create({
                participants: [a, b],
                unreadCounts: { [a.toString()]: 1, [b.toString()]: 0 }
            })

            // Create messages
            for (let j = 0; j < msgs.length; j++) {
                const senderId = j % 2 === 0 ? b : a
                const msg = await Message.create({
                    chatId: chat._id,
                    senderId,
                    text: msgs[j],
                    type: 'text',
                    status: 'delivered'
                })

                if (j === msgs.length - 1) {
                    await Chat.findByIdAndUpdate(chat._id, {
                        lastMessage: { text: msgs[j], senderId, timestamp: new Date(), read: false }
                    })
                }
            }
            console.log(`  ✅ Chat + messages created between demo and ${createdUsers[i + 1].name}`)
        } else {
            console.log(`  ⏭️  Chat already exists between demo and ${createdUsers[i + 1].name}`)
        }
    }

    console.log('\n🎉 Seed complete!')
    console.log('\nDemo credentials:')
    console.log('  Email: demo@example.com')
    console.log('  Password: password')
    console.log('\nOther test accounts (same password):')
    console.log('  alice@example.com / bob@example.com / carol@example.com')

    await mongoose.disconnect()
    process.exit(0)
}

seed().catch(err => {
    console.error('\n❌ Seed failed:', err.message)
    console.error('\nIf you see a DNS error, your MongoDB password in .env.local is missing or wrong.')
    console.error('Fix: Replace <db_password> in .env.local with your actual MongoDB Atlas password.')
    process.exit(1)
})
