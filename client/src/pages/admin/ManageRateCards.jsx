import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { DollarSign, Trash2, AlertCircle } from 'lucide-react';

export const ManageRateCards = () => {
  const [rateCards, setRateCards] = useState([]);
  const [zones, setZones] = useState([]);
  
  const [formData, setFormData] = useState({
    pickupZoneId: '',
    dropZoneId: '',
    orderType: 'B2C',
    baseWeightLimit: '',
    basePrice: '',
    pricePerKg: '',
    codSurcharge: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRatesAndZones = async () => {
    try {
      const [ratesRes, zonesRes] = await Promise.all([
        api.get('/admin/rate-cards'),
        api.get('/admin/zones')
      ]);
      setRateCards(ratesRes.data.data.rateCards);
      setZones(zonesRes.data.data.zones);
    } catch (err) {
      setError('Failed to retrieve active rate cards and zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatesAndZones();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { pickupZoneId, dropZoneId, orderType, baseWeightLimit, basePrice, pricePerKg, codSurcharge } = formData;
    if (!pickupZoneId || !dropZoneId) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    const payload = {
      pickupZoneId,
      dropZoneId,
      orderType,
      baseWeightLimit: parseFloat(baseWeightLimit),
      basePrice: parseFloat(basePrice),
      pricePerKg: parseFloat(pricePerKg),
      codSurcharge: parseFloat(codSurcharge)
    };

    try {
      await api.post('/admin/rate-cards', payload);
      setFormData({
        pickupZoneId: '',
        dropZoneId: '',
        orderType: 'B2C',
        baseWeightLimit: '',
        basePrice: '',
        pricePerKg: '',
        codSurcharge: ''
      });
      setSuccess('Rate Card pricing configured successfully!');
      await fetchRatesAndZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to configure rate card pricing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rcId) => {
    if (!window.confirm('Are you sure you want to soft delete this pricing rate card?')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/rate-cards/${rcId}`);
      setSuccess('Pricing rate card soft deleted.');
      await fetchRatesAndZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete rate card.');
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
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Create Rate Card Form */}
      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <DollarSign class="h-5 w-5 text-indigo-600" />
            <span>Configure Rates</span>
          </h3>

          {error && (
            <div class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle class="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div class="bg-indigo-50 border border-indigo-100 text-indigo-700 p-3 rounded-lg text-xs font-semibold">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Pickup Zone</label>
              <select
                name="pickupZoneId"
                required
                value={formData.pickupZoneId}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
              >
                <option value="">Select pickup zone</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Drop Zone</label>
              <select
                name="dropZoneId"
                required
                value={formData.dropZoneId}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
              >
                <option value="">Select destination zone</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Order Type</label>
              <select
                name="orderType"
                value={formData.orderType}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
              >
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Base Weight Limit (kg)</label>
              <input
                type="number"
                name="baseWeightLimit"
                required
                min="0.1"
                step="any"
                value={formData.baseWeightLimit}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                placeholder="e.g. 2.0"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Base Price ($)</label>
              <input
                type="number"
                name="basePrice"
                required
                min="0"
                step="any"
                value={formData.basePrice}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                placeholder="e.g. 10.00"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Price per extra KG ($)</label>
              <input
                type="number"
                name="pricePerKg"
                required
                min="0"
                step="any"
                value={formData.pricePerKg}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                placeholder="e.g. 2.00"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">COD Surcharge ($)</label>
              <input
                type="number"
                name="codSurcharge"
                required
                min="0"
                step="any"
                value={formData.codSurcharge}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                placeholder="e.g. 5.00"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Configuring...' : 'Configure Rates'}
            </button>
          </form>
        </div>
      </div>

      {/* Rate cards List Table */}
      <div class="lg:col-span-3">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-gray-200 bg-gray-50/50">
            <h3 class="font-bold text-gray-900">Active Rate Cards</h3>
          </div>

          {rateCards.length === 0 ? (
            <div class="p-12 text-center text-gray-500">
              <p class="text-sm">No rate cards configured yet.</p>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <th class="p-4">Route</th>
                    <th class="p-4">Type</th>
                    <th class="p-4">Base Weight</th>
                    <th class="p-4">Base Price</th>
                    <th class="p-4">Extra KG Price</th>
                    <th class="p-4">COD Surcharge</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm">
                  {rateCards.map(rc => (
                    <tr key={rc.id} class="hover:bg-gray-50/50 transition-colors">
                      <td class="p-4 font-semibold text-gray-900 truncate max-w-[160px]">
                        {rc.pickupZone?.name} ➔ {rc.dropZone?.name}
                      </td>
                      <td class="p-4 font-bold text-slate-500">{rc.orderType}</td>
                      <td class="p-4 text-gray-600">{rc.baseWeightLimit} kg</td>
                      <td class="p-4 font-semibold text-gray-900">${rc.basePrice.toFixed(2)}</td>
                      <td class="p-4 text-gray-600">${rc.pricePerKg.toFixed(2)}/kg</td>
                      <td class="p-4 text-red-500">${rc.codSurcharge.toFixed(2)}</td>
                      <td class="p-4 text-right">
                        <button
                          onClick={() => handleDelete(rc.id)}
                          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Rate Card"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageRateCards;
