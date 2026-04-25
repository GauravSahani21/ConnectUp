// scripts/wipe-db.js
// Drops all ConnectUp collections from MongoDB Atlas for a fresh start
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

const COLLECTIONS = ['users', 'chats', 'messages', 'friendrequests', 'statuses']

async function wipeDatabase() {
  console.log('🔌 Connecting to MongoDB Atlas...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected\n')

  const db = mongoose.connection.db
  const existing = await db.listCollections().toArray()
  const existingNames = existing.map(c => c.name)

  console.log(`📦 Found collections: ${existingNames.join(', ') || 'none'}`)
  console.log('🗑️  Wiping all collections...\n')

  for (const name of existingNames) {
    await db.collection(name).deleteMany({})
    console.log(`  ✓ Cleared: ${name}`)
  }

  console.log('\n✅ Database wiped clean — ready for fresh deployment!')
  await mongoose.disconnect()
  process.exit(0)
}

wipeDatabase().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
