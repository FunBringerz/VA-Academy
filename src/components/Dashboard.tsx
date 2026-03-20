import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, BookOpen, MessageSquare, Video, User, LogOut, ClipboardList } from 'lucide-react';
import SourcingSheet from './SourcingSheet';
import Lessons from './Lessons';
import Chat from './Chat';
import Meetings from './Meetings';
import Profile from './Profile';
import Tasks from './Tasks';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sourcing');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/me')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'sourcing':
        return <SourcingSheet user={user} />;
      case 'lessons':
        return <Lessons user={user} />;
      case 'tasks':
        return <Tasks user={user} />;
      case 'chat':
        return <Chat user={user} />;
      case 'meetings':
        return <Meetings user={user} />;
      case 'profile':
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-primary text-white/70 flex flex-col fixed h-full shadow-2xl z-20">
        <div className="p-8 border-b border-white/5">
          <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2 tracking-tight">
            <LayoutDashboard className="w-5 h-5 text-brand-accent" />
            Trainee Portal
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent mt-2 font-medium">Meyer's Entrepreneur</p>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          <button onClick={() => setActiveTab('sourcing')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'sourcing' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <FileSpreadsheet className="w-4 h-4" /> Sourcing Sheet
          </button>
          <button onClick={() => setActiveTab('lessons')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'lessons' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <BookOpen className="w-4 h-4" /> Lectures/Quizzes
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'tasks' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <ClipboardList className="w-4 h-4" /> Tasks
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'chat' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button onClick={() => setActiveTab('meetings')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'meetings' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <Video className="w-4 h-4" /> Meetings
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'profile' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <User className="w-4 h-4" /> Profile
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold text-white/40 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12">
        <header className="mb-12 flex justify-between items-end border-b border-brand-primary/10 pb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Workspace</p>
            <h2 className="text-4xl font-serif font-bold text-brand-primary capitalize leading-none">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] uppercase tracking-[0.1em] text-brand-primary/40 font-medium mb-1">Authenticated as</p>
            <div className="text-sm font-serif italic text-brand-primary">
              {user?.username}
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}
