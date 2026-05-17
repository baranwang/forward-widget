export type { GenerateLocalMapOptions, GenerateLocalMapResult } from "./generate-local-map";

export { generateLocalMap } from "./generate-local-map";
export type { LocalGeneratedMap, LocalMapProvider } from "./local-map";

export type {
  CanonicalMapping,
  CanonicalMovieMapping,
  CanonicalProvider,
  CanonicalTvMapping,
  MappingCandidate,
  MappingCandidateProvider,
} from "./schema";
export {
  canonicalMappingSchema,
  canonicalMovieMappingSchema,
  canonicalProviderSchema,
  canonicalTvMappingSchema,
  mappingCandidateProviderSchema,
  mappingCandidateSchema,
  mappingSchema,
} from "./schema";
