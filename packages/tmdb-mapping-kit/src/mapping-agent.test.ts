import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "@rstest/core";
import { z } from "zod";
import {
  assertNoDuplicateMapping,
  createChangesetContent,
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
  runMappingAgentCli,
  validateCandidateForIssue,
  writeMappingAgentSummary,
} from "./mapping-agent.ts";

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

### 媒体类型

tv

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
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/12345",
      season: "2",
      platform_urls: "https://v.qq.com/x/cover/demo.html",
      notes: "",
    });
  });

  test("validates TMDB path against media type", () => {
    const fields = normalizeIssueFields(parseIssueFormBody(body));
    expect(fields.season).toBe(2);
    expect(fields.platform_urls).toEqual(["https://v.qq.com/x/cover/demo.html"]);
    expect(() =>
      normalizeIssueFields({
        media_title: "Example",
        media_type: "movie",
        tmdb_url: "https://www.themoviedb.org/tv/12345",
        season: "",
        platform_urls: "https://v.qq.com/x/cover/demo.html",
        notes: "",
      }),
    ).toThrow("media_type must match tmdb_url path");
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
    media_title: "Example Show",
    media_type: "tv",
    tmdb_url: "https://www.themoviedb.org/tv/12345",
    season: "2",
    platform_urls: "https://v.qq.com/x/cover/demo.html",
    notes: "",
  });

  const response = JSON.stringify({
    status: "confident",
    reason: "extracted from URL",
    mapping: {
      type: "tv",
      tmdbId: 12345,
      title: "Model Title",
      sourceUrl: "https://www.themoviedb.org/tv/12345",
      verifiedAt: "2026-05-17T10:00:00.000Z",
      season: 2,
      providers: [{ provider: "tencent", idString: "demo", url: "https://v.qq.com/x/cover/demo.html" }],
    },
  });

  test("derives the OpenCode schema from the Zod source of truth", () => {
    expect(mappingAgentOutputJsonSchema).toEqual(z.toJSONSchema(modelResponseSchema));
  });

  test("parses structured SDK output without text extraction", () => {
    expect(parseStructuredModelResponse(JSON.parse(response))).toEqual({
      status: "confident",
      reason: "extracted from URL",
      mapping: {
        type: "tv",
        tmdbId: 12345,
        title: "Model Title",
        sourceUrl: "https://www.themoviedb.org/tv/12345",
        verifiedAt: "2026-05-17T10:00:00.000Z",
        season: 2,
        providers: [{ provider: "tencent", idString: "demo", url: "https://v.qq.com/x/cover/demo.html" }],
      },
    });
  });

  test("parses fenced JSON and validates candidate mapping", () => {
    const extraction = parseModelResponse(`\`\`\`json\n${response}\n\`\`\``);
    expect(extraction.status).toBe("confident");
    if (extraction.status !== "confident") {
      throw new Error("expected confident response");
    }
    const canonical = validateCandidateForIssue(extraction.mapping, fields);
    expect(canonical).toMatchObject({
      title: "Example Show",
      sourceUrl: "https://www.themoviedb.org/tv/12345",
      providers: [{ provider: "tencent", idString: "demo" }],
    });
    expect("url" in canonical.providers[0]).toBe(false);
  });

  test("fails safely on ambiguous output and mismatched season", () => {
    expect(parseModelResponse('{"status":"ambiguous","reason":"two possible ids"}')).toEqual({
      status: "ambiguous",
      reason: "two possible ids",
    });
    const mismatched = parseModelResponse(response.replace('"season":2', '"season":1'));
    if (mismatched.status !== "confident") {
      throw new Error("expected confident response");
    }
    expect(() => validateCandidateForIssue(mismatched.mapping, fields)).toThrow("season does not match");
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
    expect(createChangesetContent(mapping)).toContain('"@forward-widget/tmdb-mapping-kit": patch');
    expect(createChangesetContent(mapping)).toContain('"@forward-widget/danmu-universe": patch');
  });

  test("writes summary json when path is provided", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-summary-"));
    const summaryPath = path.join(tempDir, "summary.json");

    writeMappingAgentSummary(summaryPath, {
      status: "success",
      issueNumber: 42,
      mappingTitle: "Example Show",
      changedFiles: [...mappingArtifactPaths, ".changeset/tmdb-mapping-issue-42.md"],
      message: "ok",
    });

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summary).toEqual({
      status: "success",
      issueNumber: 42,
      mappingTitle: "Example Show",
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
});
