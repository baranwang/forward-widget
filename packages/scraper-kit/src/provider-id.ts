import { parse, stringify } from "querystringify";

export const providerNames = ["tencent", "youku", "iqiyi", "bilibili", "mgtv", "renren"] as const;

export type ProviderName = (typeof providerNames)[number];

export type TencentId = {
  cid: string;
  vid?: string;
};

export type YoukuId = {
  showId?: string;
  vid?: string;
};

export type IqiyiId = {
  entityId: string;
};

export type BilibiliId = {
  seasonId: string;
  aid?: string;
  cid?: string;
};

export type MgtvId = {
  dramaId: string;
  videoId?: string;
};

export type RenrenId = {
  dramaId: number;
  episodeId?: number;
};

export type ProviderId = {
  tencent: TencentId;
  youku: YoukuId;
  iqiyi: IqiyiId;
  bilibili: BilibiliId;
  mgtv: MgtvId;
  renren: RenrenId;
};

const providerNameSet = new Set<string>(providerNames);

export function isProviderName(value: string): value is ProviderName {
  return providerNameSet.has(value);
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return String(value);
}

function readRequiredString(provider: ProviderName, source: Record<string, unknown>, key: string): string {
  const value = readOptionalString(source, key);
  if (!value) {
    throw new Error(`${provider}: missing required field \`${key}\``);
  }
  return value;
}

function readOptionalNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

function readRequiredNumber(provider: ProviderName, source: Record<string, unknown>, key: string): number {
  const value = readOptionalNumber(source, key);
  if (value === undefined) {
    throw new Error(`${provider}: missing required field \`${key}\``);
  }
  return value;
}

function parseTencentId(source: Record<string, unknown>): TencentId {
  return {
    cid: readRequiredString("tencent", source, "cid"),
    vid: readOptionalString(source, "vid"),
  };
}

function parseYoukuId(source: Record<string, unknown>): YoukuId {
  return {
    showId: readOptionalString(source, "showId"),
    vid: readOptionalString(source, "vid"),
  };
}

function parseIqiyiId(source: Record<string, unknown>): IqiyiId {
  return {
    entityId: readRequiredString("iqiyi", source, "entityId"),
  };
}

function parseBilibiliId(source: Record<string, unknown>): BilibiliId {
  return {
    seasonId: readRequiredString("bilibili", source, "seasonId"),
    aid: readOptionalString(source, "aid"),
    cid: readOptionalString(source, "cid"),
  };
}

function parseMgtvId(source: Record<string, unknown>): MgtvId {
  return {
    dramaId: readRequiredString("mgtv", source, "dramaId"),
    videoId: readOptionalString(source, "videoId"),
  };
}

function parseRenrenId(source: Record<string, unknown>): RenrenId {
  return {
    dramaId: readRequiredNumber("renren", source, "dramaId"),
    episodeId: readOptionalNumber(source, "episodeId"),
  };
}

function parseProviderId(provider: ProviderName, source: Record<string, unknown>): ProviderId[ProviderName] {
  switch (provider) {
    case "tencent":
      return parseTencentId(source);
    case "youku":
      return parseYoukuId(source);
    case "iqiyi":
      return parseIqiyiId(source);
    case "bilibili":
      return parseBilibiliId(source);
    case "mgtv":
      return parseMgtvId(source);
    case "renren":
      return parseRenrenId(source);
  }
}

export function parseProviderIdString<P extends ProviderName>(provider: P, idString: string): ProviderId[P] {
  const parsed = parse(idString) as Record<string, unknown>;
  return parseProviderId(provider, parsed) as ProviderId[P];
}

export function generateProviderIdString<P extends ProviderName>(
  provider: P,
  id: ProviderId[P] | Record<string, unknown>,
): string {
  const normalized = parseProviderId(provider, id as Record<string, unknown>);
  switch (provider) {
    case "tencent": {
      const value = normalized as TencentId;
      const ordered = {
        cid: value.cid,
        ...(value.vid ? { vid: value.vid } : {}),
      };
      return stringify(ordered);
    }
    case "youku": {
      const value = normalized as YoukuId;
      const ordered = {
        ...(value.showId ? { showId: value.showId } : {}),
        ...(value.vid ? { vid: value.vid } : {}),
      };
      return stringify(ordered);
    }
    case "iqiyi": {
      const value = normalized as IqiyiId;
      return stringify({ entityId: value.entityId });
    }
    case "bilibili": {
      const value = normalized as BilibiliId;
      const ordered = {
        seasonId: value.seasonId,
        ...(value.aid ? { aid: value.aid } : {}),
        ...(value.cid ? { cid: value.cid } : {}),
      };
      return stringify(ordered);
    }
    case "mgtv": {
      const value = normalized as MgtvId;
      const ordered = {
        dramaId: value.dramaId,
        ...(value.videoId ? { videoId: value.videoId } : {}),
      };
      return stringify(ordered);
    }
    case "renren": {
      const value = normalized as RenrenId;
      const ordered = {
        dramaId: value.dramaId,
        ...(value.episodeId !== undefined ? { episodeId: value.episodeId } : {}),
      };
      return stringify(ordered);
    }
  }
}
