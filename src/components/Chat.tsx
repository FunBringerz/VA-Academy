import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Chat({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'general' | 'admin'>('general');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  
  // Admin specific states
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [trainees, setTrainees] = useState<any[]>([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchAdminData();
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      const [batchesRes, traineesRes] = await Promise.all([
        fetch('/api/admin/batches'),
        fetch('/api/admin/trainees')
      ]);
      if (batchesRes.ok) {
        const data = await batchesRes.json();
        setBatches(data.batches || []);
        if (data.batches?.length > 0) setSelectedBatchId(data.batches[0].id);
      }
      if (traineesRes.ok) {
        const data = await traineesRes.json();
        setTrainees(data.trainees || []);
        if (data.trainees?.length > 0) setSelectedTraineeId(data.trainees[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds for real-time feel
    return () => clearInterval(interval);
  }, [activeTab, selectedBatchId, selectedTraineeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      let url = `/api/chat/${activeTab}`;
      const params = new URLSearchParams();
      if (user.role === 'admin') {
        if (activeTab === 'general' && selectedBatchId) {
          params.append('batch_id', selectedBatchId);
        } else if (activeTab === 'admin' && selectedTraineeId) {
          params.append('trainee_id', selectedTraineeId);
        }
      }
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const body: any = { message: newMessage };
      if (user.role === 'admin') {
        if (activeTab === 'general') {
          body.batch_id = selectedBatchId;
        } else {
          body.receiver_id = selectedTraineeId;
        }
      }

      const res = await fetch(`/api/chat/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportingMsgId) return;

    try {
      const res = await fetch('/api/chat/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: reportingMsgId,
          reason: reportReason
        })
      });

      if (res.ok) {
        setReportSuccess('Message reported successfully.');
        setTimeout(() => {
          setReportingMsgId(null);
          setReportReason('');
          setReportSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] formal-card bg-white overflow-hidden">
      {/* Chat Header & Tabs */}
      <div className="flex flex-col border-b border-slate-100 bg-brand-secondary/30">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${activeTab === 'general' ? 'text-brand-primary bg-white border-b-2 border-brand-accent' : 'text-slate-400 hover:text-brand-primary hover:bg-white/50'}`}
          >
            General Assembly
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${activeTab === 'admin' ? 'text-brand-primary bg-white border-b-2 border-brand-accent' : 'text-slate-400 hover:text-brand-primary hover:bg-white/50'}`}
          >
            Administrative Liaison
          </button>
        </div>

        {user.role === 'admin' && (
          <div className="p-4 bg-white/50 border-t border-slate-100 flex items-center gap-4">
            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Filter By:</span>
            {activeTab === 'general' ? (
              <select 
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-b border-brand-primary/20 focus:outline-none focus:border-brand-accent py-1"
              >
                <option value="all">All Batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <select 
                value={selectedTraineeId}
                onChange={(e) => setSelectedTraineeId(e.target.value)}
                className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-b border-brand-primary/20 focus:outline-none focus:border-brand-accent py-1"
              >
                {trainees.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.username} ({typeof t.full_name === 'object' ? `${t.full_name.first || ''} ${t.full_name.last || ''}`.trim() : t.full_name})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        {loading ? (
          <div className="flex justify-center items-center h-full text-slate-300 font-serif italic">Accessing archives...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <MessageSquareIcon className="w-12 h-12 mb-6 opacity-10" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold">No correspondence found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              const isAdmin = msg.sender?.role === 'admin';
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {!isMe && isAdmin && (
                      <span className="bg-brand-accent text-white text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest">Official</span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/60">
                      {isMe ? 'Self' : (
                        msg.sender?.full_name 
                          ? (typeof msg.sender.full_name === 'string' ? msg.sender.full_name : `${msg.sender.full_name.first || ''} ${msg.sender.full_name.last || ''}`.trim())
                          : msg.sender?.username || 'Anonymous'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="group relative flex items-center gap-4">
                    {!isMe && (
                      <button 
                        onClick={() => setReportingMsgId(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all duration-300"
                        title="Flag Correspondence"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div className={`px-6 py-4 border transition-all duration-300 max-w-md ${
                      isMe 
                        ? 'bg-brand-primary text-white border-brand-primary' 
                        : isAdmin 
                          ? 'bg-brand-secondary text-brand-primary border-brand-accent/20 italic font-serif'
                          : 'bg-white border-slate-100 text-slate-700'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingMsgId && (
        <div className="absolute inset-0 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-10 formal-card max-w-md w-full animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4 mb-8 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-xl font-serif font-bold text-brand-primary">Flag Correspondence</h3>
            </div>
            
            {reportSuccess ? (
              <div className="bg-emerald-50 text-emerald-600 p-6 border border-emerald-100 flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-5 h-5" />
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReport}>
                <p className="text-xs text-slate-500 mb-6 font-light leading-relaxed">Please state the formal grounds for flagging this message for administrative review.</p>
                <textarea 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for review..."
                  className="w-full border-b border-slate-200 py-3 text-sm focus:outline-none focus:border-brand-accent bg-transparent font-serif italic mb-8 resize-none"
                  rows={3}
                  required
                ></textarea>
                <div className="flex justify-end gap-6">
                  <button 
                    type="button" 
                    onClick={() => { setReportingMsgId(null); setReportReason(''); }}
                    className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    Rescind
                  </button>
                  <button 
                    type="submit"
                    className="text-[10px] uppercase tracking-widest font-bold text-red-600 hover:text-red-700 transition-colors border-b border-red-600/30 pb-1"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-6 bg-brand-secondary/20 border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex items-center gap-6">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeTab === 'general' ? "Compose message to assembly..." : "Compose message to administration..."}
            className="flex-1 border-b border-slate-200 py-3 text-sm focus:outline-none focus:border-brand-accent bg-transparent font-serif italic"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || (user.role === 'admin' && activeTab === 'admin' && !selectedTraineeId)}
            className="bg-brand-primary text-white p-4 hover:bg-slate-800 disabled:opacity-20 transition-all duration-300 shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {user.role === 'admin' && activeTab === 'admin' && !selectedTraineeId && (
          <p className="text-[9px] uppercase tracking-widest font-bold text-red-500 mt-2 text-center">
            Please select a trainee to initiate administrative liaison.
          </p>
        )}
      </div>
    </div>
  );
}

// Helper icon component since MessageSquare isn't imported from lucide-react in this file
function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
