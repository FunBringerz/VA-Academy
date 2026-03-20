import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Link as LinkIcon, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  details: string;
  deadline: string;
  gdocs_link: string;
  submission?: {
    id: string;
    gdocs_link: string;
    grade: number | null;
    admin_comment: string | null;
    submitted_at: string;
  };
}

export default function Tasks({ user }: { user: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (taskId: string) => {
    if (!submissionLink) return;
    setSubmitting(taskId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gdocs_link: submissionLink })
      });
      if (res.ok) {
        setSuccess('Task submitted successfully!');
        setSubmissionLink('');
        fetchTasks();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit task');
      }
    } catch (err) {
      setError('An error occurred during submission');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-brand-primary/40 italic font-serif">Loading tasks...</div>;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-12">
      <div className="flex justify-between items-center formal-card p-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Assignments</div>
          <h3 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-brand-accent/60" />
            My Tasks
          </h3>
          <p className="text-sm text-brand-primary/40 italic font-serif mt-1">Submit your work and track your grades.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 text-xs font-medium border-l-2 border-red-500">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-600 p-4 text-xs font-medium border-l-2 border-emerald-500">{success}</div>}

      <div className="grid gap-8">
        {tasks.length === 0 ? (
          <div className="formal-card p-12 text-center text-brand-primary/40 italic font-serif">No tasks assigned yet.</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="formal-card overflow-hidden group">
              <div className="p-8 border-b border-brand-primary/5 bg-brand-secondary/30 flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-serif text-brand-primary mb-2">{task.title}</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-primary/40">
                      <Calendar className="w-3 h-3" />
                      Deadline: {new Date(task.deadline).toLocaleString()}
                    </div>
                    {task.submission ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                        <CheckCircle className="w-3 h-3" />
                        Submitted
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
                {task.submission?.grade !== null && task.submission?.grade !== undefined && (
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 mb-1">Grade</div>
                    <div className="text-3xl font-serif font-bold text-brand-accent">{task.submission.grade}%</div>
                  </div>
                )}
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em]">Task Details</h5>
                  <p className="text-sm text-brand-primary/70 leading-relaxed whitespace-pre-wrap">{task.details}</p>
                  {task.gdocs_link && (
                    <a 
                      href={task.gdocs_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-brand-accent hover:underline"
                    >
                      <LinkIcon className="w-3 h-3" /> Reference Document <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {task.submission ? (
                  <div className="pt-8 border-t border-brand-primary/5 space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em]">Your Submission</h5>
                        <a 
                          href={task.submission.gdocs_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-serif text-brand-primary/60 hover:text-brand-accent transition-colors flex items-center gap-2"
                        >
                          {task.submission.gdocs_link} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-[10px] font-mono text-brand-primary/30 italic">
                        Submitted on {new Date(task.submission.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {task.submission.admin_comment && (
                      <div className="p-4 bg-brand-secondary/50 border-l-2 border-brand-accent italic">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-brand-accent mb-2">Admin Feedback</div>
                        <p className="text-sm text-brand-primary/70">{task.submission.admin_comment}</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button 
                        onClick={() => {
                          setSubmitting(task.id);
                          setSubmissionLink(task.submission?.gdocs_link || '');
                        }}
                        className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 hover:text-brand-accent transition-colors"
                      >
                        Resubmit Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-8 border-t border-brand-primary/5 space-y-6">
                    <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em]">Submit Your Work</h5>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/30" />
                        <input 
                          type="url" 
                          placeholder="Paste your Google Docs link here..." 
                          value={submitting === task.id ? submissionLink : ''}
                          onChange={(e) => {
                            setSubmitting(task.id);
                            setSubmissionLink(e.target.value);
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-brand-secondary/50 border border-brand-primary/5 text-sm font-serif italic focus:outline-none focus:border-brand-accent/50"
                        />
                      </div>
                      <button 
                        onClick={() => handleSubmit(task.id)}
                        disabled={submitting === task.id && !submissionLink}
                        className="btn-formal !px-8"
                      >
                        {submitting === task.id ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                    <p className="text-[10px] text-brand-primary/30 italic">Please ensure your Google Doc is shared with "Anyone with the link can view/comment".</p>
                  </div>
                )}

                {submitting === task.id && submissionLink && task.submission && (
                  <div className="pt-8 border-t border-brand-primary/5 space-y-6 animate-in fade-in slide-in-from-top-2">
                    <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em]">Resubmission</h5>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/30" />
                        <input 
                          type="url" 
                          placeholder="Paste your new Google Docs link here..." 
                          value={submissionLink}
                          onChange={(e) => setSubmissionLink(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-brand-secondary/50 border border-brand-primary/5 text-sm font-serif italic focus:outline-none focus:border-brand-accent/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSubmit(task.id)}
                          className="btn-formal !px-8"
                        >
                          Update
                        </button>
                        <button 
                          onClick={() => {
                            setSubmitting(null);
                            setSubmissionLink('');
                          }}
                          className="px-6 py-2 text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 hover:text-brand-primary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
