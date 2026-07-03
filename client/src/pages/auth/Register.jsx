import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Truck, AlertCircle } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
    vehicleType: '',
    licenseNumber: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Filter out agent fields if customer
    const payload = { ...formData };
    if (payload.role === 'CUSTOMER') {
      delete payload.vehicleType;
      delete payload.licenseNumber;
    }

    try {
      const user = await register(payload);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'AGENT') navigate('/agent');
      else navigate('/customer');
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle Zod validation formatting
        const errMap = err.response.data.errors;
        const msg = Object.keys(errMap)
          .map((k) => `${k}: ${errMap[k]._errors?.join(', ') || ''}`)
          .join('; ');
        setError(msg || 'Registration failed');
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-[#fcfdff] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Mesh Grids & Glow Blobs */}
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
      <div class="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-indigo-200/30 rounded-full filter blur-[90px] pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-violet-200/30 rounded-full filter blur-[80px] pointer-events-none"></div>

      <div class="max-w-md w-full space-y-8 bg-white border border-slate-200/80 p-8 rounded-3xl shadow-2xl relative z-10">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Truck class="h-6 w-6" />
          </div>
          <h2 class="mt-6 text-center text-3xl font-black text-indigo-950">
            Create an account
          </h2>
          <p class="mt-2 text-center text-sm text-slate-500">
            Join us to manage deliveries efficiently
          </p>
        </div>

        {error && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form class="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div class="space-y-3">
            <div>
              <label htmlFor="name" class="block text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" class="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" class="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="phone" class="block text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. +1234567890"
              />
            </div>

            <div>
              <label htmlFor="role" class="block text-sm font-semibold text-gray-700">
                Register As
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                class="mt-1 block w-full px-4 py-2.5 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="AGENT">Delivery Agent</option>
              </select>
            </div>

            {/* Conditional Agent Fields */}
            {formData.role === 'AGENT' && (
              <div class="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label htmlFor="vehicleType" class="block text-sm font-semibold text-gray-700">
                    Vehicle Type
                  </label>
                  <input
                    id="vehicleType"
                    name="vehicleType"
                    type="text"
                    required
                    value={formData.vehicleType}
                    onChange={handleChange}
                    class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g. Bike, Car, Van"
                  />
                </div>

                <div>
                  <label htmlFor="licenseNumber" class="block text-sm font-semibold text-gray-700">
                    License Plate / Number
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g. LIC-9988-XY"
                  />
                </div>
              </div>
            )}
          </div>

          <div class="pt-4">
            <button
              type="submit"
              disabled={submitting}
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" class="font-semibold text-indigo-600 hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
