import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createOpencode } from "@opencode-ai/sdk/v2";
import { describe, expect, rs, test } from "@rstest/core";
import { z } from "zod";
import {
  assertNoDuplicateMapping,
  createChangesetContent,
  defaultRepoRoot,
  fetchTmdbMetadata,
  mappingAgentOutputJsonSchema,
  mappingArtifactPaths,
  modelResponseSchema,
  modelSelection,
  normalizeIssueFields,
  parseCliArgs,
  parseIssueFormBody,
  parseMappingAgentArgs,
  parseModelResponse,
  parseStructuredModelResponse,
  runMappingAgent,
  runMappingAgentCli,
  validateCandidateForIssue,
  writeMappingAgentSummary,
} from "./mapping-agent.ts";

rs.mock("@opencode-ai/sdk/v2", () => ({
  createOpencode: rs.fn(),
}));

describe("mapping agent CLI and provider config parsing", () => {
  test("requires issue, issue-body-file, and summary-file", () => {
    expect(parseCliArgs(["--issue", "42", "--issue-body-file", "./body.md", "--summary-file", "./summary.json"])).toBe(
      42,
    );
    expect(
      parseMappingAgentArgs(["--issue", "42", "--issue-body-file", "./body.md", "--summary-file", "./summary.json"]),
    ).toEqual({
      issue: 42,
      issueBodyFile: "./body.md",
      summaryFile: "./summary.json",
    });
    expect(() => parseCliArgs([])).toThrow("usage: tmdb:mapping-agent");
    expect(() => parseCliArgs(["--issue", "0"])).toThrow("usage: tmdb:mapping-agent");
    expect(() => parseMappingAgentArgs(["--issue", "42", "--summary-file", "./summary.json"])).toThrow(
      "usage: tmdb:mapping-agent",
    );
    expect(() => parseMappingAgentArgs(["--issue", "42", "--issue-body-file", "./body.md"])).toThrow(
      "usage: tmdb:mapping-agent",
    );
    expect(() =>
      parseMappingAgentArgs(["--issue", "42", "--issue-body-file", "   ", "--summary-file", "./summary.json"]),
    ).toThrow("usage: tmdb:mapping-agent");
    expect(() =>
      parseMappingAgentArgs(["--issue", "42", "--issue-body-file", "./body.md", "--summary-file", "   "]),
    ).toThrow("usage: tmdb:mapping-agent");
    expect(() => parseMappingAgentArgs(["--issue", "42", "--issue-body-file", "./body.md", "--summary-file"])).toThrow(
      "usage: tmdb:mapping-agent",
    );
  });

  test("parses generic OpenCode provider and model config without provider secrets", () => {
    expect(modelSelection({ OPENCODE_MODEL: "custom/model-a" })).toEqual({
      providerID: "custom",
      modelID: "model-a",
    });
    expect(modelSelection({ OPENCODE_PROVIDER: "custom", OPENCODE_MODEL: "model-a" })).toEqual({
      providerID: "custom",
      modelID: "model-a",
    });
  });
});

