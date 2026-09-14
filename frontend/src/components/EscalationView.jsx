import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Clock, CheckCircle, ShieldAlert, ArrowRight, 
  Search, Filter, Activity, Send, Check, User
} from 'lucide-react';

export default function EscalationView({ onSelectChild, currentRole }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [actionModalCase, setActionModalCase] = useState(null);
  const [actionType, setActionType] = useState('HOME_VISIT_CONDUCTED');
  const [officerName, setOfficerName] = useState(
    currentRole === 'BLOCK_OFFICER' ? 'CDPO S. K. Shinde (Dhadgaon)' : 
    currentRole === 'AWW' ? 'Anganwadi Worker Sunita Padvi' : 'Medical Officer Dr. V. Patil'
  );
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      let url = `/api/escalations?limit=50`;
      if (selectedTier) url += `&tier=${selectedTier}`;
      if (selectedBlock) url += `&block=${selectedBlock}`;
      const res = await fetch(url);
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error("Failed to load escalations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedTier, selectedBlock]);

  const handleTakeAction = async (e) => {
    e.preventDefault();
    if (!actionModalCase) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/escalations/${actionModalCase.case_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          notes: actionNotes || "Routine triage intervention completed according to SOP.",
          officer_name: officerName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(`Action recorded for case ${actionModalCase.case_id}`);
        setTimeout(() => setSuccessToast(''), 4000);
        setActionModalCase(null);
        setActionNotes('');
        fetchCases();
      }
    } catch (err) {
      console.error("Failed to record action:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Protocol SLA Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h2 className="text-xl font-bold text-white">
              Triage Escalation Queue & Decision Rights
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Active auto-escalation cases triaged by WHO growth faltering velocity and ASHA clinical alerts.
            Every case carries a strict SLA and role-based assignment to prevent bureaucratic dormancy.
          </p>
        </div>

        {/* SLA Reference Pill */}
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center space-x-1.5 text-rose-400 font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>Critical SLA: 48h (NRC / Medical Officer)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>Watch SLA: 7 Days (AWW / Home Visit)</span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">AUDIT_LOG_COMMITTED</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
            <Filter className="h-3.5 w-3.5 text-sky-400" />
            <span>Filter Queue:</span>
          </span>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-950 text-xs text-slate-200 py-1.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical Tier Only</option>
            <option value="WATCH">Watch Tier Only</option>
          </select>

          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="bg-slate-950 text-xs text-slate-200 py-1.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Blocks (Nandurbar)</option>
            <option value="Dhadgaon">Dhadgaon</option>
            <option value="Akkalkuwa">Akkalkuwa</option>
            <option value="Shahada">Shahada</option>
            <option value="Taloda">Taloda</option>
            <option value="Nandurbar Rural">Nandurbar Rural</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{cases.length}</span> prioritized escalation cases
        </div>
      </div>

      {/* Escalation Queue Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Case ID &amp; Child</th>
                <th className="py-3.5 px-4">Location (Block / AWC)</th>
                <th className="py-3.5 px-4">Risk Tier &amp; Score</th>
                <th className="py-3.5 px-4">Clinical Trigger &amp; Early Warning</th>
                <th className="py-3.5 px-4">SLA Countdown</th>
                <th className="py-3.5 px-4">Status &amp; Assignee</th>
                <th className="py-3.5 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                      <span>Retrieving escalation queue...</span>
                    </div>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No matching escalation cases found for current filter criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const isCrit = c.risk_tier === 'CRITICAL';
                  const isActioned = c.case_status === 'ACTIONED';

                  return (
                    <tr 
                      key={c.case_id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onSelectChild(c.child_id)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-sky-400 font-semibold">{c.case_id}</div>
                        <div className="text-white font-medium mt-0.5">{c.child_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.child_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{c.block_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.awc_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          isCrit 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>{c.risk_tier}</span>
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Score: <strong className="text-white">{c.composite_score}/100</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                          {c.trigger_summary}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 font-mono">
                          <Clock className={`h-3.5 w-3.5 ${
                            c.sla_status === 'BREACHED' ? 'text-rose-500' :
                            c.sla_status === 'APPROACHING_BREACH' ? 'text-amber-400' : 'text-emerald-400'
                          }`} />
                          <span className={`font-bold ${
                            c.sla_status === 'BREACHED' ? 'text-rose-400' :
                            c.sla_status === 'APPROACHING_BREACH' ? 'text-amber-300' : 'text-slate-200'
                          }`}>
                            {c.hours_remaining > 0 ? `${c.hours_remaining}h left` : 'BREACHED'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 block">
                          Total SLA: {c.sla_hours}h
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isActioned
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-amber-300 border border-slate-700'
                        }`}>
                          {c.case_status}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 truncate max-w-[160px]">
                          {c.assigned_role}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActionModalCase(c)}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow transition inline-flex items-center space-x-1"
                        >
                          <span>{isActioned ? 'Re-Act' : 'Action'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Intervention Modal */}
      {actionModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold flex items-center space-x-2">
                  <span>Log Frontline Action &amp; Triage</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Case ID: <span className="font-mono text-sky-400">{actionModalCase.case_id}</span> • Child: <strong>{actionModalCase.child_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setActionModalCase(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTakeAction} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Select Intervention Protocol
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="NRC_ADMISSION_INITIATED">NRC Emergency Admission Initiated (Sub-District Hospital)</option>
                  <option value="HOME_VISIT_CONDUCTED">Frontline AWW/ASHA Home Visit Conducted</option>
                  <option value="THR_DOUBLE_RATION_ISSUED">Supplementary Nutrition (THR Double Ration) Issued</option>
                  <option value="PHC_DOCTOR_EXAMINATION">PHC Medical Officer Clinical Examination Completed</option>
                  <option value="GROWTH_REWEIGH_SCHEDULED">Fast-Track Biometric Re-Weigh Scheduled (14 Days)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Responsible Officer / Frontline Worker
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Clinical Action Notes &amp; Observations
                </label>
                <textarea
                  rows="3"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record therapeutic feeding observations, maternal consultation, or PHC transfer vehicle details..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                ></textarea>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Statutory DPDP Audit Requirement</span>
                </div>
                <p>
                  This intervention will be timestamped, cryptographically linked to your user token, and saved to the immutable compliance ledger.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalCase(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center space-x-1.5 shadow"
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Commit Action</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
