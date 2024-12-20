const mongoose = require('mongoose');
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a schema and model for translation requests
const translationSchema = new mongoose.Schema({
  language: String,
  prompt: String,
  response: String,
  date: { type: Date, default: Date.now }
});

const Translation = mongoose.model('Translation', translationSchema);

module.exports = Translation;