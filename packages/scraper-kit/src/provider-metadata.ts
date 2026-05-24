export const providerNames = ["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"] as const;

export type ProviderName = (typeof providerNames)[number];

export const providerDisplayNames = {
  tencent: "腾讯视频",
  iqiyi: "爱奇艺",
  youku: "优酷视频",
  bilibili: "哔哩哔哩",
  renren: "人人视频",
  mgtv: "芒果 TV",
} as const satisfies Record<ProviderName, string>;

const providerNameSet = new Set<string>(providerNames);

export function isProviderName(value: string): value is ProviderName {
  return providerNameSet.has(value);
}
