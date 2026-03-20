import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, ExternalLink, MessageCircle } from 'lucide-react';

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('all');
  const [hoveredComment, setHoveredComment] = useState<{ text: string, x: number, y: number } | null>(null);

  useEffect(() => {
    fetchBatches();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [filterBatch]);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const url = filterBatch === 'all' ? '/api/admin/leads' : `/api/admin/leads?batch_id=${filterBatch}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateLead = async (leadId: string, remark: string, comment: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/remark`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark, comment })
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
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
    <div className="bg-white formal-card overflow-hidden relative">
      <div className="p-10 border-b border-brand-primary/10 flex flex-col md:flex-row justify-between items-end gap-8 bg-brand-secondary/30">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent font-bold mb-2">Management</p>
          <h3 className="text-3xl font-serif font-bold text-brand-primary">Sourcing Sheet</h3>
          <p className="text-xs font-serif italic text-brand-primary/60 mt-1">Review and manage all trainee Amazon sourcing leads</p>
        </div>
        <div className="flex gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3 border-b border-brand-primary/20 pb-1 w-full md:w-64">
            <Filter className="w-3.5 h-3.5 text-brand-accent" />
            <select 
              value={filterBatch} 
              onChange={(e) => setFilterBatch(e.target.value)}
              className="text-[10px] uppercase tracking-widest font-bold border-none focus:ring-0 outline-none bg-transparent w-full cursor-pointer"
            >
              <option value="all">ALL BATCHES</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="text-[10px] text-brand-primary/50 uppercase tracking-[0.2em] bg-brand-secondary/50 border-b border-brand-primary/10">
            <tr>
              <th className="px-6 py-5 font-bold">Remarks</th>
              <th className="px-6 py-5 font-bold">Trainee</th>
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
              <tr><td colSpan={13} className="px-6 py-12 text-center text-brand-primary/40 font-serif italic">Loading records...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={13} className="px-6 py-12 text-center text-brand-primary/40 font-serif italic">No records found.</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-brand-primary/5 hover:bg-brand-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-brand-primary/30">Lead:</span>
                        <select 
                          value={lead.lead_remark || 'Pending'}
                          onChange={(e) => handleUpdateLead(lead.id, e.target.value, lead.admin_comment || '')}
                          className={`text-[9px] font-bold uppercase tracking-widest rounded-none px-2 py-1 border outline-none transition-colors cursor-pointer ${
                            lead.lead_remark === 'Good Deal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            lead.lead_remark === 'Bad Deal' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-white text-brand-primary border-brand-primary/10'
                          }`}
                        >
                          <option value="Pending">PENDING</option>
                          <option value="Good Deal">GOOD DEAL</option>
                          <option value="Bad Deal">BAD DEAL</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-brand-primary/30">Comment:</span>
                        <textarea 
                          defaultValue={lead.admin_comment || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (lead.admin_comment || '')) {
                              handleUpdateLead(lead.id, lead.lead_remark || 'Pending', e.target.value);
                            }
                          }}
                          placeholder="ADD COMMENT..."
                          className="text-[9px] font-bold uppercase tracking-widest rounded-none px-2 py-1 border border-brand-primary/10 outline-none focus:border-brand-accent transition-colors resize-none w-32"
                          rows={1}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-serif italic text-brand-primary">
                    {typeof lead.user?.full_name === 'string' ? lead.user.full_name : (lead.user?.full_name ? `${lead.user.full_name.first || ''} ${lead.user.full_name.last || ''}`.trim() : lead.user?.username || 'Unknown')}
                  </td>
                  <td className="px-6 py-4 text-brand-primary/60">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
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
