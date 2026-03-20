import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Link as LinkIcon, CheckCircle, Clock, AlertCircle, ExternalLink, User, MessageSquare, Save, X } from 'lucide-react';

interface Task {
  id: string;
  batch_id: string;
  title: string;
  details: string;
  deadline: string;
  gdocs_link: string;
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  trainee_id: string;
  gdocs_link: string;
  admin_comment: string | null;
  grade: number | null;
  submitted_at: string;
  trainee: {
    username: string;
    full_name: string;
  };
  task: {
    title: string;
  };
}

interface Batch {
  id: string;
  name: string;
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [newTask, setNewTask] = useState({
    batch_id: '',
    title: '',
    details: '',
    deadline: '',
    gdocs_link: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, subsRes, batchesRes] = await Promise.all([
        fetch('/api/admin/tasks'),
        fetch('/api/admin/tasks/submissions'),
        fetch('/api/admin/batches')
      ]);
      
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks);
      }
      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubmissions(data.submissions);
      }
      if (batchesRes.ok) {
        const data = await batchesRes.json();
        setBatches(data.batches);
        if (data.batches.length > 0) {
          setNewTask(prev => ({ ...prev, batch_id: data.batches[0].id }));
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setSuccess('Task created successfully!');
        setShowCreateModal(false);
        setNewTask({ batch_id: batches[0]?.id || '', title: '', details: '', deadline: '', gdocs_link: '' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create task');
      }
    } catch (err) {
      setError('An error occurred during task creation');
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/tasks/submissions/${gradingSubmission.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, comment })
      });
      if (res.ok) {
        setSuccess('Submission graded successfully!');
        setGradingSubmission(null);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to grade submission');
      }
    } catch (err) {
      setError('An error occurred during grading');
    }
  };

  if (loading) return <div className="p-12 text-center text-brand-primary/40 italic font-serif">Loading task data...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-12">
      <div className="flex justify-between items-center formal-card p-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Management</div>
          <h3 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-brand-accent/60" />
            Task Management
          </h3>
          <p className="text-sm text-brand-primary/40 italic font-serif mt-1">Create assignments and grade trainee submissions.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-formal flex items-center gap-2 !px-8 !py-4"
        >
          <Plus className="w-4 h-4" /> Create New Task
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 text-xs font-medium border-l-2 border-red-500">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-600 p-4 text-xs font-medium border-l-2 border-emerald-500">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Tasks List */}
        <div className="lg:col-span-1 space-y-8">
          <h4 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Assigned Tasks
          </h4>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="formal-card p-8 text-center text-brand-primary/40 italic font-serif text-xs">No tasks created yet.</div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="formal-card p-6 hover:border-brand-accent/30 transition-colors group">
                  <div className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-2">
                    {batches.find(b => b.id === task.batch_id)?.name || 'Unknown Batch'}
                  </div>
                  <h5 className="text-lg font-serif text-brand-primary mb-2 group-hover:text-brand-accent transition-colors">{task.title}</h5>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className="lg:col-span-2 space-y-8">
          <h4 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Trainee Submissions
          </h4>
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="formal-card p-12 text-center text-brand-primary/40 italic font-serif">No submissions received yet.</div>
            ) : (
              submissions.map(sub => (
                <div key={sub.id} className="formal-card p-8 hover:border-brand-accent/30 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-brand-accent/60" />
                        <h5 className="text-xl font-serif text-brand-primary">{sub.trainee.full_name || sub.trainee.username}</h5>
                        <span className="text-[10px] font-mono text-brand-primary/30 italic">@{sub.trainee.username}</span>
                      </div>
                      <div className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList className="w-3 h-3" />
                        Task: {sub.task.title}
                      </div>
                    </div>
                    {sub.grade !== null ? (
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 mb-1">Graded</div>
                        <div className="text-2xl font-serif font-bold text-brand-primary">{sub.grade}%</div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-amber-500 mb-1">Pending Grade</div>
                        <button 
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGrade(sub.grade || 0);
                            setComment(sub.admin_comment || '');
                          }}
                          className="text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:underline"
                        >
                          Grade Now
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-brand-primary/5">
                    <a 
                      href={sub.gdocs_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand-accent flex items-center gap-2 hover:underline"
                    >
                      <LinkIcon className="w-3 h-3" /> View Submission <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="text-[10px] font-mono text-brand-primary/30 italic">
                      Submitted on {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>

                  {sub.admin_comment && (
                    <div className="mt-6 p-4 bg-brand-secondary/50 border-l-2 border-brand-accent italic">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-brand-accent mb-2">Admin Feedback</div>
                      <p className="text-sm text-brand-primary/70">{sub.admin_comment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-white formal-card w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-brand-primary/5 flex justify-between items-center bg-brand-secondary/30">
              <div>
                <h3 className="text-2xl font-serif text-brand-primary">Create New Task</h3>
                <p className="text-[10px] uppercase tracking-widest text-brand-primary/40 font-bold mt-1">Define assignment details</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-brand-primary/30 hover:text-brand-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Target Batch</label>
                  <select 
                    value={newTask.batch_id} 
                    onChange={e => setNewTask({...newTask, batch_id: e.target.value})}
                    className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-sm font-serif text-brand-primary focus:outline-none focus:border-brand-accent transition-colors"
                    required
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Deadline</label>
                  <input 
                    type="datetime-local" 
                    value={newTask.deadline} 
                    onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                    className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-sm font-serif text-brand-primary focus:outline-none focus:border-brand-accent transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Task Title</label>
                <input 
                  type="text" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-sm font-serif text-brand-primary focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="e.g. Amazon Sourcing Assignment 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Task Details</label>
                <textarea 
                  value={newTask.details} 
                  onChange={e => setNewTask({...newTask, details: e.target.value})}
                  className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-sm font-serif text-brand-primary focus:outline-none focus:border-brand-accent transition-colors min-h-[120px]"
                  placeholder="Provide detailed instructions..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Reference Link (Optional)</label>
                <input 
                  type="url" 
                  value={newTask.gdocs_link} 
                  onChange={e => setNewTask({...newTask, gdocs_link: e.target.value})}
                  className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-sm font-serif text-brand-primary focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Link to instructions doc..."
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-8 py-3 text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 hover:text-brand-primary transition-colors">Cancel</button>
                <button type="submit" className="btn-formal !px-12">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-white formal-card w-full max-w-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-brand-primary/5 flex justify-between items-center bg-brand-secondary/30">
              <div>
                <h3 className="text-2xl font-serif text-brand-primary">Grade Submission</h3>
                <p className="text-[10px] uppercase tracking-widest text-brand-primary/40 font-bold mt-1">Reviewing: {gradingSubmission.trainee.username}</p>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="text-brand-primary/30 hover:text-brand-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleGradeSubmission} className="p-8 space-y-8">
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em]">Submission Link</h5>
                <a 
                  href={gradingSubmission.gdocs_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-serif text-brand-accent hover:underline flex items-center gap-2"
                >
                  {gradingSubmission.gdocs_link} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Grade (0-100)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={grade} 
                  onChange={e => setGrade(parseInt(e.target.value))}
                  className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-2xl font-serif text-brand-accent focus:outline-none focus:border-brand-accent transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Admin Comment</label>
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)}
                  className="w-full border-b border-brand-primary/20 bg-transparent py-3 text-sm font-serif text-brand-primary focus:outline-none focus:border-brand-accent transition-colors min-h-[100px]"
                  placeholder="Provide feedback to the trainee..."
                  required
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setGradingSubmission(null)} className="px-8 py-3 text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 hover:text-brand-primary transition-colors">Cancel</button>
                <button type="submit" className="btn-formal !px-12 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
