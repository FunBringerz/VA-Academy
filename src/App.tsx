import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, TrendingUp, Users, Award } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Signup from './components/Signup';

// --- Components ---

function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-brand-secondary font-sans selection:bg-brand-accent/20">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-6 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary text-white flex items-center justify-center font-serif text-xl">M</div>
          <span className="font-serif uppercase tracking-widest text-lg">Meyer's Entrepreneur</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="/login" className="text-xs uppercase tracking-widest font-semibold text-slate-600 hover:text-brand-primary transition-colors">Log In</a>
          <button onClick={() => navigate('/signup')} className="btn-formal">Create Account</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-3 px-0 py-1 text-brand-accent text-xs font-bold uppercase tracking-[0.2em] mb-8 border-b border-brand-accent/30">
              <Award className="w-4 h-4" />
              <span>Elite Real Estate VA Training</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-brand-primary leading-[0.9] mb-10 tracking-tighter">
              Master the Art of <br />
              <span className="italic text-brand-accent">Strategic</span> Sourcing.
            </h1>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-xl font-light">
              Meyer's Entrepreneur provides the definitive framework for elite Virtual Assistants. 
              Specializing in high-yield real estate lead generation and strategic market analysis.
            </p>
            
            <div className="flex flex-wrap gap-6 w-full sm:w-auto">
              <button onClick={() => navigate('/signup')} className="btn-formal !px-10 !py-4 !text-sm">
                Sign Up
              </button>
              <button onClick={() => navigate('/login')} className="btn-outline-formal !px-10 !py-4 !text-sm">
                Trainee Portal
              </button>
            </div>

            <div className="mt-20 pt-10 border-t border-slate-200 w-full flex items-center gap-6">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Secure Access</span>
              <button onClick={() => navigate('/admin-login')} className="btn-outline-formal !px-6 !py-2 !text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Admin Gateway
              </button>
            </div>
          </div>

          <div className="md:col-span-5 grid grid-cols-1 gap-8">
            <div className="formal-card p-10 flex flex-col gap-6 group hover:border-brand-accent transition-colors duration-500">
              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Market Dominance</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-light">
                Learn the proprietary sourcing techniques used by top-tier real estate investment firms globally.
              </p>
            </div>
            <div className="formal-card p-10 flex flex-col gap-6 group hover:border-brand-accent transition-colors duration-500 md:translate-x-8">
              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-500">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Elite Network</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-light">
                Join an exclusive community of professionals mentored by industry veterans and successful entrepreneurs.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Quote */}
      <section className="bg-brand-primary text-white py-24 px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="font-serif italic text-3xl md:text-4xl text-brand-secondary/80 leading-snug">
            "Precision is not just a skill; it is the foundation of every successful enterprise."
          </p>
          <div className="mt-8 w-12 h-[1px] bg-brand-accent mx-auto"></div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-accent">The Meyer Philosophy</p>
        </div>
      </section>
    </div>
  );
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full formal-card p-12 relative">
        <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-slate-400 hover:text-brand-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-primary mb-2">Trainee Portal</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Identity Verification Required</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-4 mb-6 text-xs font-medium border-l-2 border-red-500">{error}</div>}
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, requiredRole: 'trainee' })
            });
            const data = await res.json();
            
            if (!res.ok) {
              throw new Error(data.error || 'Login failed');
            }

            if (data.role === 'admin') {
              navigate('/admin-dashboard');
            } else {
              navigate('/dashboard');
            }
          } catch (err: any) {
            setError(err.message);
          }
        }} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm"
              required
            />
          </div>
          <button type="submit" className="btn-formal w-full mt-4 py-4">
            Authorize Access
          </button>
        </form>
        <p className="mt-8 text-center text-[10px] uppercase tracking-widest font-bold text-slate-400">
          New Trainee? <a href="/signup" className="text-brand-accent hover:text-brand-primary transition-colors">Register Here</a>
        </p>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-brand-secondary formal-card p-12 border-t-4 border-brand-accent">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-brand-primary text-white flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-brand-accent" />
          </div>
        </div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-primary mb-2">Admin Gateway</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Restricted Command Center</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-4 mb-6 text-xs font-medium border-l-2 border-red-500">{error}</div>}
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, requiredRole: 'admin' })
            });
            const data = await res.json();
            
            if (!res.ok) {
              throw new Error(data.error || 'Login failed');
            }

            if (data.role === 'admin') {
              navigate('/admin-dashboard');
            } else {
              navigate('/dashboard');
            }
          } catch (err: any) {
            setError(err.message);
          }
        }} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Administrator ID</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Security Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm"
              required
            />
          </div>
          <button type="submit" className="btn-formal w-full mt-4 py-4 !bg-brand-primary hover:!bg-slate-800">
            Secure Entry
          </button>
        </form>
        <div className="mt-10 text-center">
          <button onClick={() => navigate('/')} className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary transition-colors">
            &larr; Return to Public Domain
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
