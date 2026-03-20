import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Key, BookOpen, Video, FileSpreadsheet, LogOut, MessageSquare, Layers, ClipboardList } from 'lucide-react';
import AdminLeads from './AdminLeads';
import AdminMeetings from './AdminMeetings';
import AdminChat from './AdminChat';
import AdminUsers from './AdminUsers';
import AdminCodes from './AdminCodes';
import AdminLessons from './AdminLessons';
import AdminQuizzes from './AdminQuizzes';
import AdminBatches from './AdminBatches';
import AdminTasks from './AdminTasks';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sourcing-sheet');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminDashboard: Fetching /api/me...');
    fetch('/api/me')
      .then(res => {
        console.log('AdminDashboard: /api/me response status:', res.status);
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        console.log('AdminDashboard: /api/me data:', data);
        if (data.user.role !== 'admin') {
          console.log('AdminDashboard: User is not admin, role is:', data.user.role, 'Redirecting to /admin-login');
          navigate('/admin-login');
          return;
        }
        console.log('AdminDashboard: User is admin, setting state.');
        setUser(data.user);
        setLoading(false);
      })
      .catch((err) => {
        console.error('AdminDashboard: Error fetching /api/me:', err);
        navigate('/admin-login');
      });
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'sourcing-sheet':
        return <AdminLeads />;
      case 'quizzes':
        return <AdminQuizzes />;
      case 'tasks':
        return <AdminTasks />;
      case 'chat':
        return <AdminChat />;
      case 'meeting':
        return <AdminMeetings user={user} />;
      case 'account-generation-code':
        return <AdminCodes />;
      case 'trainees':
        return <AdminUsers />;
      case 'batch':
        return <AdminBatches />;
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
            <ShieldCheck className="w-5 h-5 text-brand-accent" />
            Admin Portal
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent mt-2 font-medium">Meyer's Entrepreneur</p>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('sourcing-sheet')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'sourcing-sheet' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <FileSpreadsheet className="w-4 h-4" /> Sourcing Sheet
          </button>
          <button onClick={() => setActiveTab('quizzes')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'quizzes' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <BookOpen className="w-4 h-4" /> Lectures/Quizzes
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'tasks' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <ClipboardList className="w-4 h-4" /> Tasks
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'chat' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button onClick={() => setActiveTab('meeting')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'meeting' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <Video className="w-4 h-4" /> Meeting
          </button>
          <button onClick={() => setActiveTab('account-generation-code')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'account-generation-code' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <Key className="w-4 h-4" /> Access Codes
          </button>
          <button onClick={() => setActiveTab('trainees')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'trainees' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <Users className="w-4 h-4" /> Trainees
          </button>
          <button onClick={() => setActiveTab('batch')} className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-none uppercase text-[10px] tracking-[0.15em] font-semibold ${activeTab === 'batch' ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
            <Layers className="w-4 h-4" /> Batches
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
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Administration</p>
            <h2 className="text-4xl font-serif font-bold text-brand-primary capitalize leading-none">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] uppercase tracking-[0.1em] text-brand-primary/40 font-medium mb-1">System Administrator</p>
            <div className="text-sm font-serif italic text-brand-primary flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {user?.username}
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}
