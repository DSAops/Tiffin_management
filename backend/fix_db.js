require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL;

async function fixDatabase() {
  try {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Drop the phone_1 index if it exists
    try {
      await collection.dropIndex('phone_1');
      console.log('Successfully dropped phone_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('phone_1 index not found (already dropped or never existed)');
      } else {
        console.error('Error dropping phone_1 index:', err.message);
      }
    }
    
    // Show remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log('Remaining indexes:', remainingIndexes.map(idx => idx.name));
    
  } catch (err) {
    console.error('Database fix error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixDatabase();
