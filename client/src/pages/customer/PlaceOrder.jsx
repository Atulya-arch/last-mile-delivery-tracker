import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { Compass, Calculator, ShoppingBag, AlertCircle } from 'lucide-react';

export const PlaceOrder = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  const [formData, setFormData] = useState({
    pickupAreaId: '',
    dropAreaId: '',
    pickupAddress: '',
    deliveryAddress: '',
    length: '',
    width: '',
    height: '',
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'PREPAID',
    notes: ''
  });

  // Fetch areas on load
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get('/admin/areas');
        setAreas(res.data.data.areas);
      } catch (err) {
        setError('Failed to retrieve shipping areas list.');
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const handleChange = (e) => {
    // Reset quote if input values change
    setQuote(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getQuotePayload = () => {
    return {
      pickupAreaId: formData.pickupAreaId,
      dropAreaId: formData.dropAreaId,
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      actualWeight: parseFloat(formData.actualWeight),
      orderType: formData.orderType,
      paymentType: formData.paymentType
    };
  };

  const handleCalculateQuote = async (e) => {
    e.preventDefault();
    setError('');
    setQuote(null);

    // Validate inputs
    const payload = getQuotePayload();
    if (
      !payload.pickupAreaId ||
      !payload.dropAreaId ||
      isNaN(payload.length) || payload.length <= 0 ||
      isNaN(payload.width) || payload.width <= 0 ||
      isNaN(payload.height) || payload.height <= 0 ||
      isNaN(payload.actualWeight) || payload.actualWeight <= 0
    ) {
      return setError('Please enter valid numeric dimensions and select active areas.');
    }

    setQuoteLoading(true);
    try {
      const res = await api.post('/orders/quote', payload);
      setQuote(res.data.data.quote);
    } catch (err) {
      setError(err.response?.data?.message || 'Pricing engine lookup failed. No Rate Card configured for this route.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!quote) return;
    setError('');
    setPlacing(true);

    const payload = {
      ...formData,
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      actualWeight: parseFloat(formData.actualWeight)
    };

    try {
      await api.post('/orders', payload);
      navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Area */}
      <div class="lg:col-span-2 space-y-6">
        {error && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle class="h-5 w-5 text-red-500" />
            <span class="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleCalculateQuote} class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h3 class="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Delivery Order Details</h3>

          {/* Route Section */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Pickup Area</label>
              <select
                name="pickupAreaId"
                required
                value={formData.pickupAreaId}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Origin Area</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.zone.name})</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Delivery Area</label>
              <select
                name="dropAreaId"
                required
                value={formData.dropAreaId}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Destination Area</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.zone.name})</option>
                ))}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Pickup Address</label>
              <input
                type="text"
                name="pickupAddress"
                required
                value={formData.pickupAddress}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="123 Origin St, Building 4"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Delivery Address</label>
              <input
                type="text"
                name="deliveryAddress"
                required
                value={formData.deliveryAddress}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="456 Destination Rd, Apt 12"
              />
            </div>
          </div>

          {/* Sizing/Weight Section */}
          <h3 class="text-sm font-bold text-gray-900 border-t border-gray-100 pt-4">Package Metrics</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Length (cm)</label>
              <input
                type="number"
                name="length"
                required
                min="0.1"
                step="any"
                value={formData.length}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Width (cm)</label>
              <input
                type="number"
                name="width"
                required
                min="0.1"
                step="any"
                value={formData.width}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Height (cm)</label>
              <input
                type="number"
                name="height"
                required
                min="0.1"
                step="any"
                value={formData.height}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Weight (kg)</label>
              <input
                type="number"
                name="actualWeight"
                required
                min="0.05"
                step="any"
                value={formData.actualWeight}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Config Section */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Order Type</label>
              <select
                name="orderType"
                value={formData.orderType}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
              >
                <option value="B2C">B2C (Business-to-Customer)</option>
                <option value="B2B">B2B (Business-to-Business)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Payment Mode</label>
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COD">Cash on Delivery (COD)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase">Special Instructions / Notes</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Leave with security guard"
            ></textarea>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              disabled={quoteLoading}
              class="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Calculator class="h-4 w-4" />
              {quoteLoading ? 'Calculating Rate...' : 'Calculate Quote'}
            </button>
          </div>
        </form>
      </div>

      {/* Quote Sidebar */}
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3">Pricing Quote</h3>

          {!quote ? (
            <div class="text-center py-12 text-gray-400">
              <Calculator class="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p class="text-xs">Fill out the delivery form and calculate to view dynamic pricing quote.</p>
            </div>
          ) : (
            <div class="space-y-4">
              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Volumetric Weight:</span>
                  <span class="font-medium">{quote.volumetricWeight} kg</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Billable Weight:</span>
                  <span class="font-semibold text-gray-800">{quote.billableWeight} kg</span>
                </div>
                <hr class="border-gray-100" />
                <div class="flex justify-between">
                  <span class="text-gray-500">Base Price:</span>
                  <span class="font-medium">${quote.basePrice.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Weight Surcharge:</span>
                  <span class="font-medium">${quote.weightSurcharge.toFixed(2)}</span>
                </div>
                {quote.codSurcharge > 0 && (
                  <div class="flex justify-between">
                    <span class="text-gray-500">COD Surcharge:</span>
                    <span class="font-medium text-red-500">+${quote.codSurcharge.toFixed(2)}</span>
                  </div>
                )}
                <div class="flex justify-between">
                  <span class="text-gray-500">Origin Zone:</span>
                  <span class="font-medium">{quote.pickupZone}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Destination Zone:</span>
                  <span class="font-medium">{quote.dropZone}</span>
                </div>
              </div>

              <div class="pt-4 border-t border-gray-200 flex justify-between items-baseline">
                <span class="font-bold text-gray-900">Total Price:</span>
                <span class="text-3xl font-extrabold text-indigo-600">${quote.finalPrice.toFixed(2)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <ShoppingBag class="h-4 w-4" />
                {placing ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
