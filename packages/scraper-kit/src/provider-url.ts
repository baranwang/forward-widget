import type { ProviderId, ProviderName } from "./provider-id";
import { generateProviderIdString } from "./provider-id";

export type ParsedProviderUrl = {
  provider: ProviderName;
  id: ProviderId[ProviderName];
  idString: string;
  url: string;
};

type ParsedProviderUrlFor<P extends ProviderName> = {
  id: ProviderId[P];
  idString: string;
  url: string;
};

function parseTencentUrl(url: URL): ProviderId["tencent"] | null {
  if (url.hostname !== "v.qq.com") {
    return null;
  }

  const withVidMatch = url.pathname.match(/^\/x\/cover\/([^/]+)\/([^/.]+)\.html$/);
  if (withVidMatch) {
    return {
      cid: withVidMatch[1],
      vid: withVidMatch[2],
    };
  }

  const cidOnlyMatch = url.pathname.match(/^\/x\/cover\/([^/.]+)\.html$/);
  if (cidOnlyMatch) {
    return { cid: cidOnlyMatch[1] };
  }

  const cid = url.searchParams.get("cid") ?? undefined;
  const vid = url.searchParams.get("vid") ?? undefined;
  if (cid) {
    return { cid, vid: vid || undefined };
  }

  return null;
}

function parseYoukuUrl(url: URL): ProviderId["youku"] | null {
  if (!url.hostname.includes("youku.com")) {
    return null;
  }

  const showId = url.searchParams.get("showid") ?? undefined;
  const vid = url.searchParams.get("vid") ?? undefined;
  if (!showId && !vid) {
    return null;
  }

  return { showId, vid };
}

function parseIqiyiUrl(url: URL): ProviderId["iqiyi"] | null {
  if (!url.hostname.includes("iqiyi.com")) {
    return null;
  }

  const entityId = url.searchParams.get("entityId") ?? url.searchParams.get("tvid") ?? undefined;
  if (!entityId) {
    return null;
  }

  return { entityId };
}

function parseBilibiliUrl(url: URL): ProviderId["bilibili"] | null {
  if (url.hostname !== "www.bilibili.com" && url.hostname !== "bilibili.com") {
    return null;
  }

  const ssMatch = url.pathname.match(/^\/bangumi\/play\/ss(\d+)$/);
  if (ssMatch) {
    return { seasonId: ssMatch[1] };
  }

  return null;
}

function parseMgtvUrl(url: URL): ProviderId["mgtv"] | null {
  if (url.hostname !== "www.mgtv.com" && url.hostname !== "mgtv.com") {
    return null;
  }

  const hMatch = url.pathname.match(/^\/h\/([^/.]+)\.html$/);
  if (hMatch) {
    return { dramaId: hMatch[1] };
  }

  const bMatch = url.pathname.match(/^\/b\/([^/]+)\/([^/.]+)\.html$/);
  if (bMatch) {
    return {
      dramaId: bMatch[1],
      videoId: bMatch[2],
    };
  }

  return null;
}

function parseProviderIdFromUrl(provider: ProviderName, url: URL): ProviderId[ProviderName] | null {
  if (provider === "tencent") {
    return parseTencentUrl(url);
  }
  if (provider === "youku") {
    return parseYoukuUrl(url);
  }
  if (provider === "iqiyi") {
    return parseIqiyiUrl(url);
  }
  if (provider === "bilibili") {
    return parseBilibiliUrl(url);
  }
  if (provider === "mgtv") {
    return parseMgtvUrl(url);
  }
  return null;
}

export function parseProviderUrl(url: string): ParsedProviderUrl | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const providers: ProviderName[] = ["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"];
  for (const provider of providers) {
    const id = parseProviderIdFromUrl(provider, parsedUrl);
    if (id) {
      return {
        provider,
        id,
        idString: generateProviderIdString(provider, id as never),
        url,
      };
    }
  }

  return null;
}

export function parseProviderUrlFor<P extends ProviderName>(provider: P, url: string): ParsedProviderUrlFor<P> | null {
  const parsed = parseProviderUrl(url);
  if (!parsed || parsed.provider !== provider) {
    return null;
  }

  return {
    id: parsed.id as ProviderId[P],
    idString: parsed.idString,
    url: parsed.url,
  };
}
