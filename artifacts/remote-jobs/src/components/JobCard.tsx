import { useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import type { Job } from "../types";
import { timeAgo, isNew } from "../utils/time";

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

function CompanyAvatar({ logo, name }: { logo?: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (logo && !imgError) {
    return (
      <img
        className="company-logo"
        src={logo}
        alt={name}
        onError={() => setImgError(true)}
      />
    );
  }

  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div className="company-avatar" style={{ background: color }}>
      {initials || "?"}
    </div>
  );
}

export function JobCard({ job, isSaved, onToggleSave }: JobCardProps) {
  const jobIsNew = isNew(job.postedAt);

  return (
    <div className="job-card">
      <div className="job-card-header">
        <CompanyAvatar logo={job.companyLogo} name={job.company} />
        <div className="job-card-title-group">
          <div className="job-card-title-row">
            <h3 className="job-title">{job.title}</h3>
            {jobIsNew && <span className="badge badge-new">NEW</span>}
          </div>
          <p className="job-company">{job.company}</p>
        </div>
        <button
          className={`save-btn ${isSaved ? "saved" : ""}`}
          onClick={() => onToggleSave(job.id)}
          aria-label={isSaved ? "Remove from saved" : "Save job"}
        >
          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      <div className="job-card-badges">
        {job.isLocationRestricted ? (
          <span className="badge badge-restricted">Location Restricted</span>
        ) : (
          <span className="badge badge-remote">Truly Remote</span>
        )}
        <span className="job-time">{timeAgo(job.postedAt)}</span>
      </div>

      <div className="job-salary">
        {job.salary ? (
          <span className="salary-value">{job.salary}</span>
        ) : (
          <span className="salary-missing">Salary not listed</span>
        )}
      </div>

      {job.tags.length > 0 && (
        <div className="job-tags">
          {job.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="job-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="job-card-footer">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-apply"
        >
          Apply Now <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
