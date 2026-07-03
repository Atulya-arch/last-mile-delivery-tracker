import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Truck, 
  ArrowRight, 
  Clock, 
  Shield, 
  Navigation, 
  Compass, 
  Zap, 
  CheckCircle,
  Database,
  ArrowUpRight
} from 'lucide-react';

export const Landing = () => {
  const { user } = useAuth();

  return (
    <div class="min-h-screen bg-[#fcfdff] text-slate-900 font-sans relative overflow-hidden flex flex-col justify-between">
      
      {/* Mesh Grid Background + Glowing Blob Orbs */}
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      
      <div class="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-200/40 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-violet-200/30 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div class="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] bg-amber-100/30 rounded-full filter blur-[90px] pointer-events-none"></div>

      {/* Floating Header */}
      <header class="max-w-[1200px] w-full mx-auto px-6 h-24 flex items-center justify-between relative z-10">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Truck class="h-5 w-5" />
          </div>
          <span class="text-xl font-black tracking-tight text-indigo-950">LastMile<span class="text-indigo-600">Track</span></span>
        </div>

        <div class="flex items-center gap-6">
          {user ? (
            <Link
              to={user.role === 'ADMIN' ? '/admin' : user.role === 'AGENT' ? '/agent' : '/customer'}
              class="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
            >
              <span>Dashboard</span>
              <ArrowUpRight class="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" class="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                class="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-lg shadow-indigo-600/25"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Body Grid */}
      <main class="max-w-[1200px] w-full mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative z-10 flex-1">
        
        {/* Left: Headline & Text */}
        <div class="lg:col-span-6 space-y-8 text-left">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Zap class="h-3.5 w-3.5 fill-indigo-700/10" />
            <span>Last-Mile Logistics Operating System</span>
          </div>

          <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-indigo-950 leading-[1.05] tracking-tight">
            Seamless dispatch. <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">
              Unmatched tracking.
            </span>
          </h1>

          <p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
            Empower your dispatchers, customers, and delivery agents with automated route optimization, volumetric weighing engines, and real-time transition logs.
          </p>

          <div class="flex flex-col sm:flex-row gap-4">
            {user ? (
              <Link
                to={user.role === 'ADMIN' ? '/admin' : user.role === 'AGENT' ? '/agent' : '/customer'}
                class="inline-flex justify-center items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-600/30 text-sm"
              >
                <span>Return to Dashboard</span>
                <ArrowRight class="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  class="inline-flex justify-center items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-600/30 text-sm"
                >
                  <span>Start Free Setup</span>
                  <ArrowRight class="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  class="inline-flex justify-center items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-200 transition-all text-sm shadow-sm"
                >
                  <span>Enter Delivery Portal</span>
                </Link>
              </>
            )}
          </div>

          {/* Metric Badges */}
          <div class="pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-6">
            <div>
              <h4 class="text-2xl font-black text-indigo-950">100%</h4>
              <p class="text-xs text-slate-500 mt-1">Audit-Proof Logs</p>
            </div>
            <div>
              <h4 class="text-2xl font-black text-indigo-950">&lt; 100ms</h4>
              <p class="text-xs text-slate-500 mt-1">Dispatch Match</p>
            </div>
            <div>
              <h4 class="text-2xl font-black text-indigo-950">Active</h4>
              <p class="text-xs text-slate-500 mt-1">Neon Postgres Sync</p>
            </div>
          </div>
        </div>

        {/* Right: Highly Creative Mock Dashboard Graphic */}
        <div class="lg:col-span-6 relative flex justify-center lg:justify-end">
          
          {/* Main Floating Mock Dashboard Card */}
          <div class="w-full max-w-[480px] bg-white border border-slate-200/80 rounded-3xl shadow-2xl p-6 space-y-6 relative hover:scale-[1.02] transition-transform duration-500">
            
            {/* Header of Mock Card */}
            <div class="flex justify-between items-center border-b border-slate-100 pb-4">
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></div>
                <span class="text-xs font-bold text-indigo-900 tracking-wide uppercase">Live Dispatch Manager</span>
              </div>
              <span class="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                Active Zone: North
              </span>
            </div>

            {/* Widget 1: Order Queue Row */}
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-800">Order: #DT-994821</span>
                <span class="font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">ASSIGNED</span>
              </div>
              <div class="flex justify-between items-baseline text-xs text-slate-500">
                <span>Route: Downtown ➔ Airport</span>
                <span class="text-indigo-900 font-bold text-sm">₹45.00</span>
              </div>
              <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full w-[45%] rounded-full"></div>
              </div>
            </div>

            {/* Widget 2: Agent Matching Cards */}
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Available Match Queue</h4>
              
              <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700">BA</div>
                  <div>
                    <h5 class="text-xs font-bold text-slate-800">Bob Agent</h5>
                    <span class="text-[10px] text-slate-400">Status: AVAILABLE | Load: 0/3</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Best Match</span>
              </div>

              <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl opacity-60">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">JS</div>
                  <div>
                    <h5 class="text-xs font-bold text-slate-800">John Agent</h5>
                    <span class="text-[10px] text-slate-400">Status: BUSY | Load: 2/3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 3: Mini timeline indicator */}
            <div class="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-slate-400">
              <div class="flex items-center gap-1.5">
                <CheckCircle class="h-3.5 w-3.5 text-indigo-600" />
                <span>Volumetric Weight: 1.2 kg</span>
              </div>
              <div class="flex items-center gap-1.5">
                <CheckCircle class="h-3.5 w-3.5 text-indigo-600" />
                <span>Neon Cloud Database Synced</span>
              </div>
            </div>

          </div>

          {/* Tiny decorative floating cards to break grid flatness */}
          <div class="absolute -bottom-6 -left-6 bg-amber-500 text-white p-3 rounded-2xl shadow-xl flex items-center gap-3 hover:translate-y-[-2px] transition-transform pointer-events-none hidden sm:flex">
            <div class="p-1.5 bg-white/20 rounded-lg">
              <Clock class="h-4 w-4" />
            </div>
            <div class="text-left">
              <span class="block text-[10px] opacity-80 uppercase font-semibold">Match Time</span>
              <span class="block text-xs font-bold">Instantly Locked</span>
            </div>
          </div>

          <div class="absolute -top-6 left-12 bg-indigo-950 text-white p-3 rounded-2xl shadow-xl flex items-center gap-3 hover:translate-y-[2px] transition-transform pointer-events-none hidden sm:flex">
            <div class="p-1.5 bg-white/10 rounded-lg">
              <Compass class="h-4 w-4 text-amber-500" />
            </div>
            <div class="text-left">
              <span class="block text-[10px] opacity-80 uppercase font-semibold">Database Driver</span>
              <span class="block text-xs font-bold text-amber-500">PostgreSQL (Neon)</span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-400 relative z-10 bg-white/60 backdrop-blur-md">
        <p>© 2026 LastMileTrack. Built using dynamic volumetric pricing engines, PostgreSQL databases, and clean SaaS interfaces.</p>
      </footer>

    </div>
  );
};

export default Landing;
