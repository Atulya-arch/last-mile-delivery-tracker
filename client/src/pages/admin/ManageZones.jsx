import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Compass, Trash2, AlertCircle, Compass as CompassIcon } from 'lucide-react';

export const ManageZones = () => {
  const [zones, setZones] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchZones = async () => {
    try {
      const res = await api.get('/admin/zones');
      setZones(res.data.data.zones);
    } catch (err) {
      setError('Failed to retrieve active zones list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/admin/zones', { name: newZoneName });
      setNewZoneName('');
      setSuccess('Zone created successfully!');
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create zone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (!window.confirm('Are you sure you want to soft delete this zone? This will cascade soft-delete all child areas and associated rate cards.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/zones/${zoneId}`);
      setSuccess('Zone and dependencies soft deleted.');
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete zone.');
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
      {/* Create Zone Form */}
      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <CompassIcon class="h-5 w-5 text-indigo-600" />
            <span>Create New Zone</span>
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

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Zone Name</label>
              <input
                type="text"
                required
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                placeholder="e.g. North Zone"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Zone'}
            </button>
          </form>
        </div>
      </div>

      {/* Zones list Table */}
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-gray-200 bg-gray-50/50">
            <h3 class="font-bold text-gray-900">Active Operational Zones</h3>
          </div>

          {zones.length === 0 ? (
            <div class="p-12 text-center text-gray-500">
              <p class="text-sm">No zones configured yet.</p>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <th class="p-4">Zone Name</th>
                    <th class="p-4">Created At</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm">
                  {zones.map(zone => (
                    <tr key={zone.id} class="hover:bg-gray-50/50 transition-colors">
                      <td class="p-4 font-bold text-gray-900">{zone.name}</td>
                      <td class="p-4 text-gray-500">{new Date(zone.createdAt).toLocaleDateString()}</td>
                      <td class="p-4 text-right">
                        <button
                          onClick={() => handleDelete(zone.id)}
                          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Zone"
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

export default ManageZones;
