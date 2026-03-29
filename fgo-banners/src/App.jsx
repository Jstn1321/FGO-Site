import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import * as Papa from 'papaparse';

const EMBEDDED = [
  {
    name: "Indra's Great Trial Indra Pickup Summon",
    dates: '2027-07-02 to 2027-07-14',
    servants: 'Indra',
    image: '',
  },
  {
    name: "Indra's Great Trial Wandjina Pickup Summon",
    dates: '2027-07-05 to 2027-07-12',
    servants: 'Wandjina',
    image: '',
  },
  {
    name: "Indra's Great Trial Anastasia Pickup Summon",
    dates: '2027-07-08 to 2027-07-14',
    servants: 'Anastasia Nikolaevna Romanova, Tlaloc',
    image: '',
  },
  {
    name: "Indra's Great Trial Kingprotea Pickup Summon",
    dates: '2027-07-09 to 2027-07-14',
    servants: 'Kingprotea',
    image: '',
  },
  {
    name: 'FGO Fes 2027 10th Anniversary Countdown Pickup Summon (Daily)',
    dates: '2027-07-23 to 2027-08-02',
    servants: 'Leonardo da Vinci, Leonardo da Vinci (Rider)',
    image: '',
  },
  {
    name: 'FGO 10th Anniversary U-Olga Marie Pickup Summon',
    dates: '2027-08-03 to 2027-08-17',
    servants: 'U-Olga Marie',
    image: '',
  },
  {
    name: 'FGO Summer 2027 Chaldea U Summer Island Tezcatlipoca Pickup Summon',
    dates: '2027-08-13 to 2027-09-03',
    servants: 'Tezcatlipoca, Saito Hajime, Cu Chulainn (Caster)',
    image: '',
  },
  {
    name: 'FGO Summer 2027 Chaldea U Summer Island Passionlip (Saber) Pickup Summon',
    dates: '2027-08-13 to 2027-09-03',
    servants: 'Passionlip (Saber), Kriemhild (Rider)',
    image: '',
  },
  {
    name: 'FGO Summer 2027 Ryougi Shiki (Moon Cancer) Pickup Summon',
    dates: '2027-08-15 to 2027-09-03',
    servants: 'Ryougi Shiki (Moon Cancer), Miyu Edelfelt (Lancer)',
    image: '',
  },
  {
    name: 'FGO Summer 2027 Larva / Tiamat (Archer) Pickup Summon',
    dates: '2027-08-17 to 2027-09-03',
    servants: 'Larva / Tiamat (Archer), Jeunesse Crane',
    image: '',
  },
  {
    name: 'FGO Summer 2027 Aesc the Savior Pickup Summon',
    dates: '2027-08-20 to 2027-08-27',
    servants:
      'Aesc the Savior, Osakabehime (Archer), Illyasviel von Einzbern (Archer)',
    image: '',
  },
  {
    name: '32M Downloads Campaign Morgan Pickup Summon',
    dates: '2027-08-29 to 2027-09-12',
    servants: 'Morgan, Baobhan Sith',
    image: '',
  },
  {
    name: 'Vanishing Beginning Nemo / Noah Pickup Summon',
    dates: '2027-09-05 to 2027-09-24',
    servants: 'Nemo / Noah, Caster of Okeanos',
    image: '',
  },
  {
    name: 'Vanishing Beginning Beni-Enma Louhi Pickup 2 Summon (Daily)',
    dates: '2027-09-07 to 2027-09-24',
    servants: 'Beni-Enma, Louhi, Caster of Okeanos',
    image: '',
  },
  {
    name: 'GUDAGUDA Shinsengumi Kawakami Gensai Pickup Summon',
    dates: '2027-09-24 to 2027-10-15',
    servants: 'Kawakami Gensai, Todo Heisuke',
    image: '',
  },
  {
    name: 'GUDAGUDA Shinsengumi Pickup 2 Summon (Daily)',
    dates: '2027-09-26 to 2027-10-15',
    servants: 'Hijikata Toshizo, Okita Souji, Yamanami Keisuke',
    image: '',
  },
  {
    name: 'GUDAGUDA Shinsengumi Kondo Isami Pickup Summon',
    dates: '2027-10-01 to 2027-10-15',
    servants: 'Kondo Isami, Todo Heisuke',
    image: '',
  },
  {
    name: '33M Downloads Campaign Metatron Jeanne Pickup Summon',
    dates: '2027-10-08 to 2027-10-22',
    servants: 'Metatron Jeanne, Ashoka the Great',
    image: '',
  },
  {
    name: 'Final Halloween 2027 Elisabeth Bathory (SSR) Pickup Summon',
    dates: '2027-10-22 to 2027-11-12',
    servants: 'Elisabeth Bathory (SSR)',
    image: '',
  },
  {
    name: 'Final Halloween 2027 Pickup 2 Summon (Daily)',
    dates: '2027-10-24 to 2027-11-12',
    servants: 'Jacques de Molay, Achilles, Berserker of El Dorado',
    image: '',
  },
  {
    name: 'Final Halloween 2027 Pickup 3 Summon (Daily)',
    dates: '2027-10-28 to 2027-11-06',
    servants: 'Osakabehime, Vlad III, Watanabe-no-Tsuna, Carmilla',
    image: '',
  },
  {
    name: 'Pilgrimage Festival 14 Pickup Summon (Daily)',
    dates: '2027-10-31 to 2027-11-09',
    servants: 'Van Gogh, Abigail Williams',
    image: '',
  },
  {
    name: 'FGO Road to Final Chapter 5th Morgan Pickup Summon',
    dates: '2027-11-03 to 2027-11-10',
    servants: 'Morgan, Barghest',
    image: '',
  },
  {
    name: 'FGO Road to Final Chapter 6th Tezcatlipoca Pickup Summon',
    dates: '2027-11-10 to 2027-11-17',
    servants: 'Tezcatlipoca, Nitocris',
    image: '',
  },
  {
    name: 'FGO Road to Final Chapter 7th Medusa (Saber) Pickup Summon',
    dates: '2027-11-17 to 2027-11-24',
    servants: 'Medusa (Saber), Duryodhana',
    image: '',
  },
  {
    name: 'FGO Road to Final Chapter 8th Monte Cristo Pickup Summon',
    dates: '2027-11-24 to 2027-12-01',
    servants: 'The Count of Monte Cristo, Alessandro di Cagliostro',
    image: '',
  },
  {
    name: 'FGO Road to Final Chapter 9th BB (Dubai) Pickup Summon',
    dates: '2027-12-01 to 2027-12-08',
    servants: 'BB (Dubai), Tenochtitlan (Moon Cancer)',
    image: '',
  },
  {
    name: 'FGO Road to Final Chapter 10th Lilith Pickup Summon',
    dates: '2027-12-08 to 2027-12-15',
    servants: 'Lilith, Saint Martha (Ruler)',
    image: '',
  },
  {
    name: 'New Year 2028 Pickup Summon (Daily)',
    dates: '2028-01-01 to 2028-01-14',
    servants:
      'Lord Logres, Phantasmoon, Arjuna (Alter), Biscione, Tutankhamun, Huyan Zhuo, Takeda Shingen, Melusine (Ruler), Miyu Edelfelt, Asvatthaman, Daikokuten, Yui Shousetsu, Xu Fu (Avenger), Nagakura Shinpachi, UDK Barghest',
    image: '',
  },
  {
    name: 'Fate/strange Fake TV Anime Commemoration Pickup Summon (Daily)',
    dates: '2028-01-03 to 2028-01-16',
    servants: 'Richard I, Gilgamesh, Enkidu',
    image: '',
  },
  {
    name: 'Chaldean Floralia Prerelease Campaign Pickup Summon (Daily)',
    dates: '2028-01-13 to 2028-01-27',
    servants: 'Kingprotea, Merlin, Sen-no-Rikyu, Meltryllis, Kama, Passionlip',
    image: '',
  },
  {
    name: 'FGO Chaldea Satellite Station 2026 Dante Alighieri Pickup Summon',
    dates: '2028-01-14 to 2028-01-21',
    servants: 'Dante Alighieri',
    image: '',
  },
  {
    name: 'Chaldean Floralia Hanasaka no Okina Pickup Summon',
    dates: '2028-01-23 to 2028-02-13',
    servants: 'Hanasaka no Okina, Hebi Nyobo, Zhang Jue',
    image: '',
  },
  {
    name: 'Chaldean Floralia Ereshkigal Pickup 2 Summon',
    dates: '2028-01-25 to 2028-02-13',
    servants: 'Ereshkigal, Robin Hood',
    image: '',
  },
  {
    name: 'Chaldean Floralia Katsushika Hokusai Pickup 3 Summon',
    dates: '2028-01-27 to 2028-02-13',
    servants: 'Katsushika Hokusai, Nero Claudius',
    image: '',
  },
  {
    name: 'Chaldean Floralia Kazuradrop Pickup 4 Summon',
    dates: '2028-01-29 to 2028-02-13',
    servants: 'Kazuradrop, Mysterious Alter Ego Λ, Asclepius',
    image: '',
  },
  {
    name: 'Chaldean Floralia Xiang Yu Pickup 5 Summon',
    dates: '2028-01-31 to 2028-02-13',
    servants: 'Xiang Yu, Yu Mei-ren',
    image: '',
  },
  {
    name: 'FGO Chaldea Satellite Station 2026 Commemoration Indra Pickup Summon',
    dates: '2028-02-05 to 2028-02-12',
    servants: 'Indra',
    image: '',
  },
  {
    name: "Valentine's 2028 Prerelease Campaign Pickup Summon (Daily)",
    dates: '2028-02-06 to 2028-02-13',
    servants:
      'Ono no Komachi, Andromeda, Pope Johanna, Manannan mac Lir (Bazett), Amor (Caren), Sei Shounagon, Murasaki Shikibu, Mysterious Heroine X (Alter), Nero Claudius (Bride)',
    image: '',
  },
  {
    name: "Valentine's 2028 Demeter Pickup Summon",
    dates: '2028-02-13 to 2028-03-06',
    servants: 'Demeter',
    image: '',
  },
  {
    name: "Valentine's 2028 Pickup 2 Summon (Daily)",
    dates: '2028-02-16 to 2028-03-06',
    servants:
      "Louhi, Helena Blavatsky, Marie Antoinette (Alter), Sitonai, Altria Pendragon (Lancer), Quetzalcoatl, Queen Medb, Nitocris (Alter), Galatea, Europa, Orion, Vritra, Bradamante, Caster of the Nightless City, Xuanzang Sanzang, Ganesha (Jinako), Francis Drake, Nightingale, Tamamo-no-Mae, Jack the Ripper, Altera, Mordred, Altria Pendragon, Dioscuri, Jeanne d'Arc, Kashin Koji, Anastasia Nikolaevna Romanova, Osakabehime",
    image: '',
  },
  {
    name: 'White Day Memorial 2028 Pickup Summon (Daily)',
    dates: '2028-03-06 to 2028-03-13',
    servants:
      'Dante Alighieri, Charlemagne, Takasugi Shinsaku, Arjuna (Alter), Amakusa Shirou, Odysseus, Archer of Shinjuku, Arthur Pendragon (Prototype), Edmond Dantes, Zhuge Liang (El-Melloi II)',
    image: '',
  },
  {
    name: 'CBC 2028 Jacques de Molay (Saber) Pickup Summon',
    dates: '2028-03-11 to 2028-03-25',
    servants: 'Jacques de Molay (Saber)',
    image: '',
  },
  {
    name: 'CBC 2028 Pickup 2 Summon (Daily)',
    dates: '2028-03-13 to 2028-03-25',
    servants: 'Jacques de Molay, Napoleon, Henry Jekyll & Hyde',
    image: '',
  },
  {
    name: 'CBC 2028 Pickup 3 Summon (Daily)',
    dates: '2028-03-15 to 2028-03-25',
    servants:
      'Bhima, Cu Chulainn (Alter), Nikola Tesla, Li Shuwen (Assassin), Taigong Wang, Nemo, Ozymandias, Karna, Minamoto-no-Tametomo, Arjuna, Achilles, Vlad III, Enkidu, Xiang Yu, Dioscuri',
    image: '',
  },
  {
    name: 'Revival: Water Monsters Crisis Pickup Summon (Daily)',
    dates: '2028-03-19 to 2028-04-09',
    servants:
      'Hai Ba Trung, Morgan, Qin Shi Huang, Mysterious Heroine X, Assassin of the Nightless City, Assassin of the Nightless City (Caster), Thomas Edison, Marie Antoinette (Caster)',
    image: '',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
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
function getStatus(d) {
  const now = new Date();
  if (!d.start) return 'unknown';
  if (now > d.end) return 'past';
  if (now >= d.start) return 'active';
  return 'upcoming';
}
function daysUntil(d) {
  return Math.ceil((d - new Date()) / 86400000);
}
function getYear(d) {
  return d.start ? String(d.start.getFullYear()) : '?';
}
function processBanners(raw) {
  return raw
    .map((r) => ({
      name: r['Banner Name'] || r.name || '',
      dates: parseDates(r['Predicted NA Dates'] || r.dates || ''),
      servants: parseServants(r['Featured Servants'] || r.servants || ''),
      image: r['Image URL'] || r.image || '',
    }))
    .filter((b) => b.dates.start)
    .sort((a, b) => a.dates.start - b.dates.start);
}

// ── Attempt to auto-fetch CSV from /public folder ──────────────────────────────
// Place your scraper output as public/banners.csv and it loads on startup.
// The scraper filename changes daily, so also try common names.
const CSV_CANDIDATES = [
  '/banners.csv',
  '/fgo_banners.csv',
  '/fgo_na_predicted_banners.csv',
];

// ── Colours ────────────────────────────────────────────────────────────────────
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
  text: '#d0d8f0',
  muted: '#4a5578',
};

export default function App() {
  const [banners, setBanners] = useState(() => processBanners(EMBEDDED));
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dragging, setDragging] = useState(false);
  const [csvLabel, setCsvLabel] = useState(
    'built-in data · place banners.csv in /public to auto-load',
  );
  const fileRef = useRef();

  // ── Auto-load CSV from public folder on mount ──────────────────────────────
  useEffect(() => {
    (async () => {
      for (const path of CSV_CANDIDATES) {
        try {
          const res = await fetch(path);
          if (!res.ok) continue;
          const text = await res.text();
          const result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          });
          const processed = processBanners(result.data);
          if (processed.length > 0) {
            setBanners(processed);
            setCsvLabel(`Auto-loaded: ${path} · ${processed.length} banners`);
            return;
          }
        } catch (_) {
          /* try next */
        }
      }
    })();
  }, []);

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
      upcoming: banners.filter((b) => getStatus(b.dates) === 'upcoming').length,
      active: banners.filter((b) => getStatus(b.dates) === 'active').length,
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
      const st = getStatus(b.dates);
      const matchSt =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' &&
          (st === 'upcoming' || st === 'active')) ||
        statusFilter === st;
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

  const statusInfo = {
    active: { label: 'ACTIVE', fg: C.green, bg: C.greendim, border: '#1a4828' },
    upcoming: {
      label: 'UPCOMING',
      fg: C.blue,
      bg: C.bluedim,
      border: '#1a2e5a',
    },
    past: { label: 'PAST', fg: C.muted, bg: C.surf, border: C.border },
    unknown: { label: '?', fg: C.muted, bg: C.surf, border: C.border },
  };

  const Pill = ({ children, active, accent, onClick }) => (
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

  return (
    <div
      style={{
        // Full-viewport layout: header fixed, content scrolls
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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
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

          {/* CSV controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: C.muted,
                maxWidth: 340,
                textAlign: 'right',
                lineHeight: 1.4,
              }}
            >
              {csvLabel}
            </span>
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
              onChange={(e) => e.target.files[0] && loadCSV(e.target.files[0])}
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
            { label: 'SERVANTS', val: stats.servants, color: '#a090e0' },
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
              <span style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5 }}>
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
                <span style={{ color: C.golddim, fontWeight: 400 }}>×{n}</span>
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
              setStatusFilter((p) => (p === 'upcoming' ? 'all' : 'upcoming'))
            }
          >
            UPCOMING
          </Pill>
          {stats.active > 0 && (
            <Pill
              active={statusFilter === 'active'}
              accent={C.green}
              onClick={() =>
                setStatusFilter((p) => (p === 'active' ? 'all' : 'active'))
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
              onClick={() => setYearFilter((p) => (p === y ? 'all' : y))}
            >
              {y}
            </Pill>
          ))}
          <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>
            {filtered.length} of {banners.length} banners
          </span>
        </div>
      </div>

      {/* ── BANNER LIST (scrollable) ────────────────────────────────────────── */}
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
            <div style={{ fontSize: 30, opacity: 0.3, marginBottom: 10 }}>
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map((b, i) => {
              const st = getStatus(b.dates);
              const info = statusInfo[st];
              const days = st === 'upcoming' ? daysUntil(b.dates.start) : null;
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
                    background: st === 'active' ? '#080e0c' : C.surf,
                    boxShadow:
                      st === 'active' ? `0 0 14px ${C.green}18` : 'none',
                    animation: `fadeIn 0.15s ease ${Math.min(i * 0.025, 0.4)}s both`,
                  }}
                >
                  {/* Status strip — top */}
                  <div
                    style={{
                      height: 3,
                      width: '100%',
                      flexShrink: 0,
                      background:
                        st === 'active'
                          ? C.green
                          : st === 'upcoming'
                            ? C.blue
                            : C.border,
                      opacity: st === 'past' ? 0.3 : 1,
                    }}
                  />

                  {/* Banner image — full width, uncropped */}
                  {b.image ? (
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
                          (e.target.parentElement.style.display = 'none')
                        }
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                          opacity: st === 'past' ? 0.4 : 1,
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Content below image */}
                  <div style={{ padding: '12px 16px 14px', flex: 1 }}>
                    {/* Title + badge */}
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
                          color: st === 'past' ? C.muted : C.text,
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
                            st === 'active' ? 'pulse 2s infinite' : 'none',
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
                          color: C.gold,
                        }}
                      >
                        NA PREDICTED
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: st === 'past' ? C.muted : '#a8bce0',
                          fontWeight: 500,
                        }}
                      >
                        {fmtDate(b.dates.start)} — {fmtDate(b.dates.end)}
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
                      {st === 'active' && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: C.green,
                            background: C.greendim,
                            padding: '1px 9px',
                            borderRadius: 20,
                            border: `1px solid #204830`,
                          }}
                        >
                          ● LIVE NOW
                        </span>
                      )}
                    </div>

                    {/* Servants */}
                    {b.servants.length > 0 && (
                      <div
                        style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}
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
                                boxShadow: hit ? `0 0 6px ${C.gold}25` : 'none',
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
        <span>DRAG & DROP CSV ANYWHERE TO REFRESH</span>
      </footer>
    </div>
  );
}
