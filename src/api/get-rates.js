// api/get-rates.js
const fetch = require('node-fetch'); // Built-in on Node 18+, but safe to keep if installed

export default async function handler(req, res) {
  // 1. Enable CORS (So your frontend can talk to this)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your actual domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle the "preflight" check (browser asking if it's okay to connect)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Your ShipEngine Logic
  if (req.method === 'POST') {
    try {
      const API_KEY = process.env.SHIPENGINE_API_KEY;
      
      const response = await fetch('https://api.shipengine.com/v1/rates', {
        method: 'POST',
        headers: {
          'API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch rates');
      }
      
      res.status(200).json(data);
    } catch (error) {
      console.error('ShipEngine Error:', error);
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}