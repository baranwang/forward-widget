import { expect, test } from "@rstest/core";
import { canonicalMappingSchema, mappingSchema } from "../src/index";

test("public canonical schema accepts strict TV JSON mapping files", () => {
  const result = canonicalMappingSchema.safeParse({
    type: "tv",
    tmdbId: 95479,
    title: "咒术回战",
    providers: [{ season: 1, provider: "bilibili", idString: "seasonId=34430", epRange: [1, 24] }],
  });

  expect(result.success).toBe(true);
});

test("public canonical schema defaults omitted TV epOffset to zero", () => {
  const result = canonicalMappingSchema.parse({
    type: "tv",
    tmdbId: 95479,
    title: "咒术回战",
    providers: [{ season: 0, provider: "bilibili", idString: "seasonId=zero", epRange: [0, 0] }],
  });

  expect(result.providers).toEqual([
    { season: 0, provider: "bilibili", idString: "seasonId=zero", epRange: [0, 0], epOffset: 0 },
  ]);
});

test("public mappingSchema aliases the strict mapping file schema", () => {
  const result = mappingSchema.parse({
    type: "movie",
    tmdbId: 129,
    title: "Spirited Away",
    providers: [{ provider: "iqiyi", idString: "vid-001" }],
  });

  expect(result).toEqual({
    type: "movie",
    tmdbId: 129,
    title: "Spirited Away",
    providers: [{ provider: "iqiyi", idString: "vid-001" }],
  });
});
