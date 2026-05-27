import type { ProviderId } from "./provider-id";
import { isProviderName, type ProviderName, providerNames } from "./provider-metadata";
import { createScraperRegistry } from "./scrapers";

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

const scraperMap = createScraperRegistry().scraperMap;

type ProviderUrlScraper<P extends ProviderName> = {
  parseProviderUrl(url: URL): Promise<unknown | null>;
  generateIdString(id: unknown): string;
  parseProviderIdString(idString: string): ProviderId[P];
};

async function parseWithScraper<P extends ProviderName>(
  provider: P,
  parsedUrl: URL,
  url: string,
): Promise<ParsedProviderUrlFor<P> | null> {
  const scraper = scraperMap[provider] as unknown as ProviderUrlScraper<P>;
  const parsedId = await scraper.parseProviderUrl(parsedUrl);
  if (!parsedId) {
    return null;
  }

  const idString = scraper.generateIdString(parsedId);
  const id = scraper.parseProviderIdString(idString);
  return { id, idString, url };
}

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
  } catch (error) {
    void error;
    return null;
  }

  return parseWithScraper(provider, parsedUrl, url);
}
