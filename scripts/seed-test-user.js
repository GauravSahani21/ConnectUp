const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/whatsapp-clone"

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "Hey there! I am using WhatsApp." },
    status: { type: String, enum: ["online", "offline", "typing"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model("User", userSchema)

async function seedTestUser() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log("Connected to MongoDB")

        const testEmail = "test@example.com"
        const existingUser = await User.findOne({ email: testEmail })
        
        if (existingUser) {
            console.log("Test user already exists!")
            console.log("Email: test@example.com")
            console.log("Password: password")
            await mongoose.connection.close()
            return
        }

        const hashedPassword = await bcrypt.hash("password", 10)

        const testUser = await User.create({
            name: "Test User",
            email: testEmail,
            password: hashedPassword,
            phone: "+0987654321",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
            bio: "I'm a test user for friend requests!",
            status: "offline"
        })

        console.log("✅ Test user created successfully!")
        console.log("Email: test@example.com")
        console.log("Password: password")
        console.log("User ID:", testUser._id)

        await mongoose.connection.close()
        console.log("Database connection closed")
    } catch (error) {
        console.error("Error seeding test user:", error)
        process.exit(1)
    }
}

seedTestUser()
