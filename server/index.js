import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { nanoid } from 'nanoid';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(' MongoDB error:', err));

// Mongoose Schema
const ClickSchema = new mongoose.Schema({
  timestamp: String,
  source: String,
  geo: String,
});

const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortCode: String,
  expireAt: Date,
  clicks: [ClickSchema],
});

const URL = mongoose.model('URL', UrlSchema);

// POST /shorten
app.post('/shorten', async (req, res) => {
  const { url, customCode, validity } = req.body;
  const expireAt = new Date(Date.now() + (parseInt(validity) || 30) * 60000);

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  if (customCode && !/^[a-zA-Z0-9]+$/.test(customCode)) {
    return res.status(400).json({ message: 'Custom code must be alphanumeric' });
  }

  const shortCode = customCode || nanoid(6);
  const existing = await URL.findOne({ shortCode });

  if (existing) {
    return res.status(400).json({ message: customCode ? 'Custom code taken' : 'Generated code exists, try again' });
  }

  const newUrl = new URL({ originalUrl: url, shortCode, expireAt, clicks: [] });
  await newUrl.save();
  res.status(201).json(newUrl);
});

// GET /all
app.get('/all', async (req, res) => {
  try {
    const data = await URL.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch data' });
  }
});

// GET /:shortCode
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  const entry = await URL.findOne({ shortCode });

  if (!entry || new Date(entry.expireAt) < new Date()) {
    return res.status(404).send('Link not found or expired');
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  const source = useragent.parse(req.headers['user-agent']).toString();

  entry.clicks.push({
    timestamp: new Date().toLocaleString(),
    source,
    geo: geo?.city || 'Unknown'
  });

  await entry.save();
  res.redirect(entry.originalUrl);
});

// Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
