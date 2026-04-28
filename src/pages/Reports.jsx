import { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reports as reportsApi } from '../api';
import './Reports.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(ymd) {
  if (!ymd) return '';
  return new Date(`${String(ymd).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}
function fmtDateRange(date, endDate) {
  if (!endDate || endDate === date) return fmt(date);
  return `${fmt(date)} – ${fmt(endDate)}`;
}
function pad(n) { return String(n).padStart(2, '0'); }
function ymd(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const QUARTERS = [
  { label: 'Q1 (Jan – Mar)', value: 1, start: [1,1],  end: [3,31]  },
  { label: 'Q2 (Apr – Jun)', value: 2, start: [4,1],  end: [6,30]  },
  { label: 'Q3 (Jul – Sep)', value: 3, start: [7,1],  end: [9,30]  },
  { label: 'Q4 (Oct – Dec)', value: 4, start: [10,1], end: [12,31] },
];

const PERIOD_TABS = ['Monthly', 'Quarterly', 'Yearly'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

/* ── Component ───────────────────────────────────────────────────────────── */
export default function Reports() {
  const { user } = useAuth();

  const now = new Date();
  const [periodTab, setPeriodTab] = useState('Monthly');
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [year,    setYear]    = useState(now.getFullYear());

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [reportLabel, setReportLabel] = useState('');
  const [hostFilter, setHostFilter] = useState('all');

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  /* Compute date range from period selection */
  const dateRange = useMemo(() => {
    if (periodTab === 'Monthly') {
      return {
        start: ymd(year, month, 1),
        end:   ymd(year, month, daysInMonth(year, month)),
      };
    }
    if (periodTab === 'Quarterly') {
      const q = QUARTERS.find(q => q.value === quarter);
      return {
        start: ymd(year, q.start[0], q.start[1]),
        end:   ymd(year, q.end[0],   q.end[1]),
      };
    }
    return { start: ymd(year, 1, 1), end: ymd(year, 12, 31) };
  }, [periodTab, month, quarter, year]);

  const buildLabel = () => {
    if (periodTab === 'Monthly')   return `${MONTHS[month - 1]} ${year}`;
    if (periodTab === 'Quarterly') return `${QUARTERS.find(q => q.value === quarter).label} ${year}`;
    return `Calendar Year ${year}`;
  };

  const handleGenerate = async (range) => {
    setLoading(true);
    setError('');
    setData(null);
    setHostFilter('all');
    try {
      const rows = await reportsApi.events({ start: range.start, end: range.end });
      setData(rows);
      setReportLabel(buildLabel());
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  /* Auto-generate whenever period selection changes */
  useEffect(() => {
    handleGenerate(dateRange);
  }, [dateRange]);

  /* Unique hosts from current data */
  const hostOptions = useMemo(() => {
    if (!data) return [];
    const names = [...new Set(data.map(e => e.creator_name).filter(Boolean))].sort();
    return names;
  }, [data]);

  /* Filtered rows */
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (hostFilter === 'all') return data;
    return data.filter(e => e.creator_name === hostFilter);
  }, [data, hostFilter]);

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=1100,height=800');
    const cancelled = filteredData.filter(e => String(e.status || '').toLowerCase() === 'cancelled').length;

    const rows = filteredData.map((e, i) => `
      <tr class="${String(e.status || '').toLowerCase() === 'cancelled' ? 'cancelled' : ''}">
        <td>${i + 1}</td>
        <td>${e.title || ''}</td>
        <td style="text-transform:capitalize">${e.type || ''}</td>
        <td>${fmtDateRange(e.date, e.end_date)}</td>
        <td>${fmtTime(e.start_time)} – ${fmtTime(e.end_time)}</td>
        <td>${e.location || '—'}</td>
        <td>${e.creator_name || '—'}</td>
        <td><span class="pill ${String(e.status || 'active').toLowerCase()}">${e.status || 'Active'}</span></td>
      </tr>
    `).join('');

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${periodTab} Report — ${reportLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 1.5cm 2cm; }
    .header { border-bottom: 2px solid #0f2a5e; padding-bottom: 10px; margin-bottom: 14px; }
    .org { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; }
    .system { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #0f2a5e; margin: 2px 0 6px; }
    .report-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
    .meta { font-size: 9px; color: #64748b; }
    .summary { display: flex; gap: 12px; margin: 14px 0; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; background: #f8faff; }
    .card-num { font-size: 22px; font-weight: 800; color: #2255b0; display: block; line-height: 1; }
    .card-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    thead tr { background: #0f2a5e; }
    th { color: #fff; padding: 7px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8faff; }
    tr.cancelled td { opacity: 0.6; text-decoration: line-through; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
    .pill.active { background: #dcfce7; color: #15803d; }
    .pill.cancelled { background: #fee2e2; color: #b91c1c; }
    .footer { margin-top: 12px; font-size: 9px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    @page { size: A4 landscape; margin: 1.5cm 2cm; }
  </style>
</head>
<body>
  <div class="header">
    <div class="org">Technical Education and Skills Development Authority</div>
    <div class="system">ONE Centralized Calendar System</div>
    <div class="report-title">${periodTab} Events Report — ${reportLabel}</div>
    <div class="meta">Period: ${fmt(dateRange.start)} – ${fmt(dateRange.end)} · Generated: ${generatedAt}</div>
  </div>
  <div class="summary">
    <div class="card"><span class="card-num">${filteredData.length}</span><span class="card-label">Total Events</span></div>
    <div class="card"><span class="card-num">${cancelled}</span><span class="card-label">Cancelled</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Title</th><th>Type</th><th>Date</th>
        <th>Time</th><th>Location / Venue</th><th>Host</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">${filteredData.length} record${filteredData.length !== 1 ? 's' : ''} · Generated ${generatedAt}</div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`);
    printWin.document.close();
  };

  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="reports-page">

      {/* ── Hero ── */}
      <div className="reports-hero">
        <div className="reports-hero-inner">
          <div>
            <h1 className="reports-title">Event Reports</h1>
            <p className="reports-subtitle">Generate and export event/schedule reports</p>
          </div>
          {data && (
            <button className="reports-print-btn" onClick={handlePrint}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print / Export PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Period Tabs ── */}
      <div className="reports-period-tabs">
        {PERIOD_TABS.map(tab => (
          <button
            key={tab}
            className={`reports-period-tab ${periodTab === tab ? 'is-active' : ''}`}
            onClick={() => { setPeriodTab(tab); setData(null); }}
          >
            {tab === 'Monthly'   && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            {tab === 'Quarterly' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/></svg>}
            {tab === 'Yearly'    && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
            {tab}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="reports-filters">
        {/* Period selectors */}
        {periodTab === 'Monthly' && (
          <>
            <div className="reports-filter-group">
              <label>Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="reports-filter-group">
              <label>Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}

        {periodTab === 'Quarterly' && (
          <>
            <div className="reports-filter-group">
              <label>Quarter</label>
              <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}>
                {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
            <div className="reports-filter-group">
              <label>Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}

        {periodTab === 'Yearly' && (
          <div className="reports-filter-group">
            <label>Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {/* Divider */}
        <div className="reports-filter-divider" />

        {/* Date range preview */}
        <div className="reports-date-preview">
          <span className="reports-date-preview-label">Period</span>
          <span className="reports-date-preview-value">{fmt(dateRange.start)} – {fmt(dateRange.end)}</span>
        </div>

        {/* Host filter */}
        {data && hostOptions.length > 0 && (
          <div className="reports-filter-group">
            <label>Host</label>
            <select value={hostFilter} onChange={e => setHostFilter(e.target.value)}>
              <option value="all">All Hosts</option>
              {hostOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {loading && <span className="reports-loading-inline">Loading...</span>}
      </div>

      {error && <div className="reports-error">{error}</div>}

      {/* ── Output ── */}
      {data && (
        <div className="reports-output">
          {/* Print-only header */}
          <div className="reports-print-header">
            <div className="reports-print-org">Technical Education and Skills Development Authority</div>
            <div className="reports-print-system">ONE Centralized Calendar System</div>
            <h2 className="reports-print-title">{periodTab} Events Report — {reportLabel}</h2>
            <div className="reports-print-meta">
              Period: {fmt(dateRange.start)} – {fmt(dateRange.end)}
              {' · '}Generated: {generatedAt}
            </div>
          </div>

          {/* Screen title */}
          <div className="reports-output-title">
            <span className="reports-output-period-badge">{periodTab}</span>
            <h2>{reportLabel}</h2>
            <span className="reports-output-range">{fmt(dateRange.start)} – {fmt(dateRange.end)}</span>
          </div>

          {/* Summary */}
          <div className="reports-summary">
            <div className="reports-summary-card">
              <span className="reports-summary-num">{filteredData.length}</span>
              <span className="reports-summary-label">Total Events</span>
            </div>
            <div className="reports-summary-card">
              <span className="reports-summary-num">{filteredData.filter(e => String(e.status || '').toLowerCase() === 'cancelled').length}</span>
              <span className="reports-summary-label">Cancelled</span>
            </div>
          </div>

          {/* Table */}
          {filteredData.length === 0 ? (
            <div className="reports-empty">No events found for the selected period.</div>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location / Venue</th>
                    <th>Host</th>
                    <th>Status</th>
                    <th>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((e, i) => (
                    <tr key={e.id} className={String(e.status || '').toLowerCase() === 'cancelled' ? 'row-cancelled' : ''}>
                      <td className="col-num">{i + 1}</td>
                      <td className="col-title">{e.title}</td>
                      <td className="col-type">{e.type}</td>
                      <td className="col-date">{fmtDateRange(e.date, e.end_date)}</td>
                      <td className="col-time">{fmtTime(e.start_time)} – {fmtTime(e.end_time)}</td>
                      <td className="col-location">{e.location || '—'}</td>
                      <td className="col-host">{e.creator_name || '—'}</td>
                      <td className="col-status">
                        <span className={`reports-status-pill status-${String(e.status || 'active').toLowerCase()}`}>
                          {e.status || 'Active'}
                        </span>
                      </td>
                      <td className="col-posted">{e.is_posted ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="reports-footer">
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} · Generated {generatedAt}
          </div>
        </div>
      )}
    </div>
  );
}
