import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, CreditCard, Package, Truck, AlertCircle, Loader, Lock, Plus, Minus, Trash2 } from 'lucide-react';

// API URL from environment variable (defaults to localhost for development)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const SAVED_ADDRESS_KEY = 'saved_address';

function CompleteCheckout({ cart = [], onUpdateCart, customerInfo, onOrderComplete }) {
  const [step, setStep] = useState(1);
  const [checkoutForm, setCheckoutForm] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADDRESS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' };
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(() => !!localStorage.getItem(SAVED_ADDRESS_KEY));
  
  // Shipping state
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  
  // Payment state
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Address validation state
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [addressSuggestion, setAddressSuggestion] = useState(null);

  // Inline validation
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Full name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        return value.replace(/\D/g, '').length >= 10 ? '' : 'Enter a valid phone number';
      case 'address':
        return value.trim() ? '' : 'Street address is required';
      case 'city':
        return value.trim() ? '' : 'City is required';
      case 'state':
        if (!value.trim()) return 'State is required';
        return /^[A-Z]{2}$/.test(value) ? '' : 'Enter a 2-letter state code (e.g. MI)';
      case 'zipCode':
        if (!value.trim()) return 'ZIP code is required';
        return /^\d{5}$/.test(value) ? '' : 'Enter a valid 5-digit ZIP code';
      default:
        return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

 // Configuration
  const ORIGIN_ZIP = '48347'; // Clarkston, MI

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = selectedShipping?.rate || 0;
  // Only charge MI 6% sales tax for Michigan shipping addresses
  const isMichigan = checkoutForm.state.toUpperCase() === 'MI';
  const tax = isMichigan ? (subtotal + shippingCost) * 0.06 : 0;
  const total = subtotal + shippingCost + tax;

  // Calculate package weight (1 lb per item, adjust as needed)
  const calculateWeight = () => {
    if (!cart || cart.length === 0) return 1;
    const totalWeight = cart.reduce((sum, item) => sum + (item.quantity * 1), 0);
    return Math.max(1, totalWeight);
  };

  // Fetch shipping rates when address is complete
  useEffect(() => {
    if (checkoutForm.zipCode && checkoutForm.zipCode.length === 5 &&
        checkoutForm.city && checkoutForm.state && checkoutForm.address) {
      fetchShippingRates();
    }
  }, [checkoutForm.zipCode, checkoutForm.city, checkoutForm.state, checkoutForm.address]);

  const fetchShippingRates = async () => {
    setLoadingShipping(true);
    setShippingError('');
    setShippingRates([]);

    const fallbackRates = [
      { service: 'USPS First Class', rate: 5.99, deliveryTime: '3-5 business days', id: 'first-class' },
      { service: 'USPS Priority Mail', rate: 9.99, deliveryTime: '2-3 business days', id: 'priority' },
      { service: 'USPS Priority Express', rate: 26.99, deliveryTime: '1-2 business days', id: 'express' }
    ];

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

      // URL points to backend server (from environment variable)
      const response = await fetch(`${API_URL}/api/get-rates`, {
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
        // Live rates returned but none matched our filter — use fallback silently
        setShippingRates(fallbackRates);
        setSelectedShipping(fallbackRates[0]);
        return;
      }

      setShippingRates(uniqueRates);
      setSelectedShipping(uniqueRates[0]);

    } catch (err) {
      console.error('ShipEngine error:', err);
      setShippingError('Showing estimated rates — actual cost confirmed at shipment.');
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
      // Send cart data to backend server for Stripe session creation
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
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
          taxAmount: tax,
          shippingAddress: {
            address: checkoutForm.address,
            city: checkoutForm.city,
            state: checkoutForm.state,
            zipCode: checkoutForm.zipCode,
            phone: checkoutForm.phone
          }
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
      setPaymentError('Something went wrong. Please try again or contact us for help.');
      setLoadingPayment(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm({ ...checkoutForm, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const updateCartItem = (itemId, delta) => {
    const updated = cart
      .map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0);
    onUpdateCart(updated);
    if (step > 1) {
      setStep(1);
      setShippingRates([]);
      setSelectedShipping(null);
      setShippingError('');
    }
  };

  const removeCartItem = (itemId) => {
    const updated = cart.filter(i => i.id !== itemId);
    onUpdateCart(updated);
    if (step > 1) {
      setStep(1);
      setShippingRates([]);
      setSelectedShipping(null);
      setShippingError('');
    }
  };

  const toTitleCase = (str) =>
    str?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '';

  const validateAddress = async () => {
    setValidatingAddress(true);
    try {
      const response = await fetch(`${API_URL}/api/validate-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            address: checkoutForm.address,
            city: checkoutForm.city,
            state: checkoutForm.state,
            zipCode: checkoutForm.zipCode
          }
        })
      });

      const result = await response.json();

      if (result.status === 'error') {
        const msg = result.messages?.[0]?.message || 'Address not found. Please check and try again.';
        setFieldErrors(prev => ({ ...prev, address: msg }));
        return false;
      }

      const matched = result.matched_address;
      if (matched) {
        const suggestion = {
          address: toTitleCase(matched.address_line1),
          city: toTitleCase(matched.city_locality),
          state: matched.state_province?.toUpperCase(),
          zipCode: matched.postal_code?.substring(0, 5)
        };
        const isDifferent =
          suggestion.address.toLowerCase() !== checkoutForm.address.toLowerCase() ||
          suggestion.city.toLowerCase() !== checkoutForm.city.toLowerCase() ||
          suggestion.zipCode !== checkoutForm.zipCode;

        if (isDifferent) {
          setAddressSuggestion(suggestion);
          return false;
        }
      }

      return true;
    } catch {
      return true; // API failure — don't block checkout
    } finally {
      setValidatingAddress(false);
    }
  };

  const proceedToShipping = (form) => {
    if (saveAddress) {
      try { localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(form)); } catch {}
    }
    setStep(2);
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
                <div className={`flex items-center gap-2 ${step >= num ? 'text-rose-700' : 'text-slate-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-500'
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
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Contact & Shipping Information
                </h2>

                {showSavedBanner && step === 1 && (
                  <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-4 py-2 mb-4 text-sm">
                    <span className="text-rose-900">Using your saved address</span>
                    <button
                      type="button"
                      onClick={() => {
                        try { localStorage.removeItem(SAVED_ADDRESS_KEY); } catch {}
                        setShowSavedBanner(false);
                        setSaveAddress(false);
                        setCheckoutForm({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
                      }}
                      className="text-rose-700 hover:text-rose-800 font-medium"
                    >
                      Use a different address
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={checkoutForm.name}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        disabled={step > 1}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                        placeholder="John Doe"
                      />
                      {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={checkoutForm.email}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        disabled={step > 1}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                        placeholder="john@example.com"
                      />
                      {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={checkoutForm.phone}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      disabled={step > 1}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 ${fieldErrors.phone ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                      placeholder="(555) 123-4567"
                    />
                    {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
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
                          onBlur={handleBlur}
                          disabled={step > 1}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 ${fieldErrors.address ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                          placeholder="123 Main St"
                        />
                        {fieldErrors.address && <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>}
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                          <input
                            type="text"
                            name="city"
                            value={checkoutForm.city}
                            onChange={handleFormChange}
                            onBlur={handleBlur}
                            disabled={step > 1}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 ${fieldErrors.city ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                            placeholder="New York"
                          />
                          {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">State * <span className="font-normal text-slate-400 text-xs">(e.g. MI)</span></label>
                          <input
                            type="text"
                            name="state"
                            maxLength={2}
                            value={checkoutForm.state}
                            onChange={(e) => handleFormChange({ target: { name: 'state', value: e.target.value.toUpperCase() }})}
                            onBlur={handleBlur}
                            disabled={step > 1}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 uppercase ${fieldErrors.state ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                            placeholder="NY"
                          />
                          {fieldErrors.state && <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                          <input
                            type="text"
                            name="zipCode"
                            maxLength={5}
                            value={checkoutForm.zipCode}
                            onChange={handleFormChange}
                            onBlur={handleBlur}
                            disabled={step > 1}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-600 disabled:bg-slate-50 ${fieldErrors.zipCode ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
                            placeholder="10001"
                          />
                          {fieldErrors.zipCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.zipCode}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {step === 1 && (
                    <>
                      {!showSavedBanner && (
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={e => setSaveAddress(e.target.checked)}
                            className="rounded border-slate-300 accent-rose-700"
                          />
                          Save this address for next time
                        </label>
                      )}

                      {addressSuggestion ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-rose-900 mb-1">Did you mean this address?</p>
                          <p className="text-sm text-rose-800">
                            {addressSuggestion.address}<br />
                            {addressSuggestion.city}, {addressSuggestion.state} {addressSuggestion.zipCode}
                          </p>
                          <div className="flex gap-3 mt-3">
                            <button
                              onClick={() => {
                                const updated = { ...checkoutForm, ...addressSuggestion };
                                setCheckoutForm(updated);
                                setAddressSuggestion(null);
                                proceedToShipping(updated);
                              }}
                              className="flex-1 bg-rose-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-rose-800"
                            >
                              Use this address
                            </button>
                            <button
                              onClick={() => {
                                setAddressSuggestion(null);
                                proceedToShipping(checkoutForm);
                              }}
                              className="flex-1 border border-rose-300 text-rose-700 py-2 rounded-lg text-sm font-semibold hover:bg-rose-50"
                            >
                              Keep mine
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            const fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
                            const errors = {};
                            fields.forEach(f => {
                              const err = validateField(f, checkoutForm[f]);
                              if (err) errors[f] = err;
                            });
                            setFieldErrors(errors);
                            if (Object.keys(errors).length > 0) return;
                            const ok = await validateAddress();
                            if (ok) proceedToShipping(checkoutForm);
                          }}
                          disabled={validatingAddress}
                          className="w-full bg-rose-700 text-white py-3 rounded-lg hover:bg-rose-800 font-semibold transition disabled:bg-rose-400 disabled:cursor-not-allowed"
                        >
                          {validatingAddress ? 'Checking address...' : 'Continue to Shipping'}
                        </button>
                      )}
                    </>
                  )}

                  {step > 1 && (
                    <button onClick={() => setStep(1)} className="text-rose-700 hover:text-rose-800 font-medium text-sm">
                      ← Edit Information
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step >= 2 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                    <div className="text-sm text-amber-800 flex-1">
                      <p className="font-medium">Using estimated rates</p>
                      <p className="text-amber-700">{shippingError}</p>
                    </div>
                    <button
                      onClick={fetchShippingRates}
                      className="text-xs font-medium text-amber-700 hover:text-amber-900 underline flex-shrink-0 mt-0.5"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!loadingShipping && shippingRates.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-rose-900">
                        Shipping from Clarkston, MI ({calculateWeight()} lb package)
                      </p>
                    </div>
                    
                    {shippingRates.map((rate) => (
                      <button
                        key={rate.id}
                        onClick={() => setSelectedShipping(rate)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedShipping?.id === rate.id
                            ? 'border-rose-700 bg-rose-50'
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
                          <div className="mt-2 text-sm text-rose-700 font-medium">✓ Selected</div>
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
                      ← Edit Information
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedToPayment()}
                      className="flex-1 bg-rose-700 text-white py-3 rounded-lg hover:bg-rose-800 font-semibold transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {step > 2 && (
                  <button onClick={() => setStep(2)} className="text-rose-700 hover:text-rose-800 font-medium text-sm">
                    ← Change Shipping
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step >= 3 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </h2>
                
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{paymentError}</p>
                  </div>
                )}
                
                <button
                  onClick={handleStripeCheckout}
                  disabled={loadingPayment}
                  className="w-full bg-rose-700 text-white py-3 rounded-lg hover:bg-rose-800 font-semibold transition disabled:bg-rose-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                <button onClick={() => setStep(2)} className="text-rose-700 hover:text-rose-800 font-medium text-sm mt-4">
                  ← Change Shipping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-contain bg-slate-100 rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-slate-800 leading-snug">{item.name}</p>
                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">Size: {item.size}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartItem(item.id, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-medium text-slate-700">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.id, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-semibold text-slate-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
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
                  <span>{selectedShipping ? `$${shippingCost.toFixed(2)}` : 'Select a method'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isMichigan ? 'Sales Tax (MI 6%)' : 'Sales Tax'}</span>
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