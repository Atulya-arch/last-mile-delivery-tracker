import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Truck, 
  MapPin, 
  User, 
  Layers, 
  DollarSign, 
  LogOut, 
  PlusCircle, 
  Compass,
  LayoutDashboard
} from 'lucide-react';

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get navigation links based on user role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/zones', label: 'Manage Zones', icon: Compass },
          { to: '/admin/areas', label: 'Manage Areas', icon: MapPin },
          { to: '/admin/rates', label: 'Rate Cards', icon: DollarSign }
        ];
      case 'AGENT':
        return [
          { to: '/agent', label: 'Dashboard', icon: LayoutDashboard }
        ];
      case 'CUSTOMER':
        return [
          { to: '/customer', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/customer/place-order', label: 'Place Order', icon: PlusCircle }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div class="min-h-screen flex flex-col md:flex-row bg-[#FAF9F6]">
      {/* Sidebar */}
      <aside class="w-full md:w-64 bg-indigo-950 text-white flex flex-col shadow-lg">
        {/* Logo/Header */}
        <div class="p-6 border-b border-white/10 flex items-center gap-3">
          <Truck class="h-8 w-8 text-indigo-600" />
          <span class="text-lg font-bold tracking-wider">LastMile Tracker</span>
        </div>

        {/* User Info Card */}
        <div class="p-6 border-b border-white/10 bg-black/20 flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <User class="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h4 class="text-sm font-semibold truncate w-40">{user?.name}</h4>
            <span class="text-xs text-slate-300 capitalize bg-white/10 px-2 py-0.5 rounded-full inline-block mt-1">
              {user?.role?.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav class="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                class={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon class="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div class="p-4 border-t border-white/10 bg-black/20">
          <button
            onClick={handleLogout}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut class="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main class="flex-1 flex flex-col min-w-0 relative bg-[#fcfdff]">
        {/* Subtle Background Mesh and Violet Blur Orbs */}
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
        <div class="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-indigo-100/30 rounded-full filter blur-[80px] pointer-events-none"></div>
        <div class="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] bg-violet-100/20 rounded-full filter blur-[70px] pointer-events-none"></div>

        {/* Top bar header */}
        <header class="bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-6 md:px-8 shadow-sm relative z-10">
          <h1 class="text-lg font-black text-indigo-950 capitalize">
            {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
          </h1>
          <div class="flex items-center gap-4">
            <span class="text-xs text-indigo-950 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100 font-bold tracking-wide">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | {time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Content viewport */}
        <div class="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1400px] w-full mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
