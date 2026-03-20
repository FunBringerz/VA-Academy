import React, { useState, useEffect } from 'react';
import { Plus, Search, ExternalLink, MessageCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SourcingSheet({ user }: { user: any }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hoveredComment, setHoveredComment] = useState<{ text: string, x: number, y: number } | null>(null);

  const [formData, setFormData] = useState({
    product_name: '',
    amazon_asin: '',
    amazon_url: '',
    supplier_url: '',
    screenshot_url: '',
    roi: '',
    profit: '',
    bsr: '',
    cost_price: '',
    sale_price: '',
    sales_per_month: '',
    is_hazmat: false,
    is_fragile: false,
    trainee_comment: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || []);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLElement).blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        roi: parseFloat(formData.roi) || 0,
        profit: parseFloat(formData.profit) || 0,
        bsr: parseInt(formData.bsr) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        sales_per_month: parseInt(formData.sales_per_month) || 0
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit lead');
      }

      setSuccess('Lead submitted successfully!');
      setFormData({
        product_name: '', amazon_asin: '', amazon_url: '', supplier_url: '',
        screenshot_url: '',
        roi: '', profit: '', bsr: '', cost_price: '',
        sale_price: '', sales_per_month: '', is_hazmat: false, is_fragile: false,
        trainee_comment: ''
      });
      setShowForm(false);
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, comment: string) => {
    if (!comment) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredComment({
      text: comment,
      x: rect.left,
      y: rect.bottom + window.scrollY + 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredComment(null);
  };

  const formatCurrency = (value: any) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex justify-between items-center bg-white p-6 formal-card">
        <div className="flex items-center gap-4 border-b border-brand-primary/10 pb-2">
          <Search className="w-4 h-4 text-brand-accent" />
          <input 
            type="text" 
            placeholder="SEARCH PRODUCT NAME OR ASIN..." 
            className="bg-transparent border-none focus:ring-0 text-[10px] tracking-[0.3em] w-80 outline-none uppercase font-bold"
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-formal flex items-center gap-2"
        >
          <Plus className="w-3 h-3" />
          {showForm ? 'Cancel Entry' : 'Enter New Lead'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 border-l-4 border-red-600 text-xs uppercase tracking-wider font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> {error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-600 p-4 border-l-4 border-emerald-600 text-xs uppercase tracking-wider font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> {success}</div>}

      {showForm && (
        <div className="bg-white p-10 formal-card animate-in fade-in slide-in-from-top-4">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">New Entry</p>
            <h3 className="text-3xl font-serif font-bold text-brand-primary">Amazon Sourcing Lead</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-8 md:col-span-1">
              <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] border-b border-brand-primary/10 pb-2">Product Details</h4>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Product Name</label>
                  <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Category</label>
                  <input type="text" name="product_category" value={formData.product_category} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Amazon ASIN</label>
                  <input type="text" name="amazon_asin" value={formData.amazon_asin} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                </div>
                <div className="flex gap-8 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="is_hazmat" checked={formData.is_hazmat} onChange={handleInputChange} className="w-4 h-4 border-2 border-brand-primary/20 rounded-none checked:bg-brand-accent transition-all" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">Hazmat</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" name="is_fragile" checked={formData.is_fragile} onChange={handleInputChange} className="w-4 h-4 border-2 border-brand-primary/20 rounded-none checked:bg-brand-accent transition-all" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary/60 group-hover:text-brand-primary transition-colors">Fragile</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-8 md:col-span-1">
              <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] border-b border-brand-primary/10 pb-2">Financials & Metrics</h4>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Cost Price ($)</label>
                    <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleInputChange} onWheel={handleWheel} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Sale Price ($)</label>
                    <input type="number" step="0.01" name="sale_price" value={formData.sale_price} onChange={handleInputChange} onWheel={handleWheel} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Profit ($)</label>
                    <input type="number" step="0.01" name="profit" value={formData.profit} onChange={handleInputChange} onWheel={handleWheel} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">ROI (%)</label>
                    <input type="number" step="0.01" name="roi" value={formData.roi} onChange={handleInputChange} onWheel={handleWheel} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">BSR (Sales Rank)</label>
                  <input type="number" name="bsr" value={formData.bsr} onChange={handleInputChange} onWheel={handleWheel} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Sales per Month</label>
                  <input type="number" name="sales_per_month" value={formData.sales_per_month} onChange={handleInputChange} onWheel={handleWheel} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" required />
                </div>
              </div>
            </div>

            <div className="space-y-8 md:col-span-1">
              <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] border-b border-brand-primary/10 pb-2">URLs & Links</h4>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Amazon URL</label>
                  <input type="url" name="amazon_url" value={formData.amazon_url} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Supplier URL</label>
                  <input type="url" name="supplier_url" value={formData.supplier_url} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Screenshot URL</label>
                  <input type="url" name="screenshot_url" value={formData.screenshot_url} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-primary/40 mb-1">Your Comments</label>
                  <textarea name="trainee_comment" value={formData.trainee_comment} onChange={handleInputChange} className="w-full border-b border-brand-primary/20 bg-transparent px-0 py-2 text-sm focus:border-brand-accent outline-none transition-colors resize-none" rows={1} placeholder="ADDITIONAL NOTES..." />
                </div>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end mt-8">
              <button type="submit" className="btn-formal px-12">
                Finalize Submission
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white formal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-[10px] text-brand-primary/50 uppercase tracking-[0.2em] bg-brand-secondary/50 border-b border-brand-primary/10">
              <tr>
                <th className="px-6 py-5 font-bold">Remarks</th>
                <th className="px-6 py-5 font-bold">Date</th>
                <th className="px-6 py-5 font-bold">Product</th>
                <th className="px-6 py-5 font-bold">ASIN</th>
                <th className="px-6 py-5 font-bold">Links</th>
                <th className="px-6 py-5 font-bold">Cost</th>
                <th className="px-6 py-5 font-bold">Sale</th>
                <th className="px-6 py-5 font-bold">Profit</th>
                <th className="px-6 py-5 font-bold">ROI</th>
                <th className="px-6 py-5 font-bold">BSR</th>
                <th className="px-6 py-5 font-bold">Sales/Mo</th>
                <th className="px-6 py-5 font-bold">Notes</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-brand-primary/40 font-serif italic">Loading records...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-brand-primary/40 font-serif italic">No records found.</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[9px] uppercase tracking-wider font-bold">
                          <span className="text-brand-primary/30">Lead:</span>{' '}
                          <span className={`${lead.lead_remark === 'Good Deal' ? 'text-emerald-600' : lead.lead_remark === 'Bad Deal' ? 'text-red-600' : 'text-brand-primary'}`}>
                            {lead.lead_remark === 'Pending' ? 'PENDING REMARK' : (lead.lead_remark || 'PENDING REMARK')}
                          </span>
                        </div>
                        {lead.admin_comment && (
                          <div className="text-[9px] uppercase tracking-wider font-bold text-brand-accent flex items-center gap-1">
                            <MessageCircle className="w-2.5 h-2.5" /> ADMIN COMMENTED
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-primary/60">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 max-w-[200px] truncate font-medium" title={lead.product_name}>
                      <div className="flex flex-col gap-1">
                        <span>{lead.product_name || '-'}</span>
                        <div className="flex gap-2">
                          {lead.is_hazmat && <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold uppercase tracking-tighter">Hazmat</span>}
                          {lead.is_fragile && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold uppercase tracking-tighter">Fragile</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] tracking-tighter">{lead.amazon_asin || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        {(lead.amazon_link || lead.amazon_url) && (
                          <a href={lead.amazon_link || lead.amazon_url} target="_blank" rel="noreferrer" className="text-brand-accent hover:underline flex items-center gap-1 font-bold uppercase text-[9px] tracking-widest">
                            AMZ <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {(lead.source_link || lead.supplier_url) && (
                          <a href={lead.source_link || lead.supplier_url} target="_blank" rel="noreferrer" className="text-brand-accent hover:underline flex items-center gap-1 font-bold uppercase text-[9px] tracking-widest">
                            SUP <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {lead.screenshot_url && (
                          <a href={lead.screenshot_url} target="_blank" rel="noreferrer" className="text-brand-accent hover:underline flex items-center gap-1 font-bold uppercase text-[9px] tracking-widest">
                            IMG <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-primary">{formatCurrency(lead.cost_price)}</td>
                    <td className="px-6 py-4 font-bold text-brand-primary">{formatCurrency(lead.sale_price)}</td>
                    <td className="px-6 py-4 font-bold text-brand-accent">{formatCurrency(lead.profit)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{lead.roi}%</td>
                    <td className="px-6 py-4 text-brand-primary/70">{lead.bsr?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 text-brand-primary/70">{lead.sales_per_month || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {lead.trainee_comment && (
                          <div 
                            className="text-brand-primary/30 hover:text-brand-accent cursor-pointer transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, `TRAINEE: ${lead.trainee_comment}`)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </div>
                        )}
                        {lead.admin_comment && (
                          <div 
                            className="text-brand-accent/50 hover:text-brand-accent cursor-pointer transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, `ADMIN: ${lead.admin_comment}`)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hoveredComment && (
        <div 
          className="fixed z-50 bg-brand-primary text-brand-secondary p-4 formal-card shadow-2xl max-w-xs text-[10px] uppercase tracking-widest font-bold pointer-events-none border border-brand-accent/30"
          style={{ left: hoveredComment.x, top: hoveredComment.y }}
        >
          {hoveredComment.text}
        </div>
      )}
    </div>
  );
}
