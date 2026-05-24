import type { ProviderId } from "./provider-id";
import { isProviderName, type ProviderName, providerNames } from "./provider-metadata";
import { Fetch } from "./runtime";

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

type ParserResult<P extends ProviderName> = Partial<ProviderId[P]> | null;

type ProviderUrlParsers = {
  [P in ProviderName]: (url: URL) => Promise<ParserResult<P>> | ParserResult<P>;
};

type BilibiliSeasonResponse = {
  result?: {
    season_id?: number | string;
  };
};

function formatProviderIdString(id: Record<string, unknown>, keys: string[]) {
  return keys
    .flatMap((key) => {
      const value = id[key];
      return value === undefined || value === null || value === "" ? [] : `${key}=${value}`;
    })
    .join("&");
}

function generateParsedIdString<P extends ProviderName>(provider: P, id: ProviderId[P]) {
  const idRecord = id as Record<string, unknown>;
  switch (provider) {
    case "tencent":
      return formatProviderIdString(idRecord, ["cid", "vid"]);
    case "youku":
      return formatProviderIdString(idRecord, ["showId", "vid"]);
    case "iqiyi":
      return formatProviderIdString(idRecord, ["entityId"]);
    case "bilibili":
      return formatProviderIdString(idRecord, ["seasonId", "aid", "cid"]);
    case "mgtv":
      return formatProviderIdString(idRecord, ["dramaId", "videoId"]);
    case "renren":
      return formatProviderIdString(idRecord, ["dramaId", "episodeId"]);
  }
}

async function getBilibiliSeasonId(episodeId: string) {
  const fetch = new Fetch({ headers: { Referer: "https://www.bilibili.com/" } });
  const response = await fetch.get<BilibiliSeasonResponse>("https://api.bilibili.com/pgc/view/web/season", {
    params: {
      ep_id: episodeId,
    },
    cache: {
      cacheKey: `bilibili:season:${episodeId}`,
    },
  });
  const seasonId = response.data?.result?.season_id;
  if (seasonId === undefined || seasonId === null || seasonId === "") {
    return null;
  }
  return { seasonId: seasonId.toString() };
}

const providerUrlParsers: ProviderUrlParsers = {
  async bilibili(url) {
    if (url.hostname !== "www.bilibili.com" && url.hostname !== "bilibili.com") {
      return null;
    }

    const ssMatch = url.pathname.match(/^\/bangumi\/play\/ss(\d+)$/);
    if (ssMatch) {
      return { seasonId: ssMatch[1] };
    }

    const epMatch = url.pathname.match(/^\/bangumi\/play\/ep(\d+)\/?$/);
    if (epMatch) {
      return getBilibiliSeasonId(epMatch[1]);
    }

    return null;
  },
  iqiyi(url) {
    if (!url.hostname.includes("iqiyi.com")) {
      return null;
    }

    const entityId = url.searchParams.get("entityId") ?? url.searchParams.get("tvid") ?? undefined;
    return entityId ? { entityId } : null;
  },
  mgtv(url) {
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
  },
  renren() {
    return null;
  },
  tencent(url) {
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
    return cid ? { cid, vid: vid || undefined } : null;
  },
  youku(url) {
    if (!url.hostname.includes("youku.com")) {
      return null;
    }

    const showId = url.searchParams.get("showid") ?? undefined;
    const vid = url.searchParams.get("vid") ?? undefined;
    return showId || vid ? { showId, vid } : null;
  },
};

export async function parseProviderUrl(url: string): Promise<ParsedProviderUrl | null> {
  for (const provider of providerNames) {
    const parsed = await parseProviderUrlFor(provider, url);
    if (parsed) {
      return {
        provider,
        ...parsed,
      };
    }
  }

  return null;
}

export async function parseProviderUrlFor<P extends ProviderName>(
  provider: P,
  url: string,
): Promise<ParsedProviderUrlFor<P> | null> {
  if (!isProviderName(provider)) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const parser = providerUrlParsers[provider];
  const id = await parser(parsedUrl);
  if (!id) {
    return null;
  }
  const parsedId = id as ProviderId[P];

  return {
    id: parsedId,
    idString: generateParsedIdString(provider, parsedId),
    url,
  };
}
