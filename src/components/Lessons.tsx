import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

export default function Lessons({ user }: { user: any }) {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [activeVideoIdx, setActiveVideoIdx] = useState<number>(0);
  const [completedVideos, setCompletedVideos] = useState<number[]>([]);
  const [watchTime, setWatchTime] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizDuration, setQuizDuration] = useState<number | null>(null);
  const [dailyContent, setDailyContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch daily content and existing progress
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contentRes, progressRes] = await Promise.all([
          fetch('/api/daily-content'),
          fetch('/api/quiz-progress')
        ]);
        
        const contentData = await contentRes.json();
        const progressData = await progressRes.json();
        
        if (contentData.error) {
          setError(contentData.error);
        } else {
          setDailyContent(contentData.content);
          setCurrentDay(parseInt(contentData.current_day || '1'));
        }
        
        if (progressData.progress) {
          setWatchTime(progressData.progress.time_spent_seconds || 0);
          setCompletedVideos(progressData.progress.videos_completed || []);
          if (progressData.progress.quiz_score !== null) {
            setScore(progressData.progress.quiz_score);
            setQuizCompleted(true);
            setQuizDuration(progressData.progress.quiz_duration_seconds || null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save progress function
  const saveProgress = (updates: any) => {
    fetch('/api/quiz-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_number: currentDay,
        videos_completed: completedVideos,
        time_spent_seconds: watchTime,
        quiz_score: quizCompleted ? score : null,
        quiz_duration_seconds: quizDuration,
        total_items: dailyContent?.quiz_questions?.length || 0,
        is_general_test: currentDay === 100,
        ...updates
      })
    });
  };

  useEffect(() => {
    let timer: any;
    if (!quizStarted && !quizCompleted && !document.hidden) {
      timer = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          if (newTime % 30 === 0) { // Save every 30 seconds
            saveProgress({ time_spent_seconds: newTime });
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, currentDay]);

  const handleMarkVideoDone = (idx: number) => {
    if (!completedVideos.includes(idx)) {
      const newCompleted = [...completedVideos, idx];
      setCompletedVideos(newCompleted);
      saveProgress({ videos_completed: newCompleted });
      
      // Auto move to next video if available
      if (dailyContent.videos && idx < dailyContent.videos.length - 1) {
        setActiveVideoIdx(idx + 1);
      }
    }
  };

  const dailyQuestions = dailyContent?.quiz_questions || [];
  const videos = dailyContent?.videos || [];
  const allVideosDone = videos.length > 0 && completedVideos.length === videos.length;

  const handleAnswer = (val: string) => {
    setAnswers({ ...answers, [currentQuestion]: val });
  };

  const submitQuiz = () => {
    let correct = 0;
    dailyQuestions.forEach((q: any, idx: number) => {
      if (q.type === 'mcq') {
        if (answers[idx] === q.answer) correct++;
      } else {
        if (answers[idx]?.toLowerCase().trim() === q.answer.toLowerCase()) correct++;
      }
    });

    const duration = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
    setQuizDuration(duration);
    setScore(correct);
    setQuizCompleted(true);
    setQuizStarted(false);
    
    // Save final quiz results
    saveProgress({
      quiz_score: correct,
      quiz_duration_seconds: duration,
      total_items: dailyQuestions.length
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-serif italic text-brand-primary/40">Accessing archives...</p>
    </div>
  );

  if (error) return (
    <div className="formal-card p-12 text-center space-y-6 max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8 text-brand-accent" />
      </div>
      <h3 className="text-2xl font-serif text-brand-primary">Lecture Not Yet Available</h3>
      <p className="text-sm text-brand-primary/60 leading-relaxed italic font-serif">
        {error}
      </p>
      <div className="pt-6 border-t border-brand-primary/5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-primary/30">
          Please return on the scheduled date to access this module.
        </p>
      </div>
    </div>
  );

  if (!dailyContent) {
    return (
      <div className="formal-card p-20 bg-white text-center">
        <AlertCircle className="w-12 h-12 text-brand-accent mx-auto mb-6" />
        <h2 className="text-2xl font-serif font-bold text-brand-primary mb-4">No Lesson Scheduled</h2>
        <p className="text-sm text-brand-primary/60 italic font-serif">There is no content published for Day {currentDay} yet. Please check back later.</p>
      </div>
    );
  }

  const activeVideo = videos[activeVideoIdx];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="formal-card p-8 flex justify-between items-center bg-white">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Curriculum</p>
          <h2 className="text-2xl font-serif font-bold text-brand-primary">Day {currentDay} Lectures</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium italic">
            {currentDay === 100 ? 'General Test' : `Module ${currentDay} • Daily Evaluation`}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-end">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Watch Time</p>
            <div className="flex items-center gap-2 text-sm font-mono font-medium text-brand-primary">
              <Clock className="w-3.5 h-3.5 text-brand-accent" />
              {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Progress</p>
            <div className="flex items-center gap-2 text-sm font-serif italic text-brand-primary">
              {completedVideos.length} / {videos.length} Videos
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Video List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="formal-card p-6 bg-white">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-primary/40 mb-6">Lectures List</h3>
            <div className="space-y-3">
              {videos.map((v: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`w-full text-left p-4 border transition-all flex items-start gap-3 ${activeVideoIdx === idx ? 'border-brand-accent bg-brand-secondary/30' : 'border-slate-100 hover:border-brand-accent/30'}`}
                >
                  <div className={`mt-0.5 shrink-0 ${completedVideos.includes(idx) ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {completedVideos.includes(idx) ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold uppercase tracking-wider truncate ${activeVideoIdx === idx ? 'text-brand-primary' : 'text-slate-500'}`}>
                      {v.title || `Video ${idx + 1}`}
                    </p>
                    {v.is_important && (
                      <span className="text-[8px] text-brand-accent font-bold uppercase tracking-tighter">Important</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
              {allVideosDone ? (
                <button 
                  onClick={() => {
                    setQuizStarted(true);
                    setQuizStartTime(Date.now());
                  }}
                  disabled={quizCompleted}
                  className={`btn-formal w-full !py-4 ${quizCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {quizCompleted ? 'Quiz Completed' : 'Begin Assessment'}
                </button>
              ) : (
                <div className="bg-brand-secondary/50 border border-brand-secondary p-4 flex items-start gap-3">
                  <AlertCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                  <p className="text-[9px] text-brand-primary/60 leading-relaxed uppercase tracking-widest font-bold">
                    Complete all videos to unlock quiz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {!quizStarted && !quizCompleted && activeVideo && (
            <div className="formal-card overflow-hidden bg-white">
              <div className="aspect-video bg-brand-primary flex items-center justify-center relative group">
                {activeVideo.url ? (
                  <iframe
                    src={activeVideo.url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <PlayCircle className="w-16 h-16 text-white/20" />
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Video URL not provided</p>
                  </div>
                )}
              </div>
              <div className="p-10 flex justify-between items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-serif font-bold text-brand-primary">{activeVideo.title}</h3>
                    {activeVideo.is_important && (
                      <span className="bg-brand-accent/10 text-brand-accent text-[9px] font-bold px-3 py-1 uppercase tracking-widest border border-brand-accent/20">Important</span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-light italic font-serif">
                    {activeVideo.description || 'No description provided for this lecture.'}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkVideoDone(activeVideoIdx)}
                  disabled={completedVideos.includes(activeVideoIdx)}
                  className={`shrink-0 px-8 py-4 text-[10px] uppercase tracking-widest font-bold transition-all ${completedVideos.includes(activeVideoIdx) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary shadow-lg'}`}
                >
                  {completedVideos.includes(activeVideoIdx) ? 'Completed' : 'Mark as Done'}
                </button>
              </div>
            </div>
          )}

          {quizStarted && !quizCompleted && (
            <div className="formal-card p-10 bg-white animate-in fade-in duration-700">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent font-bold mb-1">Assessment</p>
                  <h3 className="text-xl font-serif font-bold text-brand-primary">Day {currentDay} Quiz</h3>
                </div>
                <span className="text-[10px] font-bold text-brand-primary bg-brand-secondary px-4 py-2 uppercase tracking-widest">
                  Question {currentQuestion + 1} of {dailyQuestions.length}
                </span>
              </div>

              <div className="mb-12">
                <p className="text-xl text-brand-primary font-serif italic mb-10 leading-relaxed">"{dailyQuestions[currentQuestion].question}"</p>
                
                {dailyQuestions[currentQuestion].type === 'mcq' ? (
                  <div className="grid gap-4">
                    {dailyQuestions[currentQuestion].options?.map((opt: string, idx: number) => (
                      <label key={idx} className={`flex items-center gap-4 p-5 border transition-all duration-300 cursor-pointer ${answers[currentQuestion] === opt ? 'border-brand-accent bg-brand-secondary/50' : 'border-slate-100 hover:border-brand-accent/30 hover:bg-brand-secondary/20'}`}>
                        <input 
                          type="radio" 
                          name={`q-${currentQuestion}`} 
                          value={opt}
                          checked={answers[currentQuestion] === opt}
                          onChange={(e) => handleAnswer(e.target.value)}
                          className="w-4 h-4 accent-brand-accent"
                        />
                        <span className="text-sm font-medium text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Your Answer</label>
                    <input 
                      type="text" 
                      value={answers[currentQuestion] || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full border-b border-slate-200 py-3 focus:outline-none focus:border-brand-accent transition-colors bg-transparent text-sm font-serif italic"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-12 pt-8 border-t border-slate-50">
                <button 
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                
                {currentQuestion === dailyQuestions.length - 1 ? (
                  <button 
                    onClick={submitQuiz}
                    disabled={!answers[currentQuestion]}
                    className="btn-formal !px-10"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentQuestion(prev => Math.min(dailyQuestions.length - 1, prev + 1))}
                    disabled={!answers[currentQuestion]}
                    className="btn-formal !px-10"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          )}

          {quizCompleted && (
            <div className="formal-card p-16 bg-white text-center animate-in zoom-in-95 duration-700">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-brand-primary mb-4">Quiz Completed</h2>
              <p className="text-slate-500 text-sm font-light mb-12 max-w-sm mx-auto italic">"The beautiful thing about learning is that no one can take it away from you."</p>
              
              <div className="bg-brand-secondary/30 p-10 inline-block min-w-[300px] mb-12 border border-brand-secondary">
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-4">Final Assessment Score</div>
                <div className="text-5xl font-serif font-bold text-brand-primary mb-4">
                  {score} <span className="text-xl text-slate-300 font-sans font-light">/ {dailyQuestions.length}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-brand-accent mb-4">
                  {score / dailyQuestions.length >= 0.8 ? 'Distinction Achievement' : 'Standard Completion'}
                </div>
                {quizDuration !== null && (
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Time Taken: {Math.floor(quizDuration / 60)}m {quizDuration % 60}s
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
