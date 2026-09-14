import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Users, Eye, AlertTriangle, CheckCircle, 
  Shield, Lock, ChevronLeft, ChevronRight, Activity, ArrowUpDown 
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white">
              Child Registry &amp; Anthropometric Velocity Monitoring
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Integrated repository linking monthly Poshan Tracker anthropometrics with ASHA health morbidity indicators.
            Access and visibility are dynamically enforced based on current active credentials.
          </p>
        </div>

        {/* RBAC Banner */}
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
          currentRole === 'DISTRICT_OFFICER' 
            ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
            : currentRole === 'AWW' 
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            : 'bg-sky-950/60 border-sky-800 text-sky-300'
        }`}>
          <Lock className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">
              {currentRole === 'DISTRICT_OFFICER' ? 'DPDP Section 8 Masking Active' :
               currentRole === 'AWW' ? 'Unmasked Frontline Clinical View' : 'Block Triage Scope'}
            </div>
            <div className="text-[10px] opacity-80">
              {currentRole === 'DISTRICT_OFFICER' ? 'Names masked to initials (A*** P***) to uphold child privacy' :
               currentRole === 'AWW' ? 'Full names visible for doorstep nutritional counseling' : 'Operational oversight within block'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Child ID (POSHAN-MH-...) or Name..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-slate-500"
            />
          </div>

          <select
            value={selectedBlock}
            onChange={(e) => { setSelectedBlock(e.target.value); setPage(1); }}
            className="bg-slate-950 text-xs text-slate-200 py-2 px-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
            className="bg-slate-950 text-xs text-slate-200 py-2 px-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical Tier (SAM)</option>
            <option value="WATCH">Watch Tier (Faltering)</option>
            <option value="NORMAL">Normal Tier</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-xl shadow transition"
          >
            Apply Filters
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Found <strong className="text-white">{totalCount.toLocaleString()}</strong> registered children matching criteria</span>
          <span>Page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Children Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Child ID &amp; Name</th>
                <th className="py-3.5 px-4">Age &amp; Sex</th>
                <th className="py-3.5 px-4">Block / Anganwadi</th>
                <th className="py-3.5 px-4">Anthropometrics (Weight / Ht / MUAC)</th>
                <th className="py-3.5 px-4">WHO Z-Scores (WHZ / HAZ)</th>
                <th className="py-3.5 px-4">Risk Tier &amp; Score</th>
                <th className="py-3.5 px-4">ABDM / Linkage</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                      <span>Querying child registry...</span>
                    </div>
                  </td>
                </tr>
              ) : children.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No children found matching the given filters.
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
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-sky-400 font-semibold">{c.child_id}</div>
                        <div className="text-white font-medium mt-0.5">{c.pseudonym_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.village_name}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold">{c.age_months} Months</div>
                        <div className="text-[11px] text-slate-400">{c.gender === 'M' ? 'Male (Boy)' : 'Female (Girl)'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{c.block_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.awc_id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div>{c.current_weight} kg • {c.current_height} cm</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          MUAC: <span className={c.current_muac < 115 ? 'text-rose-400 font-bold' : c.current_muac < 125 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {c.current_muac} mm
                          </span>
                          {c.oedema && <span className="ml-1 text-rose-500 font-bold">[OEDEMA]</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">WHZ:</span>
                          <span className={c.current_whz < -3.0 ? 'text-rose-400 font-bold' : c.current_whz < -2.0 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                            {c.current_whz.toFixed(2)} SD
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          <span>HAZ:</span>
                          <span className={c.current_haz < -2.0 ? 'text-purple-300 font-semibold' : 'text-slate-300'}>
                            {c.current_haz.toFixed(2)} SD
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCrit ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          isWatch ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {tier}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Score: <strong className="text-white">{c.risk.composite_score}</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          c.linkage_status.includes('ABHA') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          c.linkage_status.includes('PROBABILISTIC') ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {c.linkage_status.replace('_', ' ')}
                        </span>
                        {c.abha_id && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                            {c.abha_id}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectChild(c.child_id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold inline-flex items-center space-x-1 transition"
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
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
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
