import { DEFAULT_COLOR_INT, safeJsonParseWithZod, z } from "../../runtime";
import { CommentMode, providerCommentItemSchema } from "../base";
import { getEpisodeBlacklistPattern } from "../blacklist";

export const youkuIdSchema = z.object({
  showId: z.string().optional(),
  vid: z.string().optional(),
});

export type YoukuId = z.infer<typeof youkuIdSchema>;

const episodeBlacklistPattern = getEpisodeBlacklistPattern(
  "^(.*?)(抢先(版|篇)?|加更(版|篇)?|花絮|预告|特辑|彩蛋|专访|幕后(故事|花絮)?|直播|纯享|未播|衍生|会员(专属|加长)?|片花|精华|看点|速览|解读|reaction|影评)(.*?)$",
);

export const youkuEpisodeInfoSchema = z
  .object({
    id: z.string(),
    show_id: z.string().optional(),
    title: z.string().refine((val) => !episodeBlacklistPattern.test(val)),
    seq: z.coerce.number().optional(),
    duration: z.string(),
    category: z.string(),
    link: z.string(),
  })
  .transform((data) => {
    return {
      ...data,
      get totalMat(): number {
        try {
          const durationFloat = parseFloat(data.duration);
          return Math.floor(durationFloat / 60) + 1;
        } catch {
          return 0;
        }
      },
    };
  });

export const youkuVideoResultSchema = z.object({
  total: z.number().or(z.string().transform((v) => parseInt(v, 10))),
  videos: z
    .array(z.unknown().transform((v) => youkuEpisodeInfoSchema.safeParse(v).data))
    .transform((episodes) => episodes.filter((ep): ep is z.infer<typeof youkuEpisodeInfoSchema> => ep !== null)),
});

const youkuCommentSchema = z
  .object({
    id: z.number(),
    content: z.string(),
    playat: z.number().transform((v) => v / 1000), // milliseconds
    propertis: z
      .string()
      .nullish()
      .transform((v) =>
        safeJsonParseWithZod(
          v ?? "{}",
          z.object({
            color: z.number().optional().default(DEFAULT_COLOR_INT),
            pos: z
              .number()
              .optional()
              .transform((v) => {
                let mode = CommentMode.SCROLL;
                if (v === 1) mode = CommentMode.TOP;
                else if (v === 2) mode = CommentMode.BOTTOM;
                return mode;
              }),
          }),
        ),
      ),
  })
  .transform((v) => {
    return (
      providerCommentItemSchema.safeParse({
        id: v.id.toString(),
        timestamp: v.playat,
        mode: v.propertis?.pos,
        color: v.propertis?.color,
        content: v.content,
      }).data ?? null
    );
  });

export const youkuDanmuResultSchema = z.object({
  data: z.object({
    result: z.array(youkuCommentSchema),
  }),
});
