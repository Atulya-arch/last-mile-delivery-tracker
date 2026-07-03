import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Package, 
  MapPin, 
  User, 
  AlertTriangle, 
  ArrowLeft,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';

export const TrackOrder = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve order tracking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    setError('');
    setRescheduling(true);
    try {
      await api.post(`/orders/${id}/reschedule`, { notes: rescheduleNotes });
      setRescheduleNotes('');
      // Reload order
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule order');
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle class="h-5 w-5 text-red-500" />
          <span>{error || 'Order not found.'}</span>
        </div>
        <Link to="/customer" class="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold">
          <ArrowLeft class="h-4 w-4" /> Back to Dashboard
        </Link>
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
      <span class={`px-3 py-1.5 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div class="space-y-8">
      {/* Back Header */}
      <div class="flex items-center justify-between">
        <Link 
          to={currentUser.role === 'ADMIN' ? '/admin' : currentUser.role === 'AGENT' ? '/agent' : '/customer'} 
          class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          <ArrowLeft class="h-4 w-4" /> Back to Dashboard
        </Link>
        {getStatusBadge(order.status)}
      </div>

      {/* Main Info Blocks */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Details */}
        <div class="lg:col-span-2 space-y-6">
          
          {/* Card: Base Metadata */}
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div class="flex justify-between border-b border-gray-100 pb-3">
              <h3 class="text-md font-bold text-gray-900">Order Information</h3>
              <span class="text-sm font-bold text-slate-500">Order: {order.orderNumber}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div class="space-y-4">
                {/* Pickup */}
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <MapPin class="h-4 w-4" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900">Pickup Details</h4>
                    <p class="text-xs text-gray-500 mt-0.5">{order.pickupArea.name} ({order.pickupArea.zone.name})</p>
                    <p class="text-gray-700 mt-1">{order.pickupAddress}</p>
                  </div>
                </div>

                {/* Delivery */}
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <MapPin class="h-4 w-4" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900">Delivery Details</h4>
                    <p class="text-xs text-gray-500 mt-0.5">{order.dropArea.name} ({order.dropArea.zone.name})</p>
                    <p class="text-gray-700 mt-1">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                {/* Customer Details */}
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <User class="h-4 w-4" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900">Customer Details</h4>
                    <p class="text-gray-700 mt-1">{order.customer.name}</p>
                    <p class="text-xs text-gray-500">{order.customer.phone} | {order.customer.email}</p>
                  </div>
                </div>

                {/* Assigned Agent Details */}
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <Package class="h-4 w-4" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900">Assigned Agent</h4>
                    {order.agent ? (
                      <div>
                        <p class="text-gray-700 mt-1">{order.agent.name}</p>
                        <p class="text-xs text-gray-500">{order.agent.phone}</p>
                      </div>
                    ) : (
                      <p class="text-gray-500 italic mt-1">Pending agent assignment...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sizes & Weights details */}
            <div class="border-t border-gray-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span class="text-xs text-gray-500 uppercase block font-semibold">Dimensions</span>
                <span class="text-sm font-bold text-gray-800 mt-1 block">{order.length}x{order.width}x{order.height} cm</span>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span class="text-xs text-gray-500 uppercase block font-semibold">Actual Weight</span>
                <span class="text-sm font-bold text-gray-800 mt-1 block">{order.actualWeight} kg</span>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span class="text-xs text-gray-500 uppercase block font-semibold">Volumetric Weight</span>
                <span class="text-sm font-bold text-gray-800 mt-1 block">{order.volumetricWeight} kg</span>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span class="text-xs text-gray-500 uppercase block font-semibold">Billable Weight</span>
                <span class="text-sm font-bold text-indigo-600 mt-1 block">{order.billableWeight} kg</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div class="border-t border-gray-100 pt-4 flex justify-between items-center text-sm">
              <div class="flex gap-4 text-xs font-semibold text-gray-500">
                <span>Type: <strong class="text-gray-700">{order.orderType}</strong></span>
                <span>Payment: <strong class="text-gray-700">{order.paymentType}</strong></span>
                {order.rescheduledCount > 0 && (
                  <span class="text-red-500">Reschedules: <strong>{order.rescheduledCount}</strong></span>
                )}
              </div>
              <div class="flex items-center gap-1">
                <span class="font-bold text-gray-800">Final Price:</span>
                <span class="text-xl font-extrabold text-indigo-600">₹{order.price.toFixed(2)}</span>
              </div>
            </div>

            {order.notes && (
              <div class="bg-amber-50/50 border border-amber-100 p-4 rounded-lg flex gap-3 text-sm text-amber-800">
                <Info class="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 class="font-bold">Order Note</h5>
                  <p class="mt-0.5">{order.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reschedule Form (Customer Only & Status = FAILED) */}
          {currentUser.role === 'CUSTOMER' && order.status === 'FAILED' && (
            <form onSubmit={handleReschedule} class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Calendar class="h-5 w-5 text-indigo-600" />
                <span>Reschedule Delivery Attempt</span>
              </h3>
              <p class="text-xs text-gray-500">
                The delivery agent registered a failure. You can request a reschedule attempt.
              </p>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Reschedule Notes / Instructions</label>
                <textarea
                  required
                  rows="2"
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. Please try delivering tomorrow before noon."
                ></textarea>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  disabled={rescheduling}
                  class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {rescheduling ? 'Rescheduling...' : 'Reschedule Delivery Attempt'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Sidebar - Timeline */}
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h3 class="text-md font-bold text-gray-900 border-b border-gray-100 pb-3">Tracking History</h3>

            <div class="relative pl-6 space-y-6 border-l-2 border-gray-100 ml-3">
              {order.trackingHistory.map((log, index) => {
                const isLast = index === order.trackingHistory.length - 1;
                return (
                  <div key={log.id} class="relative">
                    {/* Circle Node indicator */}
                    <div class={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isLast ? 'border-indigo-500' : 'border-gray-300'
                    }`}>
                      {isLast && <div class="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>}
                    </div>

                    <div>
                      <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        {log.status.replace('_', ' ')}
                      </h4>
                      <p class="text-xs text-gray-400 mt-0.5">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.notes && (
                        <p class="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                          {log.notes}
                        </p>
                      )}
                      <p class="text-[10px] text-slate-400 mt-1 text-right">
                        by {log.changedBy.name} ({log.changedBy.role.toLowerCase()})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrackOrder;
