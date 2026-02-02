// api/create-checkout-session.js
const Stripe = require('stripe');
// Note: If using server.js, require dotenv at the top
// require('dotenv').config(); 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS Headers (Keep these for Vercel/Serverless)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // NOTE: We no longer need taxAmount from the frontend
      const { cart, email, name, shippingCost, shippingService } = req.body;

      // 1. Format Cart Items with Tax Behavior
      const line_items = cart.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            description: `Size: ${item.size}`,
            // "txcd_30011000" is the specific code for Clothing & Footwear
            tax_code: 'txcd_30011000' 
          },
          unit_amount: Math.round(item.price * 100),
          // "exclusive" means: Price is $10. Tax is added ON TOP (Total $10.60)
          tax_behavior: 'exclusive', 
        },
        quantity: item.quantity,
      }));

      // 2. Add Shipping as a special Line Item
      if (shippingCost > 0) {
        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: { 
              name: `Shipping: ${shippingService || 'Standard'}`,
              // "txcd_92010001" is the code for Shipping
              tax_code: 'txcd_92010001' 
            },
            unit_amount: Math.round(shippingCost * 100),
            tax_behavior: 'exclusive',
          },
          quantity: 1,
        });
      }

      // 3. Create Session with Automatic Tax Enabled
      const domain = process.env.CLIENT_URL || 'http://localhost:3000';
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: line_items,
        mode: 'payment',
        success_url: `${domain}/?success=true`,
        cancel_url: `${domain}/?canceled=true`,
        customer_email: email,
        // ENABLE AUTOMATIC TAX HERE
        automatic_tax: { enabled: true },
        // This ensures we capture the shipping address to calculate the correct tax rate
        shipping_address_collection: {
          allowed_countries: ['US'],
        },
        metadata: { customer_name: name }
      });

      res.status(200).json(session);
    } catch (error) {
      console.error('Stripe Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}