describe("issue form validation", () => {
  const body = `### 媒体标题

Example Show

### TMDB 链接

https://www.themoviedb.org/tv/12345

### 季号（可选）

2

### 视频平台链接

https://v.qq.com/x/cover/demo.html

### 备注（可选）

_no response_
`;

  test("extracts only supported issue form fields from headings", () => {
    expect(parseIssueFormBody(body)).toEqual({
      media_title: "Example Show",
      tmdb_url: "https://www.themoviedb.org/tv/12345",
      season: "2",
      platform_urls: "https://v.qq.com/x/cover/demo.html",
      notes: "",
    });
  });

  test("ignores legacy media type headings and infers type from TMDB URL", () => {
    const legacyBody = `${body}\n### 媒体类型\n\nmovie\n`;
    expect(parseIssueFormBody(legacyBody)).toEqual({
      media_title: "Example Show",
      tmdb_url: "https://www.themoviedb.org/tv/12345",
      season: "2",
      platform_urls: "https://v.qq.com/x/cover/demo.html",
      notes: "",
    });

    const fields = normalizeIssueFields(parseIssueFormBody(legacyBody));
    expect(fields.media_type).toBe("tv");
    expect(fields.season).toBe(2);
    expect(fields.platform_urls).toEqual(["https://v.qq.com/x/cover/demo.html"]);
  });

  test("parses and normalizes issue bodies without a media type heading", () => {
    const bodyWithoutMediaType = `### 媒体标题

_No response_

### TMDB 链接

https://www.themoviedb.org/tv/282136

### 视频平台链接

https://v.qq.com/x/cover/demo.html
`;

    expect(parseIssueFormBody(bodyWithoutMediaType)).toEqual({
      media_title: "",
      tmdb_url: "https://www.themoviedb.org/tv/282136",
      season: "",
      platform_urls: "https://v.qq.com/x/cover/demo.html",
      notes: "",
    });

    expect(normalizeIssueFields(parseIssueFormBody(bodyWithoutMediaType))).toEqual({
      media_title: undefined,
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/282136",
      season: null,
      platform_urls: ["https://v.qq.com/x/cover/demo.html"],
      notes: undefined,
    });
  });

  test("treats missing TV season as series-level mapping", () => {
    const fields = normalizeIssueFields({
      media_title: "Example Show",
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/12345",
      season: "",
      platform_urls: "https://v.qq.com/x/cover/demo.html",
      notes: "",
    });

    expect(fields.season).toBeNull();
  });
});

describe("model output validation", () => {
  const fields = normalizeIssueFields({
    media_title: "Issue Title",
    media_type: "movie",
    tmdb_url: "https://www.themoviedb.org/movie/980477",
    platform_urls: "https://v.qq.com/x/cover/demo.html",
    notes: "",
  });

  const response = JSON.stringify({
    status: "confident",
    reason: "extracted from URL",
    mapping: {
      type: "movie",
      tmdbId: 980477,
      title: "Model Title",
      year: 2000,
      sourceUrl: "https://www.themoviedb.org/movie/980477",
      verifiedAt: "2026-05-17T10:00:00.000Z",
      providers: [{ provider: "iqiyi", idString: "demo", url: "https://v.qq.com/x/cover/demo.html" }],
    },
  });

  test("derives the OpenCode schema from the Zod source of truth", () => {
    expect(mappingAgentOutputJsonSchema).toEqual(z.toJSONSchema(modelResponseSchema));
  });

  test("keeps the issue template free of media type input", () => {
    const template = fs.readFileSync(
      path.resolve(process.cwd(), "..", "..", ".github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml"),
      "utf8",
    );
    expect(template).not.toContain("id: media_type");
    expect(template).toContain("id: media_title");
    expect(template).toMatch(/id: media_title[\s\S]*?required: false/);
  });

  test("parses structured SDK output without text extraction", () => {
    expect(parseStructuredModelResponse(JSON.parse(response))).toEqual({
      status: "confident",
      reason: "extracted from URL",
      mapping: {
        type: "movie",
        tmdbId: 980477,
        title: "Model Title",
        year: 2000,
        sourceUrl: "https://www.themoviedb.org/movie/980477",
        verifiedAt: "2026-05-17T10:00:00.000Z",
        providers: [{ provider: "iqiyi", idString: "demo", url: "https://v.qq.com/x/cover/demo.html" }],
      },
    });
  });

  test("parses fenced JSON and validates candidate mapping", () => {
    const extraction = parseModelResponse(`\`\`\`json\n${response}\n\`\`\``);
    expect(extraction.status).toBe("confident");
    if (extraction.status !== "confident") {
      throw new Error("expected confident response");
    }
    const canonical = validateCandidateForIssue(extraction.mapping, fields, { title: "TMDB Title", year: 2025 });
    expect(canonical).toMatchObject({
      title: "TMDB Title",
      year: 2025,
      sourceUrl: "https://www.themoviedb.org/movie/980477",
      providers: [{ provider: "iqiyi", idString: "demo" }],
    });
    expect("url" in canonical.providers[0]).toBe(false);
  });

  test("fails safely on ambiguous output and mismatched TMDB id", () => {
    expect(parseModelResponse('{"status":"ambiguous","reason":"two possible ids"}')).toEqual({
      status: "ambiguous",
      reason: "two possible ids",
    });
    const mismatched = parseModelResponse(response.replace('"tmdbId":980477', '"tmdbId":980478'));
    if (mismatched.status !== "confident") {
      throw new Error("expected confident response");
    }
    expect(() => validateCandidateForIssue(mismatched.mapping, fields, { title: "TMDB Title", year: 2025 })).toThrow(
      "TMDB id does not match issue URL",
    );
  });
});

