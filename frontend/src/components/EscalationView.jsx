import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, Clock, CheckCircle2, ShieldAlert, ArrowRight, 
  Filter, Activity, Send, Check, User, ChevronRight, X, AlertTriangle
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
      let url = `/api/escalations?limit=60`;
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
          notes: actionNotes || "Clinical triage intervention logged in compliance with SOP.",
          officer_name: officerName
        })
      });
      if (res.ok) {
        setSuccessToast(`Intervention recorded for case ${actionModalCase.case_id}`);
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
      {/* Triage Worklist Header */}
      <div className="clinical-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping"></span>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              Clinical Triage Worklist &amp; Administrative Escalations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live decision-rights queue prioritizing infants by WHO growth velocity deceleration and ASHA clinical alerts.
            Every case is assigned to a responsible frontline officer under defined service delivery SLAs.
          </p>
        </div>

        {/* SLA Reference Badges */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-1.5 text-red-700 font-bold">
            <Clock className="h-3.5 w-3.5 text-red-600" />
            <span>Critical SLA: 48h (NRC Referral)</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Watch SLA: 7 Days (AWW Home Visit)</span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-subtle"
          >
            <div className="flex items-center space-x-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-semibold uppercase">DPDP_AUDIT_LOGGED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
            <Filter className="h-3.5 w-3.5 text-blue-600" />
            <span>Filter:</span>
          </span>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 font-medium py-1.5 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Triage Tiers</option>
            <option value="CRITICAL">Critical Tier (SAM / Kwashiorkor)</option>
            <option value="WATCH">Watch Tier (Early Faltering)</option>
          </select>

          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 font-medium py-1.5 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Blocks (Nandurbar)</option>
            <option value="Dhadgaon">Dhadgaon</option>
            <option value="Akkalkuwa">Akkalkuwa</option>
            <option value="Shahada">Shahada</option>
            <option value="Taloda">Taloda</option>
            <option value="Nandurbar Rural">Nandurbar Rural</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold tabular-nums">{cases.length}</span> active triage cases
        </div>
      </div>

      {/* Clinical Worklist Items */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            <span className="text-xs font-medium">Loading clinical triage worklist...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-xs">
            No active escalation cases found for current filter criteria.
          </div>
        ) : (
          cases.map((c) => {
            const isCrit = c.risk_tier === 'CRITICAL';
            const isActioned = c.case_status === 'ACTIONED';
            const isApproaching = c.sla_status === 'APPROACHING_BREACH';
            const isBreached = c.sla_status === 'BREACHED';

            return (
              <motion.div
                key={c.case_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectChild(c.child_id)}
                className="clinical-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-blue-300 transition group"
              >
                {/* Left: Patient & Clinical Triggers */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                      isCrit 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <AlertCircle className="h-3 w-3 mr-1 shrink-0" />
                      <span>{c.risk_tier}</span>
                    </span>

                    <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {c.case_id}
                    </span>

                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {c.child_name}
                    </span>

                    <span className="text-xs text-slate-500 font-mono">
                      ({c.child_id})
                    </span>
                  </div>

                  {/* Primary Trigger Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {c.trigger_summary.split(';').map((trig, idx) => (
                      <span 
                        key={idx} 
                        className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-medium"
                      >
                        {trig.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Location & Role Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span>Beat: <strong className="text-slate-700">{c.block_name}</strong> ({c.awc_id})</span>
                    <span>•</span>
                    <span>Assigned: <strong className="text-slate-700">{c.assigned_role}</strong></span>
                    {c.action_taken_by && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>Actioned by {c.action_taken_by}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: SLA Countdown & Action Button */}
                <div className="flex items-center space-x-4 md:space-x-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* SLA Badge */}
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1.5 font-mono text-xs font-bold">
                      <Clock className={`h-3.5 w-3.5 ${
                        isBreached ? 'text-red-600' :
                        isApproaching ? 'text-amber-600 animate-pulse' : 'text-emerald-600'
                      }`} />
                      <span className={`tabular-nums ${
                        isBreached ? 'text-red-700' :
                        isApproaching ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        {c.hours_remaining > 0 ? `${c.hours_remaining}h left` : 'BREACHED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      SLA: {c.sla_hours}h ({c.sla_status.replace('_', ' ')})
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActionModalCase(c)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-subtle transition ${
                        isActioned
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      <span>{isActioned ? 'Update SOP' : 'Log Action'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Action Intervention Modal */}
      <AnimatePresence>
        {actionModalCase && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-modal space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Record Clinical Action &amp; Frontline Triage
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Case: <span className="font-mono text-blue-700 font-semibold">{actionModalCase.case_id}</span> • Child: <strong>{actionModalCase.child_name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActionModalCase(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleTakeAction} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Standard Operating Procedure (SOP)
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="NRC_ADMISSION_INITIATED">NRC Emergency Admission Initiated (Sub-District Hospital)</option>
                    <option value="HOME_VISIT_CONDUCTED">Frontline AWW/ASHA Home Visit Conducted</option>
                    <option value="THR_DOUBLE_RATION_ISSUED">Supplementary Nutrition (THR Double Ration) Issued</option>
                    <option value="PHC_DOCTOR_EXAMINATION">PHC Medical Officer Clinical Examination Completed</option>
                    <option value="GROWTH_REWEIGH_SCHEDULED">Fast-Track Biometric Re-Weigh Scheduled (14 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsible Officer / Health Worker
                  </label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clinical Action Notes &amp; Observations
                  </label>
                  <textarea
                    rows="3"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Document feeding counseling, maternal consultation, or PHC ambulance transfer details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                    <span>DPDP Act Section 10 Audit Trail Requirement</span>
                  </div>
                  <p className="text-amber-800">
                    This clinical intervention will be cryptographically logged with your verified credentials into the district audit ledger.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionModalCase(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition"
                  >
                    {submitting ? (
                      <span>Recording...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Commit Intervention</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
