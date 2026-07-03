import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Truck, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'AGENT') navigate('/agent');
      else navigate('/customer');
    } catch (err) {
      const errMsg = err.response?.data?.message;
      if (errMsg === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(errMsg || 'Invalid email or password');
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
        {/* Header logo */}
        <div class="text-center">
          <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Truck class="h-6 w-6" />
          </div>
          <h2 class="mt-6 text-center text-3xl font-black text-indigo-950">
            Welcome back
          </h2>
          <p class="mt-2 text-center text-sm text-slate-500">
            Sign in to track and manage your deliveries
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form class="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div class="space-y-4">
            <div>
              <label htmlFor="email" class="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Credentials Box */}
        <div class="mt-6 border-t border-slate-100 pt-4 space-y-3">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Demo Portals (Click to Autofill)</h4>
          <div class="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('password123');
              }}
              class="flex items-center justify-between p-3 bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/60 rounded-xl transition-all text-left w-full group"
            >
              <div>
                <span class="font-bold text-indigo-950 block">System Admin Dashboard</span>
                <span class="text-[10px] text-indigo-600/80 mt-0.5 block">admin@example.com | password123</span>
              </div>
              <span class="text-[10px] font-bold text-indigo-700 bg-white px-2 py-1 rounded-md border border-indigo-100 opacity-60 group-hover:opacity-100 transition-opacity">Use Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('john@example.com');
                setPassword('john@5432');
              }}
              class="flex items-center justify-between p-3 bg-amber-50/30 hover:bg-amber-50/60 border border-amber-100/50 rounded-xl transition-all text-left w-full group"
            >
              <div>
                <span class="font-bold text-amber-950 block">Delivery Agent Dashboard</span>
                <span class="text-[10px] text-amber-600/80 mt-0.5 block">john@example.com | john@5432</span>
              </div>
              <span class="text-[10px] font-bold text-amber-700 bg-white px-2 py-1 rounded-md border border-amber-100/50 opacity-60 group-hover:opacity-100 transition-opacity">Use Portal</span>
            </button>
          </div>
        </div>

        <div class="text-center mt-6">
          <p class="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" class="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
