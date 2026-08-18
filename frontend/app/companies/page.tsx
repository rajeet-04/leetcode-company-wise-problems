import { problems } from "@/src/data/catalog";
import { CompaniesClient } from "./companies-client";

export default function CompaniesPage() {
  const counts = new Map<string, number>();
  for (const problem of problems) for (const company of problem.companies) counts.set(company, (counts.get(company) ?? 0) + 1);
  const companies = [...counts.entries()]
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));
  return <CompaniesClient companies={companies} />;
}
