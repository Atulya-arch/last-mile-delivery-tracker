import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Mail, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const VerifyOtp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const { loginWithToken } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input field
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return setError('Please enter the complete 6-digit OTP code.');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode });
      const { user, token } = res.data.data;
      
      setSuccess('Account verified successfully!');
      
      // Save token in context and storage, then redirect
      setTimeout(() => {
        loginWithToken(user, token);
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'AGENT') navigate('/agent');
        else navigate('/customer');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('Verification OTP code resent successfully.');
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
      {/* Visual Mesh and Blur Orb decoration */}
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
      <div class="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-indigo-200/20 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div class="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xl relative z-10 space-y-8">
        
        {/* Logo/Icon Header */}
        <div class="flex flex-col items-center text-center space-y-3">
          <div class="p-4 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 shadow-sm">
            <Mail class="h-8 w-8" />
          </div>
          <h2 class="text-2xl font-black text-indigo-950">Verify Your Account</h2>
          <p class="text-sm text-slate-500 max-w-[280px]">
            We have sent a 6-digit verification code to <span class="font-bold text-slate-700 block mt-1 truncate">{email}</span>
          </p>
        </div>

        {error && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0" />
            <span class="text-xs font-semibold text-left">{error}</span>
          </div>
        )}

        {success && (
          <div class="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <ShieldCheck class="h-5 w-5 text-indigo-500 flex-shrink-0" />
            <span class="text-xs font-semibold text-left">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-8">
          {/* 6 Digit Input Group */}
          <div class="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                required
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                class="w-12 h-14 border border-slate-200 rounded-xl text-center text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            class="w-full flex justify-center py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        {/* Resend Action */}
        <div class="text-center pt-2">
          <p class="text-xs text-slate-500">
            Didn't receive the OTP code?{' '}
            {timer > 0 ? (
              <span class="font-bold text-indigo-600">Resend in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                class="font-bold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
              >
                {resending ? 'Resending...' : (
                  <>
                    <RefreshCw class="h-3 w-3 animate-spin-slow" />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            )}
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtp;
