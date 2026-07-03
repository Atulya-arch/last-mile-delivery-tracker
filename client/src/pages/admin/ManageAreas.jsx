import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { MapPin, Trash2, AlertCircle } from 'lucide-react';

export const ManageAreas = () => {
  const [areas, setAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAreasAndZones = async () => {
    try {
      const [areasRes, zonesRes] = await Promise.all([
        api.get('/admin/areas'),
        api.get('/admin/zones')
      ]);
      setAreas(areasRes.data.data.areas);
      setZones(zonesRes.data.data.zones);
    } catch (err) {
      setError('Failed to retrieve active areas and zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreasAndZones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim() || !selectedZoneId) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/admin/areas', { name: newAreaName, zoneId: selectedZoneId });
      setNewAreaName('');
      setSelectedZoneId('');
      setSuccess('Area created successfully!');
      await fetchAreasAndZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create area.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (areaId) => {
    if (!window.confirm('Are you sure you want to soft delete this area?')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/areas/${areaId}`);
      setSuccess('Area soft deleted.');
      await fetchAreasAndZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete area.');
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
      {/* Create Area Form */}
      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <MapPin class="h-5 w-5 text-indigo-600" />
            <span>Create New Area</span>
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
              <label class="block text-xs font-semibold text-gray-500 uppercase">Area Name</label>
              <input
                type="text"
                required
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                placeholder="e.g. Suburbia Heights"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase">Parent Zone</label>
              <select
                required
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:outline-none"
              >
                <option value="">Select Zone</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Area'}
            </button>
          </form>
        </div>
      </div>

      {/* Areas List Table */}
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-gray-200 bg-gray-50/50">
            <h3 class="font-bold text-gray-900">Active Operational Areas</h3>
          </div>

          {areas.length === 0 ? (
            <div class="p-12 text-center text-gray-500">
              <p class="text-sm">No areas configured yet.</p>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <th class="p-4">Area Name</th>
                    <th class="p-4">Parent Zone</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm">
                  {areas.map(area => (
                    <tr key={area.id} class="hover:bg-gray-50/50 transition-colors">
                      <td class="p-4 font-bold text-gray-900">{area.name}</td>
                      <td class="p-4 text-gray-600">{area.zone?.name || 'Unknown'}</td>
                      <td class="p-4 text-right">
                        <button
                          onClick={() => handleDelete(area.id)}
                          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Area"
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

export default ManageAreas;
