import { z } from "../runtime";

export type Unflatten<T extends Record<string, unknown>> = T;

export const globalParamsConfigSchema = z
  .object({
    "global.content.aggregation": z.stringbool().catch(true),
    "global.content.conversion": z.enum(["original", "tc2sc", "sc2tc"]).catch("original"),

    "global.experimental.doubanHistory.enabled": z.stringbool().catch(false),
    "global.experimental.doubanHistory.dbcl2": z.string().catch(""),
    "global.experimental.doubanHistory.customComment": z.string().catch("自豪的使用 Forward"),

    "provider.renren.mode": z.enum(["default", "choice"]).catch("default"),
  })
  .transform((v) => {
    return {
      global: {
        content: {
          aggregation: v["global.content.aggregation"],
          conversion: v["global.content.conversion"],
        },
        experimental: {
          doubanHistory: {
            enabled: v["global.experimental.doubanHistory.enabled"],
            dbcl2: v["global.experimental.doubanHistory.dbcl2"],
            customComment: v["global.experimental.doubanHistory.customComment"],
          },
        },
      },
      provider: {
        renren: {
          mode: v["provider.renren.mode"],
        },
      },
    };
  });

export type GlobalParamsConfig = z.infer<typeof globalParamsConfigSchema>;
