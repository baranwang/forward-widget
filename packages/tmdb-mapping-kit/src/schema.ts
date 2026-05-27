import { providerNames } from "@forward-widget/scraper-kit/provider-metadata";
import { z } from "zod";

export const providerEnumSchema = z.enum(providerNames).describe("Known Forward Widget provider name.");

const tmdbIdSchema = z.number().int().nonnegative().describe("TMDB numeric identifier for this mapping file.");

const titleSchema = z.string().min(1).describe("Human-readable TMDB title for this mapping file.");

const providerNameSchema = providerEnumSchema.describe("Provider that owns this provider-specific identifier.");

const providerIdStringSchema = z
  .string()
  .describe("Opaque provider-specific identifier string passed to the scraper unchanged.");

const seasonSchema = z.number().int().nonnegative().describe("TMDB season number selected by this provider entry.");

const episodeRangeStartSchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Inclusive starting TMDB episode number covered by this provider entry.");

const episodeRangeEndSchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Inclusive ending TMDB episode number covered by this provider entry.");

export const episodeRangeSchema = z
  .tuple([episodeRangeStartSchema, episodeRangeEndSchema])
  .refine(([start, end]) => start <= end, "Episode range start must be less than or equal to end.")
  .describe("Inclusive TMDB episode range covered by this provider entry.");

const episodeOffsetSchema = z
  .number()
  .int()
  .default(0)
  .describe("Integer offset added to a requested TMDB episode number before calling the provider scraper.");

const baseProviderSchema = z
  .object({
    provider: providerNameSchema,
    idString: providerIdStringSchema,
  })
  .strict()
  .describe("Common provider mapping fields.");

export const tvProviderSchema = baseProviderSchema
  .extend({
    season: seasonSchema,
    epRange: episodeRangeSchema.optional().describe("Optional inclusive TMDB episode range for this provider entry."),
    epOffset: episodeOffsetSchema,
  })
  .strict()
  .describe("TV provider mapping entry with TMDB season and optional episode selection metadata.");

export const movieProviderSchema = baseProviderSchema
  .strict()
  .describe("Movie provider mapping entry without TV season or episode metadata.");

const baseMappingFileSchema = z
  .object({
    tmdbId: tmdbIdSchema,
    title: titleSchema,
  })
  .strict()
  .describe("Common TMDB mapping file fields.");

export const movieMappingFileSchema = baseMappingFileSchema
  .extend({
    type: z.literal("movie").describe("Mapping file media type for a TMDB movie."),
    providers: z.array(movieProviderSchema).describe("Provider mappings available for this TMDB movie."),
  })
  .strict()
  .describe("Strict one-TMDB-one-JSON mapping file for a movie.");

export const tvMappingFileSchema = baseMappingFileSchema
  .extend({
    type: z.literal("tv").describe("Mapping file media type for a TMDB TV series."),
    providers: z.array(tvProviderSchema).describe("Provider mappings available for this TMDB TV series."),
  })
  .strict()
  .describe("Strict one-TMDB-one-JSON mapping file for a TV series.");

export const mappingFileSchema = z
  .discriminatedUnion("type", [movieMappingFileSchema, tvMappingFileSchema])
  .describe("Strict one-TMDB-one-JSON mapping source file.");

export const canonicalProviderSchema = tvProviderSchema.or(movieProviderSchema);
export const canonicalMovieMappingSchema = movieMappingFileSchema;
export const canonicalTvMappingSchema = tvMappingFileSchema;
export const canonicalMappingSchema = mappingFileSchema;
export const mappingCandidateProviderSchema = canonicalProviderSchema;
export const mappingCandidateSchema = mappingFileSchema;
export const mappingSchema = mappingFileSchema;

export type TvProviderInput = z.input<typeof tvProviderSchema>;
export type TvProvider = z.output<typeof tvProviderSchema>;
export type MovieProviderInput = z.input<typeof movieProviderSchema>;
export type MovieProvider = z.output<typeof movieProviderSchema>;
export type MappingFileInput = z.input<typeof mappingFileSchema>;
export type MappingFile = z.output<typeof mappingFileSchema>;
export type MovieMappingFileInput = z.input<typeof movieMappingFileSchema>;
export type MovieMappingFile = z.output<typeof movieMappingFileSchema>;
export type TvMappingFileInput = z.input<typeof tvMappingFileSchema>;
export type TvMappingFile = z.output<typeof tvMappingFileSchema>;

export type CanonicalProvider = z.output<typeof canonicalProviderSchema>;
export type CanonicalMovieMapping = z.output<typeof canonicalMovieMappingSchema>;
export type CanonicalTvMapping = z.output<typeof canonicalTvMappingSchema>;
export type CanonicalMapping = z.output<typeof canonicalMappingSchema>;
export type MappingCandidateProvider = z.output<typeof mappingCandidateProviderSchema>;
export type MappingCandidate = z.output<typeof mappingCandidateSchema>;
