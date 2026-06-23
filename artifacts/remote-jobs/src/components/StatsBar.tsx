interface StatsBarProps {
  total: number;
  count24h: number;
  count48h: number;
  totalRemote: number;
  totalRestricted: number;
}

export function StatsBar({ total, count24h, count48h, totalRemote, totalRestricted }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-value">{total.toLocaleString()}</span>
        <span className="stat-label">Total Jobs</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value">{count24h.toLocaleString()}</span>
        <span className="stat-label">Last 24H</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value">{count48h.toLocaleString()}</span>
        <span className="stat-label">Last 48H</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value stat-green">{totalRemote.toLocaleString()}</span>
        <span className="stat-label">Truly Remote</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-value stat-red">{totalRestricted.toLocaleString()}</span>
        <span className="stat-label">Restricted</span>
      </div>
    </div>
  );
}
