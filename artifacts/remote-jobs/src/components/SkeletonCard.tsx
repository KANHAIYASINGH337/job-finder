export function SkeletonCard() {
  return (
    <div className="job-card skeleton-card">
      <div className="job-card-header">
        <div className="skeleton skeleton-logo" />
        <div className="job-card-title-group">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-company" />
        </div>
      </div>
      <div className="job-card-meta">
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="job-card-tags">
        <div className="skeleton skeleton-tag" />
        <div className="skeleton skeleton-tag" />
        <div className="skeleton skeleton-tag" />
      </div>
      <div className="job-card-footer">
        <div className="skeleton skeleton-salary" />
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  );
}
