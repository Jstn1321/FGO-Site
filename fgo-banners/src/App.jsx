import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import * as Papa from 'papaparse';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

// ── Fallback embedded data (used if CSV fails to load) ─────────────────────
const EMBEDDED = [
  {
    name: "Indra's Great Trial Indra Pickup Summon",
    dates: '2027-07-02 to 2027-07-14',
    servants: 'Indra',
    image: '',
    status: 'Upcoming',
  },
  {
    name: "Indra's Great Trial Wandjina Pickup Summon",
    dates: '2027-07-05 to 2027-07-12',
    servants: 'Wandjina',
    image: '',
    status: 'Upcoming',
  },
];

// ── CSV auto-load candidates (relative to public folder) ─────────────────────
const CSV_CANDIDATES = [
  '/fgo/banners.csv',
  '/fgo/fgo_banners.csv',
  '/fgo/fgo_na_predicted_banners.csv',
];

// ── API base — empty string = same origin (nginx proxies /api → Flask:5050) ──
const API_BASE = '';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDates(str) {
  const m = String(str).match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
  if (!m) return { start: null, end: null };
  return {
    start: new Date(m[1] + 'T12:00:00'),
    end: new Date(m[2] + 'T12:00:00'),
  };
}

function parseServants(str) {
  if (!str) return [];
  return String(str)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fmtDate(d) {
  if (!d) return '?';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(d) {
  return Math.ceil((d - new Date()) / 86400000);
}

function getYear(d) {
  return d.start ? String(d.start.getFullYear()) : '?';
}

function fixUrl(url) {
  if (!url) return '';
  try {
    const [path, qs] = url.split('?');
    const fixed = path
      .split('/')
      .map((seg, i) =>
        i < 3 ? seg : encodeURIComponent(decodeURIComponent(seg)),
      )
      .join('/');
    return qs ? fixed + '?' + qs : fixed;
  } catch {
    return url;
  }
}

// Use the Status column from CSV directly; fall back to date-based logic
function resolveStatus(csvStatus, dates) {
  if (csvStatus) {
    const s = csvStatus.trim().toLowerCase();
    if (s === 'active') return 'active';
    if (s === 'past') return 'past';
    if (s === 'upcoming') return 'upcoming';
  }
  // Fallback: derive from dates
  const now = new Date();
  if (!dates.start) return 'unknown';
  if (now > dates.end) return 'past';
  if (now >= dates.start) return 'active';
  return 'upcoming';
}

function processBanners(raw) {
  return raw
    .map((r) => {
      const dates = parseDates(r['Predicted NA Dates'] || r.dates || '');
      const csvStatus = r['Status'] || r.status || '';
      return {
        name: r['Banner Name'] || r.name || '',
        dates,
        servants: parseServants(r['Featured Servants'] || r.servants || ''),
        image: fixUrl(r['Image URL'] || r.image || ''),
        status: resolveStatus(csvStatus, dates),
      };
    })
    .filter((b) => b.dates.start)
    .sort((a, b) => a.dates.start - b.dates.start);
}

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#06080f',
  surf: '#0d1120',
  surfhi: '#111828',
  border: '#1c2540',
  borderhi: '#2a3a60',
  gold: '#c8960c',
  goldbright: '#f0b820',
  golddim: '#5a3e06',
  blue: '#3a7ee0',
  bluedim: '#0f1f48',
  green: '#28a050',
  greendim: '#081c10',
  red: '#c03838',
  reddim: '#1c0808',
  text: '#d0d8f0',
  muted: '#4a5578',
};

const STATUS_INFO = {
  active: { label: 'ACTIVE', fg: C.green, bg: C.greendim, border: '#1a4828' },
  upcoming: { label: 'UPCOMING', fg: C.blue, bg: C.bluedim, border: '#1a2e5a' },
  past: { label: 'PAST', fg: C.muted, bg: C.surf, border: C.border },
  unknown: { label: '?', fg: C.muted, bg: C.surf, border: C.border },
};

// ── Pill button ───────────────────────────────────────────────────────────────
function Pill({ children, active, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 6,
        cursor: 'pointer',
        background: active ? accent + '20' : C.surf,
        border: `1px solid ${active ? accent + '90' : C.border}`,
        color: active ? accent : C.muted,
        fontSize: 12,
        fontFamily: "'Exo 2', sans-serif",
        fontWeight: 700,
        letterSpacing: 0.5,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [banners, setBanners] = useState(() => processBanners(EMBEDDED));
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dragging, setDragging] = useState(false);
  const [csvLabel, setCsvLabel] = useState('built-in data · loading CSV…');
  const [refreshState, setRefreshState] = useState('idle'); // idle | loading | success | error
  const [refreshMsg, setRefreshMsg] = useState('');
  const fileRef = useRef();

  // ── Auto-load CSV on mount ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      for (const path of CSV_CANDIDATES) {
        try {
          const res = await fetch(path);
          if (!res.ok) continue;
          const text = await res.text();
          const { data } = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          });
          const processed = processBanners(data);
          if (processed.length > 0) {
            setBanners(processed);
            setCsvLabel(`Loaded: ${path} · ${processed.length} banners`);
            return;
          }
        } catch {
          /* try next */
        }
      }
      setCsvLabel('CSV not found · showing built-in sample data');
    })();
  }, []);

  // ── CSV manual load ────────────────────────────────────────────────────────
  const loadCSV = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        const p = processBanners(r.data);
        if (p.length > 0) {
          setBanners(p);
          setCsvLabel(`${file.name} · ${p.length} banners`);
        }
      },
    });
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f?.name.endsWith('.csv')) loadCSV(f);
    },
    [loadCSV],
  );

  // ── Refresh button — calls Flask /api/refresh then reloads CSV ────────────
  const handleRefresh = async () => {
    setRefreshState('loading');
    setRefreshMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        // Re-load the CSV after scraper finishes
        for (const path of CSV_CANDIDATES) {
          try {
            const r2 = await fetch(path + '?t=' + Date.now()); // bust cache
            if (!r2.ok) continue;
            const text = await r2.text();
            const { data } = Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
            });
            const processed = processBanners(data);
            if (processed.length > 0) {
              setBanners(processed);
              setCsvLabel(`Refreshed · ${processed.length} banners`);
              break;
            }
          } catch {
            /* try next */
          }
        }
        setRefreshState('success');
        setRefreshMsg(json.message || 'Updated.');
      } else {
        setRefreshState('error');
        setRefreshMsg(json.message || 'Scraper error.');
      }
    } catch (e) {
      setRefreshState('error');
      setRefreshMsg('Could not reach server. Is Flask running?');
    }
    setTimeout(() => setRefreshState('idle'), 4000);
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const years = useMemo(
    () =>
      [
        ...new Set(
          banners.map((b) => getYear(b.dates)).filter((y) => y !== '?'),
        ),
      ].sort(),
    [banners],
  );

  const stats = useMemo(
    () => ({
      total: banners.length,
      upcoming: banners.filter((b) => b.status === 'upcoming').length,
      active: banners.filter((b) => b.status === 'active').length,
      past: banners.filter((b) => b.status === 'past').length,
      servants: new Set(banners.flatMap((b) => b.servants)).size,
    }),
    [banners],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return banners.filter((b) => {
      const matchQ =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.servants.some((s) => s.toLowerCase().includes(q));
      const matchSt =
        statusFilter === 'all' ||
        b.status === statusFilter ||
        (statusFilter === 'upcoming' &&
          (b.status === 'upcoming' || b.status === 'active'));
      const matchY = yearFilter === 'all' || getYear(b.dates) === yearFilter;
      return matchQ && matchSt && matchY;
    });
  }, [banners, query, yearFilter, statusFilter]);

  const servantMatches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const map = {};
    banners.forEach((b) =>
      b.servants.forEach((s) => {
        if (s.toLowerCase().includes(q)) map[s] = (map[s] || 0) + 1;
      }),
    );
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [query, banners]);

  // ── Refresh button colour ──────────────────────────────────────────────────
  const refreshColor =
    refreshState === 'success'
      ? C.green
      : refreshState === 'error'
        ? C.red
        : refreshState === 'loading'
          ? C.goldbright
          : C.muted;

  const refreshLabel =
    refreshState === 'loading'
      ? '↻ Refreshing…'
      : refreshState === 'success'
        ? '✓ Updated'
        : refreshState === 'error'
          ? '✗ Error'
          : '↻ Refresh Data';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <BrowserRouter basename="/fgo">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/banner-list"
          element={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                width: '100%',
                background: C.bg,
                color: C.text,
                fontFamily: "'Exo 2', sans-serif",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Exo+2:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input::placeholder { color: ${C.muted}; }
        input:focus { outline: none; }
        button:active { transform: scale(0.97); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.55} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .bcard { transition: border-color .18s, box-shadow .18s; }
        .bcard:hover { border-color: ${C.borderhi} !important; }
      `}</style>

              {/* ── HEADER ─────────────────────────────────────────────────────────── */}
              <header
                style={{
                  width: '100%',
                  background: `linear-gradient(180deg,#0b0e1c 0%,${C.bg} 100%)`,
                  borderBottom: `1px solid ${C.border}`,
                  padding: '16px 32px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  {/* Title */}
                  <div>
                    <h1
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 24,
                        fontWeight: 900,
                        letterSpacing: 3,
                        background: `linear-gradient(90deg,${C.goldbright},#e8d48a,${C.goldbright})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      FATE/GRAND ORDER
                    </h1>
                    <p
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 9,
                        letterSpacing: 4,
                        color: C.muted,
                        fontWeight: 700,
                        marginTop: 3,
                      }}
                    >
                      NA SERVER · PREDICTED BANNER CALENDAR
                    </p>
                  </div>

                  {/* Controls: CSV load + Refresh */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        maxWidth: 340,
                        textAlign: 'right',
                        lineHeight: 1.4,
                      }}
                    >
                      {csvLabel}
                    </div>

                    {/* Refresh button — runs scraper via Flask */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={handleRefresh}
                        disabled={refreshState === 'loading'}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 7,
                          cursor:
                            refreshState === 'loading'
                              ? 'not-allowed'
                              : 'pointer',
                          background:
                            refreshState !== 'idle'
                              ? refreshColor + '18'
                              : C.surfhi,
                          border: `1px solid ${refreshColor + (refreshState === 'idle' ? '00' : '80')}`,
                          color: refreshColor,
                          fontSize: 12,
                          fontFamily: "'Exo 2', sans-serif",
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          opacity: refreshState === 'loading' ? 0.7 : 1,
                        }}
                        title="Re-runs the Python scraper on the server and reloads the CSV"
                      >
                        {refreshLabel}
                      </button>
                      {refreshMsg && (
                        <span
                          style={{
                            fontSize: 10,
                            color: refreshState === 'error' ? C.red : C.green,
                            maxWidth: 260,
                            textAlign: 'right',
                            lineHeight: 1.4,
                          }}
                        >
                          {refreshMsg}
                        </span>
                      )}
                    </div>

                    {/* Manual CSV upload */}
                    <button
                      onClick={() => fileRef.current.click()}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        background: C.surfhi,
                        border: `1px solid ${C.borderhi}`,
                        color: C.muted,
                        fontSize: 12,
                        fontFamily: "'Exo 2', sans-serif",
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.gold;
                        e.currentTarget.style.color = C.goldbright;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.borderhi;
                        e.currentTarget.style.color = C.muted;
                      }}
                    >
                      ↑ Load CSV
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={(e) =>
                        e.target.files[0] && loadCSV(e.target.files[0])
                      }
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'BANNERS', val: stats.total, color: C.goldbright },
                    { label: 'UPCOMING', val: stats.upcoming, color: C.blue },
                    ...(stats.active > 0
                      ? [{ label: 'ACTIVE', val: stats.active, color: C.green }]
                      : []),
                    ...(stats.past > 0
                      ? [{ label: 'PAST', val: stats.past, color: C.muted }]
                      : []),
                    {
                      label: 'SERVANTS',
                      val: stats.servants,
                      color: '#a090e0',
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        background: C.surfhi,
                        border: `1px solid ${C.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: 20,
                          fontWeight: 700,
                          color,
                          lineHeight: 1,
                        }}
                      >
                        {val}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          letterSpacing: 1.5,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </header>

              {/* ── CONTROLS BAR ───────────────────────────────────────────────────── */}
              <div
                style={{
                  width: '100%',
                  padding: '14px 32px 10px',
                  background: C.bg,
                  borderBottom: `1px solid ${C.border}`,
                  flexShrink: 0,
                }}
              >
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: C.muted,
                      fontSize: 17,
                      pointerEvents: 'none',
                    }}
                  >
                    ⌕
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      dragging
                        ? 'Drop CSV here…'
                        : 'Search by servant name or banner title…'
                    }
                    style={{
                      width: '100%',
                      padding: '11px 42px',
                      background: dragging ? '#0d1820' : C.surfhi,
                      border: `1px solid ${dragging ? C.gold : query ? C.borderhi : C.border}`,
                      borderRadius: 9,
                      color: C.text,
                      fontSize: 14,
                      fontFamily: "'Exo 2', sans-serif",
                      fontWeight: 500,
                      transition: 'border-color 0.15s',
                    }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: C.muted,
                        cursor: 'pointer',
                        fontSize: 20,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Servant match badges */}
                {servantMatches.length > 0 && (
                  <div
                    style={{
                      marginBottom: 10,
                      padding: '8px 12px',
                      background: '#0c1018',
                      border: `1px solid ${C.gold}25`,
                      borderRadius: 8,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: C.golddim,
                        fontWeight: 800,
                        letterSpacing: 1.2,
                      }}
                    >
                      MATCHING SERVANTS
                    </span>
                    {servantMatches.map(([s, n]) => (
                      <span
                        key={s}
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#1c1200',
                          color: C.goldbright,
                          border: `1px solid ${C.golddim}`,
                        }}
                      >
                        {s}{' '}
                        <span style={{ color: C.golddim, fontWeight: 400 }}>
                          ×{n}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Filter pills */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <Pill
                    active={yearFilter === 'all' && statusFilter === 'all'}
                    accent={C.goldbright}
                    onClick={() => {
                      setYearFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    ALL
                  </Pill>
                  <Pill
                    active={statusFilter === 'upcoming'}
                    accent={C.blue}
                    onClick={() =>
                      setStatusFilter((p) =>
                        p === 'upcoming' ? 'all' : 'upcoming',
                      )
                    }
                  >
                    UPCOMING
                  </Pill>
                  {stats.active > 0 && (
                    <Pill
                      active={statusFilter === 'active'}
                      accent={C.green}
                      onClick={() =>
                        setStatusFilter((p) =>
                          p === 'active' ? 'all' : 'active',
                        )
                      }
                    >
                      ACTIVE
                    </Pill>
                  )}
                  <Pill
                    active={statusFilter === 'past'}
                    accent={C.muted}
                    onClick={() =>
                      setStatusFilter((p) => (p === 'past' ? 'all' : 'past'))
                    }
                  >
                    PAST
                  </Pill>
                  <span
                    style={{
                      width: 1,
                      background: C.border,
                      height: 24,
                      alignSelf: 'center',
                      margin: '0 4px',
                    }}
                  />
                  {years.map((y) => (
                    <Pill
                      key={y}
                      active={yearFilter === y}
                      accent="#9080d0"
                      onClick={() =>
                        setYearFilter((p) => (p === y ? 'all' : y))
                      }
                    >
                      {y}
                    </Pill>
                  ))}
                  <span
                    style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}
                  >
                    {filtered.length} of {banners.length} banners
                  </span>
                </div>
              </div>

              {/* ── BANNER GRID ─────────────────────────────────────────────────────── */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 32px 40px',
                  width: '100%',
                }}
              >
                {filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '100px 20px',
                      border: `1px dashed ${C.border}`,
                      borderRadius: 12,
                      background: C.surf,
                    }}
                  >
                    <div
                      style={{ fontSize: 30, opacity: 0.3, marginBottom: 10 }}
                    >
                      ⚜
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: 14,
                        letterSpacing: 2,
                        color: C.muted,
                      }}
                    >
                      NO RESULTS
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(360px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {filtered.map((b, i) => {
                      const info = STATUS_INFO[b.status] || STATUS_INFO.unknown;
                      const days =
                        b.status === 'upcoming'
                          ? daysUntil(b.dates.start)
                          : null;
                      const q = query.toLowerCase().trim();
                      const titleHit = q && b.name.toLowerCase().includes(q);

                      return (
                        <div
                          key={i}
                          className="bcard"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: `1px solid ${titleHit ? C.gold + '60' : C.border}`,
                            background:
                              b.status === 'active'
                                ? '#080e0c'
                                : b.status === 'past'
                                  ? '#09090d'
                                  : C.surf,
                            boxShadow:
                              b.status === 'active'
                                ? `0 0 14px ${C.green}18`
                                : 'none',
                            animation: `fadeIn 0.15s ease ${Math.min(i * 0.025, 0.4)}s both`,
                            opacity: b.status === 'past' ? 0.65 : 1,
                          }}
                        >
                          {/* Status strip */}
                          <div
                            style={{
                              height: 3,
                              width: '100%',
                              flexShrink: 0,
                              background:
                                b.status === 'active'
                                  ? C.green
                                  : b.status === 'upcoming'
                                    ? C.blue
                                    : C.border,
                              opacity: b.status === 'past' ? 0.3 : 1,
                            }}
                          />

                          {/* Banner image */}
                          {b.image && (
                            <div
                              style={{
                                width: '100%',
                                background: '#060910',
                                lineHeight: 0,
                              }}
                            >
                              <img
                                src={b.image}
                                alt=""
                                onError={(e) =>
                                  (e.target.parentElement.style.display =
                                    'none')
                                }
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                  opacity: b.status === 'past' ? 0.4 : 1,
                                }}
                              />
                            </div>
                          )}

                          {/* Card content */}
                          <div style={{ padding: '12px 16px 14px', flex: 1 }}>
                            {/* Title + status badge */}
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'flex-start',
                                marginBottom: 8,
                                flexWrap: 'wrap',
                              }}
                            >
                              <p
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontFamily: "'Exo 2', sans-serif",
                                  fontWeight: 600,
                                  fontSize: 14,
                                  color: b.status === 'past' ? C.muted : C.text,
                                  lineHeight: 1.35,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {b.name}
                              </p>
                              <div
                                style={{
                                  flexShrink: 0,
                                  padding: '3px 9px',
                                  borderRadius: 5,
                                  background: info.bg,
                                  border: `1px solid ${info.border}`,
                                  color: info.fg,
                                  fontSize: 9,
                                  fontFamily: "'Exo 2', sans-serif",
                                  fontWeight: 800,
                                  letterSpacing: 1.3,
                                  animation:
                                    b.status === 'active'
                                      ? 'pulse 2s infinite'
                                      : 'none',
                                  alignSelf: 'flex-start',
                                }}
                              >
                                {info.label}
                              </div>
                            </div>

                            {/* Dates */}
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 10,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: 1.5,
                                  color:
                                    b.status === 'past' ? C.golddim : C.gold,
                                }}
                              >
                                {b.status === 'past' || b.status === 'active'
                                  ? 'NA'
                                  : 'NA PREDICTED'}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color:
                                    b.status === 'past' ? C.muted : '#a8bce0',
                                  fontWeight: 500,
                                }}
                              >
                                {fmtDate(b.dates.start)} —{' '}
                                {fmtDate(b.dates.end)}
                              </span>
                              {days !== null && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color:
                                      days <= 14
                                        ? C.goldbright
                                        : days <= 60
                                          ? C.blue
                                          : C.muted,
                                    background:
                                      days <= 14
                                        ? '#180e00'
                                        : days <= 60
                                          ? C.bluedim
                                          : C.surf,
                                    padding: '1px 9px',
                                    borderRadius: 20,
                                    border: `1px solid ${days <= 14 ? C.golddim : days <= 60 ? '#1a3060' : C.border}`,
                                  }}
                                >
                                  {days}d away
                                </span>
                              )}
                              {b.status === 'active' && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: C.green,
                                    background: C.greendim,
                                    padding: '1px 9px',
                                    borderRadius: 20,
                                    border: '1px solid #204830',
                                    animation: 'pulse 2s infinite',
                                  }}
                                >
                                  ● LIVE NOW
                                </span>
                              )}
                            </div>

                            {/* Servants */}
                            {b.servants.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 5,
                                }}
                              >
                                {b.servants.map((s, j) => {
                                  const hit = q && s.toLowerCase().includes(q);
                                  return (
                                    <span
                                      key={j}
                                      style={{
                                        padding: '3px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: hit ? 700 : 400,
                                        background: hit ? '#1a1000' : '#0f1428',
                                        color: hit ? C.goldbright : '#6070a0',
                                        border: `1px solid ${hit ? C.golddim : '#1c2440'}`,
                                        boxShadow: hit
                                          ? `0 0 6px ${C.gold}25`
                                          : 'none',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {s}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
              <footer
                style={{
                  width: '100%',
                  borderTop: `1px solid ${C.border}`,
                  padding: '10px 32px',
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  fontSize: 10,
                  color: C.muted,
                  letterSpacing: 0.8,
                }}
              >
                <span>
                  DATA: grandorder.gamepress.gg · JP +2 YEARS · PREDICTIONS ONLY
                </span>
                <span>
                  DRAG & DROP CSV ANYWHERE · ↻ REFRESH DATA RE-RUNS SCRAPER
                </span>
              </footer>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
