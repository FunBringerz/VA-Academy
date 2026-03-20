import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Calendar, X, Save, CheckCircle2 } from 'lucide-react';

export default function AdminBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Scheduling states
  const [schedulingBatch, setSchedulingBatch] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBatches(data.batches || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (batchId: string) => {
    try {
      const res = await fetch(`/api/admin/batch-schedules/${batchId}`);
      const data = await res.json();
      if (res.ok) {
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSchedule = (batch: any) => {
    setSchedulingBatch(batch);
    setSchedules([]);
    fetchSchedules(batch.id);
  };

  const handleSaveSchedule = async () => {
    if (!schedulingBatch) return;
    setIsSavingSchedule(true);
    try {
      const res = await fetch('/api/admin/batch-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: schedulingBatch.id,
          schedules: [1, 2, 3, 4, 5].map(day => ({
            day_number: day,
            scheduled_date: schedules.find(s => s.day_number === day)?.scheduled_date || ''
          })).filter(s => s.scheduled_date)
        })
      });
      if (res.ok) {
        setScheduleSuccess('Schedule updated successfully.');
        setTimeout(() => {
          setScheduleSuccess('');
          setSchedulingBatch(null);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const updateScheduleDate = (day: number, date: string) => {
    setSchedules(prev => {
      const existing = prev.find(s => s.day_number === day);
      if (existing) {
        return prev.map(s => s.day_number === day ? { ...s, scheduled_date: date } : s);
      }
      return [...prev, { day_number: day, scheduled_date: date }];
    });
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    setIsCreating(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newBatchName.trim(),
          start_date: newBatchStartDate || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setBatches([data.batch, ...batches]);
      setNewBatchName('');
      setNewBatchStartDate('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStartDate = async (id: string, date: string) => {
    try {
      const res = await fetch(`/api/admin/batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: date })
      });
      if (res.ok) {
        setBatches(batches.map(b => b.id === id ? { ...b, start_date: date } : b));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-brand-primary/40 italic font-serif">Loading batches...</div>;

  return (
    <div className="flex flex-col gap-12">
      <div className="formal-card p-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Administration</div>
        <h3 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
          <Layers className="w-6 h-6 text-brand-accent/60" />
          Manage Batches
        </h3>
        <p className="text-sm text-brand-primary/40 italic font-serif mt-1">Organize trainees into specific training groups.</p>
      </div>

      {error && <div className="bg-red-50 text-red-900 p-4 border-l-4 border-red-500 font-serif italic text-sm">{error}</div>}

      <div className="formal-card p-8">
        <h4 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-6">Create New Batch</h4>
        <form onSubmit={handleCreateBatch} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Batch Name</label>
            <input
              type="text"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              placeholder="e.g., Batch 1 - 2026"
              className="w-full border-b border-brand-primary/20 bg-transparent py-2 text-sm focus:border-brand-accent outline-none font-serif text-brand-primary"
              required
            />
          </div>
          <div className="w-full md:w-64 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Day 1 Start Date</label>
            <input
              type="date"
              value={newBatchStartDate}
              onChange={(e) => setNewBatchStartDate(e.target.value)}
              className="w-full border-b border-brand-primary/20 bg-transparent py-2 text-sm focus:border-brand-accent outline-none font-mono text-brand-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="btn-formal whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Create Batch'}
          </button>
        </form>
      </div>

      <div className="formal-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-secondary/50 text-brand-primary/40 border-b border-brand-primary/5">
            <tr>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Batch Name</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Day 1 Start Date</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Actions</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/5">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-brand-primary/40 italic font-serif">No batches found.</td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-brand-secondary/30 transition group">
                  <td className="p-6 font-serif text-brand-primary group-hover:text-brand-accent transition">{batch.name}</td>
                  <td className="p-6">
                    <input
                      type="date"
                      value={batch.start_date ? batch.start_date.split('T')[0] : ''}
                      onChange={(e) => handleUpdateStartDate(batch.id, e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-brand-primary/20 focus:border-brand-accent outline-none text-xs font-mono transition-colors"
                    />
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => handleOpenSchedule(batch)}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:text-brand-primary transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Set Schedule
                    </button>
                  </td>
                  <td className="p-6 text-brand-primary/40 text-xs font-mono italic">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      {schedulingBatch && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-10 formal-card max-w-lg w-full animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-serif text-brand-primary">Lecture Schedule</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-brand-accent mt-1">{schedulingBatch.name}</p>
              </div>
              <button onClick={() => setSchedulingBatch(null)} className="text-slate-400 hover:text-brand-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {scheduleSuccess ? (
              <div className="bg-emerald-50 text-emerald-600 p-6 border border-emerald-100 flex items-center gap-3 text-xs font-bold uppercase tracking-widest mb-8">
                <CheckCircle2 className="w-5 h-5" />
                {scheduleSuccess}
              </div>
            ) : (
              <div className="space-y-6 mb-10">
                {[1, 2, 3, 4, 5].map(day => (
                  <div key={day} className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-sm font-serif text-brand-primary">Day {day} Lecture</span>
                    <input 
                      type="date"
                      value={schedules.find(s => s.day_number === day)?.scheduled_date || ''}
                      onChange={(e) => updateScheduleDate(day, e.target.value)}
                      className="bg-transparent border-b border-brand-primary/10 focus:border-brand-accent outline-none text-xs font-mono py-1"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-6">
              <button 
                onClick={() => setSchedulingBatch(null)}
                className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="btn-formal"
              >
                <Save className="w-4 h-4" />
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
