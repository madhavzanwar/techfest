import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Users, Eye, AlertCircle, CheckCircle2, 
  Shield, Lock, ChevronLeft, ChevronRight, Activity, ArrowRight
} from 'lucide-react';

export default function ChildrenView({ currentRole, onSelectChild }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      let url = `/api/children?role=${currentRole}&page=${page}&limit=20`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedBlock) url += `&block=${encodeURIComponent(selectedBlock)}`;
      if (selectedTier) url += `&tier=${selectedTier}`;

      const res = await fetch(url);
      const data = await res.json();
      setChildren(data.data || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch children registry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [currentRole, page, selectedBlock, selectedTier]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchChildren();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header & Privacy Banner */}
      <div className="clinical-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-display">
              Beneficiary Registry &amp; Anthropometric Velocity Curves
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Unified longitudinal repository joining monthly Poshan Tracker anthropometrics with ASHA health morbidity records.
            Access and visibility are dynamically enforced by active credentials under the DPDP Act 2023.
          </p>
        </div>

        {/* RBAC Mode Badge */}
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center space-x-2.5 ${
          currentRole === 'DISTRICT_OFFICER' 
            ? 'bg-purple-50 border-purple-200 text-purple-900' 
            : currentRole === 'AWW' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <Lock className="h-4 w-4 shrink-0 text-current" />
          <div>
            <div className="font-bold">
              {currentRole === 'DISTRICT_OFFICER' ? 'DPDP Section 8 Masking Active' :
               currentRole === 'AWW' ? 'Unmasked Frontline Clinical View' : 'Block Triage Scope'}
            </div>
            <div className="text-[10px] opacity-85">
              {currentRole === 'DISTRICT_OFFICER' ? 'Names masked to initials (A*** P***) to uphold child privacy' :
               currentRole === 'AWW' ? 'Full names visible for doorstep nutritional counseling' : 'Operational oversight within block'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Child ID (POSHAN-MH-...) or Name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          <select
            value={selectedBlock}
            onChange={(e) => { setSelectedBlock(e.target.value); setPage(1); }}
            className="bg-slate-50 text-xs text-slate-800 font-medium py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Blocks (Nandurbar)</option>
            <option value="Dhadgaon">Dhadgaon</option>
            <option value="Akkalkuwa">Akkalkuwa</option>
            <option value="Shahada">Shahada</option>
            <option value="Taloda">Taloda</option>
            <option value="Nandurbar Rural">Nandurbar Rural</option>
          </select>

          <select
            value={selectedTier}
            onChange={(e) => { setSelectedTier(e.target.value); setPage(1); }}
            className="bg-slate-50 text-xs text-slate-800 font-medium py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical Tier (SAM)</option>
            <option value="WATCH">Watch Tier (Faltering)</option>
            <option value="NORMAL">Normal Tier</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Apply Filters
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Found <strong className="text-slate-900 tabular-nums">{totalCount.toLocaleString()}</strong> registered infants</span>
          <span>Page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Children Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-4">Beneficiary &amp; Name</th>
                <th className="py-3.5 px-4">Age &amp; Sex</th>
                <th className="py-3.5 px-4">Beat (Block / AWC)</th>
                <th className="py-3.5 px-4">Anthropometrics (Weight / Height / MUAC)</th>
                <th className="py-3.5 px-4">WHO Z-Scores (WHZ / HAZ)</th>
                <th className="py-3.5 px-4">Triage Tier</th>
                <th className="py-3.5 px-4">ABDM Status</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                    <span>Filtering clinical registry...</span>
                  </td>
                </tr>
              ) : children.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No beneficiary records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                children.map((c) => {
                  const tier = c.risk.tier;
                  const isCrit = tier === 'CRITICAL';
                  const isWatch = tier === 'WATCH';

                  return (
                    <tr
                      key={c.child_id}
                      onClick={() => onSelectChild(c.child_id)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-blue-700 font-semibold">{c.child_id}</div>
                        <div className="text-slate-900 font-bold mt-0.5 group-hover:text-blue-700 transition">
                          {c.pseudonym_name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.village_name}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 tabular-nums">{c.age_months} Months</div>
                        <div className="text-[11px] text-slate-500">{c.gender === 'M' ? 'Boy' : 'Girl'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.block_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.awc_id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="tabular-nums text-slate-900 font-medium">{c.current_weight} kg • {c.current_height} cm</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          MUAC: <span className={`font-bold ${
                            c.current_muac < 115 ? 'text-red-700' :
                            c.current_muac < 125 ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {c.current_muac} mm
                          </span>
                          {c.oedema && <span className="ml-1 text-red-700 font-bold bg-red-50 px-1 py-0.2 rounded border border-red-200">[OEDEMA]</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-1.5 tabular-nums">
                          <span className="text-slate-400 text-[11px]">WHZ:</span>
                          <span className={`font-bold ${
                            c.current_whz < -3.0 ? 'text-red-700' :
                            c.current_whz < -2.0 ? 'text-amber-700' : 'text-slate-800'
                          }`}>
                            {c.current_whz.toFixed(2)} SD
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          <span>HAZ:</span>
                          <span className={c.current_haz < -2.0 ? 'text-purple-700 font-semibold' : 'text-slate-600'}>
                            {c.current_haz.toFixed(2)} SD
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCrit ? 'bg-red-50 text-red-700 border border-red-200' :
                          isWatch ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {tier}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                          Score: <strong className="text-slate-800">{c.risk.composite_score}</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.linkage_status.includes('ABHA') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          c.linkage_status.includes('PROBABILISTIC') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {c.linkage_status.replace('_', ' ')}
                        </span>
                        {c.abha_id && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[110px]">
                            {c.abha_id}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectChild(c.child_id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition inline-flex items-center space-x-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 shadow-subtle"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 shadow-subtle"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
