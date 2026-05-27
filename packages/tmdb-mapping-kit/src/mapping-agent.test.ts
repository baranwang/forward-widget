import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { createOpencode } from "@opencode-ai/sdk/v2";
import { describe, expect, rs, test } from "@rstest/core";
import { z } from "zod";
import {
  buildIssueFieldsPrompt,
  buildMappingPrompt,
  createChangesetContent,
  createMappingFileContent,
  defaultRepoRoot,
  fetchTmdbMetadata,
  type IssueFormFields,
  issueFormFieldsOutputJsonSchema,
  issueFormFieldsSchema,
  mappingAgentOutputJsonSchema,
  mappingDataRelativePath,
  mergeMappingFile,
  modelResponseOutputSchema,
  modelSelection,
  parseCliArgs,
  parseIssueFieldsStructuredResponse,
  parseMappingAgentArgs,
  parseStructuredModelResponse,
  runMappingAgent,
  runMappingAgentCli,
  writeMappingAgentSummary,
  writeMappingArtifacts,
} from "./mapping-agent.ts";

rs.mock("@opencode-ai/sdk/v2", () => ({
  createOpencode: rs.fn(),
}));

type MockOpenCodeSession = {
  create: ReturnType<typeof rs.fn>;
  prompt: ReturnType<typeof rs.fn>;
};

function mockOpenCodeClient(session: MockOpenCodeSession): Awaited<ReturnType<typeof createOpencode>> {
  const client: OpencodeClient = Object.create(null);
  Object.defineProperty(client, "session", { value: session });

  return {
    client,
    server: {
      url: "http://127.0.0.1:0",
      close: rs.fn(),
    },
  };
}

