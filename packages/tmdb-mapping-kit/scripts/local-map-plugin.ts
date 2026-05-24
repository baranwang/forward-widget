import fs from "node:fs";
import path from "node:path";
import { type ProviderName, providerNames } from "@forward-widget/scraper-kit/provider-metadata";

type Provider = {
  provider: ProviderName;
  idString: string;
  episodeNumber?: number;
};

type LocalGeneratedMap = {
  movie: Record<string, Provider[]>;
  tv: Record<string, Record<string, Provider[]>>;
};

type Entry = {
  type: "movie" | "tv";
  tmdbId: number;
  season: string;
  providers: Provider[];
};

const providerNameSet = new Set<string>(providerNames);

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string, lineNumber: number): string {
  const value = record[key];
  if (typeof value !== "string" || !value) {
    fail(`line ${lineNumber}: ${key} must be a non-empty string`);
  }
  return value;
}

function requireNumber(record: Record<string, unknown>, key: string, lineNumber: number): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    fail(`line ${lineNumber}: ${key} must be a non-negative integer`);
  }
  return value;
}

function optionalSeason(record: Record<string, unknown>, lineNumber: number): string {
  const value = record.season;
  if (value === undefined || value === null) return "series";
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    fail(`line ${lineNumber}: season must be null or a non-negative integer`);
  }
  return String(value);
}

function normalizeProvider(value: unknown, lineNumber: number): Provider {
  if (!isRecord(value)) {
    fail(`line ${lineNumber}: provider item must be an object`);
  }
  const provider = requireString(value, "provider", lineNumber);
  if (!providerNameSet.has(provider)) {
    fail(`line ${lineNumber}: unsupported provider ${provider}`);
  }
  const idString = requireString(value, "idString", lineNumber);
  const result: Provider = { provider: provider as Provider["provider"], idString };
  const episodeNumber = value.episodeNumber;
  if (episodeNumber !== undefined) {
    if (typeof episodeNumber !== "number" || !Number.isInteger(episodeNumber) || episodeNumber < 0) {
      fail(`line ${lineNumber}: episodeNumber must be a non-negative integer`);
    }
    result.episodeNumber = episodeNumber;
  }
  return result;
}

function normalizeEntry(line: string, lineNumber: number): Entry {
  const parsed: unknown = JSON.parse(line);
  if (!isRecord(parsed)) {
    fail(`line ${lineNumber}: entry must be an object`);
  }
  const type = requireString(parsed, "type", lineNumber);
  if (type !== "movie" && type !== "tv") {
    fail(`line ${lineNumber}: type must be movie or tv`);
  }
  const tmdbId = requireNumber(parsed, "tmdbId", lineNumber);
  requireString(parsed, "title", lineNumber);
  requireString(parsed, "sourceUrl", lineNumber);
  requireString(parsed, "verifiedAt", lineNumber);
  if (!Array.isArray(parsed.providers) || parsed.providers.length === 0) {
    fail(`line ${lineNumber}: providers must be a non-empty array`);
  }
  return {
    type,
    tmdbId,
    season: type === "tv" ? optionalSeason(parsed, lineNumber) : "0",
    providers: parsed.providers.map((value) => normalizeProvider(value, lineNumber)),
  };
}

function compareProvider(a: Provider, b: Provider): number {
  if (a.provider !== b.provider) {
    return a.provider.localeCompare(b.provider);
  }
  if (a.idString !== b.idString) {
    return a.idString.localeCompare(b.idString);
  }
  return (a.episodeNumber ?? -1) - (b.episodeNumber ?? -1);
}

function createLocalMap(content: string): LocalGeneratedMap {
  const entries = content
    .split("\n")
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, lineNumber }) => normalizeEntry(line, lineNumber))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.tmdbId !== b.tmdbId) return a.tmdbId - b.tmdbId;
      return Number(a.season) - Number(b.season);
    });

  const map: LocalGeneratedMap = { movie: {}, tv: {} };
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = `${entry.type}:${entry.tmdbId}:${entry.season}`;
    if (seen.has(key)) {
      fail(`duplicate mapping key ${key}`);
    }
    seen.add(key);
    const normalizedProviders = [...entry.providers].sort(compareProvider);
    if (entry.type === "movie") {
      map.movie[String(entry.tmdbId)] = normalizedProviders;
      continue;
    }
    const tmdbKey = String(entry.tmdbId);
    map.tv[tmdbKey] ??= {};
    map.tv[tmdbKey][entry.season] = normalizedProviders;
  }

  return map;
}

function renderLocalMapRuntimeModule(content: string): string {
  return `export const LOCAL_TMDB_PLATFORM_MAP = ${JSON.stringify(createLocalMap(content), null, 2)};\n`;
}

function defaultLocalMapSourcePath(): string {
  return path.resolve(import.meta.dirname, "..", "data", "tmdb-platform-map.jsonl");
}

export const localMapPlugin = () => ({
  name: "tmdb-local-map",
  setup(api: {
    transform: (
      options: { test: string },
      handler: (context: { code: string; addDependency: (dependency: string) => void }) => { code: string },
    ) => void;
    onAfterBuild: (callback: () => void) => void;
    context: { distPath: string };
  }) {
    api.transform({ test: "/src/local-map.ts$/" }, ({ code, addDependency }) => {
      addDependency(defaultLocalMapSourcePath());
      return { code };
    });

    api.onAfterBuild(() => {
      const outputPath = api.context.distPath;
      const localMapPath = path.resolve(outputPath, "local-map.js");
      const content = fs.readFileSync(defaultLocalMapSourcePath(), "utf-8");
      fs.mkdirSync(path.dirname(localMapPath), { recursive: true });
      fs.writeFileSync(localMapPath, renderLocalMapRuntimeModule(content));
    });
  },
});
