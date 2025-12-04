# Integration Guide - Enhanced Components

## Quick Start: Using the New Features

Your WhatsApp features are built and ready! Here's how to integrate the enhanced components.

## Step 1: Update Message List Component

Replace the old message bubble with the enhanced version:

**File: `components/chat/message-list.tsx`**

```typescript
// Change this import:
import MessageBubble from "./message-bubble"

// To this:
import MessageBubble from "./message-bubble-enhanced"
```

Add reply state management:

```typescript
import { useState } from "react"

export default function MessageList() {
  const [replyTo, setReplyTo] = useState<any>(null)
  
  // In your JSX, pass the onReply handler:
  <MessageBubble 
    message={msg} 
    isOwn={isOwn}
    onReply={(msg) => setReplyTo(msg)}
  />
  
  // Pass replyTo to MessageInput component
}
```

## Step 2: Update Chat Area Component

Replace the message input with the enhanced version:

**File: `components/chat/chat-area.tsx`**

```typescript
// Change this import:
import MessageInput from "./message-input"

// To this:
import MessageInputEnhanced from "./message-input-enhanced"

// Add state for reply:
const [replyTo, setReplyTo] = useState<any>(null)

// In JSX:
<MessageInputEnhanced 
  replyTo={replyTo}
  onCancelReply={() => setReplyTo(null)}
/>
```

## Step 3: Fix Messages API Call

Update to include userId for filtering deleted messages:

**File: `context/app-context.tsx`** (around line 90)

```typescript
// Update the SWR call for messages:
const { data: messagesData, mutate: mutateMessages } = useSWR(
  selectedChat && currentUser 
    ? `/api/messages?chatId=${selectedChat.id}&userId=${currentUser.id}` 
    : null,
  fetcher,
  { refreshInterval: 1000 }
)
```

## Step 4: Re-seed Database (Important!)

The database schema has changed. Re-seed to ensure compatibility:

```bash
npm run seed
```

This will:
- ✅ Clear old data
- ✅ Create demo user with new schema
- ✅ Generate sample chats with proper structure

## Step 5: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 6: Test Features

1. **Login**: `demo@example.com` / `password`
2. **Open a chat** with Alice, Bob, Carol, or David
3. **Test features**:
   - Type a message → see typing indicator
   - Send message → see read receipts (✓, ✓✓)
   - Hover over message → click smile → add reaction
   - Hover over message → click reply → send reply
   - Hover over message → click star
   - Upload file with paperclip button
   - Pin chat from sidebar hover

## Optional: Add Emoji Picker

Install emoji picker library:

```bash
npm install emoji-picker-react
```

Update `message-input-enhanced.tsx`:

```typescript
import EmojiPicker from 'emoji-picker-react'

// Add state:
const [showEmojiPicker, setShowEmojiPicker] = useState(false)

// Replace emoji button with:
<button 
  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
  className="..."
>
  <Smile size={24} />
</button>

{showEmojiPicker && (
  <div className="absolute bottom-full mb-2">
    <EmojiPicker 
      onEmojiClick={(emoji) => {
        setMessage(message + emoji.emoji)
        setShowEmojiPicker(false)
      }}
    />
  </div>
)}
```

## Troubleshooting

### Issue: Messages not showing new fields

**Solution**: Re-seed database
```bash
npm run seed
```

### Issue: File upload fails

**Solution**: Ensure uploads directory exists
```bash
mkdir -p public/uploads
```

### Issue: Typing indicator not working

**Solution**: Check API endpoint
- Go to http://localhost:3000/api/chats/typing
- Should return 404 (GET without params) but not an error

### Issue: Read receipts not updating

**Solution**: Check SWR refresh interval
- Messages should refresh every 1 second
- Chats should refresh every 3 seconds

## Next Steps

1. ✅ Integrate enhanced components (follow steps above)
2. 📱 Test all features thoroughly
3. 🎨 Customize colors/styles to match your brand
4. 🔊 Add notification sounds
5. 📢 Add desktop notifications
6. 🎤 Implement voice message recording
7. 🌐 Consider WebSocket for real-time updates

## Files Modified

- ✅ `models/Message.ts` - Enhanced schema
- ✅ `models/User.ts` - Added privacy settings
- ✅ `models/Chat.ts` - Added archive, typing, clear
- ✅ `app/api/messages/route.ts` - Enhanced with actions
- ✅ `app/api/messages/status/route.ts` - New endpoint
- ✅ `app/api/chats/route.ts` - Added PUT endpoint
- ✅ `app/api/chats/typing/route.ts` - New endpoint
- ✅ `app/api/upload/route.ts` - New endpoint
- ✅ `context/app-context.tsx` - Implemented placeholders
- ✅ `components/chat/message-bubble-enhanced.tsx` - New component
- ✅ `components/chat/message-input-enhanced.tsx` - New component

## Need Help?

If something doesn't work:
1. Check browser console for errors
2. Check terminal for API errors
3. Verify MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
4. Re-seed database: `npm run seed`
5. Restart dev server: `npm run dev`

Happy coding! 🚀
