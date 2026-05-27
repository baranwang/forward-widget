import fs from "node:fs";
import path from "node:path";
import type { ZodError } from "zod";
import { type MappingFile, type MovieProvider, mappingFileSchema, type TvProvider } from "./schema";

export type GenerateLocalMapOptions = {
  sourcePath?: string;
  outputPath?: string;
};

export type GenerateLocalMapResult = {
  outputPath: string;
  size: number;
};

export type LocalMapProvider = MovieProvider | TvProvider;

export type LocalGeneratedMap = {
  movie: Record<string, MovieProvider[]>;
  tv: Record<string, TvProvider[]>;
};

export type LocalMapSourceFile = {
  filePath: string;
  content: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function defaultSourcePath(): string {
  return path.resolve(import.meta.dirname, "..", "data");
}

export function defaultLocalMapSourcePath(): string {
  return defaultSourcePath();
}

function compareOptionalNumber(a: number | undefined, b: number | undefined): number {
  return (a ?? -1) - (b ?? -1);
}

function compareProvider(a: LocalMapProvider, b: LocalMapProvider): number {
  const seasonComparison = compareOptionalNumber(
    "season" in a ? a.season : undefined,
    "season" in b ? b.season : undefined,
  );
  if (seasonComparison !== 0) {
    return seasonComparison;
  }
  if (a.provider !== b.provider) {
    return a.provider.localeCompare(b.provider);
  }
  if (a.idString !== b.idString) {
    return a.idString.localeCompare(b.idString);
  }
  const aRange = "epRange" in a ? a.epRange : undefined;
  const bRange = "epRange" in b ? b.epRange : undefined;
  const rangeStartComparison = compareOptionalNumber(aRange?.[0], bRange?.[0]);
  if (rangeStartComparison !== 0) {
    return rangeStartComparison;
  }
  return compareOptionalNumber(aRange?.[1], bRange?.[1]);
}

function compareMappingFile(a: MappingFile, b: MappingFile): number {
  if (a.type !== b.type) {
    return a.type.localeCompare(b.type);
  }
  return a.tmdbId - b.tmdbId;
}

function parseJsonFile(sourceFile: LocalMapSourceFile): unknown {
  try {
    return JSON.parse(sourceFile.content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${sourceFile.filePath}: invalid JSON: ${message}`);
  }
}

function formatSchemaError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "<root>"}: ${issue.message}`)
    .sort()
    .join("; ");
}

export function parseLocalMapSourceFile(sourceFile: LocalMapSourceFile): MappingFile {
  const parsed = mappingFileSchema.safeParse(parseJsonFile(sourceFile));
  if (!parsed.success) {
    fail(`${sourceFile.filePath}: schema validation failed: ${formatSchemaError(parsed.error)}`);
  }

  const parentDirectory = path.basename(path.dirname(sourceFile.filePath));
  if (parentDirectory !== "movie" && parentDirectory !== "tv") {
    fail(`${sourceFile.filePath}: parent directory must be movie or tv`);
  }
  if (parsed.data.type !== parentDirectory) {
    fail(`${sourceFile.filePath}: file is under ${parentDirectory} but body type is ${parsed.data.type}`);
  }

  const fileTmdbId = Number(path.basename(sourceFile.filePath, ".json"));
  if (!Number.isInteger(fileTmdbId) || fileTmdbId < 0) {
    fail(`${sourceFile.filePath}: filename must be a non-negative TMDB id ending in .json`);
  }
  if (parsed.data.tmdbId !== fileTmdbId) {
    fail(`${sourceFile.filePath}: filename TMDB id ${fileTmdbId} does not match body tmdbId ${parsed.data.tmdbId}`);
  }

  return parsed.data;
}

export function readLocalMapSourceFiles(sourcePath = defaultSourcePath()): LocalMapSourceFile[] {
  if (!fs.existsSync(sourcePath)) {
    fail(`${sourcePath}: local map source directory does not exist`);
  }
  if (!fs.statSync(sourcePath).isDirectory()) {
    fail(`${sourcePath}: local map source path must be a directory`);
  }

  const sourceFiles: LocalMapSourceFile[] = [];
  for (const type of ["movie", "tv"] as const) {
    const typeDirectory = path.resolve(sourcePath, type);
    if (!fs.existsSync(typeDirectory)) {
      continue;
    }
    for (const entry of fs.readdirSync(typeDirectory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }
      const filePath = path.join(typeDirectory, entry.name);
      sourceFiles.push({ filePath, content: fs.readFileSync(filePath, "utf-8") });
    }
  }
  return sourceFiles.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

export function createLocalMap(sourceFiles: LocalMapSourceFile[]): LocalGeneratedMap {
  const seenFiles = new Set<string>();
  const seenTmdbKeys = new Set<string>();
  const mappings = sourceFiles.map((sourceFile) => {
    const normalizedPath = path.resolve(sourceFile.filePath);
    if (seenFiles.has(normalizedPath)) {
      fail(`${sourceFile.filePath}: duplicate source file`);
    }
    seenFiles.add(normalizedPath);
    return parseLocalMapSourceFile(sourceFile);
  });

  const map: LocalGeneratedMap = { movie: {}, tv: {} };
  for (const mapping of mappings.sort(compareMappingFile)) {
    const mappingKey = `${mapping.type}:${mapping.tmdbId}`;
    if (seenTmdbKeys.has(mappingKey)) {
      fail(`duplicate TMDB mapping ${mappingKey}`);
    }
    seenTmdbKeys.add(mappingKey);

    if (mapping.type === "movie") {
      map.movie[String(mapping.tmdbId)] = [...mapping.providers].sort(compareProvider);
      continue;
    }
    map.tv[String(mapping.tmdbId)] = [...mapping.providers].sort(compareProvider);
  }

  return map;
}

export function renderLocalMapRuntimeModule(sourceFiles: LocalMapSourceFile[]): string {
  return `export const LOCAL_TMDB_PLATFORM_MAP = ${JSON.stringify(createLocalMap(sourceFiles), null, 2)};\n`;
}

export function generateLocalMap(options?: GenerateLocalMapOptions): GenerateLocalMapResult {
  const sourcePath = options?.sourcePath ?? defaultSourcePath();
  const outputPath = options?.outputPath ?? path.resolve(process.cwd(), "dist", "local-map.js");
  const generated = renderLocalMapRuntimeModule(readLocalMapSourceFiles(sourcePath));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generated);
  const size = Buffer.byteLength(generated, "utf-8");
  if (size >= 10240) {
    fail(`generated local map is too large: ${size} bytes`);
  }
  return { outputPath, size };
}
