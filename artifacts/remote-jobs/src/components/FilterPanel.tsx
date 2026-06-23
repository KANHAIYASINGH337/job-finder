import { Search } from "lucide-react";
import type {
  Filters,
  TimeFilter,
  ExperienceLevel,
  SalaryRange,
  JobCategory,
  SortOption,
} from "../types";

interface FilterPanelProps {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  timeCounts: Record<string, number>;
  filteredCount: number;
}

const TIME_OPTIONS: { value: TimeFilter; label: string; key: string }[] = [
  { value: "24h", label: "Last 24H", key: "24h" },
  { value: "36h", label: "Last 36H", key: "36h" },
  { value: "48h", label: "Last 48H", key: "48h" },
  { value: "7d", label: "Last 7 Days", key: "7d" },
  { value: "all", label: "All Jobs", key: "all" },
];

const CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product" },
  { value: "data", label: "Data / ML" },
  { value: "support", label: "Customer Support" },
  { value: "writing", label: "Writing / Content" },
  { value: "devops", label: "DevOps / Infra" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "any", label: "Any Level" },
  { value: "entry", label: "Entry Level (0-2 yrs)" },
  { value: "mid", label: "Mid Level (2-5 yrs)" },
  { value: "senior", label: "Senior (5+ yrs)" },
];

const SALARY_OPTIONS: { value: SalaryRange; label: string }[] = [
  { value: "any", label: "Any Salary" },
  { value: "0-50k", label: "$0 - $50k" },
  { value: "50k-100k", label: "$50k - $100k" },
  { value: "100k+", label: "$100k+" },
  { value: "listed-only", label: "Only with salary" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "salary-high", label: "Salary: High to Low" },
  { value: "salary-low", label: "Salary: Low to High" },
];

export function FilterPanel({ filters, onChange, timeCounts, filteredCount }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <div className="time-filter-bar">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`time-btn ${filters.timeFilter === opt.value ? "active" : ""}`}
            onClick={() => onChange({ timeFilter: opt.value })}
          >
            {opt.label}
            <span className="time-count">{timeCounts[opt.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="filter-controls">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="search-input"
            placeholder="Search jobs, companies, skills..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>

        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value as JobCategory })}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.experience}
          onChange={(e) => onChange({ experience: e.target.value as ExperienceLevel })}
        >
          {EXPERIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.salary}
          onChange={(e) => onChange({ salary: e.target.value as SalaryRange })}
        >
          {SALARY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortOption })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="results-count">{filteredCount.toLocaleString()} jobs</span>
      </div>
    </div>
  );
}
