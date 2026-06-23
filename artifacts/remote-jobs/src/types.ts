export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  url: string;
  postedAt: Date;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  tags: string[];
  description: string;
  category: string;
  location?: string;
  isLocationRestricted: boolean;
  isTrulyRemote: boolean;
  source: "remoteok" | "remotive";
}

export type TimeFilter = "24h" | "36h" | "48h" | "7d" | "all";
export type Theme = "light" | "dark" | "midnight";
export type SortOption = "newest" | "oldest" | "salary-high" | "salary-low";
export type ExperienceLevel = "any" | "entry" | "mid" | "senior";
export type SalaryRange = "any" | "0-50k" | "50k-100k" | "100k+" | "listed-only";
export type JobCategory =
  | "all"
  | "engineering"
  | "design"
  | "marketing"
  | "product"
  | "data"
  | "support"
  | "writing"
  | "devops";

export interface Filters {
  timeFilter: TimeFilter;
  search: string;
  experience: ExperienceLevel;
  salary: SalaryRange;
  category: JobCategory;
  sort: SortOption;
}
