import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Mail, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { addOrder, updateProduct, getProductById } from '../services/productService';
import banner from '../assets/banner.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderSaved, setOrderSaved] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    verifyAndSaveOrder();
  }, [sessionId]);

  const verifyAndSaveOrder = async () => {
    try {
      // 1. Verify the Stripe session
      const response = await fetch(`${API_URL}/api/checkout-session/${sessionId}`);
      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      if (session.status !== 'paid') {
        throw new Error('Payment not completed');
      }

      // 2. Parse the order data from metadata
      const metadata = session.metadata || {};
      const cartItems = JSON.parse(metadata.cart_items || '[]');
      const shippingAddress = JSON.parse(metadata.shipping_address || '{}');

      // 3. Check if order already exists (prevent duplicates)
      const orderKey = `order_${sessionId}`;
      if (localStorage.getItem(orderKey)) {
        // Order already saved, just show confirmation
        setOrderDetails({
          email: session.customer_email,
          total: session.amount_total / 100,
          items: cartItems,
          shippingAddress,
          shippingService: metadata.shipping_service
        });
        setOrderSaved(true);
        setLoading(false);
        return;
      }

      // 4. Create order in Firestore
      const orderData = {
        date: new Date().toISOString(),
        stripeSessionId: sessionId,
        paymentStatus: 'paid',
        customer: {
          name: metadata.customer_name,
          email: session.customer_email,
          ...shippingAddress
        },
        items: cartItems,
        shippingService: metadata.shipping_service,
        shippingCost: parseFloat(metadata.shipping_cost) || 0,
        taxAmount: parseFloat(metadata.tax_amount) || 0,
        total: session.amount_total / 100,
        status: 'Processing'
      };

      await addOrder(orderData);

      // 5. Update inventory for each item
      for (const item of cartItems) {
        try {
          const product = await getProductById(item.id);
          if (product && product.stock > 0) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await updateProduct(item.id, { stock: newStock });
          }
        } catch (stockError) {
          console.error(`Failed to update stock for ${item.name}:`, stockError);
        }
      }

      // 6. Mark as saved to prevent duplicates
      localStorage.setItem(orderKey, 'saved');

      // 7. Clear the cart
      localStorage.removeItem('cart');

      setOrderDetails({
        email: session.customer_email,
        total: session.amount_total / 100,
        items: cartItems,
        shippingAddress,
        shippingService: metadata.shipping_service
      });
      setOrderSaved(true);

    } catch (err) {
      console.error('Order verification error:', err);
      setError(err.message || 'Failed to verify order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <img
              src={banner}
              alt="The Rack Hack"
              className="h-24 cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Order Verification Issue</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <p className="text-slate-500 text-sm mb-6">
              If you completed payment, your order was still processed.
              Please contact us if you have any concerns.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Continue Shopping
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <img
            src={banner}
            alt="The Rack Hack"
            className="h-24 cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Order Confirmed!</h1>
            <p className="text-slate-600">Thank you for shopping with The Rack Hack</p>
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div className="space-y-6">
              {/* Confirmation Email Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">Confirmation sent to:</p>
                  <p className="text-blue-700">{orderDetails.email}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-b py-4">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </h2>

                <div className="space-y-2">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.name} (Size: {item.size}) x{item.quantity}
                      </span>
                      <span className="font-medium text-slate-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-green-600">${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Info */}
              {orderDetails.shippingAddress && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Shipping To:</h3>
                  <p className="text-slate-600 text-sm">
                    {orderDetails.shippingAddress.address}<br />
                    {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                  </p>
                  {orderDetails.shippingService && (
                    <p className="text-slate-500 text-sm mt-1">
                      Via: {orderDetails.shippingService}
                    </p>
                  )}
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2">What's Next?</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• We'll prepare your order for shipment</li>
                  <li>• You'll receive tracking info via email</li>
                  <li>• Contact us anytime with questions</li>
                </ul>
              </div>

              {/* Continue Shopping */}
              <button
                onClick={() => navigate('/shop')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition flex items-center justify-center gap-2"
              >
                Continue Shopping
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default OrderSuccessPage;
