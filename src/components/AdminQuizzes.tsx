import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calendar, 
  CheckCircle2, 
  CheckCircle,
  Clock, 
  ChevronRight, 
  Video, 
  X,
  GripVertical,
  AlertCircle,
  BookOpen,
  Users,
  Search,
  Filter,
  Wand2
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuizProgress {
  id: string;
  trainee_id: string;
  day_number: number;
  videos_completed: number[];
  time_spent_seconds: number;
  quiz_score: number;
  quiz_duration_seconds: number | null;
  total_items: number;
  is_general_test: boolean;
  trainee: {
    id: string;
    username: string;
    full_name: any;
  };
}

interface Batch {
  id: string;
  name: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const DAYS = [
  { num: 1, name: 'Day 1' },
  { num: 2, name: 'Day 2' },
  { num: 3, name: 'Day 3' },
  { num: 4, name: 'Day 4' },
  { num: 5, name: 'Day 5' },
];

interface VideoItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  is_important: boolean;
  sequence_order: number;
}

interface SortableVideoItemProps {
  video: VideoItem;
  onRemove: (id: string) => void;
  key?: any;
}

function SortableVideoItem({ video, onRemove }: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group flex items-center gap-4 p-4 bg-white border ${video.is_important ? 'border-brand-accent/30' : 'border-slate-100'} rounded-xl hover:border-brand-primary/20 transition-all duration-300 shadow-sm hover:shadow-md mb-3`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-50 rounded-lg transition-colors">
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 truncate">{video.title}</h4>
          {video.is_important && (
            <span className="px-1.5 py-0.5 bg-brand-accent/10 text-brand-accent text-[8px] font-bold uppercase tracking-widest rounded">Important</span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 truncate font-serif italic">{video.url}</p>
        {video.description && (
          <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">{video.description}</p>
        )}
      </div>

      <button 
        onClick={() => onRemove(video.id)}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminQuizzes() {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [videosByDay, setVideosByDay] = useState<Record<number, VideoItem[]>>({});
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({ url: '', title: '', description: '', is_important: false });
  const [isSavingVideos, setIsSavingVideos] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setVideosByDay((prev) => {
        const currentVideos = prev[activeDay] || [];
        const oldIndex = currentVideos.findIndex((v) => v.id === active.id);
        const newIndex = currentVideos.findIndex((v) => v.id === over.id);
        
        const newVideos = arrayMove(currentVideos, oldIndex, newIndex).map((v: any, idx: number) => ({
          ...(v as object),
          sequence_order: idx
        }));

        return {
          ...prev,
          [activeDay]: newVideos
        };
      });
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/admin/videos');
      if (response.ok) {
        const data = await response.json();
        const grouped = data.videos.reduce((acc: any, v: any) => {
          if (!acc[v.day_number]) acc[v.day_number] = [];
          acc[v.day_number].push(v);
          return acc;
        }, {});
        // Sort each day by sequence_order
        Object.keys(grouped).forEach(day => {
          grouped[day].sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        });
        setVideosByDay(grouped);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleAddVideo = async () => {
    if (!newVideo.url || !newVideo.title) return;
    
    try {
      const response = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVideo,
          day_number: activeDay,
          sequence_order: (videosByDay[activeDay]?.length || 0)
        })
      });

      if (response.ok) {
        setShowAddVideo(false);
        setNewVideo({ url: '', title: '', description: '', is_important: false });
        fetchVideos();
      }
    } catch (error) {
      console.error('Error adding video:', error);
    }
  };

  const handleRemoveVideo = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setShowDeleteConfirm(null);
        fetchVideos();
      }
    } catch (error) {
      console.error('Error removing video:', error);
    }
  };

  const handleSaveOrder = async () => {
    setIsSavingVideos(true);
    try {
      const response = await fetch('/api/admin/videos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: videosByDay[activeDay] })
      });
      if (response.ok) {
        alert('Video order saved successfully.');
      }
    } catch (error) {
      console.error('Error saving video order:', error);
    } finally {
      setIsSavingVideos(false);
    }
  };
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [progressData, setProgressData] = useState<QuizProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSchedule, setTestSchedule] = useState('');
  
  // Scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  // View All Videos states
  const [showAllVideosModal, setShowAllVideosModal] = useState(false);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    fetch('/api/admin/batches')
      .then(res => res.json())
      .then(data => {
        setBatches(data.batches || []);
        if (data.batches?.length > 0) {
          setSelectedBatch(data.batches[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      setLoading(true);
      fetch(`/api/admin/quiz-progress/${selectedBatch}`)
        .then(res => res.json())
        .then(data => {
          setProgressData(data.progress || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedBatch]);

  const handleOpenBank = async (day: any) => {
    setSelectedDay(day);
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-content?day=${day.num}`);
      const data = await res.json();
      setQuestions(data.content?.quiz_questions || []);
      setShowBankModal(true);
    } catch (err) {
      console.error('Error fetching bank:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async () => {
    if (!selectedDay) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/daily-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_number: selectedDay.num,
          quiz_questions: questions
        })
      });
      if (res.ok) {
        setShowBankModal(false);
      }
    } catch (err) {
      console.error('Error saving bank:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTest = async () => {
    if (!selectedBatch) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: selectedBatch,
          scheduled_time: testSchedule || new Date().toISOString()
        })
      });
      if (res.ok) {
        alert('General test generated successfully!');
        setShowTestModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate test');
      }
    } catch (err) {
      console.error('Error generating test:', err);
    } finally {
      setSaving(false);
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

  const handleOpenSchedule = () => {
    if (!selectedBatch) return;
    setSchedules([]);
    fetchSchedules(selectedBatch);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedBatch) return;
    setIsSavingSchedule(true);
    try {
      const res = await fetch('/api/admin/batch-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: selectedBatch,
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
          setShowScheduleModal(false);
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

  const handleViewAllVideos = async () => {
    setLoadingVideos(true);
    setShowAllVideosModal(true);
    try {
      const results = await Promise.all([1, 2, 3, 4, 5].map(day => 
        fetch(`/api/daily-content?day=${day}`).then(res => res.json())
      ));
      
      const all: any[] = [];
      results.forEach((res, idx) => {
        const dayNum = idx + 1;
        if (res.content?.videos) {
          res.content.videos.forEach((v: any) => {
            all.push({ ...v, day: dayNum });
          });
        }
      });
      setAllVideos(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === 'question') {
      newQuestions[index].question = value;
    } else if (field === 'correctAnswer') {
      newQuestions[index].correctAnswer = parseInt(value);
    }
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  // Group progress by trainee
  const traineeProgress = progressData.reduce((acc: any, curr) => {
    const traineeId = curr.trainee_id;
    if (!acc[traineeId]) {
      acc[traineeId] = {
        trainee: curr.trainee,
        days: {},
      };
    }
    acc[traineeId].days[curr.day_number] = curr;
    return acc;
  }, {});

  const filteredTrainees = Object.values(traineeProgress).filter((tp: any) => {
    const name = typeof tp.trainee.full_name === 'string' ? tp.trainee.full_name : (tp.trainee.full_name ? `${tp.trainee.full_name.first || ''} ${tp.trainee.full_name.last || ''}`.trim() : tp.trainee.username);
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || tp.trainee.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Controls */}
      <div className="bg-white p-8 formal-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-brand-accent" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold">Progress Tracking</p>
          </div>
          <h3 className="text-2xl font-serif font-bold text-brand-primary">Trainee Quiz Progress</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto items-start md:items-center">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleViewAllVideos}
              className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-brand-primary/90 transition shadow-lg rounded-xl"
            >
              <Video className="w-4 h-4" /> View All Videos
            </button>
            <button 
              onClick={handleOpenSchedule}
              className="flex items-center gap-2 px-6 py-3 border-2 border-brand-primary/10 text-brand-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-brand-primary/5 transition rounded-xl"
            >
              <Calendar className="w-4 h-4" /> Schedule Dates
            </button>
            <button 
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-brand-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-brand-accent/80 transition shadow-lg rounded-xl"
            >
              <Wand2 className="w-4 h-4" /> Generate Test
            </button>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/30" />
              <input 
                type="text" 
                placeholder="Search trainee..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-brand-secondary/50 border border-brand-primary/5 text-xs font-serif italic focus:outline-none focus:border-brand-accent/50 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 bg-brand-secondary/50 px-4 py-3 border border-brand-primary/5 rounded-xl min-w-[160px]">
              <Filter className="w-4 h-4 text-brand-primary/30" />
              <select 
                value={selectedBatch} 
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 focus:outline-none cursor-pointer w-full"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Question Banks */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DAYS.map(day => (
          <button
            key={day.num}
            onClick={() => handleOpenBank(day)}
            className="bg-white p-6 formal-card hover:border-brand-accent/30 transition group text-left"
          >
            <div className="text-[10px] uppercase tracking-widest text-brand-accent font-bold mb-2">{day.name}</div>
            <div className="text-lg font-serif font-bold text-brand-primary group-hover:text-brand-accent transition">Question Bank</div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-primary/40 font-mono italic">
              <ChevronRight className="w-3 h-3" /> Manage Questions
            </div>
          </button>
        ))}
      </div>

      {/* Progress Table */}
      <div className="bg-white formal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-brand-secondary/50 text-brand-primary/40 border-b border-brand-primary/5">
              <tr>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] min-w-[200px]">Trainee</th>
                {DAYS.map(day => (
                  <th key={day.num} className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-center border-l border-brand-primary/5">
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {loading && !showBankModal ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-brand-primary/40 italic font-serif">Loading progress data...</td>
                </tr>
              ) : filteredTrainees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-brand-primary/40 italic font-serif">No progress data found for this batch.</td>
                </tr>
              ) : (
                filteredTrainees.map((tp: any) => {
                  const name = typeof tp.trainee.full_name === 'string' ? tp.trainee.full_name : (tp.trainee.full_name ? `${tp.trainee.full_name.first || ''} ${tp.trainee.full_name.last || ''}`.trim() : tp.trainee.username);
                  return (
                    <tr key={tp.trainee.id} className="hover:bg-brand-secondary/30 transition group">
                      <td className="p-6">
                        <div className="font-serif text-brand-primary group-hover:text-brand-accent transition font-bold">{name}</div>
                        <div className="text-[10px] font-mono text-brand-primary/40 italic mt-1">@{tp.trainee.username}</div>
                      </td>
                      {DAYS.map(day => {
                        const dayData = tp.days[day.num];
                        return (
                          <td key={day.num} className="p-6 border-l border-brand-primary/5">
                            {dayData ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${dayData.videos_completed?.length > 0 ? 'bg-emerald-500' : 'bg-brand-primary/10'}`}></div>
                                  <span className="text-[10px] font-mono text-brand-primary/60" title="Watch Time">{formatTime(dayData.time_spent_seconds)}</span>
                                </div>
                                <div className="text-sm font-serif font-bold text-brand-primary">
                                  {dayData.quiz_score} <span className="text-[10px] text-brand-primary/30 font-sans">/ {dayData.total_items}</span>
                                </div>
                                {dayData.quiz_duration_seconds !== null && (
                                  <div className="text-[8px] font-mono text-brand-accent/60" title="Quiz Duration">
                                    ⏱️ {formatTime(dayData.quiz_duration_seconds)}
                                  </div>
                                )}
                                {dayData.quiz_score / dayData.total_items >= 0.8 && (
                                  <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-500">Passed</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center opacity-20">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-brand-primary/10"></div>
                                  <span className="text-[10px] font-mono">--:--</span>
                                </div>
                                <div className="text-sm font-serif font-bold">--</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-8 px-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Video Completed</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-primary/10"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Video Incomplete</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Score / Total</span>
        </div>
      </div>

      {/* Question Bank Modal */}
      {showBankModal && selectedDay && (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-secondary w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 bg-white border-b border-brand-primary/5 flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-1">{selectedDay.name}</div>
                <h3 className="text-2xl font-serif font-bold text-brand-primary">Manage Question Bank</h3>
                <div className={`mt-2 inline-block px-3 py-1 text-[8px] font-bold uppercase tracking-widest border ${questions.length === 20 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-secondary text-brand-primary/40 border-brand-primary/10'}`}>
                  {questions.length} / 20 Questions
                </div>
                <p className="text-[8px] text-brand-primary/40 uppercase tracking-widest mt-2 ml-1 inline-block italic">Target: 20 per day</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 border border-brand-primary/10 text-[10px] uppercase tracking-widest font-bold text-brand-primary hover:bg-brand-primary/5 transition"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
                <button 
                  onClick={handleSaveBank}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white text-[10px] uppercase tracking-widest font-bold hover:bg-brand-primary/90 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={() => setShowBankModal(false)}
                  className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 hover:text-brand-primary transition"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-brand-primary/40 italic font-serif">
                  No questions in this bank yet. Click "Add Question" to start.
                </div>
              ) : (
                questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-white p-8 formal-card relative group">
                    <button 
                      onClick={() => removeQuestion(qIndex)}
                      className="absolute top-4 right-4 p-2 text-red-500/20 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-brand-primary/40 font-bold block mb-2">Question {qIndex + 1}</label>
                        <textarea 
                          value={q.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          className="w-full p-4 bg-brand-secondary/50 border border-brand-primary/5 text-sm font-serif italic focus:outline-none focus:border-brand-accent/50 min-h-[80px]"
                          placeholder="Enter question text..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-4">
                            <input 
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctAnswer === oIndex}
                              onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                              className="w-4 h-4 accent-brand-accent"
                            />
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className="flex-1 p-3 bg-brand-secondary/50 border border-brand-primary/5 text-xs focus:outline-none focus:border-brand-accent/50"
                              placeholder={`Option ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* General Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 formal-card shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Wand2 className="w-6 h-6 text-brand-accent" />
              <h3 className="text-2xl font-serif font-bold text-brand-primary">Generate General Test</h3>
            </div>
            
            <p className="text-sm text-brand-primary/60 font-serif italic mb-8">
              This will automatically select 10 questions from each day (Monday-Friday) to create a comprehensive 50-item test for the selected batch.
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-brand-primary/40 font-bold block mb-2">Schedule Test</label>
                <input 
                  type="datetime-local"
                  value={testSchedule}
                  onChange={(e) => setTestSchedule(e.target.value)}
                  className="w-full p-4 bg-brand-secondary/50 border border-brand-primary/5 text-xs focus:outline-none focus:border-brand-accent/50"
                />
                <p className="text-[10px] text-brand-primary/40 italic mt-2">Leave blank to start immediately.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleGenerateTest}
                  disabled={saving}
                  className="flex-1 py-3 bg-brand-primary text-white text-[10px] uppercase tracking-widest font-bold hover:bg-brand-primary/90 transition disabled:opacity-50"
                >
                  {saving ? 'Generating...' : 'Generate & Schedule'}
                </button>
                <button 
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-3 border border-brand-primary/10 text-[10px] uppercase tracking-widest font-bold text-brand-primary hover:bg-brand-primary/5 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-10 formal-card max-w-lg w-full animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-serif text-brand-primary">Lecture Schedule</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-brand-accent mt-1">
                  {batches.find(b => b.id === selectedBatch)?.name}
                </p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-brand-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {scheduleSuccess ? (
              <div className="bg-emerald-50 text-emerald-600 p-6 border border-emerald-100 flex items-center gap-3 text-xs font-bold uppercase tracking-widest mb-8">
                <CheckCircle className="w-5 h-5" />
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
                onClick={() => setShowScheduleModal(false)}
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

      {/* View All Videos Modal */}
      {showAllVideosModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Curriculum Repository</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Video Management System</p>
              </div>
              <button 
                onClick={() => setShowAllVideosModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all duration-300 text-slate-400 hover:text-brand-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day Selector */}
            <div className="px-8 py-4 bg-white/50 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
              {[1, 2, 3, 4, 5].map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                    activeDay === day 
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'bg-white text-slate-400 hover:text-brand-primary hover:bg-white border border-slate-100'
                  }`}
                >
                  Day {day}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/5 rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Day {activeDay} Content</h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{(videosByDay[activeDay]?.length || 0)} Videos Found</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveOrder}
                    disabled={isSavingVideos}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all duration-300 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingVideos ? 'Saving...' : 'Save Order'}
                  </button>
                  <button 
                    onClick={() => setShowAddVideo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all duration-300 shadow-lg shadow-brand-primary/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Video
                  </button>
                </div>
              </div>

              {showAddVideo && (
                <div className="mb-8 p-6 bg-white border border-brand-primary/10 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Video Title</label>
                        <input 
                          type="text"
                          value={newVideo.title}
                          onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                          placeholder="Enter title..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Video URL</label>
                        <input 
                          type="text"
                          value={newVideo.url}
                          onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Description (Optional)</label>
                      <textarea 
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                        placeholder="Brief description..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all h-20 resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-10 h-6 rounded-full transition-all duration-300 relative ${newVideo.is_important ? 'bg-brand-accent' : 'bg-slate-200'}`}>
                          <input 
                            type="checkbox"
                            checked={newVideo.is_important}
                            onChange={(e) => setNewVideo({ ...newVideo, is_important: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${newVideo.is_important ? 'left-5' : 'left-1'}`} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-800 transition-colors">Mark as Important</span>
                      </label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowAddVideo(false)}
                          className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddVideo}
                          className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all duration-300"
                        >
                          Add to Day {activeDay}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={(videosByDay[activeDay] || []).map(v => v.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {(videosByDay[activeDay] || []).length === 0 ? (
                      <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                        <Video className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">No videos assigned to this day</p>
                      </div>
                    ) : (
                      (videosByDay[activeDay] || []).map((video) => (
                        <SortableVideoItem 
                          key={video.id} 
                          video={video} 
                          onRemove={(id: string) => setShowDeleteConfirm(id)} 
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Delete Confirmation Overlay */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-sm rounded-[2rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Confirm Deletion</h3>
                <p className="text-sm text-slate-500 text-center mb-8">Are you sure you want to remove this video? This action cannot be undone.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleRemoveVideo(showDeleteConfirm)}
                    className="py-4 bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all duration-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
