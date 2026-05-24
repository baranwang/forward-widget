import { z } from "./zod";

export enum MediaType {
  Movie = "movie",
  TV = "tv",
}

export const DEFAULT_COLOR_HEX = "ffffff";
export const DEFAULT_COLOR_INT = parseInt(DEFAULT_COLOR_HEX, 16);

export const searchDanmuParamsSchema = z.object({
  tmdbId: z.coerce.string().optional(),
  type: z
    .enum(["movie", "tv"])
    .transform((val: "movie" | "tv") => val as MediaType)
    .catch(MediaType.Movie),
  title: z.coerce.string().optional(),
  seriesName: z.coerce.string().optional(),
  season: z.coerce.number().optional(),
  airDate: z.coerce.string().optional(),
  episode: z.coerce.number().optional(),
  fuzzyMatch: z.enum(["always", "never", "auto"]).catch("auto").optional().default("auto"),
  qihooSearch: z.stringbool().catch(false).optional().default(false),
});
