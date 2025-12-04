import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/whatsapp-clone"

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "/default-avatar.png" },
    bio: { type: String, default: "Hey there! I am using WhatsApp." },
    status: { type: String, enum: ["online", "offline", "typing"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },
})

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
})

const MessageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ["text", "image", "audio", "file"], default: "text" },
})

const User = mongoose.models.User || mongoose.model("User", UserSchema)
const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema)
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema)

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log("✅ Connected to MongoDB")

        // Clear existing data
        await User.deleteMany({})
        await Chat.deleteMany({})
        await Message.deleteMany({})
        console.log("🗑️  Cleared existing data")

        // Create demo user
        const demoPassword = await bcrypt.hash("password", 10)
        const demoUser = await User.create({
            name: "Demo User",
            email: "demo@example.com",
            password: demoPassword,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
            bio: "Hey there! I'm the demo user.",
            status: "online",
        })
        console.log("👤 Created demo user:", demoUser.email)

        // Create additional users
        const users = [
            {
                name: "Alice Johnson",
                email: "alice@example.com",
                password: await bcrypt.hash("password", 10),
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
                bio: "Love chatting with friends! 💬",
            },
            {
                name: "Bob Smith",
                email: "bob@example.com",
                password: await bcrypt.hash("password", 10),
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
                bio: "Working from home today 🏠",
            },
            {
                name: "Carol Williams",
                email: "carol@example.com",
                password: await bcrypt.hash("password", 10),
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
                bio: "Coffee lover ☕",
            },
            {
                name: "David Brown",
                email: "david@example.com",
                password: await bcrypt.hash("password", 10),
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
                bio: "Traveling the world 🌍",
            },
        ]

        const createdUsers = await User.insertMany(users)
        console.log(`👥 Created ${createdUsers.length} additional users`)

        // Create AI Assistant user
        const aiAssistant = await User.create({
            name: "AI Assistant",
            email: "ai@assistant.com",
            password: await bcrypt.hash("no-login", 10),
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AI",
            bio: "🤖 I'm your friendly AI assistant! Ask me anything and I'll do my best to help.",
            status: "online",
        })
        console.log("🤖 Created AI Assistant user with ID:", aiAssistant._id.toString())

        // Create AI chat for demo user
        const aiChat = await Chat.create({
            participants: [demoUser._id, aiAssistant._id],
        })

        // Add welcome message from AI
        await Message.create({
            chatId: aiChat._id,
            senderId: aiAssistant._id,
            text: "👋 Hello! I'm your AI Assistant. I'm here to help answer questions, have conversations, and assist you with various topics. Feel free to ask me anything!",
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
        })
        console.log("💬 Created AI Assistant chat with welcome message")

        // Create chats between demo user and others
        for (let i = 0; i < createdUsers.length; i++) {
            const otherUser = createdUsers[i]
            await Chat.create({
                participants: [demoUser._id, otherUser._id],
            })
            console.log(`💬 Created chat with ${otherUser.name}`)
        }

        console.log("\n✨ Database seeded successfully!")
        console.log("\n📝 Demo credentials:")
        console.log("   Email: demo@example.com")
        console.log("   Password: password")
        console.log("\n🚀 You can now log in to the application!")

        await mongoose.connection.close()
        process.exit(0)
    } catch (error) {
        console.error("❌ Error seeding database:", error)
        process.exit(1)
    }
}

seed()
