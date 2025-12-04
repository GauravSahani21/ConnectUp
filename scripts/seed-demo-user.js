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

async function seedDemoUser() {
    try {
        
        console.log("Connecting to MongoDB...")
        await mongoose.connect(MONGODB_URI)
        console.log("Connected to MongoDB")

        
        const existingUser = await User.findOne({ email: "demo@example.com" })
        
        if (existingUser) {
            console.log("Demo user already exists!")
            console.log("Email: demo@example.com")
            console.log("Password: password")
            await mongoose.connection.close()
            return
        }

        
        const hashedPassword = await bcrypt.hash("password", 10)

        
        const demoUser = await User.create({
            name: "Demo User",
            email: "demo@example.com",
            password: hashedPassword,
            phone: "+1234567890",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
            bio: "Hey there! I am using WhatsApp.",
            status: "offline"
        })

        console.log("✅ Demo user created successfully!")
        console.log("Email: demo@example.com")
        console.log("Password: password")
        console.log("User ID:", demoUser._id)

        await mongoose.connection.close()
        console.log("Database connection closed")
    } catch (error) {
        console.error("Error seeding demo user:", error)
        process.exit(1)
    }
}

seedDemoUser()