describe("TMDB metadata fetch", () => {
  const movieFields = normalizeIssueFields({
    media_title: "Issue Title",
    media_type: "movie",
    tmdb_url: "https://www.themoviedb.org/movie/980477",
    platform_urls: "https://v.qq.com/x/cover/demo.html",
    notes: "",
  });

  const tvFields = normalizeIssueFields({
    media_title: "Issue Title",
    media_type: "tv",
    tmdb_url: "https://www.themoviedb.org/tv/12345",
    platform_urls: "https://v.qq.com/x/cover/demo.html",
    notes: "",
  });

  function response(json: Record<string, unknown>, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => json,
    } as Response;
  }

  test("fetches movie title and year from TMDB metadata", async () => {
    const fetchImpl = async () => response({ title: "TMDB Movie", release_date: "2025-03-01" });

    await expect(fetchTmdbMetadata(movieFields, { TMDB_ACCESS_TOKEN: "token" }, fetchImpl)).resolves.toEqual({
      title: "TMDB Movie",
      year: 2025,
    });
  });

  test("fetches TV title and year from TMDB metadata", async () => {
    const fetchImpl = async () => response({ name: "TMDB Show", first_air_date: "2024-11-09" });

    await expect(fetchTmdbMetadata(tvFields, { TMDB_ACCESS_TOKEN: "token" }, fetchImpl)).resolves.toEqual({
      title: "TMDB Show",
      year: 2024,
    });
  });

  test("requires a TMDB access token", async () => {
    const fetchImpl = async () => response({ title: "TMDB Movie" });

    await expect(fetchTmdbMetadata(movieFields, {}, fetchImpl)).rejects.toThrow("TMDB_ACCESS_TOKEN is required");
  });

  test("fails on non-2xx TMDB metadata responses", async () => {
    const fetchImpl = async () => response({}, 503);

    await expect(fetchTmdbMetadata(movieFields, { TMDB_ACCESS_TOKEN: "token" }, fetchImpl)).rejects.toThrow(
      "TMDB metadata fetch failed with status 503",
    );
  });

  test("fails when TMDB metadata omits a usable title", async () => {
    const fetchImpl = async () => response({ release_date: "2025-03-01" });

    await expect(fetchTmdbMetadata(movieFields, { TMDB_ACCESS_TOKEN: "token" }, fetchImpl)).rejects.toThrow(
      "TMDB metadata response did not include a title",
    );
  });
});

