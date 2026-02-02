import React, { useState } from 'react';

function StripeCheckout({ cart, checkoutForm, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stripe keys - use environment variables
  // IMPORTANT: Secret key should ONLY be used on server-side, never in frontend code!
  const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
  const STRIPE_SECRET_KEY = process.env.REACT_APP_STRIPE_SECRET_KEY || '';

  // Validate form
  if (!checkoutForm.name || !checkoutForm.email) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg mb-4">
        Please fill in all required fields before payment
      </div>
    );
  }

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // Calculate total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create line items for Stripe
      const lineItems = cart.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: `Size: ${item.size}`,
          },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      }));

      // Create checkout session
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'success_url': window.location.origin + '/?success=true',
          'cancel_url': window.location.origin + '/?canceled=true',
          'mode': 'payment',
          'customer_email': checkoutForm.email,
          ...lineItems.reduce((acc, item, index) => {
            acc[`line_items[${index}][price_data][currency]`] = item.price_data.currency;
            acc[`line_items[${index}][price_data][product_data][name]`] = item.price_data.product_data.name;
            acc[`line_items[${index}][price_data][product_data][description]`] = item.price_data.product_data.description;
            acc[`line_items[${index}][price_data][unit_amount]`] = item.price_data.unit_amount;
            acc[`line_items[${index}][quantity]`] = item.quantity;
            return acc;
          }, {}),
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error.message);
      }

      // Redirect to Stripe Checkout using the URL
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (err) {
      console.error('Stripe error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleStripeCheckout}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold transition disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          'Redirecting to Stripe...'
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
            </svg>
            Pay with Stripe
          </>
        )}
      </button>
    </div>
  );
}

export default StripeCheckout;