async function withMockedFetch<T>(fetchImpl: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function mockIssueFieldExtraction(structured: unknown) {
  const mockedCreateOpencode = rs.mocked(createOpencode);
  const sessionCreate = rs.fn().mockResolvedValueOnce({ data: { id: "session-1" } });
  const sessionPrompt = rs.fn().mockResolvedValueOnce({
    data: {
      info: {
        structured,
      },
    },
  });

  mockedCreateOpencode.mockReset();
  mockedCreateOpencode.mockResolvedValueOnce(mockOpenCodeClient({ create: sessionCreate, prompt: sessionPrompt }));

  return { mockedCreateOpencode, sessionCreate, sessionPrompt };
}

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

describe("issue field extraction", () => {
  test("derives the issue field JSON schema from a Zod source of truth", () => {
    expect(issueFormFieldsOutputJsonSchema).toEqual(z.toJSONSchema(issueFormFieldsSchema));
    expect(issueFormFieldsOutputJsonSchema).toMatchObject({
      type: "object",
      properties: {
        media_type: {
          type: "string",
          enum: ["movie", "tv"],
        },
        platform_urls: {
          type: "array",
        },
      },
      required: ["media_type", "tmdb_url", "platform_urls"],
      additionalProperties: false,
    });
  });

  test("builds an extraction prompt with the raw issue body and flexible label guidance", () => {
    const issueBody = `### Title

Example Show

### TMDB URL

https://www.themoviedb.org/tv/12345
`;

    const prompt = buildIssueFieldsPrompt(issueBody);

    expect(prompt).toContain(issueBody);
    expect(prompt).toContain("Headings and labels may vary");
    expect(prompt).not.toContain("媒体标题");
  });

  test("parses only the structured issue fields schema", () => {
    expect(
      parseIssueFieldsStructuredResponse({
        media_title: "Example Show",
        media_type: "tv",
        tmdb_url: "https://www.themoviedb.org/tv/12345",
        season: null,
        platform_urls: ["https://v.qq.com/x/cover/demo.html"],
        notes: "extra notes",
      }),
    ).toEqual({
      media_title: "Example Show",
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/12345",
      season: null,
      platform_urls: ["https://v.qq.com/x/cover/demo.html"],
      notes: "extra notes",
    });

    expect(() =>
      parseIssueFieldsStructuredResponse({
        media_type: "movie",
        platform_urls: ["https://v.qq.com/x/cover/demo.html"],
      }),
    ).toThrow();
    expect(() =>
      parseIssueFieldsStructuredResponse({
        media_title: "Example Show",
        media_type: "tv",
        tmdb_url: "https://www.themoviedb.org/tv/12345",
        season: "1",
        platform_urls: "https://v.qq.com/x/cover/demo.html",
      }),
    ).toThrow();
    expect(() =>
      parseIssueFieldsStructuredResponse({
        media_title: "Example Show",
        media_type: "tv",
        tmdb_url: "https://www.themoviedb.org/tv/12345",
        season: null,
        platform_urls: [],
      }),
    ).toThrow();
  });
});

describe("model output validation", () => {
  const response = {
    status: "confident",
    reason: "extracted from URL",
    mapping: {
      type: "movie",
      tmdbId: 980477,
      title: "Model Title",
      providers: [{ provider: "iqiyi", idString: "entityId=demo", url: "https://v.qq.com/x/cover/demo.html" }],
    },
  };

  test("derives the OpenCode schema from an object-root Zod source of truth", () => {
    expect(mappingAgentOutputJsonSchema).toEqual(z.toJSONSchema(modelResponseOutputSchema));
    expect(mappingAgentOutputJsonSchema).toMatchObject({
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["confident", "ambiguous"],
        },
      },
      required: ["status"],
      additionalProperties: false,
    });
    expect(mappingAgentOutputJsonSchema).not.toHaveProperty("anyOf");
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
    expect(parseStructuredModelResponse(response)).toEqual({
      status: "confident",
      reason: "extracted from URL",
      mapping: {
        type: "movie",
        tmdbId: 980477,
        title: "Model Title",
        providers: [{ provider: "iqiyi", idString: "entityId=demo", url: "https://v.qq.com/x/cover/demo.html" }],
      },
    });
  });

  test("rejects provider idString values that cannot be parsed by the selected provider", () => {
    expect(() =>
      parseStructuredModelResponse({
        status: "confident",
        mapping: {
          type: "tv",
          tmdbId: 282136,
          title: "Example Show",
          providers: [{ season: 1, provider: "bilibili", idString: "ses_19657d109ffe84cBiE6WQ5Qjrv" }],
        },
      }),
    ).toThrow("idString must be valid for the selected provider");
  });

  test("parses ambiguous structured SDK output", () => {
    expect(parseStructuredModelResponse({ status: "ambiguous", reason: "two possible ids" })).toEqual({
      status: "ambiguous",
      reason: "two possible ids",
    });
  });

  test("builds a prompt for provider-level season, range, offset, and ambiguity rules", () => {
    const prompt = buildMappingPrompt(
      {
        media_type: "tv",
        tmdb_url: "https://www.themoviedb.org/tv/95479",
        season: 1,
        platform_urls: ["https://www.bilibili.com/bangumi/play/ss34430"],
      },
      { title: "Jujutsu Kaisen", year: 2020 },
    );

    expect(prompt).toContain("provider-level season");
    expect(prompt).toContain("inclusive TMDB episode range");
    expect(prompt).toContain("epOffset defaults to 0");
    expect(prompt).toContain("idString is opaque");
    expect(prompt).toContain("return ambiguous");
    expect(prompt).toContain("Do not infer split episode ranges");
  });
});