describe("write safety helpers", () => {
  const mapping = {
    type: "movie" as const,
    tmdbId: 980477,
    title: "Ne Zha 2",
    year: 2025,
    sourceUrl: "https://www.themoviedb.org/movie/980477",
    verifiedAt: "2026-05-17T10:00:00.000Z",
    providers: [{ provider: "iqiyi" as const, idString: "abc" }],
  };

  test("rejects duplicate JSONL rows before writes", () => {
    assertNoDuplicateMapping("", mapping);
    expect(() => assertNoDuplicateMapping(`${JSON.stringify(mapping)}\n`, mapping)).toThrow("mapping already exists");
  });

  test("creates a changeset for affected packages", () => {
    expect(createChangesetContent(mapping)).toContain('"@forward-widget/danmu-universe": patch');
  });

  test("writes summary json when path is provided", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-summary-"));
    const summaryPath = path.join(tempDir, "summary.json");

    writeMappingAgentSummary(summaryPath, {
      status: "success",
      issueNumber: 42,
      mappingTitle: "Example Show",
      mappingYear: 2025,
      changedFiles: [...mappingArtifactPaths, ".changeset/tmdb-mapping-issue-42.md"],
      message: "ok",
    });

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summary).toEqual({
      status: "success",
      issueNumber: 42,
      mappingTitle: "Example Show",
      mappingYear: 2025,
      changedFiles: [...mappingArtifactPaths, ".changeset/tmdb-mapping-issue-42.md"],
      message: "ok",
    });
  });

  test("writes ambiguous summary shape without success-only fields", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-summary-"));
    const summaryPath = path.join(tempDir, "summary.json");

    writeMappingAgentSummary(summaryPath, {
      status: "ambiguous",
      issueNumber: 42,
      message: "multiple candidates found",
    });

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summary).toEqual({
      status: "ambiguous",
      issueNumber: 42,
      message: "multiple candidates found",
    });
    expect(summary.mappingTitle).toBeUndefined();
    expect(summary.changedFiles).toBeUndefined();
  });
});

describe("cli safe failure summary", () => {
  test("writes error summary and sets exitCode=2 when issue body is invalid", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-cli-"));
    const issueBodyPath = path.join(tempDir, "issue-body.md");
    const summaryPath = path.join(tempDir, "summary.json");
    fs.writeFileSync(issueBodyPath, "### 媒体标题\n\nOnly title without required fields\n");

    process.exitCode = undefined;
    const result = await runMappingAgentCli([
      "--issue",
      "42",
      "--issue-body-file",
      issueBodyPath,
      "--summary-file",
      summaryPath,
    ]);

    expect(result.status).toBe("error");
    expect(result.issueNumber).toBe(42);
    expect(process.exitCode).toBe(2);

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summary.status).toBe("error");
    expect(summary.issueNumber).toBe(42);
    expect(summary.message).toContain("is required");
    expect(summary.mappingTitle).toBeUndefined();
    expect(summary.changedFiles).toBeUndefined();
  });

  test("writes error summary when issue-body-file cannot be read", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-cli-"));
    const summaryPath = path.join(tempDir, "summary.json");
    const missingIssueBodyPath = path.join(tempDir, "missing-issue-body.md");

    process.exitCode = undefined;
    const result = await runMappingAgentCli([
      "--issue",
      "42",
      "--issue-body-file",
      missingIssueBodyPath,
      "--summary-file",
      summaryPath,
    ]);

    expect(result).toEqual({
      status: "error",
      issueNumber: 42,
      message: expect.stringContaining("ENOENT"),
    });
    expect(process.exitCode).toBe(2);

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summary).toEqual({
      status: "error",
      issueNumber: 42,
      message: expect.stringContaining("ENOENT"),
    });
  });

  test("uses GitHub workspace as CLI repo root when pnpm runs from package cwd", () => {
    expect(defaultRepoRoot({ GITHUB_WORKSPACE: "/tmp/forward-widget" })).toBe("/tmp/forward-widget");
  });
});

