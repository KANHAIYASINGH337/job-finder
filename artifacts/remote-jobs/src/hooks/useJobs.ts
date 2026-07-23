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
  /north\s*america\s*only/i,
  /latin\s*america\s*only/i,
  /apac\s*only/i,
  /timezone/i,
];

function detectLocationRestriction(location: string = "", text: string = ""): boolean {
  const combined = (location + " " + text).toLowerCase();
  if (/\b(worldwide|anywhere|everywhere|global)\b/i.test(location) && !LOCATION_RESTRICTION_PATTERNS.some((p) => p.test(location))) {
    return false;
  }
  return LOCATION_RESTRICTION_PATTERNS.some((p) => p.test(combined));
}

function detectExperienceLevel(title: string = "", desc: string = ""): string {
  const text = (title + " " + desc).toLowerCase();
  if (/\b(senior|sr\.|lead|principal|staff|architect|head of|vp|director|manager)\b/.test(text)) return "senior";
  if (/\b(junior|jr\.|entry|fresher|graduate|intern|associate|0-2|0 to 2)\b/.test(text)) return "entry";
  if (/\b(mid|middle|intermediate|2-5|3-5|mid-level|midlevel)\b/.test(text)) return "mid";
  return "mid";
}

function detectCategory(title: string = "", tags: string[] = []): string {
  const text = (title + " " + tags.join(" ")).toLowerCase();
  if (/\b(devops|infra|infrastructure|sre|kubernetes|docker|ci\/cd|cloud|aws|gcp|azure|platform)\b/.test(text)) return "devops";
  if (/\b(design|ui|ux|figma|illustrat|graphic|brand|visual|product designer|animator)\b/.test(text)) return "design";
  if (/\b(marketing|seo|growth|content market|social media|ads|copywrite|email market|sem)\b/.test(text)) return "marketing";
  if (/\b(product manager|pm|product owner|roadmap|scrum master)\b/.test(text)) return "product";
  if (/\b(data|ml|machine learning|ai|analytics|scientist|analyst|nlp|llm|etl|pipeline|big data)\b/.test(text)) return "data";
  if (/\b(support|customer success|account manager|help desk|customer service|client manager)\b/.test(text)) return "support";
  if (/\b(writer|writing|content|editorial|copywriter|journalist|technical writer|docs|documentation)\b/.test(text)) return "writing";
  if (/\b(engineer|developer|dev|software|backend|frontend|fullstack|full-stack|web|mobile|ios|android|react|node|python|java|rust|go|php|ruby|c\+\+|typescript)\b/.test(text)) return "engineering";
  return "engineering";
}

function parseSalary(salaryStr?: string): { min?: number; max?: number } {
  if (!salaryStr) return {};
  const nums = salaryStr.match(/\d[\d,]*/g);
  if (!nums) return {};
  const parsed = nums
    .map((n) => parseInt(n.replace(/,/g, ""), 10))
    .filter((n) => !isNaN(n) && n > 0);
  if (parsed.length === 0) return {};
  const normalized = parsed.map((n) => (n > 0 && n < 1000 ? n * 1000 : n));
  if (normalized.length === 1) return { min: normalized[0] };
  return { min: Math.min(...normalized), max: Math.max(...normalized) };
}

function extractSalaryInfo(
  salaryField?: string,
  minField?: any,
  maxField?: any,
  descriptionText: string = ""
): { salary?: string; salaryMin?: number; salaryMax?: number } {
  let min = minField ? Number(minField) : undefined;
  let max = maxField ? Number(maxField) : undefined;
  if (min === 0) min = undefined;
  if (max === 0) max = undefined;

  if (min && max) {
    return {
      salary: `$${min.toLocaleString()} - $${max.toLocaleString()}`,
      salaryMin: min,
      salaryMax: max,
    };
  }
  if (min) {
    return {
      salary: `$${min.toLocaleString()}+`,
      salaryMin: min,
      salaryMax: undefined,
    };
  }

  if (salaryField && salaryField.trim() && !/competitive|doe|negotiable|depends/i.test(salaryField)) {
    const parsed = parseSalary(salaryField);
    return {
      salary: salaryField.trim(),
      salaryMin: parsed.min,
      salaryMax: parsed.max,
    };
  }

  // Scan description for salary patterns e.g. $80,000 - $120,000 or $90k
  const salaryRegex = /\$(\d{2,3}(?:,\d{3})*|\d{2,3}k)\s*(?:-|to)?\s*\$?(\d{2,3}(?:,\d{3})*|\d{2,3}k)?\s*(?:usd|\/year|\/yr|per year)?\b/gi;
  const matches = descriptionText.match(salaryRegex);
  if (matches && matches.length > 0) {
    const foundStr = matches[0].trim();
    const parsed = parseSalary(foundStr);
    if (parsed.min || parsed.max) {
      return {
        salary: foundStr,
        salaryMin: parsed.min,
        salaryMax: parsed.max,
      };
    }
  }

  return {};
}

function parseDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;

  if (typeof val === "number" || (typeof val === "string" && /^\d+$/.test(val.trim()))) {
    const num = Number(val);
    if (!isNaN(num)) {
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
  }

  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

async function fetchJsonWithFallback(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, options);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // direct fetch failed
  }

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  throw new Error(`Failed to fetch from ${url}`);
}

async function fetchRemoteOK(): Promise<Job[]> {
  const data = await fetchJsonWithFallback("https://remoteok.com/api", {
    headers: { "User-Agent": "RemoteJobAggregator/1.0" },
  });

  if (!Array.isArray(data)) return [];

  const jobs: Job[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object" || !item.position || !item.company) continue;
    const text = `${item.position} ${item.description || ""} ${item.location || ""}`;
    const locationStr = item.location || "";
    const isRestricted = detectLocationRestriction(locationStr, text);
    const tags: string[] = Array.isArray(item.tags) ? item.tags.slice(0, 8) : [];
    
    const salaryInfo = extractSalaryInfo(item.salary, item.salary_min, item.salary_max, item.description || "");
    const postedAt = parseDate(item.date || item.epoch);

    jobs.push({
      id: `rok-${item.id || item.slug || Math.random().toString(36).substring(2, 9)}`,
      title: item.position,
      company: item.company,
      companyLogo: item.company_logo,
      url: item.url || (item.slug ? `https://remoteok.com/l/${item.slug}` : "https://remoteok.com"),
      postedAt,
      salary: salaryInfo.salary,
      salaryMin: salaryInfo.salaryMin,
      salaryMax: salaryInfo.salaryMax,
      tags,
      description: item.description || "",
      category: detectCategory(item.position, tags),
      location: locationStr,
      isLocationRestricted: isRestricted,
      isTrulyRemote: !isRestricted,
      source: "remoteok",
    });
  }
  return jobs;
}

async function fetchRemotive(): Promise<Job[]> {
  const data = await fetchJsonWithFallback("https://remotive.com/api/remote-jobs?limit=200");
  const jobList = data && Array.isArray(data.jobs) ? data.jobs : [];
  const jobs: Job[] = [];

  for (const item of jobList) {
    if (!item || !item.title || !item.company_name) continue;
    const locationStr = item.candidate_required_location || "";
    const text = `${item.title} ${item.description || ""} ${locationStr}`;
    const isRestricted = detectLocationRestriction(locationStr, text);
    const tags: string[] = Array.isArray(item.tags) ? item.tags.slice(0, 8) : [];
    
    const salaryInfo = extractSalaryInfo(item.salary, undefined, undefined, item.description || "");
    const postedAt = parseDate(item.publication_date || item.date);

    jobs.push({
      id: `rem-${item.id}`,
      title: item.title,
      company: item.company_name,
      companyLogo: item.company_logo_url,
      url: item.url,
      postedAt,
      salary: salaryInfo.salary,
      salaryMin: salaryInfo.salaryMin,
      salaryMax: salaryInfo.salaryMax,
      tags,
      description: item.description || "",
      category: detectCategory(item.title, tags),
      location: locationStr,
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
    if (!seen.has(key)) {
      seen.set(key, job);
    } else {
      const existing = seen.get(key)!;
      if ((!existing.salary && job.salary) || (!existing.companyLogo && job.companyLogo)) {
        seen.set(key, job);
      }
    }
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
  return jobs.filter((j) => j.postedAt instanceof Date && !isNaN(j.postedAt.getTime()) && j.postedAt >= threshold).length;
}

export function applyFilters(jobs: Job[], filters: Filters): Job[] {
  let result = [...jobs];

  const threshold = getTimeThreshold(filters.timeFilter);
  if (threshold) {
    result = result.filter((j) => j.postedAt instanceof Date && !isNaN(j.postedAt.getTime()) && j.postedAt >= threshold);
  }

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
      result = result.filter((j) => !!j.salary || j.salaryMin !== undefined);
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
    result.sort((a, b) => {
      const valA = a.salaryMax ?? a.salaryMin ?? -1;
      const valB = b.salaryMax ?? b.salaryMin ?? -1;
      return valB - valA;
    });
  } else if (filters.sort === "salary-low") {
    result.sort((a, b) => {
      const valA = a.salaryMin ?? a.salaryMax ?? Number.MAX_SAFE_INTEGER;
      const valB = b.salaryMin ?? b.salaryMax ?? Number.MAX_SAFE_INTEGER;
      return valA - valB;
    });
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

    if (rok.status === "fulfilled") {
      results.push(...rok.value);
    } else {
      newErrors.push("RemoteOK: Could not load (using Remotive data only)");
    }

    if (rem.status === "fulfilled") {
      results.push(...rem.value);
    } else {
      newErrors.push("Remotive: Could not load (using RemoteOK data only)");
    }

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