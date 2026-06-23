import { useState, useEffect, useCallback, useRef } from "react";
import type { Job, Filters, TimeFilter } from "../types";

const LOCATION_RESTRICTION_PATTERNS = [
  /us\s*only/i,
  /usa\s*only/i,
  /united\s*states\s*only/i,
  /eu\s*only/i,
  /europe\s*only/i,
  /uk\s*only/i,
  /united\s*kingdom\s*only/i,
  /right\s*to\s*work/i,
  /must\s*be\s*(in|based)/i,
  /based\s*in/i,
  /residents?\s*of/i,
  /authorized\s*to\s*work/i,
  /canada\s*only/i,
  /australia\s*only/i,
];

function detectLocationRestriction(text: string): boolean {
  return LOCATION_RESTRICTION_PATTERNS.some((p) => p.test(text));
}

function detectExperienceLevel(title: string, desc: string): string {
  const text = (title + " " + desc).toLowerCase();
  if (/\b(senior|sr\.|lead|principal|staff|architect|head of)\b/.test(text)) return "senior";
  if (/\b(junior|jr\.|entry|fresher|graduate|intern|0-2|0 to 2)\b/.test(text)) return "entry";
  if (/\b(mid|middle|intermediate|2-5|3-5)\b/.test(text)) return "mid";
  return "mid";
}

function detectCategory(title: string, tags: string[]): string {
  const text = (title + " " + tags.join(" ")).toLowerCase();
  if (/\b(devops|infra|sre|kubernetes|docker|ci\/cd|cloud|aws|gcp|azure|platform)\b/.test(text)) return "devops";
  if (/\b(design|ui|ux|figma|illustrat|graphic|brand|visual|product designer)\b/.test(text)) return "design";
  if (/\b(marketing|seo|growth|content market|social media|ads|copywrite|email market)\b/.test(text)) return "marketing";
  if (/\b(product manager|pm |product owner|roadmap)\b/.test(text)) return "product";
  if (/\b(data|ml|machine learning|ai|analytics|scientist|analyst|nlp|llm|etl|pipeline)\b/.test(text)) return "data";
  if (/\b(support|customer success|account manager|help desk|customer service)\b/.test(text)) return "support";
  if (/\b(writer|writing|content|editorial|copywriter|journalist|technical writer|docs)\b/.test(text)) return "writing";
  if (/\b(engineer|developer|dev|software|backend|frontend|fullstack|full-stack|web|mobile|ios|android|react|node|python|java|rust|go|php|ruby)\b/.test(text)) return "engineering";
  return "engineering";
}

function parseSalary(salaryStr?: string): { min?: number; max?: number } {
  if (!salaryStr) return {};
  const nums = salaryStr.match(/\d[\d,]*/g);
  if (!nums) return {};
  const parsed = nums.map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => n > 0);
  if (parsed.length === 0) return {};
  if (parsed.length === 1) return { min: parsed[0] };
  return { min: Math.min(...parsed), max: Math.max(...parsed) };
}

async function fetchRemoteOK(): Promise<Job[]> {
  const res = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "RemoteJobAggregator/1.0" },
  });
  if (!res.ok) throw new Error("RemoteOK fetch failed");
  const data = await res.json();
  const jobs: Job[] = [];
  for (const item of data) {
    if (!item.position || !item.company) continue;
    const text = (item.position + " " + (item.description || "") + " " + (item.location || ""));
    const isRestricted = detectLocationRestriction(text);
    const tags: string[] = Array.isArray(item.tags) ? item.tags.slice(0, 8) : [];
    const salaryStr = item.salary_min && item.salary_max
      ? `$${item.salary_min.toLocaleString()} - $${item.salary_max.toLocaleString()}`
      : undefined;
    jobs.push({
      id: `rok-${item.id || item.slug}`,
      title: item.position,
      company: item.company,
      companyLogo: item.company_logo,
      url: item.url || `https://remoteok.com/l/${item.slug}`,
      postedAt: item.date ? new Date(item.date * 1000) : new Date(),
      salary: salaryStr,
      salaryMin: item.salary_min ? Number(item.salary_min) : undefined,
      salaryMax: item.salary_max ? Number(item.salary_max) : undefined,
      tags,
      description: item.description || "",
      category: detectCategory(item.position, tags),
      location: item.location,
      isLocationRestricted: isRestricted,
      isTrulyRemote: !isRestricted,
      source: "remoteok",
    });
  }
  return jobs;
}

