// server.js
import express from 'express';
import fetch from 'node-fetch'; // or global fetch in Node 18+
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/check', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const resp = await fetch(url, {
      // Don't follow too many redirects; many platforms redirect missing users differently
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (HandleChecker)'
      }
    });

    const status = resp.status;

    // Heuristics
    const taken = status >= 200 && status < 400;
    const available = status === 404;

    res.json({ url, status, taken, available });
  } catch (err) {
    res.status(500).json({ url, error: true, message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Handle checker API on :${port}`));
