import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, Activity, Heart, Shield, Calendar, 
  TrendingDown, TrendingUp, CheckCircle2, Clock, MapPin, User, AlertCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ReferenceLine, Legend, CartesianGrid 
} from 'recharts';

export default function ChildDetailModal({ childId, onClose, currentRole }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;
    const fetchChild = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/children/${childId}?role=${currentRole}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load child profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChild();
  }, [childId, currentRole]);

  if (!childId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 text-slate-900 shadow-modal space-y-6"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold font-display text-sm">
              PID
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {profile?.pseudonym_name || 'Loading profile...'}
                </h3>
                {profile?.gender && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {profile.gender === 'M' ? 'Boy' : 'Girl'}, {profile.age_months} Months
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {profile?.child_id} • {profile?.block_name} Block ({profile?.awc_id})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-xs font-medium">Fetching longitudinal anthropometric history...</span>
          </div>
        ) : profile ? (
          <>
            {/* Risk Protocol Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              profile.risk.tier === 'CRITICAL'
                ? 'bg-red-50/90 border-red-200 text-red-950'
                : profile.risk.tier === 'WATCH'
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className={`h-4 w-4 ${
                    profile.risk.tier === 'CRITICAL' ? 'text-red-700' :
                    profile.risk.tier === 'WATCH' ? 'text-amber-700' : 'text-emerald-700'
                  }`} />
                  <span className="font-extrabold uppercase tracking-wider text-xs font-display">
                    {profile.risk.tier} RISK TIER • Clinical Triage Score: {profile.risk.composite_score}/100
                  </span>
                </div>
                <p className="text-xs mt-1.5 font-medium leading-relaxed opacity-90 max-w-2xl">
                  {profile.risk.recommendation}
                </p>
              </div>

              {/* Subscores breakdown */}
              <div className="flex items-center space-x-2 shrink-0 font-mono text-xs">
                <div className="bg-white/90 px-3 py-2 rounded-xl border border-slate-200/80 text-center shadow-subtle">
                  <div className="text-[10px] text-slate-500 uppercase font-bold font-sans">Anthro</div>
                  <div className="font-extrabold text-slate-900 tabular-nums">{profile.risk.anthropometric_score}/40</div>
                </div>
                <div className="bg-white/90 px-3 py-2 rounded-xl border border-slate-200/80 text-center shadow-subtle">
                  <div className="text-[10px] text-slate-500 uppercase font-bold font-sans">Velocity</div>
                  <div className="font-extrabold text-amber-800 tabular-nums">{profile.risk.velocity_score}/30</div>
                </div>
                <div className="bg-white/90 px-3 py-2 rounded-xl border border-slate-200/80 text-center shadow-subtle">
                  <div className="text-[10px] text-slate-500 uppercase font-bold font-sans">Health</div>
                  <div className="font-extrabold text-red-800 tabular-nums">{profile.risk.clinical_vulnerability_score}/30</div>
                </div>
              </div>
            </div>

            {/* Triggers List */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block font-display">
                Primary Early Warning Triggers Detected:
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.risk.primary_triggers.map((trig, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-subtle flex items-center space-x-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                    <span>{trig}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Longitudinal Chart: Growth Velocity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                    Longitudinal Growth Velocity Curve (Months T-2 to Current)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Weight-for-Height Z-Score (WHZ) and Weight (kg) across 3 successive frontline weigh-in visits.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-bold tabular-nums shrink-0">
                  Δ 60-Day WHZ: {profile.risk.velocity_delta_whz_60d} SD
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.growth_history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="visit_date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis yAxisId="whz" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} domain={[-4, 2]} />
                    <YAxis yAxisId="wt" orientation="right" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E2E8F0', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        fontSize: '12px',
                        color: '#0F172A'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <ReferenceLine yAxisId="whz" y={-2} stroke="#D97706" strokeDasharray="3 3" label={{ value: "MAM (-2 SD)", fill: "#D97706", fontSize: 10, position: 'insideTopLeft' }} />
                    <ReferenceLine yAxisId="whz" y={-3} stroke="#DC2626" strokeDasharray="3 3" label={{ value: "SAM (-3 SD)", fill: "#DC2626", fontSize: 10, position: 'insideBottomLeft' }} />
                    <Line yAxisId="whz" type="monotone" dataKey="whz" name="WHZ (WHO Z-Score)" stroke="#2563EB" strokeWidth={3} dot={{ r: 5, fill: "#2563EB" }} animationDuration={800} />
                    <Line yAxisId="wt" type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4, fill: "#059669" }} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dual-Silo Health Integration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Poshan Tracker Data */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-blue-700 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between font-display">
                  <span>Poshan Tracker (MWCD) Anthropometrics</span>
                  <span className="font-mono text-slate-500">{profile.child_id}</span>
                </div>
                <div className="space-y-2 pt-1 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Current Weight:</span>
                    <strong className="text-slate-900 font-mono tabular-nums">{profile.current_weight} kg</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Current Height:</span>
                    <strong className="text-slate-900 font-mono tabular-nums">{profile.current_height} cm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">MUAC (Arm Tape):</span>
                    <strong className={`font-mono tabular-nums ${
                      profile.current_muac < 115 ? 'text-red-700 font-bold' :
                      profile.current_muac < 125 ? 'text-amber-700 font-bold' : 'text-emerald-700'
                    }`}>
                      {profile.current_muac} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Weight-for-Age (WAZ):</span>
                    <strong className="text-slate-900 font-mono tabular-nums">{profile.current_waz.toFixed(2)} SD</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Height-for-Age (HAZ):</span>
                    <strong className="text-slate-900 font-mono tabular-nums">{profile.current_haz.toFixed(2)} SD</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Bilateral Oedema:</span>
                    <strong className={profile.oedema ? 'text-red-700 font-bold' : 'text-slate-600'}>
                      {profile.oedema ? 'PRESENT (Kwashiorkor Emergency)' : 'Absent'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ASHA Health Record */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-emerald-800 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between font-display">
                  <span>ASHA / RCH Health Record (MoHFW)</span>
                  <span className="font-mono text-slate-500">{profile.rch_id || 'Pending Link'}</span>
                </div>
                <div className="space-y-2 pt-1 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Immunization Status:</span>
                    <strong className={`font-semibold ${
                      profile.immunization_status === 'FULL' ? 'text-emerald-800' : 'text-red-700'
                    }`}>
                      {profile.immunization_status}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Blood Hemoglobin (Hb):</span>
                    <strong className={`font-mono tabular-nums ${
                      profile.hb_level < 7.0 ? 'text-red-700 font-bold' :
                      profile.hb_level < 10.0 ? 'text-amber-700 font-bold' : 'text-slate-900'
                    }`}>
                      {profile.hb_level ? `${profile.hb_level} g/dL` : 'Not recorded'}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Recent Diarrhea (30d):</span>
                    <strong className="text-slate-900 font-mono tabular-nums">{profile.recent_diarrhea_days} Days</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">ARI / Pneumonia:</span>
                    <strong className={profile.recent_ari ? 'text-red-700' : 'text-slate-600'}>
                      {profile.recent_ari ? 'Reported within 30d' : 'None'}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Prior NRC Admission:</span>
                    <strong className="text-slate-900">{profile.prior_nrc ? 'Yes (Admitted previously)' : 'No'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">ABDM ABHA ID:</span>
                    <strong className="text-blue-700 font-mono">{profile.abha_id || 'Unlinked'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
