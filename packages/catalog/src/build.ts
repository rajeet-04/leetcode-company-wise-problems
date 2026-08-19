import fs from "node:fs";
import path from "node:path";
import type { CatalogMetadata, CatalogProblem, CatalogWindow } from "@leet-progress/types";
import { CATALOG_SCHEMA_VERSION } from "@leet-progress/types";
import { aggregateCatalog } from "./aggregate";
import { sha256 } from "./checksum";
import { normalizeRow } from "./normalize";
import { parseCsv } from "./parse-csv";

const EXCLUDED_DIRECTORIES = new Set([".git", ".github", ".worktrees", "artifacts", "docs", "frontend", "node_modules", "packages", "worktrees"]);

export type BuildCatalogOptions = {
  rootDir: string;
  webDataDir: string;
  extensionArtifactPath: string;
  publicCatalogDir?: string;
  generatedAt?: string;
};

export type BuildCatalogResult = {
  problems: CatalogProblem[];
  metadata: CatalogMetadata & { mergedDuplicates: number };
  compatibility: LegacyProblem[];
};

type LegacyPeriod = "30d" | "90d" | "6m" | "all";
type LegacyProblem = { id:string;title:string;slug:string;url:string;difficulty:string;frequency:string;acceptanceRate:string;companies:string[];periods:LegacyPeriod[];topics:string[];sources:{company:string;period:LegacyPeriod}[] };

function walkCsvFiles(rootDir:string):string[]{
  const visit=(directory:string,depth:number):string[]=>fs.readdirSync(directory,{withFileTypes:true}).flatMap((entry)=>{const fullPath=path.join(directory,entry.name);if(entry.isDirectory()){if(depth===0&&EXCLUDED_DIRECTORIES.has(entry.name))return[];return visit(fullPath,depth+1);}return entry.name.toLowerCase().endsWith(".csv")?[fullPath]:[];});
  return visit(rootDir,0).sort((a,b)=>a.localeCompare(b));
}
function compatibilityPeriod(window:CatalogWindow):LegacyPeriod{return window==="older"?"6m":window;}
function toCompatibility(problem:CatalogProblem):LegacyProblem{
  const companies=[...new Set(problem.observations.map((item)=>item.company))].sort((a,b)=>a.localeCompare(b));
  const periods=[...new Set(problem.observations.map((item)=>compatibilityPeriod(item.window)))].sort();
  const sources=[...new Map(problem.observations.map((item)=>{const period=compatibilityPeriod(item.window);return[`${item.company}\u0000${period}`,{company:item.company,period}];})).values()].sort((a,b)=>`${a.company}-${a.period}`.localeCompare(`${b.company}-${b.period}`));
  const frequency=problem.observations.find((item)=>item.frequency!==null)?.frequency;
  const acceptanceRate=problem.observations.find((item)=>item.acceptanceRate!==null)?.acceptanceRate;
  return{id:"",title:problem.title,slug:problem.slug,url:problem.url,difficulty:problem.difficulty,frequency:frequency===undefined?"":String(frequency),acceptanceRate:acceptanceRate===undefined?"":String(acceptanceRate),companies,periods,topics:problem.topics,sources};
}

export function buildCatalogArtifacts(options:BuildCatalogOptions):BuildCatalogResult{
  const normalized=[];const issues:string[]=[];let sourceRows=0;
  for(const file of walkCsvFiles(options.rootDir)){
    const company=path.basename(path.dirname(file));const filename=path.basename(file);const rows=parseCsv(fs.readFileSync(file,"utf8"));
    for(let index=0;index<rows.length;index+=1){sourceRows+=1;const result=normalizeRow(company,filename,rows[index]!);if(result)normalized.push(result);else issues.push(`${path.relative(options.rootDir,file)}:${index+2}: invalid problem identity`);}
  }
  if(issues.length>0)throw new Error(`Catalog normalization failed:\n${issues.slice(0,25).join("\n")}`);
  const problems=aggregateCatalog(normalized);const canonicalJson=JSON.stringify(problems);const checksum=sha256(canonicalJson);
  const metadata={schemaVersion:CATALOG_SCHEMA_VERSION,catalogVersion:`v2-${checksum.slice(0,16)}`,generatedAt:options.generatedAt??new Date().toISOString(),sourceRows,uniqueProblems:problems.length,companies:new Set(problems.flatMap((problem)=>problem.observations.map((item)=>item.company))).size,checksum,mergedDuplicates:sourceRows-problems.length} satisfies CatalogMetadata&{mergedDuplicates:number};
  const compatibility=problems.map(toCompatibility);const metadataJson=JSON.stringify(metadata,null,2);
  fs.mkdirSync(options.webDataDir,{recursive:true});fs.mkdirSync(path.dirname(options.extensionArtifactPath),{recursive:true});
  fs.writeFileSync(path.join(options.webDataDir,"catalog-v2.json"),canonicalJson);fs.writeFileSync(path.join(options.webDataDir,"catalog.json"),JSON.stringify(compatibility));fs.writeFileSync(path.join(options.webDataDir,"catalog-meta.json"),metadataJson);fs.writeFileSync(options.extensionArtifactPath,canonicalJson);
  if(options.publicCatalogDir){fs.mkdirSync(options.publicCatalogDir,{recursive:true});fs.writeFileSync(path.join(options.publicCatalogDir,"catalog.json"),canonicalJson);fs.writeFileSync(path.join(options.publicCatalogDir,"catalog-meta.json"),metadataJson);}
  return{problems,metadata,compatibility};
}
