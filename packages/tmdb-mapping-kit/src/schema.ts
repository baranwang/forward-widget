import { z } from "zod";

const providerEnumSchema = z.enum(["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"]);

export const canonicalProviderSchema = z.object({
  provider: providerEnumSchema,
  idString: z.string(),
});

const canonicalBaseMappingSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  sourceUrl: z.url(),
  verifiedAt: z.string(),
  notes: z.string().optional(),
  state: z.string().optional(),
});

export const canonicalMovieMappingSchema = canonicalBaseMappingSchema.extend({
  type: z.literal("movie"),
  year: z.number().int().optional(),
  providers: z.array(canonicalProviderSchema),
});

export const canonicalTvMappingSchema = canonicalBaseMappingSchema.extend({
  type: z.literal("tv"),
  year: z.number().int().optional(),
  season: z.number().int().nonnegative().nullable().optional(),
  providers: z.array(canonicalProviderSchema),
});

export const canonicalMappingSchema = z.union([canonicalMovieMappingSchema, canonicalTvMappingSchema]);

export const mappingCandidateProviderSchema = canonicalProviderSchema.extend({
  url: z.url(),
});

export const mappingCandidateSchema = z.union([
  canonicalMovieMappingSchema.extend({
    providers: z.array(mappingCandidateProviderSchema),
  }),
  canonicalTvMappingSchema.extend({
    providers: z.array(mappingCandidateProviderSchema),
  }),
]);

export const mappingSchema = canonicalMappingSchema;

export type CanonicalProvider = z.infer<typeof canonicalProviderSchema>;
export type CanonicalMovieMapping = z.infer<typeof canonicalMovieMappingSchema>;
export type CanonicalTvMapping = z.infer<typeof canonicalTvMappingSchema>;
export type CanonicalMapping = z.infer<typeof canonicalMappingSchema>;
export type MappingCandidateProvider = z.infer<typeof mappingCandidateProviderSchema>;
export type MappingCandidate = z.infer<typeof mappingCandidateSchema>;
