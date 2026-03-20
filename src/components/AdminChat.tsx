import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Shield, Trash2, CheckCircle } from 'lucide-react';

export default function AdminChat() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/chat-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'dismiss' | 'delete_message') => {
    try {
      const res = await fetch(`/api/admin/chat-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="bg-white p-10 formal-card">
        <div className="flex items-center gap-4 mb-4">
          <Shield className="w-8 h-8 text-brand-accent" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-1">Security</p>
            <h3 className="text-3xl font-serif font-bold text-brand-primary">Chat Moderation</h3>
          </div>
        </div>
        <p className="text-xs font-serif italic text-brand-primary/60">Review reported messages and maintain a professional environment.</p>
      </div>

      <div className="bg-white formal-card overflow-hidden">
        <div className="p-6 border-b border-brand-primary/10 bg-brand-secondary/30">
          <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-brand-accent" />
            Reported Messages
          </h4>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-brand-primary/40 font-serif italic">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-emerald-500/50" />
            <p className="text-sm font-serif italic text-brand-primary/60">No pending reports. The chat is clean!</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-primary/5">
            {reports.map((report) => (
              <div key={report.id} className="p-8 hover:bg-brand-secondary/30 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-accent/10 text-brand-accent px-3 py-1 border border-brand-accent/20">
                        {report.reason}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-primary/40">
                        Reported by: <span className="text-brand-primary">{report.reporter?.username}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-primary/20">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="bg-brand-secondary/50 p-6 border border-brand-primary/5 relative">
                      <div className="text-[9px] uppercase tracking-widest font-bold text-brand-primary/30 mb-2">
                        Message from <span className="text-brand-primary">{report.message?.sender?.username}</span>:
                      </div>
                      <p className="text-sm text-brand-primary font-serif italic leading-relaxed">"{report.message?.message}"</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-3 min-w-[160px]">
                    <button 
                      onClick={() => handleResolve(report.id, 'delete_message')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Msg
                    </button>
                    <button 
                      onClick={() => handleResolve(report.id, 'dismiss')}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-secondary text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border border-brand-primary/10"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
