import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, CheckCircle, XCircle, ChevronRight, Copy, Eye, EyeOff, X, Filter } from 'lucide-react';

export default function AdminCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchCodes();
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
        if (data.batches && data.batches.length > 0) {
          setBatchId(data.batches[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/admin/codes');
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!batchId) return;
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCode(data.code.code);
        setShowModal(true);
        // Automatically reveal the newly generated code in the table if it's visible
        setRevealedCodes(prev => ({ ...prev, [data.code.id]: true }));
        fetchCodes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCodes = filterBatchId === 'all' 
    ? codes 
    : codes.filter(c => c.batch_id === filterBatchId);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;
    try {
      const res = await fetch(`/api/admin/codes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCodes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-12 relative">
      {/* Modal for Generated Code */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-primary/60 backdrop-blur-md">
          <div className="formal-card max-w-md w-full p-10 animate-in fade-in zoom-in duration-300 border-t-4 border-t-brand-accent">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-brand-accent font-bold mb-2">Success</div>
                <h3 className="text-3xl font-serif text-brand-primary">Code Generated</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-brand-primary/30 hover:text-brand-primary transition p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-brand-secondary/50 p-6 mb-8 flex items-center justify-between group border border-brand-primary/5 relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1 h-full bg-brand-accent/30"></div>
              <span className="font-mono text-lg font-bold tracking-[0.15em] text-brand-primary whitespace-nowrap overflow-hidden text-ellipsis">{generatedCode}</span>
              <button 
                onClick={() => handleCopy(generatedCode)}
                className="ml-4 p-2 bg-white hover:bg-brand-accent hover:text-white transition shadow-sm text-brand-accent shrink-0"
                title="Copy to clipboard"
              >
                {copySuccess ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="space-y-4 mb-10">
              <p className="text-sm text-brand-primary/60 font-serif leading-relaxed">
                The registration code has been successfully created for the selected batch. 
              </p>
              <p className="text-xs text-brand-primary/40 italic font-serif">
                Please share this code with the trainee. They will need it to complete their registration.
              </p>
            </div>
            
            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-brand-primary text-white py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-brand-primary/90 transition-all shadow-lg"
            >
              Close & Continue
            </button>
          </div>
        </div>
      )}

      <div className="formal-card p-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Administration</div>
        <h3 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
          <Key className="w-6 h-6 text-brand-accent/60" />
          Registration Codes
        </h3>
        <p className="text-sm text-brand-primary/40 italic font-serif mt-1">Generate and manage codes for new trainees to sign up.</p>
      </div>

      <div className="formal-card p-8 border-l-4 border-l-brand-accent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-full md:w-64">
              <h4 className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.3em] mb-2">Select Batch</h4>
              <div className="relative">
                <select
                  value={batchId}
                  onChange={e => setBatchId(e.target.value)}
                  className="w-full border-b border-brand-primary/10 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none appearance-none font-serif text-brand-primary cursor-pointer transition-colors"
                  required
                >
                  <option value="" disabled className="bg-white text-brand-primary">Select a batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-white text-brand-primary">{b.name}</option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={!batchId}
            className="group relative overflow-hidden bg-brand-accent text-white py-3 px-8 flex items-center justify-center gap-3 hover:bg-brand-accent/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-fit mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4 relative z-10" /> 
            <span className="tracking-[0.2em] font-bold uppercase text-[10px] relative z-10">Generate Code</span>
          </button>
        </div>
      </div>

      <div className="formal-card overflow-hidden">
        <div className="p-8 border-b border-brand-primary/5 flex justify-between items-center bg-brand-primary/[0.02]">
          <div>
            <h4 className="text-lg font-serif text-brand-primary">Active Codes</h4>
            <p className="text-xs text-brand-primary/40 italic font-serif">Manage existing registration codes and track their usage.</p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-brand-accent" />
            <select 
              value={filterBatchId}
              onChange={e => setFilterBatchId(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase tracking-wider text-brand-primary/60 outline-none cursor-pointer hover:text-brand-accent transition-colors"
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-primary/[0.03]">
                <th className="px-8 py-5 text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] border-b border-brand-primary/5">Code</th>
                <th className="px-8 py-5 text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] border-b border-brand-primary/5">Batch</th>
                <th className="px-8 py-5 text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] border-b border-brand-primary/5">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] border-b border-brand-primary/5">Used By</th>
                <th className="px-8 py-5 text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] border-b border-brand-primary/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-brand-primary/40 font-serif italic">Loading codes...</td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-brand-primary/40 font-serif italic">No codes found.</td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-brand-primary/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-sm font-bold tracking-wider ${revealedCodes[code.id] ? 'text-brand-primary' : 'text-brand-primary/20 select-none'}`}>
                          {revealedCodes[code.id] ? code.code : '••••••••'}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleReveal(code.id)}
                            className="p-1.5 text-brand-primary/30 hover:text-brand-accent transition-colors"
                            title={revealedCodes[code.id] ? "Hide code" : "Reveal code"}
                          >
                            {revealedCodes[code.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => handleCopy(code.code)}
                            className="p-1.5 text-brand-primary/30 hover:text-brand-accent transition-colors"
                            title="Copy code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-brand-primary/60 uppercase tracking-wider">
                        {batches.find(b => b.id === code.batch_id)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {code.is_used ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Used</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-brand-accent">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-serif text-brand-primary/60 italic">
                        {code.user?.username || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(code.id)}
                        className="p-2 text-brand-primary/20 hover:text-red-500 transition-colors"
                        title="Delete code"
                      >
                        <Trash2 className="w-4 h-4" />
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
