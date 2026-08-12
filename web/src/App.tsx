import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchHolidays,
  fetchOptimize,
  fetchStates,
  fmtDay,
  fmtRange,
  icsUrl,
  shareUrl,
  weekdayLetter,
  weekdayShort,
  type Holiday,
  type LeavePlan,
  type OptimizeResult,
  type StateInfo,
} from "./api.ts";

const DEFAULT_STATES: StateInfo[] = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DH", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TS", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UT", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.48, ease: [0.2, 0.7, 0.2, 1] },
  }),
};

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${weekdayShort(iso)} ${MONTHS[(m ?? 1) - 1]} ${d}`;
}

function groupHolidays(holidays: Holiday[]): { month: string; items: Holiday[] }[] {
  const map = new Map<string, Holiday[]>();
  for (const h of holidays) {
    const key = MONTHS[Number(h.date.slice(5, 7)) - 1] ?? "—";
    const list = map.get(key) ?? [];
    list.push(h);
    map.set(key, list);
  }
  return MONTHS.filter((m) => map.has(m)).map((month) => ({
    month,
    items: map.get(month)!,
  }));
}

function isWeekendDay(iso: string, weekend: string): boolean {
  const day = new Date(iso + "T00:00:00Z").getUTCDay();
  if (weekend === "sun-only") return day === 0;
  return day === 0 || day === 6;
}

function TimelineStrip({
  plan,
  holidays,
  weekend,
}: {
  plan: LeavePlan;
  holidays: Holiday[];
  weekend: string;
}) {
  const leaveSet = new Set(plan.leaveDates);
  const holidaySet = new Set(
    holidays
      .filter((h) => h.date >= plan.from && h.date <= plan.to)
      .map((h) => h.date),
  );

  const days: {
    iso: string;
    kind: "leave" | "holiday" | "weekend" | "span";
    label: string;
  }[] = [];
  const start = new Date(plan.from + "T00:00:00Z");
  const end = new Date(plan.to + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    let kind: "leave" | "holiday" | "weekend" | "span" = "span";
    if (leaveSet.has(iso)) kind = "leave";
    else if (holidaySet.has(iso)) kind = "holiday";
    else if (isWeekendDay(iso, weekend)) kind = "weekend";
    days.push({ iso, kind, label: weekdayLetter(iso) });
  }

  return (
    <div className="timeline" aria-label="Break timeline">
      <div className="timeline__legend">
        <span className="lg lg--leave">Leave day</span>
        <span className="lg lg--holiday">Holiday</span>
        <span className="lg lg--weekend">Weekend</span>
      </div>
      <div className="timeline__track">
        {days.map((day) => (
          <div key={day.iso} className="timeline__cell" title={`${fmtDay(day.iso)} · ${day.kind}`}>
            <span className={`timeline__day timeline__day--${day.kind}`} />
            <span className="timeline__dow">{day.label}</span>
            <span className="timeline__dom">{Number(day.iso.slice(8))}</span>
          </div>
        ))}
      </div>
      <div className="timeline__labels">
        <span>{shortDate(plan.from)}</span>
        <span>{shortDate(plan.to)}</span>
      </div>
    </div>
  );
}

function PlanRow({
  plan,
  rank,
  selected,
  onSelect,
}: {
  plan: LeavePlan;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const maxEff = Math.max(plan.efficiency, 1);
  const bar = Math.min(100, Math.round((plan.efficiency / Math.max(maxEff, 8)) * 100) + 20);

  return (
    <button
      type="button"
      className={`plan-row glass ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
    >
      <span className="plan-rank">#{rank}</span>
      <div className="plan-row-main">
        <strong>{plan.label}</strong>
        <span>{fmtRange(plan.from, plan.to)}</span>
        <span className="plan-bar" aria-hidden>
          <i style={{ width: `${bar}%` }} />
        </span>
      </div>
      <div className="plan-row-meta">
        <em>{plan.efficiency}×</em>
        <span>{plan.totalOff}d off</span>
      </div>
    </button>
  );
}

