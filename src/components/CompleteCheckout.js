import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, CreditCard, Package, Truck, AlertCircle, Loader, Lock } from 'lucide-react';

function CompleteCheckout({ cart = [], onUpdateCart }) {
  const [step, setStep] = useState(1);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  // Shipping state
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  
  // Payment state
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

 // Configuration
  const ORIGIN_ZIP = '48347'; // Clarkston, MI

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = selectedShipping?.rate || 0;
  const tax = (subtotal + shippingCost) * 0.06;
  const total = subtotal + shippingCost + tax;

  // Calculate package weight (1 lb per item, adjust as needed)
  const calculateWeight = () => {
    if (!cart || cart.length === 0) return 1;
    const totalWeight = cart.reduce((sum, item) => sum + (item.quantity * 1), 0);
    return Math.max(1, totalWeight);
  };

  // Fetch shipping rates when ZIP is entered
  useEffect(() => {
    if (checkoutForm.zipCode && checkoutForm.zipCode.length === 5) {
      fetchShippingRates();
    }
  }, [checkoutForm.zipCode]);

  const fetchShippingRates = async () => {
    setLoadingShipping(true);
    setShippingError('');
    setShippingRates([]);

    try {
      const weight = calculateWeight();
      
      // ShipEngine API request body
      const requestBody = {
        rate_options: {
          // IMPORTANT: Check your ShipEngine dashboard for your "carrier_id" (starts with se-)
          // If you leave this empty [], it often fails in testing. 
          carrier_ids: ['se-4358864'], 
        },
        shipment: {
          validate_address: 'no_validation',
          ship_to: {
            name: checkoutForm.name || 'Customer',
            phone: checkoutForm.phone || '555-555-5555',
            address_line1: checkoutForm.address,
            city_locality: checkoutForm.city,
            state_province: checkoutForm.state,
            postal_code: checkoutForm.zipCode,
            country_code: 'US'
          },
          ship_from: {
            name: 'The Rack Hack',
            phone: '248-555-0100',
            company_name: 'The Rack Hack',
            address_line1: '6325 Sashabaw Rd',
            city_locality: 'Clarkston',
            state_province: 'MI',
            postal_code: ORIGIN_ZIP,
            country_code: 'US'
          },
          packages: [
            {
              weight: {
                value: weight,
                unit: 'pound'
              },
              dimensions: {
                length: 12,
                width: 10,
                height: 6,
                unit: 'inch'
              }
            }
          ]
        }
      };

      // CHANGE 1: URL points to YOUR backend (port 3001)
      const response = await fetch('http://localhost:3001/api/get-rates', {
        method: 'POST',
        headers: {
          // CHANGE 2: No API Key here! just content type
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get shipping rates');
      }

      if (!data.rate_response || !data.rate_response.rates || data.rate_response.rates.length === 0) {
        throw new Error('No shipping rates available');
      }
      console.log("Raw Rates from ShipEngine:", data.rate_response.rates);

      // 1. Define the EXACT names found in your error log
      const allowedServices = [
        "USPS Priority Mail",
        "USPS Priority Mail Express",
        "USPS Ground Advantage" // This is the new name for "First Class" (Recommended)
      ];

      // 2. Filter, Format, and Sort
      let formattedRates = data.rate_response.rates
        .filter(rate => {
          // Check if the service type matches our allowed list
          return allowedServices.includes(rate.service_type);
        })
        .map(rate => {
          // Create a better label based on the service name
          let timeLabel = rate.delivery_days ? `${rate.delivery_days} business days` : 'Varies';
          
          if (rate.service_type.includes('Express')) {
             timeLabel += ' (Guaranteed)';
          } else if (rate.service_type.includes('Ground')) {
             timeLabel += ' (Estimated)';
          }

          return {
            id: rate.rate_id,
            service: rate.service_type,
            rate: parseFloat(rate.shipping_amount.amount),
            deliveryTime: timeLabel, // Use our new fancy label
            carrier: rate.carrier_friendly_name
          };
        })
        .sort((a, b) => a.rate - b.rate); // Sort cheapest to most expensive

      // 3. DEDUPLICATE (Fixes the "7 options" problem)
      // Since we sorted by price above, this keeps the CHEAPEST option for each name
      // and throws away the more expensive duplicates (like Flat Rate boxes that don't fit).
      const uniqueRates = [];
      const seenServices = new Set();

      for (const rate of formattedRates) {
        if (!seenServices.has(rate.service)) {
          seenServices.add(rate.service);
          uniqueRates.push(rate);
        }
      }

      if (uniqueRates.length === 0) {
        const availableCodes = data.rate_response.rates.map(r => r.service_type);
        throw new Error(`Rates found, but rejected. Available: ${availableCodes.join(', ')}`);
      }

      setShippingRates(uniqueRates);
      setSelectedShipping(uniqueRates[0]); // Auto-select cheapest

    } catch (err) {
      console.error('ShipEngine error:', err);
      setShippingError(err.message || 'Failed to fetch shipping rates');
      
      // Fallback rates
      const fallbackRates = [
        { service: 'USPS First Class', rate: 5.99, deliveryTime: '3-5 business days', id: 'first-class' },
        { service: 'USPS Priority Mail', rate: 9.99, deliveryTime: '2-3 business days', id: 'priority' },
        { service: 'USPS Priority Express', rate: 26.99, deliveryTime: '1-2 business days', id: 'express' }
      ];
      setShippingRates(fallbackRates);
      setSelectedShipping(fallbackRates[0]);
    } finally {
      setLoadingShipping(false);
    }
  };

 const handleStripeCheckout = async () => {
    setLoadingPayment(true);
    setPaymentError('');

    try {
      // We now send the raw cart data to YOUR backend
      // The backend will handle the math and the Secret Key
      const response = await fetch('http://localhost:3001/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cart,
          email: checkoutForm.email,
          name: checkoutForm.name,
          shippingCost: shippingCost,
          shippingService: selectedShipping?.service,
          taxAmount: tax
        }),
      });

      const session = await response.json();

      if (session.error) throw new Error(session.error.message);
      
      if (session.url) {
        // Redirect to Stripe
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment failed');
      setLoadingPayment(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm({ ...checkoutForm, [name]: value });
  };

  const canProceedToShipping = () => {
    return checkoutForm.name && checkoutForm.email && checkoutForm.phone &&
           checkoutForm.address && checkoutForm.city && checkoutForm.state &&
           checkoutForm.zipCode.length === 5;
  };

  const canProceedToPayment = () => {
    return canProceedToShipping() && selectedShipping;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Checkout</h1>
          <p className="text-slate-600">Complete your purchase</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Information', icon: MapPin },
              { num: 2, label: 'Shipping', icon: Package },
              { num: 3, label: 'Payment', icon: CreditCard }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${step >= num ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step > num ? '✓' : num}
                  </div>
                  <span className="font-medium hidden sm:inline">{label}</span>
                </div>
                {num < 3 && <div className="hidden sm:block w-12 h-0.5 bg-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Contact Info */}
            {step >= 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Contact & Shipping Information
                </h2>
                
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={checkoutForm.name}
                        onChange={handleFormChange}
                        disabled={step > 1}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={checkoutForm.email}
                        onChange={handleFormChange}
                        disabled={step > 1}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={checkoutForm.phone}
                      onChange={handleFormChange}
                      disabled={step > 1}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Shipping Address</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={checkoutForm.address}
                          onChange={handleFormChange}
                          disabled={step > 1}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                          placeholder="123 Main St"
                        />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                          <input
                            type="text"
                            name="city"
                            value={checkoutForm.city}
                            onChange={handleFormChange}
                            disabled={step > 1}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                          <input
                            type="text"
                            name="state"
                            maxLength={2}
                            value={checkoutForm.state}
                            onChange={(e) => handleFormChange({ target: { name: 'state', value: e.target.value.toUpperCase() }})}
                            disabled={step > 1}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 uppercase"
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                          <input
                            type="text"
                            name="zipCode"
                            maxLength={5}
                            value={checkoutForm.zipCode}
                            onChange={handleFormChange}
                            disabled={step > 1}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            placeholder="10001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {step === 1 && (
                    <button
                      onClick={() => setStep(2)}
                      disabled={!canProceedToShipping()}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Continue to Shipping
                    </button>
                  )}

                  {step > 1 && (
                    <button onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      ← Edit Information
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step >= 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Method
                </h2>
                
                {loadingShipping && (
                  <div className="flex items-center justify-center py-8 text-slate-600">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Calculating real-time rates...
                  </div>
                )}

                {shippingError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Using estimated rates</p>
                      <p className="text-amber-700">{shippingError}</p>
                    </div>
                  </div>
                )}

                {!loadingShipping && shippingRates.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        📦 Shipping from Clarkston, MI ({calculateWeight()} lb package)
                      </p>
                    </div>
                    
                    {shippingRates.map((rate) => (
                      <button
                        key={rate.id}
                        onClick={() => setSelectedShipping(rate)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedShipping?.id === rate.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{rate.service}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              Delivery: {rate.deliveryTime}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-slate-800">
                            ${rate.rate.toFixed(2)}
                          </div>
                        </div>
                        {selectedShipping?.id === rate.id && (
                          <div className="mt-2 text-sm text-blue-600 font-medium">✓ Selected</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50 font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedToPayment()}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {step > 2 && (
                  <button onClick={() => setStep(2)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    ← Change Shipping
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step >= 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </h2>
                
                {paymentError && (
                  <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">
                    {paymentError}
                  </div>
                )}
                
                <button
                  onClick={handleStripeCheckout}
                  disabled={loadingPayment}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold transition disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingPayment ? 'Redirecting to Stripe...' : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                      </svg>
                      Complete Payment
                    </>
                  )}
                </button>

                <button onClick={() => setStep(2)} className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-4">
                  ← Back to Shipping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-slate-600 text-xs">Size: {item.size}</p>
                      <p className="text-slate-600 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{selectedShipping ? `$${shippingCost.toFixed(2)}` : 'TBD'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (6%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-slate-800">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Secure checkout powered by Stripe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompleteCheckout;