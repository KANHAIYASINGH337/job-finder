import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Moon, Sun, Zap, Bookmark } from "lucide-react";
import { useJobs } from "./hooks/useJobs";
import { JobCard } from "./components/JobCard";
import { FilterPanel } from "./components/FilterPanel";
import { StatsBar } from "./components/StatsBar";
import { SkeletonCard } from "./components/SkeletonCard";
import type { Filters, Theme } from "./types";

const DEFAULT_FILTERS: Filters = {
  timeFilter: "all",
  search: "",
  experience: "any",
  salary: "any",
  category: "all",
  sort: "newest",
};

function timeAgoShort(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<"jobs" | "saved">("jobs");
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "light";
  });

  const {
    allJobs,
    filteredJobs,
    isLoading,
    errors,
    lastUpdated,
    savedJobIds,
    savedJobs,
    timeCounts,
    totalRemote,
    totalRestricted,
    toggleSave,
    refresh,
  } = useJobs(activeTab === "saved" ? { ...filters, timeFilter: "all" } : filters);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const updateFilters = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const displayJobs = activeTab === "saved" ? savedJobs : filteredJobs;

  const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={14} /> },
    { value: "dark", label: "Dark", icon: <Moon size={14} /> },
    { value: "midnight", label: "Midnight", icon: <Zap size={14} /> },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon">
              <Zap size={20} />
            </div>
            <div>
              <h1 className="brand-title">RemoteWork</h1>
              <p className="brand-sub">Live remote job aggregator</p>
            </div>
          </div>

          <div className="header-right">
            {lastUpdated && (
              <span className="last-updated">
                Updated {timeAgoShort(lastUpdated)}
              </span>
            )}
            <button
              className="btn btn-refresh"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? "spin" : ""} />
              Refresh
            </button>
            <div className="theme-switcher">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  className={`theme-btn ${theme === t.value ? "active" : ""}`}
                  onClick={() => setTheme(t.value)}
                  title={t.label}
                >
                  {t.icon}
                  <span className="theme-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {errors.length > 0 && (
          <div className="errors-bar">
            {errors.map((e, i) => (
              <div key={i} className="error-msg">
                ⚠️ {e}
              </div>
            ))}
          </div>
        )}

        <StatsBar
          total={allJobs.length}
          count24h={timeCounts["24h"] ?? 0}
          count48h={timeCounts["48h"] ?? 0}
          totalRemote={totalRemote}
          totalRestricted={totalRestricted}
        />

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            Browse Jobs
          </button>
          <button
            className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark size={14} />
            Saved Jobs
            {savedJobIds.size > 0 && (
              <span className="tab-count">{savedJobIds.size}</span>
            )}
          </button>
        </div>

        {activeTab === "jobs" && (
          <FilterPanel
            filters={filters}
            onChange={updateFilters}
            timeCounts={timeCounts}
            filteredCount={filteredJobs.length}
          />
        )}

        <div className="jobs-grid">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          ) : displayJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {activeTab === "saved" ? "🔖" : "🔍"}
              </div>
              <h3>
                {activeTab === "saved"
                  ? "No saved jobs yet"
                  : "No jobs found"}
              </h3>
              <p>
                {activeTab === "saved"
                  ? "Bookmark jobs using the icon on each card."
                  : "Try adjusting your filters or time range."}
              </p>
            </div>
          ) : (
            displayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={toggleSave}
              />
            ))
          )}
        </div>
      </main>

      <footer className="footer">
        Data sourced from RemoteOK &amp; Remotive &bull; Updates every 30 min
      </footer>
    </div>
  );
}