export default function App() {
  const [states, setStates] = useState<StateInfo[]>(DEFAULT_STATES);
  const [years, setYears] = useState<number[]>([2026, 2027]);
  const [state, setState] = useState("KA");
  const [year, setYear] = useState(2027);
  const [leaves, setLeaves] = useState(4);
  const [weekend, setWeekend] = useState<"sat-sun" | "sun-only">("sat-sun");
  const [includeRestricted, setIncludeRestricted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    fetchStates()
      .then((data) => {
        setStates(data.states);
        setYears(data.years);
        if (data.years.length && !data.years.includes(year)) {
          setYear(data.years[data.years.length - 1]!);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".glass") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const selected = useMemo(() => {
    if (!result?.plans.length) return null;
    return result.plans.find((p) => p.id === selectedId) ?? result.plans[0]!;
  }, [result, selectedId]);

  const stateName = states.find((s) => s.code === state)?.name ?? state;
  const holidayGroups = useMemo(() => groupHolidays(holidays), [holidays]);
  const best = result?.plans[0] ?? null;

  async function runOptimize(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const [opt, hol] = await Promise.all([
        fetchOptimize({
          state,
          year,
          leaves,
          weekend,
          includeRestricted,
          maxPlans: 8,
        }),
        fetchHolidays(state, year, includeRestricted),
      ]);
      setResult(opt);
      setSelectedId(opt.plans[0]?.id ?? null);
      setHolidays(hol.holidays);
    } catch (err) {
      setResult(null);
      setSelectedId(null);
      setHolidays([]);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <div className="bg-orbit" aria-hidden />

      <header className="ide-bar">
        <a className="ide-brand" href="https://toolwizhub.com" aria-label="ToolWizHub HolidayLens">
          <span className="ide-brand__badge">
            <img src="/assets/logo-icon.webp" alt="" width={34} height={34} />
          </span>
          <span className="ide-brand__text">
            <strong>ToolWizHub</strong>
            <span>HolidayLens</span>
          </span>
        </a>
        <span className="ide-bar__spacer" />
        <span className="ide-bar__tag">Leave bridges · India</span>
      </header>

      <section className="hero-stage">
        <motion.div
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <p className="hero__eyebrow">India · state-aware leave optimizer</p>
          <h1 className="hero__brand">HolidayLens</h1>
          <p className="hero__lede">
            Turn a handful of leave days into the longest break on the calendar — gazette holidays,
            weekends, and bridge math. No AI keys.
          </p>
        </motion.div>

        <motion.div
          className="hero-formula"
          aria-hidden
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="formula-card">
            <span className="formula-card__n">{leaves}</span>
            <span className="formula-card__l">leave days</span>
          </div>
          <span className="formula-arrow">→</span>
          <div className="formula-card formula-card--out">
            <span className="formula-card__n">
              {best ? best.totalOff : "—"}
            </span>
            <span className="formula-card__l">day break</span>
          </div>
          <div className="formula-glow" />
        </motion.div>
      </section>

      <form className="controls glass" onSubmit={runOptimize}>
        <label>
          <span>State</span>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {states.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Year</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="leaves-field">
          <span>Leave days</span>
          <div className="stepper">
            <button
              type="button"
              aria-label="Fewer leave days"
              onClick={() => setLeaves((n) => Math.max(0, n - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={30}
              value={leaves}
              onChange={(e) => setLeaves(Number(e.target.value))}
            />
            <button
              type="button"
              aria-label="More leave days"
              onClick={() => setLeaves((n) => Math.min(30, n + 1))}
            >
              +
            </button>
          </div>
        </label>
        <label>
          <span>Weekend</span>
          <select
            value={weekend}
            onChange={(e) => setWeekend(e.target.value as "sat-sun" | "sun-only")}
          >
            <option value="sat-sun">Sat–Sun</option>
            <option value="sun-only">Sun only</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={includeRestricted}
            onChange={(e) => setIncludeRestricted(e.target.checked)}
          />
          <span>Restricted</span>
        </label>
        <button type="submit" className="cta" disabled={loading}>
          {loading ? "Finding…" : "Find bridges"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            className="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {loading && !result && (
        <div className="loading" role="status" aria-live="polite">
          <div className="loading__head">
            <div className="loading__orb" aria-hidden>
              <span className="loading__ring" />
              <span className="loading__ring loading__ring--2" />
              <span className="loading__spark" />
            </div>
            <div className="loading__copy">
              <div className="loading__title">
                <span className="loading__shine">Scanning the calendar</span>
                <span className="loading__dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="loading__sub">Merging holidays + weekends…</div>
            </div>
          </div>
        </div>
      )}

      {result && selected && (
        <motion.section
          className="spotlight"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
        >
          <div className="spotlight__glow" aria-hidden />
          <div className="spotlight__main glass">
            <div className="spotlight__kicker">
              <span>Best match</span>
              {result.coverage === "national" && <span className="coverage">National calendar</span>}
              {result.coverage === "state" && <span className="coverage is-state">State + national</span>}
            </div>
            <h2 className="spotlight__title">{selected.label}</h2>
            <p className="spotlight__range">
              {stateName} · {fmtRange(selected.from, selected.to)}
            </p>
            <TimelineStrip plan={selected} holidays={holidays} weekend={result.weekend} />
            <div className="spotlight__stats">
              <div>
                <strong>{selected.leavesUsed}</strong>
                <span>Leave days</span>
              </div>
              <div>
                <strong>{selected.weekends}</strong>
                <span>Weekends</span>
              </div>
              <div>
                <strong>{selected.holidays}</strong>
                <span>Holidays</span>
              </div>
              <div>
                <strong>{selected.totalOff}</strong>
                <span>Days off</span>
              </div>
              <div className="is-accent">
                <strong>{selected.efficiency}×</strong>
                <span>ROI</span>
              </div>
            </div>
            {(selected.leaveDates.length > 0 || selected.holidayNames.length > 0) && (
              <div className="spotlight__chips">
                {selected.leaveDates.length > 0 && (
                  <div className="chip-block">
                    <h4>Apply leave on</h4>
                    <div className="chips">
                      {selected.leaveDates.map((d) => (
                        <span key={d}>{fmtDay(d)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.holidayNames.length > 0 && (
                  <div className="chip-block">
                    <h4>Holidays in span</h4>
                    <div className="chips soft">
                      {selected.holidayNames.map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="detail-actions">
              <a
                className="btn"
                href={shareUrl({
                  state: result.state,
                  year: result.year,
                  leaves: result.leaves,
                  plan: selected.id,
                })}
                target="_blank"
                rel="noreferrer"
              >
                Share page
              </a>
              <a
                className="btn ghost"
                href={icsUrl({
                  state: result.state,
                  year: result.year,
                  leaves: result.leaves,
                  plan: selected.id,
                })}
              >
                Add to calendar
              </a>
            </div>
          </div>
        </motion.section>
      )}

      {result && (
        <motion.section
          className="results"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
        >
          <div className="section-head">
            <h2>All bridges · {result.year}</h2>
            <p>
              {result.plans.length
                ? `${result.plans.length} plans ranked by days off, then efficiency.`
                : "No bridges fit this leave-day budget — try more days or another year."}
            </p>
          </div>

          <div className="plan-list plan-list--grid">
            {result.plans.map((plan, i) => (
              <motion.div key={plan.id} variants={fadeUp} custom={i + 1} initial="hidden" animate="show">
                <PlanRow
                  plan={plan}
                  rank={i + 1}
                  selected={selected?.id === plan.id}
                  onSelect={() => setSelectedId(plan.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {holidayGroups.length > 0 && (
        <motion.section
          className="holidays-section"
          id="holidays"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0}
        >
          <div className="section-head">
            <h2>Year at a glance</h2>
            <p>
              {holidays.length} gazetted
              {includeRestricted ? " + restricted" : ""} holidays powering the optimizer
              {result?.coverage === "national" ? " · national calendar" : ""}.
            </p>
          </div>
          <div className="month-grid">
            {holidayGroups.map((g) => (
              <div key={g.month} className="month-card glass">
                <h3>{g.month}</h3>
                <ul>
                  {g.items.map((h) => (
                    <li key={`${h.date}-${h.name}`}>
                      <div className="h-date">
                        <time dateTime={h.date}>{h.date.slice(8)}</time>
                        <em>{weekdayShort(h.date)}</em>
                      </div>
                      <span className="h-name">{h.name}</span>
                      <span className={`badge ${h.type}`}>{h.scope}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <div className="ide-statusbar" role="status">
        <span className="ide-statusbar__seg">{stateName}</span>
        <span className="ide-statusbar__seg">
          {result?.plans[0] ? result.plans[0].label : "—"}
        </span>
        <span className="ide-statusbar__seg ide-statusbar__seg--grow">HolidayLens</span>
        <span className="ide-statusbar__seg ide-statusbar__seg--ok">
          {loading ? "loading…" : error ? "error" : result ? "ready" : "idle"}
        </span>
      </div>

      <footer className="app-footer">
        <a
          className="app-footer__brand"
          href="https://toolwizhub.com"
          target="_blank"
          rel="noopener noreferrer"
          title="More free tools at ToolWizHub"
        >
          <span className="app-footer__label">More free tools at</span>
          <img src="/assets/logo-horizontal.webp" alt="ToolWizHub" />
        </a>
        <p className="app-footer__credit">
          State holidays + leave bridges · <a href="https://toolwizhub.com">ToolWizHub</a>
        </p>
      </footer>
    </div>
  );
}
