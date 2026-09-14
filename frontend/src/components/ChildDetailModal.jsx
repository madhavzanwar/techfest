import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Activity, Heart, Shield, Calendar, 
  TrendingDown, TrendingUp, CheckCircle, Clock, MapPin, User 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ReferenceLine, Legend 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 font-bold font-mono">
              ID
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">
                  {profile?.pseudonym_name || 'Loading profile...'}
                </h3>
                {profile?.gender && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {profile.gender === 'M' ? 'Boy' : 'Girl'}, {profile.age_months} Months
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {profile?.child_id} • {profile?.block_name} Block ({profile?.awc_id})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
            <span>Fetching deep longitudinal child profile...</span>
          </div>
        ) : profile ? (
          <>
            {/* Risk & Clinical Triage Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              profile.risk.tier === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : profile.risk.tier === 'WATCH'
                ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-extrabold uppercase tracking-wider text-xs">
                    {profile.risk.tier} RISK TIER (Clinical Triage Score: {profile.risk.composite_score}/100)
                  </span>
                </div>
                <p className="text-xs mt-1.5 font-medium text-white/90 leading-relaxed">
                  {profile.risk.recommendation}
                </p>
              </div>

              {/* Subscores */}
              <div className="flex items-center space-x-2 shrink-0 font-mono text-xs">
                <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Anthro</div>
                  <div className="font-bold text-white">{profile.risk.anthropometric_score}/40</div>
                </div>
                <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Velocity</div>
                  <div className="font-bold text-amber-400">{profile.risk.velocity_score}/30</div>
                </div>
                <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Health</div>
                  <div className="font-bold text-rose-400">{profile.risk.clinical_vulnerability_score}/30</div>
                </div>
              </div>
            </div>

            {/* Triggers List */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Primary Early Warning Triggers Detected:
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.risk.primary_triggers.map((trig, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-slate-200 border border-slate-700 flex items-center space-x-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                    <span>{trig}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Longitudinal Chart: Growth Velocity */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Longitudinal Growth Velocity Curve (Months T-2 to Current)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Weight-for-Height Z-Score (WHZ) and Weight (kg) measured across successive frontline visits.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  Δ 60-Day WHZ: {profile.risk.velocity_delta_whz_60d} SD
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.growth_history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <XAxis dataKey="visit_date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="whz" stroke="#64748b" fontSize={11} tickLine={false} domain={[-4, 2]} />
                    <YAxis yAxisId="wt" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <ReferenceLine yAxisId="whz" y={-2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "MAM (-2 SD)", fill: "#f59e0b", fontSize: 10 }} />
                    <ReferenceLine yAxisId="whz" y={-3} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "SAM (-3 SD)", fill: "#ef4444", fontSize: 10 }} />
                    <Line yAxisId="whz" type="monotone" dataKey="whz" name="WHZ (Z-Score)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} />
                    <Line yAxisId="wt" type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#34d399" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Health System Integration Grid (ASHA Records) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Poshan Tracker Data */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-900/60 space-y-2">
                <div className="text-sky-400 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Poshan Tracker (MWCD) Anthropometrics</span>
                  <span className="font-mono text-slate-400">{profile.child_id}</span>
                </div>
                <div className="space-y-1.5 pt-1 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Current Weight:</span>
                    <strong className="text-white font-mono">{profile.current_weight} kg</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Current Height / Length:</span>
                    <strong className="text-white font-mono">{profile.current_height} cm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">MUAC (Arm Circumference):</span>
                    <strong className={`font-mono ${profile.current_muac < 115 ? 'text-rose-400' : profile.current_muac < 125 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {profile.current_muac} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Weight-for-Age (WAZ):</span>
                    <strong className="text-white font-mono">{profile.current_waz.toFixed(2)} SD</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Height-for-Age (HAZ):</span>
                    <strong className="text-white font-mono">{profile.current_haz.toFixed(2)} SD</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Bilateral Pitting Oedema:</span>
                    <strong className={profile.oedema ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {profile.oedema ? 'PRESENT (Kwashiorkor)' : 'Absent'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ASHA / Health System Record */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/60 space-y-2">
                <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>ASHA / RCH Health Record (MoHFW)</span>
                  <span className="font-mono text-slate-400">{profile.rch_id || 'Pending Link'}</span>
                </div>
                <div className="space-y-1.5 pt-1 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Immunization Status:</span>
                    <strong className={`font-semibold ${
                      profile.immunization_status === 'FULL' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {profile.immunization_status}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Blood Hemoglobin (Hb):</span>
                    <strong className={`font-mono ${profile.hb_level < 7.0 ? 'text-rose-400' : profile.hb_level < 10.0 ? 'text-amber-400' : 'text-white'}`}>
                      {profile.hb_level ? `${profile.hb_level} g/dL` : 'Not recorded'}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Recent Diarrhea (Past 30d):</span>
                    <strong className="text-white font-mono">{profile.recent_diarrhea_days} Days</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">ARI / Pneumonia Episode:</span>
                    <strong className={profile.recent_ari ? 'text-rose-400' : 'text-slate-400'}>
                      {profile.recent_ari ? 'Reported within 30d' : 'None'}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Prior NRC Rehabilitation:</span>
                    <strong className="text-white">{profile.prior_nrc ? 'Yes (Admitted previously)' : 'No'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">ABDM ABHA Number:</span>
                    <strong className="text-sky-400 font-mono">{profile.abha_id || 'Unlinked'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
