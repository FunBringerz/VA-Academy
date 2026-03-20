import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, ExternalLink } from 'lucide-react';

export default function Meetings({ user }: { user: any }) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
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

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="formal-card p-8 flex justify-between items-center bg-white">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Schedule</p>
          <h2 className="text-2xl font-serif font-bold text-brand-primary">My Meetings</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium italic">Upcoming 1-on-1s and group sessions</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-400 font-serif italic">Loading scheduled sessions...</div>
      ) : meetings.length === 0 ? (
        <div className="formal-card p-20 bg-white text-center">
          <div className="w-20 h-20 bg-brand-secondary/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-secondary">
            <Calendar className="w-8 h-8 text-brand-accent" />
          </div>
          <h3 className="text-xl font-serif font-bold text-brand-primary mb-4">No Upcoming Meetings</h3>
          <p className="text-slate-500 text-sm font-light italic max-w-xs mx-auto">"Your schedule is currently clear. Check back later for new appointments."</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {meetings.map((meeting) => {
            const meetingDate = new Date(meeting.meeting_time);
            const isPast = meetingDate < new Date();
            
            return (
              <div key={meeting.id} className={`formal-card p-8 bg-white transition-all duration-500 ${isPast ? 'opacity-40 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                <div className="flex justify-between items-start mb-8">
                  <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${meeting.meeting_type === 'group' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-brand-secondary text-brand-accent border border-brand-accent/20'}`}>
                    {meeting.meeting_type === 'group' ? 'Group Session' : 'Private 1-on-1'}
                  </div>
                  {isPast && <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 uppercase tracking-widest border border-slate-100">Concluded</span>}
                </div>
                
                <h3 className="text-xl font-serif font-bold text-brand-primary mb-8 leading-tight">{meeting.subject}</h3>
                
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <Calendar className="w-4 h-4 text-brand-accent" />
                    <span className="font-medium">{meetingDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <Clock className="w-4 h-4 text-brand-accent" />
                    <span className="font-mono">{meetingDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <Users className="w-4 h-4 text-brand-accent" />
                    <span className="font-medium italic">Administrative Host</span>
                  </div>
                </div>
                
                <a 
                  href={meeting.meeting_link} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`w-full flex items-center justify-center gap-3 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${isPast ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-primary text-white hover:bg-slate-800 shadow-lg'}`}
                >
                  <Video className="w-4 h-4" />
                  Enter Meeting Room
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
