import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form State
  const [registrationCode, setRegistrationCode] = useState('');
  const [account, setAccount] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [profile, setProfile] = useState({
    firstName: '', mi: '', lastName: '', age: '', birthday: '', address: '', contactNumber: ''
  });
  const [academic, setAcademic] = useState({
    elementary: { schoolName: '', yearGraduated: '' },
    highSchool: { schoolName: '', yearGraduated: '' },
    seniorHigh: { schoolName: '', yearGraduated: '', strand: '' },
    college: { schoolName: '', yearGraduated: '', degree: '' }
  });
  const [work, setWork] = useState({
    category: '', companyName: '', duration: ''
  });
  const [vaExperience, setVaExperience] = useState<any[]>([
    { company: '', duration: '' }
  ]);
  const [hasVaExperience, setHasVaExperience] = useState('No');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (account.password !== account.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const payload = {
        registrationCode,
        username: account.username,
        email: account.email,
        password: account.password,
        profile: {
          fullName: { first: profile.firstName, mi: profile.mi, last: profile.lastName },
          age: parseInt(profile.age),
          birthday: profile.birthday,
          address: profile.address,
          contactNumber: profile.contactNumber
        },
        academicBackground: academic,
        workBackground: [work],
        amazonVaExperience: {
          hasExperience: hasVaExperience,
          experiences: hasVaExperience === 'Yes' ? vaExperience : []
        }
      };

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('handleNext called, current step:', step);
    
    if (step === 1) {
      console.log('Validating registration code:', registrationCode);
      try {
        const res = await fetch('/api/validate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: registrationCode })
        });
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response data:', data);
        if (!res.ok) throw new Error(data.error || 'Invalid code');
        console.log('Code is valid, moving to next step');
        nextStep();
      } catch (err: any) {
        console.error('Error validating code:', err);
        setError(err.message);
      }
    } else if (step === 2) {
      if (account.password !== account.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      nextStep();
    } else if (step === 5) {
      handleSignup(e);
    } else {
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full formal-card p-12 relative">
        <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-slate-400 hover:text-brand-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-primary mb-2">Trainee Registration</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Step {step} of 5</p>
        </div>
        
        {/* Progress Bar */}
        <div className="flex mb-12 justify-between gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`flex-1 h-[2px] ${step >= i ? 'bg-brand-accent' : 'bg-slate-200'}`} />
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 mb-6 text-xs font-medium border-l-2 border-red-500">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-600 p-4 mb-6 text-xs font-medium border-l-2 border-emerald-500">{success}</div>}
        
        <form onSubmit={handleNext} className="flex flex-col gap-8">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-primary">Registration Code</h3>
              <p className="text-xs text-slate-500 mb-8 font-light">Please enter the unique credential provided by your administrator.</p>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Access Key</label>
                <input 
                  type="text" 
                  value={registrationCode} 
                  onChange={e => setRegistrationCode(e.target.value)}
                  className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm"
                  placeholder="Enter code..."
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-primary">Account Credentials</h3>
              <p className="text-xs text-slate-500 mb-8 font-light">Define your digital identity within the portal.</p>
              <div className="grid gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Email Address</label>
                  <input type="email" value={account.email} onChange={e => setAccount({...account, email: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Username</label>
                  <input type="text" value={account.username} onChange={e => setAccount({...account, username: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Password</label>
                  <input type="password" value={account.password} onChange={e => setAccount({...account, password: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Confirm Password</label>
                  <input type="password" value={account.confirmPassword} onChange={e => setAccount({...account, confirmPassword: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-primary">Personal Profile</h3>
              <p className="text-xs text-slate-500 mb-8 font-light">Official identification details for your trainee record.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">First Name</label>
                  <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">M.I.</label>
                  <input type="text" value={profile.mi} onChange={e => setProfile({...profile, mi: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Last Name</label>
                  <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Age</label>
                  <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Birthday</label>
                  <input type="date" value={profile.birthday} onChange={e => setProfile({...profile, birthday: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
              </div>
              <div className="grid gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Residential Address</label>
                  <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Contact Number</label>
                  <input type="text" value={profile.contactNumber} onChange={e => setProfile({...profile, contactNumber: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-primary">Academic History</h3>
              <p className="text-xs text-slate-500 mb-8 font-light">Educational background and qualifications.</p>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">Elementary</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <input type="text" placeholder="School Name" value={academic.elementary.schoolName} onChange={e => setAcademic({...academic, elementary: {...academic.elementary, schoolName: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                    <input type="text" placeholder="Year Graduated (or N/A)" value={academic.elementary.yearGraduated} onChange={e => setAcademic({...academic, elementary: {...academic.elementary, yearGraduated: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">High School</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <input type="text" placeholder="School Name" value={academic.highSchool.schoolName} onChange={e => setAcademic({...academic, highSchool: {...academic.highSchool, schoolName: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                    <input type="text" placeholder="Year Graduated (or N/A)" value={academic.highSchool.yearGraduated} onChange={e => setAcademic({...academic, highSchool: {...academic.highSchool, yearGraduated: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">Senior High School</h4>
                  <div className="grid grid-cols-3 gap-8">
                    <input type="text" placeholder="School Name" value={academic.seniorHigh.schoolName} onChange={e => setAcademic({...academic, seniorHigh: {...academic.seniorHigh, schoolName: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                    <input type="text" placeholder="Year Graduated (or N/A)" value={academic.seniorHigh.yearGraduated} onChange={e => setAcademic({...academic, seniorHigh: {...academic.seniorHigh, yearGraduated: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                    <input type="text" placeholder="Strand" value={academic.seniorHigh.strand} onChange={e => setAcademic({...academic, seniorHigh: {...academic.seniorHigh, strand: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">College</h4>
                  <div className="grid grid-cols-3 gap-8">
                    <input type="text" placeholder="School Name" value={academic.college.schoolName} onChange={e => setAcademic({...academic, college: {...academic.college, schoolName: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                    <input type="text" placeholder="Year Graduated (or N/A/Current)" value={academic.college.yearGraduated} onChange={e => setAcademic({...academic, college: {...academic.college, yearGraduated: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                    <input type="text" placeholder="Degree" value={academic.college.degree} onChange={e => setAcademic({...academic, college: {...academic.college, degree: e.target.value}})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" required />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-serif font-bold mb-2 text-brand-primary">Professional Experience</h3>
              <p className="text-xs text-slate-500 mb-8 font-light">Prior work history and specialized VA experience.</p>
              
              <div className="space-y-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">General Background</h4>
                  <div className="grid gap-8">
                    <input type="text" placeholder="Category of Work" value={work.category} onChange={e => setWork({...work, category: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" />
                    <input type="text" placeholder="Company/Agency Name" value={work.companyName} onChange={e => setWork({...work, companyName: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" />
                    <input type="text" placeholder="Duration (e.g. Jan 2020 - Dec 2022)" value={work.duration} onChange={e => setWork({...work, duration: e.target.value})} className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">Specialized VA Experience</h4>
                  <div className="flex gap-8 mb-4">
                    <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-600 cursor-pointer">
                      <input type="radio" name="vaExp" value="Yes" checked={hasVaExperience === 'Yes'} onChange={() => setHasVaExperience('Yes')} className="accent-brand-primary" /> Yes
                    </label>
                    <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-600 cursor-pointer">
                      <input type="radio" name="vaExp" value="No" checked={hasVaExperience === 'No'} onChange={() => setHasVaExperience('No')} className="accent-brand-primary" /> No
                    </label>
                  </div>
                  {hasVaExperience === 'Yes' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
                      {vaExperience.map((exp, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-lg relative">
                          {vaExperience.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setVaExperience(vaExperience.filter((_, i) => i !== idx))}
                              className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          )}
                          <div className="grid gap-8">
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Company/Client</label>
                              <input 
                                type="text" 
                                placeholder="Enter company name..." 
                                value={exp.company} 
                                onChange={e => {
                                  const newExp = [...vaExperience];
                                  newExp[idx].company = e.target.value;
                                  setVaExperience(newExp);
                                }} 
                                className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" 
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Duration</label>
                              <input 
                                type="text" 
                                placeholder="e.g. March 2024 - January 2025" 
                                value={exp.duration} 
                                onChange={e => {
                                  const newExp = [...vaExperience];
                                  newExp[idx].duration = e.target.value;
                                  setVaExperience(newExp);
                                }} 
                                className="w-full border-b border-slate-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent text-sm" 
                                required 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => setVaExperience([...vaExperience, { company: '', duration: '' }])}
                        className="w-full py-3 border-2 border-dashed border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all rounded-lg"
                      >
                        + Add Another Experience
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-12 pt-8 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary transition-colors">Back</button>
            ) : <div></div>}
            
            <button type="submit" className="btn-formal !px-12 !py-4">
              {step === 5 ? 'Finalize Registration' : 'Continue'}
            </button>
          </div>
        </form>
        
        <div className="mt-12 text-center">
          <button onClick={() => navigate('/')} className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-primary transition-colors">
            &larr; Return to Public Domain
          </button>
        </div>
      </div>
    </div>
  );
}
