import React, { useState, useEffect } from 'react';
import { Users, UserX, Mail, Phone, Calendar, MapPin, Briefcase, GraduationCap, ChevronRight, ArrowLeft } from 'lucide-react';

export default function AdminUsers() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [trainees, setTrainees] = useState<any[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
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
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchTrainees = async (batchId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trainees/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.trainees || []).sort((a: any, b: any) => {
          const nameA = typeof a.full_name === 'string' ? a.full_name : (a.full_name?.last || a.username);
          const nameB = typeof b.full_name === 'string' ? b.full_name : (b.full_name?.last || b.username);
          return nameA.localeCompare(nameB);
        });
        setTrainees(sorted);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (selectedTrainee) {
    return (
      <div className="flex flex-col gap-12">
        <button 
          onClick={() => setSelectedTrainee(null)} 
          className="flex items-center gap-2 text-brand-primary/40 hover:text-brand-primary transition w-fit uppercase text-[10px] tracking-[0.2em] font-bold"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Trainees List
        </button>

        <div className="formal-card p-12">
          <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12 pb-12 border-b border-brand-primary/5">
            <div className="w-24 h-24 bg-brand-primary text-white flex items-center justify-center text-3xl font-serif">
              {typeof selectedTrainee.full_name === 'string' ? selectedTrainee.full_name[0].toUpperCase() : (selectedTrainee.full_name?.first?.[0] || selectedTrainee.username[0].toUpperCase())}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Trainee Profile</div>
              <h2 className="text-4xl font-serif text-brand-primary mb-1">
                {typeof selectedTrainee.full_name === 'string' ? selectedTrainee.full_name : (selectedTrainee.full_name ? `${selectedTrainee.full_name.first} ${selectedTrainee.full_name.mi ? selectedTrainee.full_name.mi + '.' : ''} ${selectedTrainee.full_name.last}` : selectedTrainee.username)}
              </h2>
              <p className="text-brand-primary/40 font-mono text-xs italic">@{selectedTrainee.username}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-12">
              <div>
                <h3 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-brand-primary/70 text-sm">
                    <Mail className="w-4 h-4 text-brand-accent/50" /> {selectedTrainee.email_address || selectedTrainee.email}
                  </div>
                  <div className="flex items-center gap-4 text-brand-primary/70 text-sm">
                    <Phone className="w-4 h-4 text-brand-accent/50" /> {selectedTrainee.contact_number || 'N/A'}
                  </div>
                  <div className="flex items-start gap-4 text-brand-primary/70 text-sm">
                    <MapPin className="w-4 h-4 text-brand-accent/50 mt-0.5" /> {selectedTrainee.address || 'N/A'}
                  </div>
                  <div className="flex items-center gap-4 text-brand-primary/70 text-sm">
                    <Calendar className="w-4 h-4 text-brand-accent/50" /> {selectedTrainee.birthday || 'N/A'} (Age: {selectedTrainee.age || 'N/A'})
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-6">Amazon VA Experience</h3>
                <div className="bg-brand-secondary/50 p-6 border-l-2 border-brand-accent">
                  <p className="text-sm font-serif italic text-brand-primary mb-2">Has Experience: {selectedTrainee.amazon_va_experience?.hasExperience || 'No'}</p>
                  {selectedTrainee.amazon_va_experience?.hasExperience === 'Yes' && (
                    <div className="space-y-4 mt-4">
                      {(selectedTrainee.amazon_va_experience.experiences || []).map((exp: any, idx: number) => (
                        <div key={idx} className="text-xs text-brand-primary/60 space-y-1 font-mono border-t border-brand-primary/5 pt-3 first:border-0 first:pt-0">
                          <p>Company: {exp.company || 'N/A'}</p>
                          <p>Duration: {exp.duration || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div>
                <h3 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-6">Academic Background</h3>
                <div className="space-y-8">
                  {['college', 'seniorHigh', 'highSchool', 'elementary'].map((level) => {
                    const data = selectedTrainee.academic_background?.[level];
                    if (!data?.schoolName) return null;
                    return (
                      <div key={level} className="flex items-start gap-4 text-brand-primary/70">
                        <GraduationCap className="w-4 h-4 text-brand-accent/50 mt-1" />
                        <div>
                          <p className="text-xs uppercase tracking-wider font-bold text-brand-primary/40 mb-1">
                            {level === 'college' ? 'College' : level === 'seniorHigh' ? 'Senior High' : level === 'highSchool' ? 'High School' : 'Elementary'}
                          </p>
                          <p className="text-sm font-serif text-brand-primary">{data.schoolName}</p>
                          <p className="text-xs italic text-brand-primary/50">
                            {level === 'seniorHigh' ? data.strand : level === 'college' ? data.degree : ''} {data.yearGraduated ? `(${data.yearGraduated})` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-6">Work Background</h3>
                <div className="space-y-6">
                  {selectedTrainee.work_background?.map((work: any, idx: number) => (
                    work.companyName && (
                      <div key={idx} className="flex items-start gap-4 text-brand-primary/70">
                        <Briefcase className="w-4 h-4 text-brand-accent/50 mt-1" />
                        <div>
                          <p className="text-sm font-serif text-brand-primary">{work.companyName}</p>
                          <p className="text-xs text-brand-primary/60">{work.category}</p>
                          <p className="text-[10px] font-mono text-brand-primary/40">{work.duration}</p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-brand-primary/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] uppercase tracking-widest text-brand-primary/30 font-bold">
            <div>Joined: {new Date(selectedTrainee.created_at || Date.now()).toLocaleDateString()}</div>
            <div className="flex items-center gap-2">
              Registration Code: 
              <span className="font-mono bg-brand-secondary px-3 py-1 text-brand-primary/60">{selectedTrainee.registration_code || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="formal-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Administration</div>
          <h3 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-accent/60" />
            Trainees
          </h3>
          <p className="text-sm text-brand-primary/40 italic font-serif mt-1">View trainee profiles and details per batch.</p>
        </div>
        <div className="w-full md:w-80">
          <label className="block text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-3">Select Batch</label>
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm focus:border-brand-accent outline-none appearance-none font-serif text-brand-primary cursor-pointer"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id} className="bg-white text-brand-primary">{b.name}</option>
              ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary/30">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="formal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-secondary/50 text-brand-primary/40 border-b border-brand-primary/5">
              <tr>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Name</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Code</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Username</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em]">Email</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-brand-primary/40 italic font-serif">Loading trainees...</td>
                </tr>
              ) : trainees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-brand-primary/40 italic font-serif">No trainees found in this batch.</td>
                </tr>
              ) : (
                trainees.map((trainee) => (
                  <tr 
                    key={trainee.id} 
                    className="hover:bg-brand-secondary/30 transition cursor-pointer group" 
                    onClick={() => setSelectedTrainee(trainee)}
                  >
                    <td className="p-6">
                      <div className="font-serif text-brand-primary group-hover:text-brand-accent transition">
                        {typeof trainee.full_name === 'string' ? trainee.full_name : (trainee.full_name ? `${trainee.full_name.last}, ${trainee.full_name.first}` : 'N/A')}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-mono text-[10px] bg-brand-secondary px-2 py-1 text-brand-primary/40 group-hover:text-brand-accent transition">
                        {trainee.registration_code || 'N/A'}
                      </span>
                    </td>
                    <td className="p-6 text-xs font-mono text-brand-primary/50 italic">@{trainee.username}</td>
                    <td className="p-6 text-sm text-brand-primary/60">{trainee.email_address || trainee.email}</td>
                    <td className="p-6 text-right">
                      <button className="text-[10px] uppercase tracking-widest font-bold text-brand-accent/60 group-hover:text-brand-accent flex items-center justify-end gap-2 w-full transition">
                        View Profile <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
