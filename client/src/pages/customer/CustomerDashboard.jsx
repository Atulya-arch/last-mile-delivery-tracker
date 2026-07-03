import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Package, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';

export const CustomerDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/orders')
        ]);
        setSummary(summaryRes.data.data.summary);
        setOrders(ordersRes.data.data.orders);
      } catch (err) {
        setError('Failed to retrieve dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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
      <span class={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div class="space-y-8">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle class="h-5 w-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Clock class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500">Active Shipments</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.activeOrders || 0}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <CheckCircle2 class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500">Delivered</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.completedOrders || 0}</h3>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-red-50 rounded-lg text-red-600">
            <XCircle class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-500">Failed Delivery</p>
            <h3 class="text-2xl font-bold text-gray-900">{summary?.failedOrders || 0}</h3>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div class="flex items-center gap-2">
            <Package class="h-5 w-5 text-gray-500" />
            <h3 class="font-bold text-gray-900">Your Delivery Orders</h3>
          </div>
          <Link
            to="/customer/place-order"
            class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            + Create New Order
          </Link>
        </div>

        {orders.length === 0 ? (
          <div class="p-12 text-center text-gray-500">
            <p class="text-sm">No orders placed yet.</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <th class="p-4">Order Number</th>
                  <th class="p-4">Date</th>
                  <th class="p-4">Final Price</th>
                  <th class="p-4">Status</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} class="hover:bg-gray-50/50 transition-colors">
                    <td class="p-4 font-bold text-gray-900">{order.orderNumber}</td>
                    <td class="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td class="p-4 font-semibold text-gray-950">₹{order.price.toFixed(2)}</td>
                    <td class="p-4">{getStatusBadge(order.status)}</td>
                    <td class="p-4 text-right">
                      <Link
                        to={`/customer/track/${order.id}`}
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Eye class="h-3.5 w-3.5" />
                        <span>Track</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
