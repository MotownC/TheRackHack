// server.js
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { GoogleGenAI } = require('@google/genai');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = 3001;

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Cloudinary (for server-side upload of AI-generated images)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CORS configuration - restrict to your domains in production
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.1.50:3000',
  'https://therackhack.com',
  'https://www.therackhack.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

// Stripe webhook needs raw body - must be BEFORE express.json()
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    console.log('Payment successful for session:', session.id);
    console.log('Customer email:', session.customer_email);
    console.log('Amount total:', session.amount_total / 100);

    // TODO: Here you would:
    // 1. Create order in Firestore (requires firebase-admin SDK)
    // 2. Update inventory
    // 3. Send confirmation email (requires email service)

    // For now, log the session metadata
    console.log('Order metadata:', session.metadata);
  }

  res.json({ received: true });
});

// Parse JSON for all other routes (increased limit for base64 image uploads)
app.use(express.json({ limit: '20mb' }));

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

// --- STRIPE ROUTES ---

// Verify a checkout session (for success page)
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['line_items']
    });

    res.json({
      status: session.payment_status,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Session retrieval error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe Secret Key is missing in .env file');
    }

    const { cart, email, name, shippingCost, shippingService, taxAmount, shippingAddress } = req.body;

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
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      customer_email: email,
      metadata: {
        customer_name: name,
        shipping_address: JSON.stringify(shippingAddress || {}),
        shipping_service: shippingService || '',
        shipping_cost: String(shippingCost || 0),
        tax_amount: String(taxAmount || 0),
        // Stripe metadata values limited to 500 chars - store only IDs and quantities
        cart_items: JSON.stringify(cart.map(item => ({
          id: item.id,
          name: item.name.substring(0, 30),
          size: item.size,
          price: item.price,
          quantity: item.quantity
        }))).substring(0, 500)
      }
    });
    
    res.json(session);
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- GLAMOUR PHOTO AI GENERATION ---
app.post('/api/generate-glamour', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in .env file');
    }

    const { imageBase64, mimeType, mode, modelType, lighting, customPrompt } = req.body;

    if (!imageBase64 || !mimeType) {
      throw new Error('imageBase64 and mimeType are required');
    }

    // Build prompt (ported from glamour-app/src/App.tsx)
    let promptText = '';

    if (mode === 'model') {
      promptText = `Professional fashion photography of a ${modelType || 'female'} model wearing the clothing item shown in the reference image. The clothing item must be preserved exactly. `;
    } else {
      promptText = `Professional product photography of the clothing item shown in the reference image. Standalone glamour shot, creative composition. The clothing item must be preserved exactly. `;
    }

    promptText += `Lighting style: ${lighting || 'studio'}. High fashion, 4k resolution, photorealistic, highly detailed texture. `;

    if (customPrompt) {
      promptText += `Additional details: ${customPrompt}`;
    }

    // Call Gemini API (ported from glamour-app/src/services/gemini.ts)
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: promptText },
          { inlineData: { data: imageBase64, mimeType: mimeType } },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '3:4',
          imageSize: '2K',
        },
      },
    });

    // Extract generated image from response
    let generatedBase64 = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedBase64) {
      throw new Error('No image was generated by Gemini');
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${generatedBase64}`,
      { folder: 'rack-hack-products' }
    );

    res.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Glamour generation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;