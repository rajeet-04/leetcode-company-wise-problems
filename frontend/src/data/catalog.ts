import catalog from "./catalog.json";

export type Period = "30d" | "90d" | "6m" | "all";
export type Problem = {
  id: string; title: string; slug: string; url: string; difficulty: string;
  frequency: string; acceptanceRate: string; companies: string[]; periods: Period[];
  topics: string[]; sources: { company: string; period: Period }[];
};
export const problems = catalog as Problem[];
