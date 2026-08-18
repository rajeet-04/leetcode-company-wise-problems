import { notFound } from "next/navigation";
import { catalogV2BySlug } from "@/src/data/catalog-v2";
import { ProblemIntelligenceClient } from "./problem-intelligence-client";

export const instant = false;

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = catalogV2BySlug.get(slug);
  if (!problem) notFound();
  return <ProblemIntelligenceClient problem={problem} />;
}
