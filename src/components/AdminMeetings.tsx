import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, Plus, X } from 'lucide-react';

export default function AdminMeetings({ user }: { user: any }) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    subject: '',
    meeting_time: '',
    meeting_link: '',
    recipient_type: 'group',
    selected_users: [] as string[]
  });

  useEffect(() => {
    fetchBatches();
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchTrainees(selectedBatch);
    } else {
      setTrainees([]);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
        if (data.batches && data.batches.length > 0) {
          setSelectedBatch(data.batches[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrainees = async (batchId: string) => {
    try {
      const res = await fetch(`/api/admin/trainees/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setTrainees(data.trainees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/admin/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure meeting_time is in a format Postgres likes (ISO string)
      const formattedTime = new Date(formData.meeting_time).toISOString();
      
      const res = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          meeting_time: formattedTime,
          batch_id: selectedBatch 
        })
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ subject: '', meeting_time: '', meeting_link: '', recipient_type: 'group', selected_users: [] });
        fetchMeetings();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to schedule meeting');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while scheduling the meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_users: prev.selected_users.includes(userId)
        ? prev.selected_users.filter(id => id !== userId)
        : [...prev.selected_users, userId]
    }));
  };

  const filteredTrainees = trainees.filter(t => {
    const name = typeof t.full_name === 'string' 
      ? t.full_name.toLowerCase() 
      : (t.full_name ? `${t.full_name.first || ''} ${t.full_name.last || ''}`.trim().toLowerCase() : t.username.toLowerCase());
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 bg-white p-10 formal-card">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Scheduling</p>
          <h3 className="text-3xl font-serif font-bold text-brand-primary">Manage Meetings</h3>
          <p className="text-xs font-serif italic text-brand-primary/60 mt-1">Schedule 1-on-1s or group sessions for trainees</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 w-full md:w-auto">
          <div className="w-full md:w-72">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 mb-2">Select Active Batch</label>
            <div className="bg-brand-secondary/50 px-4 py-3 border border-brand-primary/5 rounded-xl">
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest text-brand-primary focus:outline-none cursor-pointer"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-brand-primary/90 transition shadow-lg rounded-xl whitespace-nowrap"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel Operation' : 'Schedule New Event'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-10 formal-card animate-in fade-in slide-in-from-top-4">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">New Event</p>
            <h4 className="text-2xl font-serif font-bold text-brand-primary">Meeting Details</h4>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Subject / Title</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Meeting Link (Zoom/Meet)</label>
                <input 
                  type="url" 
                  value={formData.meeting_link}
                  onChange={e => setFormData({...formData, meeting_link: e.target.value})}
                  className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.meeting_time}
                  onChange={e => setFormData({...formData, meeting_time: e.target.value})}
                  className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Recipient Scope</label>
                <select 
                  value={formData.recipient_type}
                  onChange={e => setFormData({...formData, recipient_type: e.target.value, selected_users: []})}
                  className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors appearance-none cursor-pointer font-bold uppercase tracking-widest"
                >
                  <option value="group">ALL (ENTIRE BATCH)</option>
                  <option value="individual">INDIVIDUAL SELECTION</option>
                </select>
              </div>
            </div>

            {formData.recipient_type === 'individual' && (
              <div className="bg-brand-secondary/50 p-8 border border-brand-primary/5">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-primary mb-4">Select Trainee(s)</label>
                <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-2 mb-6">
                  <Plus className="w-3 h-3 text-brand-accent" />
                  <input
                    type="text"
                    placeholder="SEARCH BY NAME..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[10px] tracking-widest w-full outline-none uppercase font-bold"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTrainees.map(u => (
                    <label key={u.id} className={`flex items-center gap-4 p-4 border transition-all cursor-pointer ${formData.selected_users.includes(u.id) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-primary border-brand-primary/10 hover:border-brand-accent'}`}>
                      <input 
                        type="checkbox" 
                        checked={formData.selected_users.includes(u.id)}
                        onChange={() => handleUserToggle(u.id)}
                        className="w-4 h-4 text-brand-accent focus:ring-brand-accent rounded-none border-brand-primary/20"
                      />
                      <span className="text-[10px] uppercase tracking-wider font-bold">
                        {typeof u.full_name === 'string' 
                          ? u.full_name 
                          : (u.full_name ? `${u.full_name.first || ''} ${u.full_name.last || ''}`.trim() : u.username)}
                      </span>
                    </label>
                  ))}
                  {filteredTrainees.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-brand-primary/30 font-serif italic">No trainees found.</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-8">
              <button type="submit" className="btn-formal px-12">
                Finalize Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-brand-primary/40 font-serif italic">Loading scheduled meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-white formal-card text-brand-primary/40 font-serif italic">No meetings scheduled.</div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="bg-white p-8 formal-card hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${meeting.is_all ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'}`}>
                  {meeting.is_all ? 'Group Session' : '1-on-1 Meeting'}
                </div>
                {meeting.batch_name && (
                  <div className="text-[9px] font-bold uppercase tracking-widest text-brand-primary/40 bg-brand-secondary px-2 py-1 border border-brand-primary/5">
                    {meeting.batch_name}
                  </div>
                )}
              </div>
              <h4 className="text-2xl font-serif font-bold text-brand-primary mb-4 group-hover:text-brand-accent transition-colors">{meeting.subject}</h4>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-brand-primary/60">
                  <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                  {new Date(meeting.meeting_time).toLocaleString()}
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-brand-primary/60">
                  <Users className="w-3.5 h-3.5 text-brand-accent" />
                  {meeting.is_all ? 'All Trainees' : `${meeting.meeting_participants?.length || 0} Participant(s)`}
                </div>
              </div>
              <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="btn-outline-formal w-full flex items-center justify-center gap-2">
                <Video className="w-3.5 h-3.5" /> Join Session
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
