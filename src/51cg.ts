import { getHtml } from './utils';

const BASE_URL = 'https://51cg1.com';

WidgetMetadata = {
  id: '51cg',
  title: '51吃瓜',
  version: __VERSION__,
  requiredVersion: '0.0.1',
  modules: [
    {
      id: '51cg.list',
      title: '51吃瓜 列表',
      functionName: 'get51cgList',
      params: [
        {
          name: 'base_url',
          title: '网址',
          type: 'input',
          value: BASE_URL,
        },
        {
          name: 'page',
          title: '页码',
          type: 'page',
        },
      ],
    },
  ],
};

async function getList(params: { base_url: string; page: number }) {
  params.base_url ||= BASE_URL;
  params.page ||= 1;
  const $ = await getHtml(`${params.base_url}/page/${params.page}/`);
  const articles = $('[role="main"]').find('article');
  const resules = Array.from(articles).map<VideoItem | null>((el) => {
    const $el = $(el);
    if ($el.find('.post-card-ads').length > 0) {
      return null;
    }
    const url = $el.find('a').attr('href');
    if (!url) {
      return null;
    }
    return {
      id: url,
      type: 'url',
      title: $el.find('.post-card-title').clone().remove('*').text().trim(),
      link: url,
    };
  });
  return resules.filter(Boolean);
}

export async function get51cgList(params: { base_url: string; page: number }) {
  return getList(params);
}

export async function loadDetail(link: string): Promise<VideoItem> {
  const $ = await getHtml(link);
  const videos = $('div[itemprop="articleBody"]').find('.dplayer');
  if (!videos) {
    throw new Error('视频获取失败');
  }
  const videoUrls = Array.from(videos).map((el) => {
    const $el = $(el);
    const config = $el.attr('data-config') || '{}';
    const configData = JSON.parse(config);
    return configData.video.url;
  });
  return {
    type: 'detail',
    id: link,
    title: $('meta[itemprop="headline"]').attr('content') || '',
    link,
    videoUrl: videoUrls[0],
  };
}