async function fetchRemotive(): Promise<Job[]> {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=200");
  if (!res.ok) throw new Error("Remotive fetch failed");
  const data = await res.json();
  const jobs: Job[] = [];
  for (const item of data.jobs || []) {
    const text = (item.title + " " + (item.description || "") + " " + (item.candidate_required_location || ""));
    const isRestricted = detectLocationRestriction(text);
    const tags: string[] = (item.tags || []).slice(0, 8);
    jobs.push({
      id: `rem-${item.id}`,
      title: item.title,
      company: item.company_name,
      companyLogo: item.company_logo_url,
      url: item.url,
      postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
      salary: item.salary || undefined,
      salaryMin: parseSalary(item.salary).min,
      salaryMax: parseSalary(item.salary).max,
      tags,
      description: item.description || "",
      category: detectCategory(item.title, tags),
      location: item.candidate_required_location,
      isLocationRestricted: isRestricted,
      isTrulyRemote: !isRestricted,
      source: "remotive",
    });
  }
  return jobs;
}

function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
    if (!seen.has(key)) seen.set(key, job);
  }
  return Array.from(seen.values());
}

function getTimeThreshold(filter: TimeFilter): Date | null {
  const now = new Date();
  if (filter === "24h") return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (filter === "36h") return new Date(now.getTime() - 36 * 60 * 60 * 1000);
  if (filter === "48h") return new Date(now.getTime() - 48 * 60 * 60 * 1000);
  if (filter === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return null;
}

export function countByTimeFilter(jobs: Job[], filter: TimeFilter): number {
  const threshold = getTimeThreshold(filter);
  if (!threshold) return jobs.length;
  return jobs.filter((j) => j.postedAt >= threshold!).length;
}

export function applyFilters(jobs: Job[], filters: Filters): Job[] {
  let result = [...jobs];

  const threshold = getTimeThreshold(filters.timeFilter);
  if (threshold) result = result.filter((j) => j.postedAt >= threshold);

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filters.experience !== "any") {
    result = result.filter((j) => {
      const lvl = detectExperienceLevel(j.title, j.description);
      return lvl === filters.experience;
    });
  }

  if (filters.salary !== "any") {
    if (filters.salary === "listed-only") {
      result = result.filter((j) => !!j.salary);
    } else if (filters.salary === "0-50k") {
      result = result.filter((j) => j.salaryMin !== undefined && j.salaryMin < 50000);
    } else if (filters.salary === "50k-100k") {
      result = result.filter((j) => j.salaryMin !== undefined && j.salaryMin >= 50000 && j.salaryMin < 100000);
    } else if (filters.salary === "100k+") {
      result = result.filter((j) => j.salaryMin !== undefined && j.salaryMin >= 100000);
    }
  }

  if (filters.category !== "all") {
    result = result.filter((j) => j.category === filters.category);
  }

  if (filters.sort === "newest") {
    result.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
  } else if (filters.sort === "oldest") {
    result.sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime());
  } else if (filters.sort === "salary-high") {
    result.sort((a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0));
  } else if (filters.sort === "salary-low") {
    result.sort((a, b) => (a.salaryMin ?? Infinity) - (b.salaryMin ?? Infinity));
  }

  return result;
}

export interface JobsState {
  allJobs: Job[];
  filteredJobs: Job[];
  isLoading: boolean;
  errors: string[];
  lastUpdated: Date | null;
  savedJobIds: Set<string>;
  savedJobs: Job[];
  timeCounts: Record<string, number>;
  totalRemote: number;
  totalRestricted: number;
}

export function useJobs(filters: Filters) {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("savedJobs") || "[]"));
    } catch {
      return new Set();
    }
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const newErrors: string[] = [];
    const results: Job[] = [];

    const [rok, rem] = await Promise.allSettled([fetchRemoteOK(), fetchRemotive()]);

    if (rok.status === "fulfilled") results.push(...rok.value);
    else newErrors.push("RemoteOK: Could not load (using Remotive data only)");

    if (rem.status === "fulfilled") results.push(...rem.value);
    else newErrors.push("Remotive: Could not load (using RemoteOK data only)");

    const deduped = deduplicateJobs(results);
    deduped.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

    setAllJobs(deduped);
    setErrors(newErrors);
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  const toggleSave = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      localStorage.setItem("savedJobs", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const filteredJobs = applyFilters(allJobs, filters);
  const savedJobs = allJobs.filter((j) => savedJobIds.has(j.id));

  const timeCounts = {
    "24h": countByTimeFilter(allJobs, "24h"),
    "36h": countByTimeFilter(allJobs, "36h"),
    "48h": countByTimeFilter(allJobs, "48h"),
    "7d": countByTimeFilter(allJobs, "7d"),
    all: allJobs.length,
  };

  const totalRemote = allJobs.filter((j) => j.isTrulyRemote).length;
  const totalRestricted = allJobs.filter((j) => j.isLocationRestricted).length;

  return {
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
    refresh: fetchAll,
  };
}