describe("runMappingAgent integration", () => {
  test("writes success summary with canonical title, year, and changed files", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-run-"));
    const repoRoot = tempDir;
    const dataPath = path.join(repoRoot, "packages", "tmdb-mapping-kit", "data", "tmdb-platform-map.jsonl");
    const changesetDir = path.join(repoRoot, ".changeset");
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.mkdirSync(changesetDir, { recursive: true });
    fs.writeFileSync(dataPath, "");

    const issueBody = `### 媒体标题

_No response_

### TMDB 链接

https://www.themoviedb.org/tv/282136

### 视频平台链接

https://v.qq.com/x/cover/demo.html
`;
    const summaryPath = path.join(tempDir, "summary.json");
    const fetchImpl: typeof fetch = async () =>
      ({
        ok: true,
        json: async () => ({
          name: "Example Show",
          first_air_date: "2025-01-02",
        }),
      }) as Response;

    const mockedCreateOpencode = rs.mocked(createOpencode);
    mockedCreateOpencode.mockReset();
    mockedCreateOpencode.mockResolvedValueOnce({
      client: {
        session: {
          create: rs.fn().mockResolvedValueOnce({ data: { id: "session-1" } }),
          prompt: rs.fn().mockResolvedValueOnce({
            data: {
              info: {
                structured: {
                  status: "confident",
                  mapping: {
                    type: "tv",
                    tmdbId: 282136,
                    title: "Example Show",
                    year: 2025,
                    sourceUrl: "https://www.themoviedb.org/tv/282136",
                    verifiedAt: "2026-05-17T10:00:00.000Z",
                    providers: [
                      {
                        provider: "iqiyi",
                        idString: "demo",
                        url: "https://v.qq.com/x/cover/demo.html",
                      },
                    ],
                  },
                },
              },
            },
          }),
        },
      },
      server: {
        url: "http://127.0.0.1:0",
        close: rs.fn(),
      },
    } as unknown as Awaited<ReturnType<typeof createOpencode>>);

    const summary = await runMappingAgent({
      issueNumber: 42,
      issueBody,
      repoRoot,
      summaryPath,
      env: {
        OPENCODE_MODEL: "custom/model-a",
        OPENCODE_API_KEY: "test-api-key",
        TMDB_ACCESS_TOKEN: "tmdb-token",
      },
      fetchImpl,
    });

    expect(summary).toEqual({
      status: "success",
      issueNumber: 42,
      mappingTitle: "Example Show",
      mappingYear: 2025,
      changedFiles: [...mappingArtifactPaths, ".changeset/tmdb-mapping-issue-42.md"],
      message: "TMDB mapping artifacts written for Example Show",
    });

    const summaryFile = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summaryFile).toEqual(summary);
    expect(fs.existsSync(path.join(repoRoot, ".changeset", "tmdb-mapping-issue-42.md"))).toBe(true);
    expect(fs.existsSync(dataPath)).toBe(true);
  });

  test("resolves Bilibili episode URLs without OpenCode", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-run-"));
    const repoRoot = tempDir;
    const dataPath = path.join(repoRoot, "packages", "tmdb-mapping-kit", "data", "tmdb-platform-map.jsonl");
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, ".changeset"), { recursive: true });
    fs.writeFileSync(dataPath, "");

    const issueBody = `### 媒体标题（可选）

_No response_

### TMDB 链接

https://www.themoviedb.org/tv/282136

### 季号（可选）

_No response_

### 视频平台链接

https://www.bilibili.com/bangumi/play/ep3409878
`;
    const summaryPath = path.join(tempDir, "summary.json");
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.startsWith("https://api.themoviedb.org/3/tv/282136")) {
        return {
          ok: true,
          json: async () => ({ name: "将夜", first_air_date: "2018-10-31" }),
        } as Response;
      }
      if (url === "https://api.bilibili.com/pgc/view/web/season?ep_id=3409878") {
        return {
          ok: true,
          json: async () => ({ result: { season_id: 45962 } }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    };

    const mockedCreateOpencode = rs.mocked(createOpencode);
    mockedCreateOpencode.mockReset();

    const summary = await runMappingAgent({
      issueNumber: 2,
      issueBody,
      repoRoot,
      summaryPath,
      env: {
        TMDB_ACCESS_TOKEN: "tmdb-token",
      },
      fetchImpl,
    });

    expect(summary).toMatchObject({
      status: "success",
      issueNumber: 2,
      mappingTitle: "将夜",
      mappingYear: 2018,
    });
    expect(mockedCreateOpencode).not.toHaveBeenCalled();

    const [jsonl] = fs.readFileSync(dataPath, "utf8").trim().split(/\r?\n/);
    expect(JSON.parse(jsonl)).toMatchObject({
      type: "tv",
      tmdbId: 282136,
      title: "将夜",
      year: 2018,
      season: null,
      providers: [{ provider: "bilibili", idString: "seasonId=45962" }],
    });
  });
});
