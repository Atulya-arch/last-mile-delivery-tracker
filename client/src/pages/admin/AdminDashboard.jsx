import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { 
  Package, 
  DollarSign, 
  UserCheck, 
  Clock, 
  Settings, 
  Eye, 
  AlertCircle,
  Filter
} from 'lucide-react';

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering
  const [statusFilter, setStatusFilter] = useState('');
  
  // Override Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideAgentId, setOverrideAgentId] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [summaryRes, ordersRes, agentsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/orders'),
        api.get('/admin/agents')
      ]);
      setSummary(summaryRes.data.data.summary);
      setOrders(ordersRes.data.data.orders);
      setAgents(agentsRes.data.data.agents);
    } catch (err) {
      setError('Failed to retrieve administrative overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const openOverrideModal = (order) => {
    setSelectedOrder(order);
    setOverrideStatus(order.status);
    setOverrideAgentId(order.agentId || '');
    setOverrideNotes('');
  };

  const closeOverrideModal = () => {
    setSelectedOrder(null);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!overrideNotes.trim()) {
      return setError('Override explanation justification is required.');
    }

    setError('');
    setOverrideLoading(true);

    const payload = {
      notes: overrideNotes
    };

    if (overrideStatus !== selectedOrder.status) {
      payload.status = overrideStatus;
    }
    
    // Check if agent assignment is changing
    const prevAgentId = selectedOrder.agentId || '';
    if (overrideAgentId !== prevAgentId) {
      payload.agentId = overrideAgentId === '' ? null : overrideAgentId;
    }

    try {
      await api.post(`/orders/${selectedOrder.id}/override`, payload);
      closeOverrideModal();
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply admin override changes.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredOrders = statusFilter 
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  if (loading) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div class="space-y-8">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle class="h-5 w-5 text-red-500" />
          <span class="text-sm">{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <DollarSign class="h-6 w-6" />
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Total Revenue</p>
            <h3 class="text-2xl font-bold text-gray-900">${summary?.totalRevenue?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Clock class="h-6 w-6" />
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Active Deliveries</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.activeOrders || 0}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-purple-50 rounded-lg text-purple-600">
            <UserCheck class="h-6 w-6" />
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Online Agents</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.availableAgents || 0}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Package class="h-6 w-6" />
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Completed orders</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.completedOrders || 0}</h3>
          </div>
        </div>
      </div>

      {/* Orders Catalog Table */}
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50">
          <div class="flex items-center gap-2">
            <Package class="h-5 w-5 text-gray-500" />
            <h3 class="font-bold text-gray-900">All Delivery Orders</h3>
          </div>

          {/* Filter Dropdown */}
          <div class="flex items-center gap-2 self-end">
            <Filter class="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            >
              <option value="">All Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div class="p-12 text-center text-gray-500">
            <p class="text-sm">No orders match the selected status.</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <th class="p-4">Code</th>
                  <th class="p-4">Price</th>
                  <th class="p-4">Status</th>
                  <th class="p-4">Created At</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} class="hover:bg-gray-50/50 transition-colors">
                    <td class="p-4 font-bold text-gray-900">{order.orderNumber}</td>
                    <td class="p-4 font-semibold text-gray-900">${order.price.toFixed(2)}</td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {order.status}
                      </span>
                    </td>
                    <td class="p-4 text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                    <td class="p-4 text-right flex justify-end gap-2">
                      <Link
                        to={`/customer/track/${order.id}`}
                        class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        title="View Timeline"
                      >
                        <Eye class="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => openOverrideModal(order)}
                        class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        title="Manual Override"
                      >
                        <Settings class="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      {selectedOrder && (
        <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
            <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3">
              Override Order {selectedOrder.orderNumber}
            </h3>

            <form onSubmit={handleOverrideSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Override Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
                >
                  <option value="CREATED">CREATED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="PICKED_UP">PICKED_UP</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Assigned Delivery Agent</label>
                <select
                  value={overrideAgentId}
                  onChange={(e) => setOverrideAgentId(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm"
                >
                  <option value="">Unassigned (None)</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.agentProfile?.vehicleType || 'No Profile'}) - {a.agentProfile?.status || 'OFFLINE'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Override Explanation Notes (Required)</label>
                <textarea
                  required
                  rows="3"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Provide audit justification details here..."
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  class="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-slate-700 text-sm font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {overrideLoading ? 'Applying...' : 'Apply Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
