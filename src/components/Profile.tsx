import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Save, Edit2 } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-brand-primary/40 italic font-serif">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-12 text-center text-brand-primary/40 italic font-serif">Profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="flex justify-between items-center formal-card p-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Account Settings</div>
          <h3 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
            <User className="w-6 h-6 text-brand-accent/60" />
            My Profile
          </h3>
          <p className="text-sm text-brand-primary/40 italic font-serif mt-1">Your registered personal information.</p>
        </div>
      </div>

      <div className="formal-card overflow-hidden">
        <div className="p-12 border-b border-brand-primary/5 bg-brand-secondary/30 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-brand-primary text-white flex items-center justify-center text-3xl font-serif">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-3xl font-serif text-brand-primary mb-1">{user.full_name || user.username}</h4>
            <p className="text-xs uppercase tracking-widest font-bold text-brand-primary/30">
              <span className="font-mono italic">@{user.username}</span> • {user.role}
            </p>
          </div>
        </div>

        <div className="p-12 space-y-16">
          {/* Contact Info */}
          <div>
            <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-accent/50" /> Contact Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Email Address</label>
                <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                  {user.email_address || 'N/A'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Phone Number</label>
                <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                  {user.contact_number || 'N/A'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Age / Birthday</label>
                <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                  {user.age || 'N/A'} • {user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Residential Address
                </label>
                <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                  {user.address || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Amazon VA Experience */}
          <div>
            <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <User className="w-4 h-4 text-brand-accent/50" /> Amazon VA Experience
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Has Experience?</label>
                <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                  {user.amazon_va_experience?.hasExperience === 'Yes' ? 'Yes' : 'No'}
                </div>
              </div>
              {user.amazon_va_experience?.hasExperience === 'Yes' && (
                <div className="md:col-span-2 space-y-6">
                  {user.amazon_va_experience?.experiences?.map((exp: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-12 p-4 bg-brand-secondary/20 border border-brand-primary/5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Company</label>
                        <div className="text-sm font-serif text-brand-primary/60">{exp.company || 'N/A'}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Duration</label>
                        <div className="text-sm font-serif text-brand-primary/60">{exp.duration || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Academic Background */}
          <div>
            <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-brand-accent/50" /> Academic Background
            </h5>
            <div className="space-y-12">
              {['elementary', 'highSchool', 'seniorHigh', 'college'].map((level) => {
                const data = user.academic_background?.[level] || {};
                return (
                  <div key={level} className="space-y-6">
                    <h6 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">
                      {level === 'elementary' ? 'Elementary' : 
                       level === 'highSchool' ? 'High School' : 
                       level === 'seniorHigh' ? 'Senior High School' : 'College / University'}
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">School Name</label>
                        <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                          {data.schoolName || 'N/A'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Year Graduated</label>
                        <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                          {data.yearGraduated || 'N/A'}
                        </div>
                      </div>
                      {level === 'seniorHigh' && (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Strand</label>
                          <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                            {data.strand || 'N/A'}
                          </div>
                        </div>
                      )}
                      {level === 'college' && (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Degree</label>
                          <div className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-3 text-sm font-serif text-brand-primary/60">
                            {data.degree || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h5 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-brand-accent/50" /> Work Experience
            </h5>
            <div className="space-y-6">
              {user.work_background?.map((work: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-12 p-6 bg-brand-secondary/20 border border-brand-primary/5">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Company Name</label>
                    <div className="text-sm font-serif text-brand-primary/60">
                      {work.companyName || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Category</label>
                    <div className="text-sm font-serif text-brand-primary/60">
                      {work.category || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/40">Duration</label>
                    <div className="text-sm font-serif text-brand-primary/60">
                      {work.duration || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