describe("TMDB metadata fetch", () => {
  const movieFields: IssueFormFields = {
    media_title: "Issue Title",
    media_type: "movie",
    tmdb_url: "https://www.themoviedb.org/movie/980477",
    platform_urls: ["https://v.qq.com/x/cover/demo.html"],
    notes: "",
  };

  const tvFields: IssueFormFields = {
    media_title: "Issue Title",
    media_type: "tv",
    tmdb_url: "https://www.themoviedb.org/tv/12345",
    platform_urls: ["https://v.qq.com/x/cover/demo.html"],
    notes: "",
  };

  function response(json: Record<string, unknown>, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => json,
    } as Response;
  }

  test("fetches movie title and year from TMDB metadata", async () => {
    const fetchImpl = async () => response({ title: "TMDB Movie", release_date: "2025-03-01" });

    await withMockedFetch(fetchImpl, async () => {
      await expect(fetchTmdbMetadata(movieFields, { TMDB_ACCESS_TOKEN: "token" })).resolves.toEqual({
        title: "TMDB Movie",
        year: 2025,
      });
    });
  });

  test("fetches TV title and year from TMDB metadata", async () => {
    const fetchImpl = async () => response({ name: "TMDB Show", first_air_date: "2024-11-09" });

    await withMockedFetch(fetchImpl, async () => {
      await expect(fetchTmdbMetadata(tvFields, { TMDB_ACCESS_TOKEN: "token" })).resolves.toEqual({
        title: "TMDB Show",
        year: 2024,
      });
    });
  });

  test("requires a TMDB access token", async () => {
    const fetchImpl = async () => response({ title: "TMDB Movie" });

    await withMockedFetch(fetchImpl, async () => {
      await expect(fetchTmdbMetadata(movieFields, {})).rejects.toThrow("TMDB_ACCESS_TOKEN is required");
    });
  });

  test("fails on non-2xx TMDB metadata responses", async () => {
    const fetchImpl = async () => response({}, 503);

    await withMockedFetch(fetchImpl, async () => {
      await expect(fetchTmdbMetadata(movieFields, { TMDB_ACCESS_TOKEN: "token" })).rejects.toThrow(
        "TMDB metadata fetch failed with status 503",
      );
    });
  });

  test("fails when TMDB metadata omits a usable title", async () => {
    const fetchImpl = async () => response({ release_date: "2025-03-01" });

    await withMockedFetch(fetchImpl, async () => {
      await expect(fetchTmdbMetadata(movieFields, { TMDB_ACCESS_TOKEN: "token" })).rejects.toThrow(
        "TMDB metadata response did not include a title",
      );
    });
  });
});

