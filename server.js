const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory monitoring registry
let targets = [
  { id: '1', url: 'https://github.com', status: 'Checking', latency: null, lastChecked: null },
  { id: '2', url: 'https://google.com', status: 'Checking', latency: null, lastChecked: null },
  { id: '3', url: 'https://invalid-url-test-example.com', status: 'Checking', latency: null, lastChecked: null }
];

// Asynchronous Ping utility
async function pingSite(target) {
  const start = Date.now();
  try {
    const response = await axios.get(target.url, { timeout: 5000 });
    target.status = response.status >= 200 && response.status < 400 ? 'UP' : 'DOWN';
    target.latency = Date.now() - start;
  } catch (error) {
    target.status = 'DOWN';
    target.latency = null;
  }
  target.lastChecked = new Date().toISOString();
}

// Background scheduler
async function startMonitoring() {
  const run = async () => {
    await Promise.all(targets.map(pingSite));
  };
  await run(); 
  setInterval(run, 15000);
}

// API Endpoints
app.get('/api/targets', (req, res) => {
  res.json(targets);
});

app.post('/api/targets', async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const newTarget = {
    id: Date.now().toString(),
    url: url,
    status: 'Checking',
    latency: null,
    lastChecked: null
  };

  targets.push(newTarget);
  await pingSite(newTarget); // Instant feedback loop
  res.status(201).json(newTarget);
});

app.delete('/api/targets/:id', (req, res) => {
  targets = targets.filter(t => t.id !== req.params.id);
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`⚡ PulseNeon is running live at http://localhost:${PORT}`);
  startMonitoring();
});
