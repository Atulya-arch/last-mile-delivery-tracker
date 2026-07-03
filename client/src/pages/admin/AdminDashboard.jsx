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
  Filter,
  Users,
  PlusCircle,
  Trash2,
  Edit2,
  Calendar,
  XCircle,
  CheckCircle,
  ChevronRight,
  Info
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtering
  const [statusFilter, setStatusFilter] = useState('');
  
  // Override Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideAgentId, setOverrideAgentId] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Manage Agent Modal
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentZoneId, setAgentZoneId] = useState('');
  const [agentStatus, setAgentStatus] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);

  // Place Order form states
  const [orderCustomer, setOrderCustomer] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [dropArea, setDropArea] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [length, setLength] = useState('10');
  const [width, setWidth] = useState('10');
  const [height, setHeight] = useState('10');
  const [weight, setWeight] = useState('1');
  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('PREPAID');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [placing, setPlacing] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [summaryRes, ordersRes, agentsRes, customersRes, zonesRes, areasRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/orders'),
        api.get('/admin/agents'),
        api.get('/admin/customers'),
        api.get('/admin/zones'),
        api.get('/admin/areas')
      ]);
      setSummary(summaryRes.data.data.summary);
      setOrders(ordersRes.data.data.orders);
      setAgents(agentsRes.data.data.agents);
      setCustomers(customersRes.data.data.customers);
      setZones(zonesRes.data.data.zones);
      setAreas(areasRes.data.data.areas);
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
    
    const prevAgentId = selectedOrder.agentId || '';
    if (overrideAgentId !== prevAgentId) {
      payload.agentId = overrideAgentId === '' ? null : overrideAgentId;
    }

    try {
      await api.post(`/orders/${selectedOrder.id}/override`, payload);
      closeOverrideModal();
      setSuccess('Order parameters successfully overridden.');
      await fetchAdminData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply admin override changes.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setError('');
    try {
      await api.post(`/orders/${orderId}/override`, {
        status: 'FAILED',
        notes: 'Order cancelled by Administrator override.'
      });
      setSuccess('Order successfully cancelled.');
      await fetchAdminData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel the order.');
    }
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setAgentZoneId(agent.agentProfile?.zoneId || '');
    setAgentStatus(agent.agentProfile?.status || 'OFFLINE');
  };

  const handleAgentUpdate = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;
    setError('');
    setAgentLoading(true);
    try {
      await api.put(`/admin/agents/${editingAgent.id}/profile`, {
        zoneId: agentZoneId === '' ? null : agentZoneId,
        status: agentStatus
      });
      setEditingAgent(null);
      setSuccess('Agent profile updated successfully.');
      await fetchAdminData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update agent profile.');
    } finally {
      setAgentLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to deactivate this agent profile? This will release their active deliveries back to the creation queue.')) return;
    setError('');
    try {
      await api.delete(`/admin/agents/${agentId}`);
      setSuccess('Agent profile deactivated successfully.');
      await fetchAdminData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate agent profile.');
    }
  };

  const handleCalculateQuote = async (e) => {
    e.preventDefault();
    if (!orderCustomer || !pickupArea || !dropArea) {
      return setError('Please select a customer, pickup area, and delivery area.');
    }
    setError('');
    setCalculating(true);
    setQuote(null);
    try {
      const payload = {
        pickupAreaId: pickupArea,
        dropAreaId: dropArea,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        actualWeight: parseFloat(weight),
        orderType,
        paymentType
      };
      const res = await api.post('/orders/quote', payload);
      setQuote(res.data.data.quote);
    } catch (err) {
      setError(err.response?.data?.message || 'Pricing quote calculations failed.');
    } finally {
      setCalculating(false);
    }
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (!quote) return;
    setError('');
    setPlacing(true);
    try {
      const payload = {
        customerId: orderCustomer,
        pickupAreaId: pickupArea,
        dropAreaId: dropArea,
        pickupAddress,
        deliveryAddress,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        actualWeight: parseFloat(weight),
        orderType,
        paymentType,
        notes
      };
      await api.post('/orders', payload);
      setSuccess('Customer order placed and auto-assigned successfully.');
      setQuote(null);
      // Reset form
      setPickupAddress('');
      setDeliveryAddress('');
      setNotes('');
      setActiveTab('orders');
      await fetchAdminData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place the order.');
    } finally {
      setPlacing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      CREATED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      PICKED_UP: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      DELIVERED: 'bg-indigo-600 text-white border-transparent',
      FAILED: 'bg-amber-50 text-amber-700 border-amber-100',
      RESCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };
    return (
      <span class={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getAgentStatusBadge = (status) => {
    const styles = {
      AVAILABLE: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      BUSY: 'bg-amber-50 text-amber-700 border-amber-100',
      OFFLINE: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return (
      <span class={`px-2 py-0.5 text-[10px] font-bold rounded border ${styles[status] || 'bg-gray-50 text-gray-700'}`}>
        {status}
      </span>
    );
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
    <div class="space-y-8 text-left">
      
      {/* Banner Messages */}
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0" />
          <span class="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div class="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle class="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <span class="text-sm">{success}</span>
        </div>
      )}

      {/* Tab Menu Header */}
      <div class="flex border-b border-slate-200/80 gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          class={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package class="h-4 w-4" />
          <span>Active Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          class={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'agents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users class="h-4 w-4" />
          <span>Manage Agents</span>
        </button>

        <button
          onClick={() => setActiveTab('place_order')}
          class={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'place_order' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <PlusCircle class="h-4 w-4" />
          <span>Place Customer Order</span>
        </button>
      </div>

      {/* RENDER TAB: ORDERS */}
      {activeTab === 'orders' && (
        <div class="space-y-8">
          {/* KPI Cards Grid */}
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] transition-all">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <DollarSign class="h-6 w-6" />
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">Total Revenue</p>
                <h3 class="text-2xl font-black text-indigo-950">${summary?.totalRevenue?.toFixed(2) || '0.00'}</h3>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] transition-all">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Clock class="h-6 w-6" />
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">Active Orders</p>
                <h3 class="text-2xl font-black text-indigo-950">{summary?.activeOrders || 0}</h3>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] transition-all">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <UserCheck class="h-6 w-6" />
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">Online Agents</p>
                <h3 class="text-2xl font-black text-indigo-950">{summary?.availableAgents || 0}</h3>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] transition-all">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Package class="h-6 w-6" />
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">Completed Deliveries</p>
                <h3 class="text-2xl font-black text-indigo-950">{summary?.completedOrders || 0}</h3>
              </div>
            </div>
          </div>

          {/* Orders Table catalog */}
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/20">
              <div class="flex items-center gap-2">
                <Package class="h-5 w-5 text-indigo-950" />
                <h3 class="font-extrabold text-indigo-950">Active Orders Queue</h3>
              </div>

              <div class="flex items-center gap-2 self-end">
                <Filter class="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              <div class="p-12 text-center text-slate-400">
                <p class="text-sm">No orders match the selected status.</p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                      <th class="p-4">Order Number</th>
                      <th class="p-4">Route</th>
                      <th class="p-4">Customer</th>
                      <th class="p-4">Price</th>
                      <th class="p-4">Status</th>
                      <th class="p-4">Assigned Agent</th>
                      <th class="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-sm">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} class="hover:bg-slate-50/30 transition-colors">
                        <td class="p-4 font-bold text-indigo-950">{order.orderNumber}</td>
                        <td class="p-4 text-xs">
                          <span class="font-semibold block">{order.pickupArea?.name || 'Unknown'} ➔ {order.dropArea?.name || 'Unknown'}</span>
                          <span class="text-[10px] text-slate-400 block mt-0.5">{order.pickupArea?.zone?.name || 'Unknown Zone'}</span>
                        </td>
                        <td class="p-4 text-xs">
                          <span class="font-semibold block">{order.customer?.name || 'Unknown Customer'}</span>
                          <span class="text-[10px] text-slate-400 block mt-0.5">{order.customer?.email || 'No Email'}</span>
                        </td>
                        <td class="p-4 font-bold text-slate-700">${order.price?.toFixed(2) || '0.00'}</td>
                        <td class="p-4">{getStatusBadge(order.status)}</td>
                        <td class="p-4 text-xs font-semibold text-slate-600">
                          {order.agent ? (
                            <span class="bg-indigo-50/50 px-2.5 py-1 rounded-md text-indigo-700 block text-center truncate max-w-[130px]">
                              {order.agent.name}
                            </span>
                          ) : (
                            <span class="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td class="p-4 text-right flex items-center justify-end gap-2">
                          <Link
                            to={`/customer/track-order?id=${order.id}`}
                            class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                            title="View tracking timeline"
                          >
                            <Eye class="h-4 w-4" />
                          </Link>
                          
                          <button
                            onClick={() => openOverrideModal(order)}
                            class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                            title="Override agent/status"
                          >
                            <Settings class="h-4 w-4" />
                          </button>

                          {order.status !== 'DELIVERED' && order.status !== 'FAILED' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              class="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                              title="Cancel Order"
                            >
                              <XCircle class="h-4 w-4" />
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
        </div>
      )}

      {/* RENDER TAB: MANAGE AGENTS */}
      {activeTab === 'agents' && (
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100 bg-slate-50/20 flex items-center gap-2">
            <Users class="h-5 w-5 text-indigo-950" />
            <h3 class="font-extrabold text-indigo-950">Active Delivery Agents</h3>
          </div>

          {agents.length === 0 ? (
            <div class="p-12 text-center text-slate-400">
              <p class="text-sm">No registered delivery agents found in the system.</p>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                    <th class="p-4">Agent Name</th>
                    <th class="p-4">License / Vehicle</th>
                    <th class="p-4">Operating Zone</th>
                    <th class="p-4">Active Status</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                  {agents.map((agent) => (
                    <tr key={agent.id} class="hover:bg-slate-50/30 transition-colors">
                      <td class="p-4">
                        <span class="font-bold text-indigo-950 block">{agent.name}</span>
                        <span class="text-xs text-slate-400 block mt-0.5">{agent.email} | {agent.phone}</span>
                      </td>
                      <td class="p-4 text-xs font-semibold text-slate-600">
                        <span class="block">{agent.agentProfile?.vehicleType}</span>
                        <span class="text-[10px] text-slate-400 block mt-0.5">Lic: {agent.agentProfile?.licenseNumber}</span>
                      </td>
                      <td class="p-4 text-xs font-semibold">
                        {agent.agentProfile?.zone ? (
                          <span class="text-indigo-600">{agent.agentProfile.zone.name}</span>
                        ) : (
                          <span class="text-slate-400 italic">No zone assigned</span>
                        )}
                      </td>
                      <td class="p-4">{getAgentStatusBadge(agent.agentProfile?.status || 'OFFLINE')}</td>
                      <td class="p-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditAgent(agent)}
                          class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                          title="Edit Agent Profile"
                        >
                          <Edit2 class="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          class="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                          title="Deactivate Agent Profile"
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
      )}

      {/* RENDER TAB: PLACE CUSTOMER ORDER */}
      {activeTab === 'place_order' && (
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Fields */}
          <div class="lg:col-span-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 class="text-lg font-extrabold text-indigo-950 border-b border-slate-100 pb-3">Place Order for Customer</h3>
            
            <form class="space-y-6" onSubmit={handleCalculateQuote}>
              {/* Customer selection */}
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Target Customer</label>
                <select
                  required
                  value={orderCustomer}
                  onChange={(e) => {
                    setOrderCustomer(e.target.value);
                    setQuote(null);
                  }}
                  class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="">Select registered customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Area selection */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Pickup Area</label>
                  <select
                    required
                    value={pickupArea}
                    onChange={(e) => {
                      setPickupArea(e.target.value);
                      setQuote(null);
                    }}
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Select pickup area...</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.zone.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Delivery Area</label>
                  <select
                    required
                    value={dropArea}
                    onChange={(e) => {
                      setDropArea(e.target.value);
                      setQuote(null);
                    }}
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Select delivery area...</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.zone.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address inputs */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Pickup Address Details</label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. Room 405, Building 4B"
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Delivery Address Details</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Apartment 12, Tower C"
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Package metrics */}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Length (cm)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={length}
                    onChange={(e) => {
                      setLength(e.target.value);
                      setQuote(null);
                    }}
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Width (cm)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={width}
                    onChange={(e) => {
                      setWidth(e.target.value);
                      setQuote(null);
                    }}
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Height (cm)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      setQuote(null);
                    }}
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      setQuote(null);
                    }}
                    class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Options */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Order Type</label>
                  <div class="mt-2 flex gap-4">
                    <label class="inline-flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="B2C"
                        checked={orderType === 'B2C'}
                        onChange={(e) => {
                          setOrderType(e.target.value);
                          setQuote(null);
                        }}
                        class="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span class="ml-2 text-sm text-slate-700">B2C (Retail)</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="B2B"
                        checked={orderType === 'B2B'}
                        onChange={(e) => {
                          setOrderType(e.target.value);
                          setQuote(null);
                        }}
                        class="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span class="ml-2 text-sm text-slate-700">B2B (Enterprise)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Mode</label>
                  <div class="mt-2 flex gap-4">
                    <label class="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentType"
                        value="PREPAID"
                        checked={paymentType === 'PREPAID'}
                        onChange={(e) => {
                          setPaymentType(e.target.value);
                          setQuote(null);
                        }}
                        class="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span class="ml-2 text-sm text-slate-700">Prepaid</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentType"
                        value="COD"
                        checked={paymentType === 'COD'}
                        onChange={(e) => {
                          setPaymentType(e.target.value);
                          setQuote(null);
                        }}
                        class="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span class="ml-2 text-sm text-slate-700">Cash on Delivery</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Special instructions */}
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Special Instructions / Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call before delivery attempt"
                  class="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                ></textarea>
              </div>

              <div class="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={calculating}
                  class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/10"
                >
                  {calculating ? 'Calculating...' : 'Calculate Pricing Quote'}
                </button>
              </div>
            </form>
          </div>

          {/* Pricing Quote Preview Panel */}
          <div class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Pricing Calculation Summary</h4>
            
            {quote ? (
              <div class="space-y-6">
                <div class="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col items-center">
                  <span class="text-xs text-indigo-700 font-bold tracking-wide uppercase">Final Quote Rate</span>
                  <span class="text-4xl font-black text-indigo-950 mt-2">${quote.finalPrice.toFixed(2)}</span>
                  <span class="text-[10px] text-indigo-500/80 mt-1 block">Includes base weights & tax overrides</span>
                </div>

                <div class="space-y-3 text-xs border-t border-slate-100 pt-4">
                  <div class="flex justify-between">
                    <span class="text-slate-400 font-semibold">Billable weight:</span>
                    <span class="font-bold text-slate-700">{quote.billableWeight.toFixed(2)} kg</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400 font-semibold">Base shipping cost:</span>
                    <span class="font-bold text-slate-700">${quote.basePrice.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400 font-semibold">Weight surcharge:</span>
                    <span class="font-bold text-slate-700">${quote.weightSurcharge.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400 font-semibold">COD Surcharge:</span>
                    <span class="font-bold text-slate-700">${quote.codSurcharge.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrderSubmit}>
                  <button
                    type="submit"
                    disabled={placing}
                    class="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-colors"
                  >
                    {placing ? 'Placing Order...' : 'Confirm & Place Order'}
                  </button>
                </form>
              </div>
            ) : (
              <div class="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3">
                <Info class="h-8 w-8 text-slate-300" />
                <p class="text-xs">Fill out the parameters and click "Calculate Pricing Quote" to visualize rate values.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERRIDE AGENT/STATUS MODAL */}
      {selectedOrder && (
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 class="text-md font-extrabold text-indigo-950 border-b border-slate-100 pb-3">Admin Dispatch Override</h3>
            
            <form onSubmit={handleOverrideSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Force Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
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
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Force Assign Agent</label>
                <select
                  value={overrideAgentId}
                  onChange={(e) => setOverrideAgentId(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agentProfile?.zone?.name || 'No Zone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Override Justification</label>
                <textarea
                  required
                  rows="2"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Manual driver dispatch due to load overrides"
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  class="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors shadow-md"
                >
                  {overrideLoading ? 'Applying...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE AGENT PROFILE MODAL */}
      {editingAgent && (
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 class="text-md font-extrabold text-indigo-950 border-b border-slate-100 pb-3">Edit Agent Profile</h3>
            
            <form onSubmit={handleAgentUpdate} class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Agent Name</label>
                <input
                  type="text"
                  disabled
                  value={editingAgent.name}
                  class="mt-1 block w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Zone</label>
                <select
                  value={agentZoneId}
                  onChange={(e) => setAgentZoneId(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="">No Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wide">Set Status</label>
                <select
                  value={agentStatus}
                  onChange={(e) => setAgentStatus(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  class="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={agentLoading}
                  class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors shadow-md"
                >
                  {agentLoading ? 'Saving...' : 'Save Profile'}
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