describe("write safety helpers", () => {
  const mapping = {
    type: "movie" as const,
    tmdbId: 980477,
    title: "Ne Zha 2",
    providers: [{ provider: "iqiyi" as const, idString: "abc" }],
  };

  test("creates stable JSON file content without source metadata", () => {
    expect(createMappingFileContent(mapping)).toBe(`${JSON.stringify(mapping, null, 2)}\n`);
  });

  test("merges exact duplicate provider entries as a no-op", () => {
    const existing = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [{ season: 1, provider: "bilibili" as const, idString: "seasonId=34430", epOffset: 0 }],
    };

    expect(mergeMappingFile(existing, existing)).toEqual({ mapping: existing, changed: false });
  });

  test("rejects overlapping ranges for the same provider, season, and idString", () => {
    const existing = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [
        {
          season: 1,
          provider: "bilibili" as const,
          idString: "seasonId=34430",
          epRange: [1, 24] as [number, number],
          epOffset: 0,
        },
      ],
    };
    const incoming = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [
        {
          season: 1,
          provider: "bilibili" as const,
          idString: "seasonId=34430",
          epRange: [24, 30] as [number, number],
          epOffset: 0,
        },
      ],
    };

    expect(() => mergeMappingFile(existing, incoming)).toThrow("provider entry overlaps");
  });

  test("allows overlapping ranges for different idString values and no-range entries", () => {
    const existing = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [
        {
          season: 1,
          provider: "bilibili" as const,
          idString: "seasonId=34430",
          epRange: [1, 24] as [number, number],
          epOffset: 0,
        },
        { season: 1, provider: "bilibili" as const, idString: "seasonId=all", epOffset: 0 },
      ],
    };
    const incoming = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [
        {
          season: 1,
          provider: "bilibili" as const,
          idString: "seasonId=45574",
          epRange: [12, 47] as [number, number],
          epOffset: -24,
        },
        { season: 1, provider: "bilibili" as const, idString: "seasonId=34430", epOffset: 0 },
      ],
    };

    const result = mergeMappingFile(existing, incoming);

    expect(result.changed).toBe(true);
    expect(result.mapping.providers).toHaveLength(4);
  });

  test("updates an existing JSON mapping file with a new provider entry", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-write-"));
    const existing = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [
        {
          season: 1,
          provider: "bilibili" as const,
          idString: "seasonId=34430",
          epRange: [1, 24] as [number, number],
          epOffset: 0,
        },
      ],
    };
    const incoming = {
      type: "tv" as const,
      tmdbId: 95479,
      title: "Jujutsu Kaisen",
      providers: [
        {
          season: 1,
          provider: "bilibili" as const,
          idString: "seasonId=45574",
          epRange: [25, 47] as [number, number],
          epOffset: -24,
        },
      ],
    };
    const dataPath = path.join(tempDir, mappingDataRelativePath(existing));
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, createMappingFileContent(existing));

    const result = writeMappingArtifacts(tempDir, 42, incoming);

    expect(result).toEqual({
      changed: true,
      changedFiles: [mappingDataRelativePath(incoming), ".changeset/tmdb-mapping-issue-42.md"],
    });
    const updated = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    expect(updated.providers).toEqual([
      { season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24], epOffset: 0 },
      { season: 1, provider: "bilibili", idString: "seasonId=45574", epRange: [25, 47], epOffset: -24 },
    ]);
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
      changedFiles: [mappingDataRelativePath(mapping), ".changeset/tmdb-mapping-issue-42.md"],
      message: "ok",
    });

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summary).toEqual({
      status: "success",
      issueNumber: 42,
      mappingTitle: "Example Show",
      mappingYear: 2025,
      changedFiles: [mappingDataRelativePath(mapping), ".changeset/tmdb-mapping-issue-42.md"],
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

    const mockedCreateOpencode = rs.mocked(createOpencode);
    mockedCreateOpencode.mockReset();
    mockedCreateOpencode.mockResolvedValueOnce(
      mockOpenCodeClient({
        create: rs.fn().mockResolvedValueOnce({ data: { id: "session-1" } }),
        prompt: rs.fn().mockResolvedValueOnce({
          data: {
            info: {},
          },
        }),
      }),
    );

    const previousModel = process.env.OPENCODE_MODEL;
    const previousApiKey = process.env.OPENCODE_API_KEY;
    process.env.OPENCODE_MODEL = "custom/model-a";
    process.env.OPENCODE_API_KEY = "test-api-key";

    try {
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
      expect(summary.message).toBe("OpenCode SDK response did not include structured output");
      expect(summary.mappingTitle).toBeUndefined();
      expect(summary.changedFiles).toBeUndefined();
    } finally {
      if (previousModel === undefined) {
        delete process.env.OPENCODE_MODEL;
      } else {
        process.env.OPENCODE_MODEL = previousModel;
      }
      if (previousApiKey === undefined) {
        delete process.env.OPENCODE_API_KEY;
      } else {
        process.env.OPENCODE_API_KEY = previousApiKey;
      }
    }
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
  test("uses OpenCode fallback for unsupported provider URLs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-run-"));
    const repoRoot = tempDir;
    const dataPath = path.join(repoRoot, mappingDataRelativePath({ type: "movie", tmdbId: 999999 }));
    const changesetDir = path.join(repoRoot, ".changeset");
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.mkdirSync(changesetDir, { recursive: true });

    const issueBody = `### 媒体标题（可选）

_No response_

### TMDB 链接

https://www.themoviedb.org/tv/282136

### 视频平台链接

https://example.com/watch/unknown-provider
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

    const { mockedCreateOpencode, sessionPrompt } = mockIssueFieldExtraction({
      media_title: undefined,
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/282136",
      season: null,
      platform_urls: ["https://example.com/watch/unknown-provider"],
      notes: undefined,
    });
    const candidatePrompt = rs.fn().mockResolvedValueOnce({
      data: {
        info: {
          structured: {
            status: "confident",
            mapping: {
              type: "movie",
              tmdbId: 999999,
              title: "Mismatched Candidate",
              providers: [
                {
                  provider: "iqiyi",
                  idString: "entityId=demo",
                  url: "https://example.com/watch/other-provider",
                },
              ],
            },
          },
        },
      },
    });
    mockedCreateOpencode.mockResolvedValueOnce(
      mockOpenCodeClient({
        create: rs.fn().mockResolvedValueOnce({ data: { id: "session-2" } }),
        prompt: candidatePrompt,
      }),
    );

    const summary = await withMockedFetch(fetchImpl, () =>
      runMappingAgent({
        issueNumber: 42,
        issueBody,
        repoRoot,
        summaryPath,
        env: {
          OPENCODE_MODEL: "custom/model-a",
          OPENCODE_API_KEY: "test-api-key",
          TMDB_ACCESS_TOKEN: "tmdb-token",
        },
      }),
    );

    expect(summary).toEqual({
      status: "success",
      issueNumber: 42,
      mappingTitle: "Mismatched Candidate",
      mappingYear: 2025,
      changedFiles: [mappingDataRelativePath({ type: "movie", tmdbId: 999999 }), ".changeset/tmdb-mapping-issue-42.md"],
      message: "TMDB mapping artifacts written for Mismatched Candidate",
    });

    expect(mockedCreateOpencode).toHaveBeenCalledTimes(2);
    expect(sessionPrompt).toHaveBeenCalledTimes(1);
    expect(sessionPrompt.mock.calls[0][0].parts[0].text).toContain(issueBody);
    expect(sessionPrompt.mock.calls[0][0].parts[0].text).toContain("媒体标题（可选）");
    expect(candidatePrompt).toHaveBeenCalledTimes(1);

    const summaryFile = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(summaryFile).toEqual(summary);
    const json = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    expect(json).toMatchObject({
      type: "movie",
      tmdbId: 999999,
      title: "Mismatched Candidate",
      providers: [{ provider: "iqiyi", idString: "entityId=demo" }],
    });
    expect(json).not.toHaveProperty("sourceUrl");
    expect(json).not.toHaveProperty("verifiedAt");
    expect("url" in json.providers[0]).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, ".changeset", "tmdb-mapping-issue-42.md"))).toBe(true);
    expect(fs.existsSync(dataPath)).toBe(true);
  });

  test("resolves Bilibili episode URLs with OpenCode extraction", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-run-"));
    const repoRoot = tempDir;
    const dataPath = path.join(repoRoot, mappingDataRelativePath({ type: "tv", tmdbId: 282136 }));
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, ".changeset"), { recursive: true });

    const issueBody = `### 媒体标题（可选）

    1

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

    const { mockedCreateOpencode, sessionPrompt } = mockIssueFieldExtraction({
      media_title: undefined,
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/282136",
      season: 1,
      platform_urls: ["https://www.bilibili.com/bangumi/play/ep3409878"],
      notes: undefined,
    });

    const summary = await withMockedFetch(fetchImpl, () =>
      runMappingAgent({
        issueNumber: 2,
        issueBody,
        repoRoot,
        summaryPath,
        env: {
          OPENCODE_MODEL: "custom/model-a",
          OPENCODE_API_KEY: "test-api-key",
          TMDB_ACCESS_TOKEN: "tmdb-token",
        },
      }),
    );

    expect(summary).toMatchObject({
      status: "success",
      issueNumber: 2,
      mappingTitle: "将夜",
      mappingYear: 2018,
    });
    expect(mockedCreateOpencode).toHaveBeenCalledTimes(1);
    expect(sessionPrompt).toHaveBeenCalledTimes(1);

    const json = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    expect(json).toMatchObject({
      type: "tv",
      tmdbId: 282136,
      title: "将夜",
      providers: [{ season: 1, provider: "bilibili", idString: "seasonId=45962", epOffset: 0 }],
    });
    expect(json).not.toHaveProperty("sourceUrl");
    expect(json).not.toHaveProperty("verifiedAt");
    expect("url" in json.providers[0]).toBe(false);
  });

  test("resolves Bilibili season URLs with OpenCode extraction", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-run-"));
    const repoRoot = tempDir;
    const dataPath = path.join(repoRoot, mappingDataRelativePath({ type: "tv", tmdbId: 282136 }));
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, ".changeset"), { recursive: true });

    const issueBody = `### 媒体标题（可选）

    1

### TMDB 链接

https://www.themoviedb.org/tv/282136

### 季号（可选）

_No response_

### 视频平台链接

https://www.bilibili.com/bangumi/play/ss45962
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
      throw new Error(`unexpected fetch: ${url}`);
    };

    const { mockedCreateOpencode, sessionPrompt } = mockIssueFieldExtraction({
      media_title: undefined,
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/282136",
      season: 1,
      platform_urls: ["https://www.bilibili.com/bangumi/play/ss45962"],
      notes: undefined,
    });

    const summary = await withMockedFetch(fetchImpl, () =>
      runMappingAgent({
        issueNumber: 7,
        issueBody,
        repoRoot,
        summaryPath,
        env: {
          OPENCODE_MODEL: "custom/model-a",
          OPENCODE_API_KEY: "test-api-key",
          TMDB_ACCESS_TOKEN: "tmdb-token",
        },
      }),
    );

    expect(summary).toMatchObject({
      status: "success",
      issueNumber: 7,
      mappingTitle: "将夜",
      mappingYear: 2018,
    });
    expect(mockedCreateOpencode).toHaveBeenCalledTimes(1);
    expect(sessionPrompt).toHaveBeenCalledTimes(1);

    const seasonJson = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    expect(seasonJson).toMatchObject({
      type: "tv",
      tmdbId: 282136,
      title: "将夜",
      providers: [{ season: 1, provider: "bilibili", idString: "seasonId=45962", epOffset: 0 }],
    });
    expect("url" in seasonJson.providers[0]).toBe(false);
  });

  test("resolves MGTV drama URLs with OpenCode extraction", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmdb-mapping-run-"));
    const repoRoot = tempDir;
    const dataPath = path.join(repoRoot, mappingDataRelativePath({ type: "tv", tmdbId: 97199 }));
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, ".changeset"), { recursive: true });

    const issueBody = `### 媒体标题（可选）

