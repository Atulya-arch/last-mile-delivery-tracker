import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Package, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  AlertCircle,
  Truck,
  Compass,
  Settings,
  Filter
} from 'lucide-react';

export const AgentDashboard = () => {
  const { user: currentUser } = useAuth();
  
  // States
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Agent profile configs
  const [agentStatus, setAgentStatus] = useState('OFFLINE');
  const [agentZoneId, setAgentZoneId] = useState('');
  
  // Modal for status progression
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [failedReason, setFailedReason] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, ordersRes, zonesRes, meRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/orders'),
        api.get('/admin/zones'),
        api.get('/auth/me')
      ]);
      setSummary(summaryRes.data.data.summary);
      setOrders(ordersRes.data.data.orders);
      setZones(zonesRes.data.data.zones);
      
      const profile = meRes.data.data.user.agentProfile;
      if (profile) {
        setAgentStatus(profile.status);
        setAgentZoneId(profile.zoneId || '');
      }
    } catch (err) {
      setError('Failed to retrieve dashboard summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusToggle = async (e) => {
    const nextVal = e.target.value;
    setError('');
    try {
      const res = await api.put('/agent/profile/status', { status: nextVal });
      setAgentStatus(res.data.data.profile.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability status.');
    }
  };

  const handleZoneChange = async (e) => {
    const targetZoneId = e.target.value;
    if (!targetZoneId) return;
    setError('');
    try {
      const res = await api.put('/agent/profile/zone', { zoneId: targetZoneId });
      setAgentZoneId(res.data.data.profile.zoneId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update operating zone.');
    }
  };

  // Get allowed next transition statuses based on current status
  const getAllowedTransitions = (currentStatus) => {
    const rules = {
      ASSIGNED: ['PICKED_UP', 'FAILED'],
      PICKED_UP: ['IN_TRANSIT', 'FAILED'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED']
    };
    return rules[currentStatus] || [];
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    const allowed = getAllowedTransitions(order.status);
    setNextStatus(allowed[0] || '');
    setNotes('');
    setFailedReason('');
  };

  const closeStatusModal = () => {
    setSelectedOrder(null);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setError('');
    setUpdateLoading(true);

    const payload = {
      status: nextStatus,
      notes
    };
    if (nextStatus === 'FAILED') {
      payload.failedReason = failedReason;
    }

    try {
      await api.put(`/agent/orders/${selectedOrder.id}/status`, payload);
      closeStatusModal();
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update delivery status.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === '') return true;
    if (statusFilter === 'ACTIVE') {
      return !['DELIVERED', 'FAILED'].includes(order.status);
    }
    return order.status === statusFilter;
  });

  return (
    <div class="space-y-8">
      {/* Header */}
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Agent Portal</h2>
          <p class="text-gray-500 mt-1">Manage assigned deliveries, update operational status, and trace workloads.</p>
        </div>
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle class="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Actions Configs */}
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Toggle */}
        <div class="flex items-center justify-between border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
          <div class="flex items-center gap-3">
            <div class={`p-3 rounded-lg ${agentStatus === 'OFFLINE' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
              <Truck class="h-6 w-6" />
            </div>
            <div>
              <h4 class="font-bold text-gray-900">Work Status</h4>
              <p class="text-xs text-gray-500 mt-0.5">Toggle availability to receive dispatch matches.</p>
            </div>
          </div>
          <select
            value={agentStatus}
            onChange={handleStatusToggle}
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white font-semibold"
          >
            <option value="OFFLINE">OFFLINE</option>
            <option value="AVAILABLE">ONLINE (AVAILABLE)</option>
          </select>
        </div>

        {/* Zone Selector */}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Compass class="h-6 w-6" />
            </div>
            <div>
              <h4 class="font-bold text-gray-900">Operating Zone</h4>
              <p class="text-xs text-gray-500 mt-0.5">Set home zone to auto-match local orders.</p>
            </div>
          </div>
          <select
            value={agentZoneId}
            onChange={handleZoneChange}
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">Select Zone</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Clock class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500">Active Assigned</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.activeOrders || 0}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <CheckCircle2 class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500">Completed</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.completedOrders || 0}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-red-50 rounded-lg text-red-600">
            <XCircle class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500">Failed</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.failedOrders || 0}</h3>
          </div>
        </div>
      </div>

      {/* Assigned Orders Table */}
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50">
          <div class="flex items-center gap-2">
            <Package class="h-5 w-5 text-gray-500" />
            <h3 class="font-bold text-gray-900">Your Deliveries Log</h3>
          </div>
          
          <div class="flex items-center gap-2 self-end">
            <Filter class="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="">All Assigned</option>
              <option value="ACTIVE">Active Deliveries</option>
              <option value="DELIVERED">Delivered (History)</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div class="p-12 text-center text-gray-500">
            <p class="text-sm">No deliveries found matching criteria.</p>
          </div>
        ) : (

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <th class="p-4">Order Code</th>
                  <th class="p-4">Pickup Address</th>
                  <th class="p-4">Delivery Address</th>
                  <th class="p-4">Status</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} class="hover:bg-gray-50/50 transition-colors">
                    <td class="p-4 font-bold text-gray-900">{order.orderNumber}</td>
                    <td class="p-4 text-gray-600 truncate max-w-xs">{order.pickupAddress}</td>
                    <td class="p-4 text-gray-600 truncate max-w-xs">{order.deliveryAddress}</td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                        {order.status}
                      </span>
                    </td>
                    <td class="p-4 text-right flex justify-end gap-2">
                      <Link
                        to={`/customer/track/${order.id}`}
                        class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        title="View Timeline"
                      >
                        <Eye class="h-4 w-4" />
                      </Link>

                      {order.status !== 'DELIVERED' && order.status !== 'FAILED' && (
                        <button
                          onClick={() => openStatusModal(order)}
                          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transition Modal */}
      {selectedOrder && (
        <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
            <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3">
              Progress Order {selectedOrder.orderNumber}
            </h3>
            
            <form onSubmit={handleStatusSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Current Status</label>
                <span class="mt-1 block text-sm font-bold text-gray-800">{selectedOrder.status}</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Next Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
                >
                  {getAllowedTransitions(selectedOrder.status).map(status => (
                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {nextStatus === 'FAILED' && (
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Failure Reason</label>
                  <select
                    required
                    value={failedReason}
                    onChange={(e) => setFailedReason(e.target.value)}
                    class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm text-red-700"
                  >
                    <option value="">Select failure reason</option>
                    <option value="Customer not home / unresponsive">Customer not home / unresponsive</option>
                    <option value="Incorrect address details">Incorrect address details</option>
                    <option value="Package damaged / refused">Package damaged / refused</option>
                    <option value="Vehicle breakdown / traffic force majeure">Vehicle breakdown / traffic force majeure</option>
                  </select>
                </div>
              )}

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Status Notes / Log Comments</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. Package collected at sorting depot"
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  class="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-slate-700 text-sm font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {updateLoading ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
