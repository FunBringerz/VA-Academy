import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, Trash2, Video, FileText, ChevronRight, AlertCircle } from 'lucide-react';

interface VideoContent {
  url: string;
  title: string;
  description: string;
  is_important: boolean;
}

interface DailyContent {
  id?: string;
  day_number: number;
  videos: VideoContent[];
  quiz_questions: any[];
}

const DAYS = [
  { num: 1, name: 'Day 1' },
  { num: 2, name: 'Day 2' },
  { num: 3, name: 'Day 3' },
  { num: 4, name: 'Day 4' },
  { num: 5, name: 'Day 5' },
];

export default function AdminLessons() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [content, setContent] = useState<DailyContent>({
    day_number: 1,
    videos: [],
    quiz_questions: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchContent(selectedDay);
  }, [selectedDay]);

  const fetchContent = async (day: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-content?day=${day}`);
      const data = await res.json();
      if (data.content) {
        // Handle legacy data structure if necessary
        const videos = data.content.videos || (data.content.video_url ? [{
          url: data.content.video_url,
          title: data.content.video_title || '',
          description: data.content.video_description || '',
          is_important: false
        }] : []);
        
        setContent({
          ...data.content,
          videos
        });
      } else {
        setContent({
          day_number: day,
          videos: [],
          quiz_questions: []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/daily-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      if (res.ok) {
        setMessage('Content saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error saving content.');
    } finally {
      setSaving(false);
    }
  };

  const addVideo = () => {
    setContent({
      ...content,
      videos: [...content.videos, { url: '', title: '', description: '', is_important: false }]
    });
  };

  const updateVideo = (idx: number, updates: Partial<VideoContent>) => {
    const newVideos = [...content.videos];
    newVideos[idx] = { ...newVideos[idx], ...updates };
    setContent({ ...content, videos: newVideos });
  };

  const removeVideo = (idx: number) => {
    setContent({
      ...content,
      videos: content.videos.filter((_, i) => i !== idx)
    });
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'mcq',
      question: '',
      options: ['', '', ''],
      answer: ''
    };
    setContent({
      ...content,
      quiz_questions: [...content.quiz_questions, newQuestion]
    });
  };

  const updateQuestion = (id: number, updates: any) => {
    setContent({
      ...content,
      quiz_questions: content.quiz_questions.map(q => q.id === id ? { ...q, ...updates } : q)
    });
  };

  const removeQuestion = (id: number) => {
    setContent({
      ...content,
      quiz_questions: content.quiz_questions.filter(q => q.id !== id)
    });
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="bg-white p-10 formal-card flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <BookOpen className="w-8 h-8 text-brand-accent" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-1">Curriculum</p>
              <h3 className="text-3xl font-serif font-bold text-brand-primary">Lectures/Quizzes</h3>
            </div>
          </div>
          <p className="text-xs font-serif italic text-brand-primary/60">Configure daily lessons, videos, and quiz questions.</p>
        </div>

        <div className="flex items-center gap-2 bg-brand-secondary/50 px-6 py-3 border border-brand-primary/5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 mr-2">Target Day:</span>
          {DAYS.map(day => (
            <button
              key={day.num}
              onClick={() => setSelectedDay(day.num)}
              className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-all ${selectedDay === day.num ? 'bg-brand-accent text-brand-primary shadow-lg' : 'hover:bg-brand-primary/5 text-brand-primary/40'}`}
            >
              {day.num}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-brand-primary/40 italic font-serif">Loading content for Day {selectedDay}...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Video Configuration */}
          <div className="bg-white p-10 formal-card space-y-10">
            <div className="flex justify-between items-center border-b border-brand-primary/5 pb-6">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-brand-accent" />
                <h4 className="text-xl font-serif font-bold text-brand-primary">Lecture Videos</h4>
              </div>
              <button
                onClick={addVideo}
                className="text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:text-brand-primary transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Add Video
              </button>
            </div>

            <div className="space-y-12 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {content.videos.map((video, idx) => (
                <div key={idx} className="p-6 bg-brand-secondary/30 border border-brand-primary/5 space-y-6 relative group">
                  <button
                    onClick={() => removeVideo(idx)}
                    className="absolute top-4 right-4 text-brand-primary/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-primary/40">Video {idx + 1}</label>
                      {video.url && (
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[8px] uppercase tracking-widest font-bold text-brand-accent hover:underline flex items-center gap-1"
                        >
                          <Video className="w-2.5 h-2.5" /> Preview
                        </a>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={video.is_important}
                        onChange={e => updateVideo(idx, { is_important: e.target.checked })}
                        className="accent-brand-accent"
                      />
                      <span className="text-[9px] uppercase tracking-widest font-bold text-brand-accent">Mark as Important</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Title</label>
                      <input
                        type="text"
                        value={video.title}
                        onChange={e => updateVideo(idx, { title: e.target.value })}
                        placeholder="Video Title"
                        className="w-full border-b border-brand-primary/10 bg-transparent py-2 text-sm font-serif italic focus:border-brand-accent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">URL</label>
                      <input
                        type="url"
                        value={video.url}
                        onChange={e => updateVideo(idx, { url: e.target.value })}
                        placeholder="https://youtube.com/..."
                        className="w-full border-b border-brand-primary/10 bg-transparent py-2 text-sm font-mono focus:border-brand-accent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Description</label>
                      <textarea
                        value={video.description}
                        onChange={e => updateVideo(idx, { description: e.target.value })}
                        placeholder="Optional description"
                        rows={2}
                        className="w-full border border-brand-primary/5 bg-white/50 p-3 text-xs font-serif italic focus:border-brand-accent outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {content.videos.length === 0 && (
                <div className="text-center py-12 text-brand-primary/30 italic font-serif">No videos added yet.</div>
              )}
            </div>
          </div>

          {/* Quiz Configuration */}
          <div className="bg-white p-10 formal-card space-y-10">
            <div className="flex justify-between items-center border-b border-brand-primary/5 pb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-accent" />
                <h4 className="text-xl font-serif font-bold text-brand-primary">Question Bank</h4>
              </div>
              <button
                onClick={addQuestion}
                className="text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:text-brand-primary transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>

            <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {content.quiz_questions.map((q, idx) => (
                <div key={q.id} className="p-6 bg-brand-secondary/30 border border-brand-primary/5 space-y-6 relative group">
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="absolute top-4 right-4 text-brand-primary/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-brand-primary/40">Question {idx + 1}</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateQuestion(q.id, { question: e.target.value })}
                      className="w-full bg-transparent border-b border-brand-primary/10 py-2 text-sm font-serif italic focus:border-brand-accent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {q.options.map((opt: string, oIdx: number) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.answer === opt && opt !== ''}
                          onChange={() => updateQuestion(q.id, { answer: opt })}
                          className="accent-brand-accent"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...q.options];
                            newOpts[oIdx] = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }}
                          placeholder={`Option ${oIdx + 1}`}
                          className="flex-1 bg-transparent border-b border-brand-primary/5 py-1 text-xs focus:border-brand-accent outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {content.quiz_questions.length === 0 && (
                <div className="text-center py-12 text-brand-primary/30 italic font-serif">No questions added yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-brand-primary p-8 formal-card text-white">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-5 h-5 text-brand-accent" />
          <p className="text-xs uppercase tracking-widest font-bold text-white/60">
            {message || `Reviewing configuration for Day ${selectedDay}`}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-accent text-brand-primary px-12 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all shadow-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Publish Content'}
        </button>
      </div>
    </div>
  );
}