_No response_

### TMDB 链接

https://www.themoviedb.org/tv/97199

### 季号（可选）

6

### 视频平台链接

https://www.mgtv.com/h/860862.html
`;
    const summaryPath = path.join(tempDir, "summary.json");
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.startsWith("https://api.themoviedb.org/3/tv/97199")) {
        return {
          ok: true,
          json: async () => ({ name: "妻子的浪漫旅行", first_air_date: "2018-08-15" }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    };

    const { mockedCreateOpencode, sessionPrompt } = mockIssueFieldExtraction({
      media_title: undefined,
      media_type: "tv",
      tmdb_url: "https://www.themoviedb.org/tv/97199",
      season: 6,
      platform_urls: ["https://www.mgtv.com/h/860862.html"],
      notes: undefined,
    });

    const summary = await withMockedFetch(fetchImpl, () =>
      runMappingAgent({
        issueNumber: 6,
        issueBody,
        repoRoot,
        summaryPath,
        env: {
          OPENCODE_MODEL: "custom/model-a",
          OPENCODE_API_KEY: "test-api-key",
          TMDB_ACCESS_TOKEN: "tmdb-token",
        },
      }),
    );

    expect(summary).toMatchObject({
      status: "success",
      issueNumber: 6,
      mappingTitle: "妻子的浪漫旅行",
      mappingYear: 2018,
    });
    expect(mockedCreateOpencode).toHaveBeenCalledTimes(1);
    expect(sessionPrompt).toHaveBeenCalledTimes(1);

    const mgtvJson = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    expect(mgtvJson).toMatchObject({
      type: "tv",
      tmdbId: 97199,
      title: "妻子的浪漫旅行",
      providers: [{ season: 6, provider: "mgtv", idString: "dramaId=860862", epOffset: 0 }],
    });
    expect("url" in mgtvJson.providers[0]).toBe(false);
  });
});
