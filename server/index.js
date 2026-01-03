require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { analyzeContent } = require('./services/analyzer');

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Rate Limiting (15 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for easier deployment troubleshooting
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// File Upload Setup (Memory storage for immediate processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    const text = req.body.text;
    const file = req.file;
    let history = [];

    // Parse history if provided (FormData sends it as string)
    if (req.body.history) {
      try {
        history = JSON.parse(req.body.history);
      } catch (e) {
        console.error('Failed to parse history:', e);
        history = [];
      }
    }

    if (!text && !file && history.length === 0) {
      return res.status(400).json({ error: 'Please provide text, a file, or conversation history.' });
    }

    const result = await analyzeContent(text, file, history);
    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Unable to complete analysis. Please try again.',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`RealityCheck AI Server running on port ${port}`);
});
