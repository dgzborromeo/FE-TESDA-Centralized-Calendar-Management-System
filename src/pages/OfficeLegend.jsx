import { useState, useEffect } from 'react';
import { users as usersApi } from '../api';
import './OfficeLegend.css';

const PARTICIPANT_LEGEND_ITEMS = [
  { key: 'osec',    label: 'DG',      color: '#ef4444', desc: 'Director General' },
  { key: 'ddgs',    label: 'DDGs',    color: '#ec4899', desc: 'Deputy Directors General' },
  { key: 'eds',     label: 'EDs',     color: '#06b6d4', desc: 'Executive Directors' },
  { key: 'rds',     label: 'RDs',     color: '#f97316', desc: 'Regional Directors' },
  { key: 'pds_dds', label: 'PDs/DDs', color: '#a855f7', desc: 'Provincial / District Directors' },
  { key: 'aeds',    label: 'AEDs',    color: '#93c5fd', desc: 'Asst. Executive Directors' },
  { key: 'admin',   label: 'ADMIN',   color: '#22c55e', desc: 'Administrative Staff' },
  { key: 'chief',   label: 'CHIEF',   color: '#3b82f6', desc: 'Chief of Office' },
  { key: 'focals',  label: 'FOCALS',  color: '#eab308', desc: 'Focal Persons' },
];

const REGIONS = [
  'NCR','CAR','Region I','Region II','Region III',
  'Region IV-A','Region IV-B','Region V','Region VI',
  'Region VII','Region VIII','Region IX','Region X',
  'Region XI','Region XII','Region XIII','BARMM',
];

export default function OfficeLegend() {
  const [clusterLegend, setClusterLegend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCluster, setExpandedCluster] = useState(null);

  useEffect(() => {
    usersApi.legendClusters()
      .then(rows => {
        setClusterLegend(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setClusterLegend([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ol-page">

      {/* ── Hero ── */}
      <header className="ol-hero">
        <div className="ol-hero-bg" aria-hidden="true">
          <div className="ol-hero-orb ol-hero-orb-1" />
          <div className="ol-hero-orb ol-hero-orb-2" />
          <div className="ol-hero-orb ol-hero-orb-3" />
          <div className="ol-hero-grid" />
        </div>
        <div className="ol-hero-content">
          <div className="ol-hero-left">
            <div className="ol-hero-kicker">
              <span className="ol-hero-kicker-dot" />
              TESDA COROPOTI · CY 2026
            </div>
            <h1 className="ol-hero-title">Office &amp; Participant Color Reference</h1>
            <p className="ol-hero-sub">
              Official color coding guide for all TESDA COROPOTI clusters, offices,
              and participant roles used in the ONE Centralized Calendar System.
            </p>
          </div>
          <div className="ol-hero-right">
            <div className="ol-hero-stat">
              <span className="ol-hero-stat-num">{clusterLegend.length + 1}</span>
              <span className="ol-hero-stat-label">Clusters</span>
            </div>
            <div className="ol-hero-stat-sep" />
            <div className="ol-hero-stat">
              <span className="ol-hero-stat-num">
                {clusterLegend.reduce((s, c) => s + (c.offices?.length || 0), 0) + REGIONS.length}
              </span>
              <span className="ol-hero-stat-label">Offices &amp; Regions</span>
            </div>
            <div className="ol-hero-stat-sep" />
            <div className="ol-hero-stat">
              <span className="ol-hero-stat-num">{PARTICIPANT_LEGEND_ITEMS.length}</span>
              <span className="ol-hero-stat-label">Participant Roles</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Info note ── */}
      <div className="ol-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
        Color codes correspond to event indicators on the calendar. Use the <strong>Office filter</strong> on the Calendar page to view events by cluster or office.
      </div>

      {/* ── Body ── */}
      <div className="ol-body ol-body--two-column">

        {/* ── Left: Organizational Clusters ── */}
        <div className="ol-section">
          <div className="ol-card">
            <div className="ol-card-head">
              <div className="ol-card-head-label">
                <span className="ol-card-num">01</span>
                <div>
                  <h2 className="ol-card-title">Organizational Clusters</h2>
                  <p className="ol-card-desc">Click a cluster to expand its constituent offices and divisions</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="ol-loading">
                <div className="ol-spinner" />
                Loading organizational data…
              </div>
            ) : (
              <div className="ol-clusters">
                {[...clusterLegend, { id: 'regions', name: 'TESDA Regional Offices', color: '#facc15', offices: REGIONS.map(r => ({ name: r, color: '#facc15', divisions: [] })) }]
                  .map((cluster, idx) => (
                  <div
                    key={cluster.id}
                    className={`ol-cluster ${expandedCluster === cluster.id ? 'is-open' : ''}`}
                    style={{ '--c': cluster.color || '#94a3b8' }}
                  >
                    <button
                      className="ol-cluster-btn"
                      onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
                      aria-expanded={expandedCluster === cluster.id}
                    >
                      <span className="ol-cluster-swatch" />
                      <span className="ol-cluster-name">{cluster.name}</span>
                      <span className="ol-cluster-pill">
                        {(cluster.offices || []).length}
                      </span>
                      <svg className="ol-cluster-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>

                    {expandedCluster === cluster.id && (
                      <div className={`ol-offices ${cluster.id === 'regions' ? 'ol-offices--grid' : ''}`}>
                        {(cluster.offices || []).map((office) => (
                          <div key={office.name} className="ol-office">
                            <div className="ol-office-row">
                              <span className="ol-office-dot" style={{ background: office.color || cluster.color || '#94a3b8' }} />
                              <span className="ol-office-name">{office.name}</span>
                            </div>
                            {Array.isArray(office.divisions) && office.divisions.length > 0 && (
                              <ul className="ol-divs">
                                {office.divisions.map(d => (
                                  <li key={d} className="ol-div">{d}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Participant Roles ── */}
        <div className="ol-section">
          <div className="ol-card">
            <div className="ol-card-head">
              <div className="ol-card-head-label">
                <span className="ol-card-num">02</span>
                <div>
                  <h2 className="ol-card-title">Participant Roles</h2>
                  <p className="ol-card-desc">Color indicators for event participants</p>
                </div>
              </div>
            </div>
            <div className="ol-roles">
              {PARTICIPANT_LEGEND_ITEMS.map((item) => (
                <div key={item.key} className="ol-role" style={{ '--r': item.color }}>
                  <span className="ol-role-dot" />
                  <div className="ol-role-text">
                    <span className="ol-role-label">{item.label}</span>
                    <span className="ol-role-desc">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="ol-footer">
        <span>ONE Centralized Calendar System</span>
        <span className="ol-footer-dot">·</span>
        <span>Technical Education and Skills Development Authority — COROPOTI</span>
        <span className="ol-footer-dot">·</span>
        <span>Calendar Year 2026</span>
      </footer>

    </div>
  );
}
