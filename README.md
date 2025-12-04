# ConnectUp 💬

A modern, feature-rich real-time chat application built with Next.js, Socket.IO, and MongoDB. Connect with friends instantly through messaging, voice/video calls, and more.

![ConnectUp](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io)
![MongoDB](https://img.shields.io/badge/MongoDB-9.0-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

## ✨ Key Features

### 💬 Real-Time Messaging
- **Instant message delivery** with Socket.IO WebSocket connections
- **Message types**: Text, images, videos, audio, files, voice messages, emojis
- **Message actions**: Edit, delete, copy messages
- **Read receipts** and typing indicators
- **Location sharing** with map integration

### 📞 Voice & Video Calls
- **WebRTC-based** peer-to-peer audio and video calls
- **Call notifications** with incoming call modal
- **Call history** tracking (missed, completed, cancelled calls)
- **Call duration** recording
- **Real-time call status** updates

### 👥 Friend System
- **Friend requests** via email
- **Email notifications** for friend requests and acceptances
- Accept/reject friend request functionality
- Search users by email

### 🎨 Modern UI/UX
- **Responsive design** - Desktop and mobile optimized
- **Mobile bottom navigation** (WhatsApp-style)
- **Dark mode** support
- **Glassmorphism** and modern design aesthetics
- **Notification badges** on navigation icons
- **Floating Action Button (FAB)** for quick actions

### 🤖 AI Assistant
- **Integrated AI chatbot** powered by Google Gemini
- Conversational AI for help and information
- Context-aware responses

### 👤 User Profiles
- **Customizable profiles** with bio, avatar, phone, email
- **Profile picture upload**
- **Online/offline status** tracking
- **Last seen** timestamps

### 💡 Chat Features
- **Pin important chats**
- **Mute/unmute** conversations
- **Archive chats**
- **Clear chat history**
- **Search chats** functionality
- **Chat sorting** (pinned chats at top)

## 🛠️ Technologies Used

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **SWR** - Data fetching and caching
- **Sonner** - Toast notifications
- **Emoji Picker React** - Emoji selection
- **React Hook Form + Zod** - Form validation

### Backend
- **Next.js API Routes** - Serverless functions
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB + Mongoose** - Database and ODM
- **bcryptjs** - Password hashing
- **Nodemailer** - Email notifications

### Real-Time Communication
- **Socket.IO** - WebSocket server and client
- **WebRTC** - Peer-to-peer audio/video calls
- Custom signaling server for call connection

### AI Integration
- **Google Gemini API** - AI chatbot functionality

### Development Tools
- **ESLint** - Code linting
- **PostCSS + Autoprefixer** - CSS processing
- **tsx** - TypeScript execution

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Gmail account for email notifications (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd connectup
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/connectup

# Email Configuration (for friend request notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Google Gemini AI (for AI chatbot)
GEMINI_API_KEY=your-gemini-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 📧 Email Setup (Optional)

For friend request email notifications:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use the generated password in `EMAIL_PASSWORD`
4. See `docs/EMAIL_SETUP.md` for detailed instructions

## 🗄️ Database Schema

### Collections
- **users** - User accounts and profiles
- **chats** - Chat conversations
- **messages** - Chat messages
- **friendrequests** - Friend request data

## 📱 Mobile Features

- **Bottom navigation bar** with 5 icons (Chats, Friend Requests, New Chat FAB, Settings, Calls)
- **Responsive layout** that adapts to mobile screens
- **Touch-optimized UI** for mobile interactions
- **Full-screen chat view** on mobile

## 🎯 Project Structure

```
connectup/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication
│   │   ├── chats/        # Chat operations
│   │   ├── messages/     # Message handling
│   │   ├── friend-requests/  # Friend system
│   │   └── ai-chat/      # AI chatbot
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── auth/             # Login/signup forms
│   ├── chat/             # Chat components
│   ├── call/             # Call components
│   ├── profile/          # Profile settings
│   └── ui/               # Reusable UI components
├── context/              # React Context providers
│   ├── app-context.tsx   # App state
│   ├── call-context.tsx  # Call management
│   └── socket-context.tsx # Socket.IO
├── lib/                  # Utility libraries
│   ├── db.ts            # MongoDB connection
│   ├── email.ts         # Email service
│   └── webrtc.ts        # WebRTC logic
├── models/               # Mongoose schemas
├── utils/                # Helper functions
└── server.js            # Custom server with Socket.IO
```

## 🔒 Security Features

- **Password hashing** with bcryptjs
- **Environment variables** for sensitive data
- **Authentication checks** on API routes
- **Input validation** with Zod schemas

## 🌟 Future Enhancements

- Group chats
- Message forwarding
- Media gallery
- Custom themes
- End-to-end encryption
- Push notifications
- Stories/Status updates

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

Built with ❤️ by Gaurav Sahani

---

**ConnectUp** - Connect with friends instantly! 🚀
