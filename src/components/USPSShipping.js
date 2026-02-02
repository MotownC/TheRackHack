import React, { useState, useEffect } from 'react';
import { Truck, AlertCircle, Loader } from 'lucide-react';

function USPSShipping({ cart = [], shippingAddress = {}, onShippingSelect }) {
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // USPS API credentials - Get these from USPS Web Tools
  const USPS_USER_ID = 'YOUR_USPS_USER_ID'; // Replace with your USPS User ID

  // Calculate package weight from cart items (estimate 1 lb per item)
  const calculateWeight = () => {
    if (!cart || cart.length === 0) return 1;
    const totalWeight = cart.reduce((sum, item) => sum + (item.quantity * 1), 0);
    return Math.max(1, totalWeight); // Minimum 1 lb
  };

  // Fetch shipping rates when address is provided
  useEffect(() => {
    if (shippingAddress?.zipCode && shippingAddress.zipCode.length === 5) {
      fetchShippingRates();
    }
  }, [shippingAddress?.zipCode]);

  const fetchShippingRates = async () => {
    setLoading(true);
    setError('');
    setShippingRates([]);

    try {
      const weight = calculateWeight();
      const originZip = '48348'; // Your warehouse ZIP (Clarkston, MI)
      const destZip = shippingAddress.zipCode;

      // Build USPS XML API request
      const xmlRequest = `
        <RateV4Request USERID="${USPS_USER_ID}">
          <Revision>2</Revision>
          <Package ID="1ST">
            <Service>PRIORITY</Service>
            <ZipOrigination>${originZip}</ZipOrigination>
            <ZipDestination>${destZip}</ZipDestination>
            <Pounds>${Math.floor(weight)}</Pounds>
            <Ounces>${Math.round((weight % 1) * 16)}</Ounces>
            <Container>VARIABLE</Container>
            <Size>REGULAR</Size>
            <Machinable>TRUE</Machinable>
          </Package>
          <Package ID="2ND">
            <Service>FIRST CLASS</Service>
            <FirstClassMailType>PARCEL</FirstClassMailType>
            <ZipOrigination>${originZip}</ZipOrigination>
            <ZipDestination>${destZip}</ZipDestination>
            <Pounds>${Math.floor(weight)}</Pounds>
            <Ounces>${Math.round((weight % 1) * 16)}</Ounces>
            <Container>VARIABLE</Container>
            <Size>REGULAR</Size>
            <Machinable>TRUE</Machinable>
          </Package>
          <Package ID="3RD">
            <Service>PRIORITY EXPRESS</Service>
            <ZipOrigination>${originZip}</ZipOrigination>
            <ZipDestination>${destZip}</ZipDestination>
            <Pounds>${Math.floor(weight)}</Pounds>
            <Ounces>${Math.round((weight % 1) * 16)}</Ounces>
            <Container>VARIABLE</Container>
            <Size>REGULAR</Size>
            <Machinable>TRUE</Machinable>
          </Package>
        </RateV4Request>
      `;

      // Call USPS API (you'll need a CORS proxy for this to work in browser)
      const response = await fetch(
        `https://secure.shippingapis.com/ShippingAPI.dll?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`
      );

      const xmlText = await response.text();
      
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for errors
      const errorNode = xmlDoc.querySelector('Error');
      if (errorNode) {
        throw new Error(errorNode.querySelector('Description')?.textContent || 'USPS API error');
      }

      // Extract rates
      const packages = xmlDoc.querySelectorAll('Package');
      const rates = [];

      packages.forEach(pkg => {
        const serviceName = pkg.querySelector('MailService')?.textContent;
        const rate = pkg.querySelector('Rate')?.textContent;
        const days = pkg.querySelector('CommitmentDate')?.textContent || 
                    pkg.querySelector('Days')?.textContent;

        if (serviceName && rate) {
          rates.push({
            service: serviceName,
            rate: parseFloat(rate),
            deliveryTime: days || 'N/A',
            id: pkg.getAttribute('ID')
          });
        }
      });

      if (rates.length === 0) {
        throw new Error('No shipping rates available for this address');
      }

      // Sort by price
      rates.sort((a, b) => a.rate - b.rate);
      setShippingRates(rates);

      // Auto-select cheapest option
      setSelectedRate(rates[0]);
      if (onShippingSelect) {
        onShippingSelect(rates[0]);
      }

    } catch (err) {
      console.error('USPS API error:', err);
      setError(err.message || 'Failed to fetch shipping rates');
      
      // Fallback to flat rates if API fails
      const fallbackRates = [
        { service: 'Standard Shipping', rate: 8.99, deliveryTime: '5-7 business days', id: 'standard' },
        { service: 'Express Shipping', rate: 19.99, deliveryTime: '2-3 business days', id: 'express' }
      ];
      setShippingRates(fallbackRates);
      setSelectedRate(fallbackRates[0]);
      if (onShippingSelect) {
        onShippingSelect(fallbackRates[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (rate) => {
    setSelectedRate(rate);
    if (onShippingSelect) {
      onShippingSelect(rate);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Shipping Options</h3>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-600">
          <Loader className="w-6 h-6 animate-spin mr-2" />
          Calculating shipping rates...
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Using fallback rates</p>
            <p className="text-amber-700">{error}</p>
          </div>
        </div>
      )}

      {!loading && shippingRates.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          <p>Enter a shipping address to see available shipping options</p>
        </div>
      )}

      {!loading && shippingRates.length > 0 && (
        <div className="space-y-2">
          {shippingRates.map((rate) => (
            <button
              key={rate.id}
              onClick={() => handleSelectRate(rate)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                selectedRate?.id === rate.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{rate.service}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Estimated delivery: {rate.deliveryTime}
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  ${rate.rate.toFixed(2)}
                </div>
              </div>
              {selectedRate?.id === rate.id && (
                <div className="mt-2 text-sm text-blue-600 font-medium">
                  ✓ Selected
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
        <strong>Note:</strong> Shipping calculated from Clarkston, MI. Package weight estimated at {calculateWeight()} lb(s) based on cart items.
      </div>
    </div>
  );
}

export default USPSShipping;