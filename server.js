// server.js
const express = require('express');
const cors = require('cors');
// We don't need 'node-fetch' line because Node v22 has it built-in!
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors()); 

const PORT = 3001;

// --- SHIPENGINE ROUTE ---
app.post('/api/get-rates', async (req, res) => {
  try {
    const API_KEY = process.env.REACT_APP_SHIPENGINE_API_KEY || process.env.SHIPENGINE_API_KEY;
    
    // Using Node's built-in fetch
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
      console.error('ShipEngine Error:', data);
      throw new Error(data.message || 'Failed to fetch rates');
    }
    
    res.json(data);
  } catch (error) {
    console.error('Backend Error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// --- STRIPE ROUTE ---
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    
    if (!SECRET_KEY) {
      throw new Error('Stripe Secret Key is missing in .env file');
    }

    const stripe = Stripe(SECRET_KEY);
    const { cart, email, name, shippingCost, shippingService, taxAmount } = req.body;

    // 1. Format Cart Items
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          description: `Size: ${item.size}`
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // 2. Add Shipping
    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: `Shipping: ${shippingService || 'Standard'}` },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // 3. Add Tax
    if (taxAmount > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Sales Tax (6%)' },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      customer_email: email,
      metadata: { customer_name: name }
    });
    
    res.json(session);
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});