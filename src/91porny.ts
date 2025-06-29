import type { CheerioAPI } from 'cheerio';
import { getHtml } from './utils';

const DEFAULT_BASE_URL = 'https://91porny.com';

const generateParams = (module: WidgetModule, categoryEnum: WidgetModuleParam['enumOptions']): WidgetModule => {
  return {
    cacheDuration: 3600,
    requiresWebView: false,
    ...module,
    params: [
      {
        name: 'sort_by',
        title: '分类',
        description: '分类',
        type: 'enumeration',
        value: categoryEnum?.[0]?.value || '',
        enumOptions: categoryEnum,
      },
      {
        name: 'page',
        title: '页码',
        type: 'page',
        value: '1',
      },
      {
        name: 'base_url',
        title: '基础 URL',
        type: 'input',
        value: DEFAULT_BASE_URL,
      },
    ],
  };
};

WidgetMetadata = {
  id: '91porny',
  title: '91Porny',
  description: '91Porny',
  version: process.env.NODE_ENV === 'development' ? 'development' : process.env.PACKAGE_VERSION,
  requiredVersion: '0.0.1',
  site: 'https://github.com/baranwang/forward-widget',
  detailCacheDuration: 1,
  modules: [
    generateParams(
      {
        id: '91porny.video',
        title: '91Porn 视频',
        description: '获取 91Porn 视频列表',
        functionName: 'get91List',
      },
      [
        { value: 'latest', title: '最近更新' },
        { value: 'hd', title: '高清视频' },
        { value: 'recent-favorite', title: '最近加精' },
        { value: 'hot-list', title: '当前最热' },
        { value: 'recent-rating', title: '最近得分' },
        { value: 'nonpaid', title: '非付费' },
        { value: 'ori', title: '91原创' },
        { value: 'long-list', title: '10分钟以上' },
        { value: 'longer-list', title: '20分钟以上' },
        { value: 'month-discuss', title: '本月讨论' },
        { value: 'top-favorite', title: '本月收藏' },
        { value: 'most-favorite', title: '收藏最多' },
        { value: 'top-list', title: '本月最热' },
        { value: 'top-last', title: '上月最热' },
      ],
    ),
    generateParams(
      {
        id: '91porny.videos',
        title: '蝌蚪窝视频',
        description: '获取蝌蚪窝视频列表',
        functionName: 'getKedouList',
      },
      [
        { value: 'chinese', title: '国产' },
        { value: 'europe-america', title: '欧美' },
        { value: 'fornication', title: '乱伦' },
        { value: 'japan-korea', title: '日韩' },
        { value: 'anime', title: '动漫' },
        { value: 'homosexual', title: '同性' },
        { value: 'hd', title: '高清AV' },
        { value: 'sm', title: 'SM专区' },
        { value: 'jijin', title: '片商集锦' },
        { value: 'guodong', title: '果冻传媒' },
        { value: 'xingkong', title: '星空传媒' },
        { value: 'madou', title: '麻豆传媒' },
        { value: 'tianmei', title: '天美传媒' },
        { value: 'jingdong', title: '精东影业' },
        { value: 'swag', title: '台湾SWAG' },
        { value: 'tuzi', title: '兔子先生' },
        { value: 'mitao', title: '蜜桃传媒' },
        { value: 'huangjia', title: '皇家华人' },
      ],
    ),
    generateParams(
      {
        id: '91porny.vod',
        title: '精选视频',
        description: '获取精选视频列表',
        functionName: 'getVodList',
      },
      [
        { value: '', title: '最新视频' },
        { value: '原创', title: '原创' },
        { value: '转发', title: '转发' },
        { value: '赞助', title: '赞助' },
      ],
    ),
  ],
  search: {
    title: '91Porny 搜索',
    functionName: 'search',
    params: [
      {
        name: 'keyword',
        title: '关键词',
        type: 'input',
        description: '搜索的关键词',
        value: '',
      },
      {
        name: 'page',
        title: '页码',
        type: 'page',
        value: '1',
      },
      {
        name: 'base_url',
        title: '基础 URL',
        type: 'input',
        value: DEFAULT_BASE_URL,
      },
    ],
  },
};

function getVideoList($: CheerioAPI, base_url = DEFAULT_BASE_URL): VideoItem[] {
  const list = Array.from($('.video-elem')).map<VideoItem | null>((el) => {
    const $el = $(el);
    let link = $el.find('a').attr('href');
    if (!link) {
      console.debug('跳过没有链接的元素');
      return null;
    }
    if (link.startsWith('/')) {
      link = `${base_url}${link}`;
    } else {
      console.debug('跳过广告');
      return null;
    }
    const backdropPath = $el
      .find('.img')
      .attr('style')
      ?.match(/url\(['"]?(.*?)['"]?\)/)?.[1]
      ?.replace(/^\/\//, 'https://');

    const result: VideoItem = {
      id: link,
      type: 'url',
      mediaType: 'movie',
      link,
      title: $el.find('.title').text().trim(),
      backdropPath,
    };

    try {
      result.durationText = $el.find('.layer').text().trim();
    } catch (error) {}

    return result;
  });

  return list.filter((item): item is VideoItem => Boolean(item));
}

export async function get91List(params: { sort_by: string; page: number; base_url: string }) {
  params.sort_by ||= 'latest';
  params.page ||= 1;
  params.base_url ||= DEFAULT_BASE_URL;
  try {
    const $ = await getHtml(`${params.base_url}/video/category/${params.sort_by}/${params.page}`);
    return getVideoList($, params.base_url);
  } catch (error) {
    console.error('视频列表加载失败', error);
    return [];
  }
}

export async function getKedouList(params: { sort_by: string; page: number; base_url: string }) {
  params.sort_by ||= 'chinese';
  params.page ||= 1;
  params.base_url ||= DEFAULT_BASE_URL;
  try {
    const $ = await getHtml(`${params.base_url}/videos/categories/${params.sort_by}/${params.page}`);
    return getVideoList($, params.base_url);
  } catch (error) {
    console.error('视频列表加载失败', error);
    return [];
  }
}

export async function getVodList(params: { sort_by: string; page: number; base_url: string }) {
  params.sort_by ||= '';
  params.page ||= 1;
  params.base_url ||= DEFAULT_BASE_URL;
  try {
    let url = `${params.base_url}/vod`;
    if (params.sort_by) {
      url += `/${params.sort_by}`;
    }
    url += `?page=${params.page}`;
    const $ = await getHtml(url);
    return getVideoList($, params.base_url);
  } catch (error) {
    console.error('视频列表加载失败', error);
    return [];
  }
}

export async function loadDetail(url: string) {
  try {
    let realUrl = url;
    if (realUrl.includes('/viewhd/')) {
      realUrl = realUrl.replace('/viewhd/', '/view/');
    }
    const $ = await getHtml(realUrl);
    const video = $('#video-play');
    const videoUrl = video.attr('data-src')?.replace('&amp;', '&');
    if (!videoUrl) {
      throw new Error('未找到视频资源');
    }
    const result: VideoItem = {
      id: url,
      type: 'detail',
      mediaType: 'movie',
      link: url,
      title: $('meta[property="og:title"]').attr('content')?.trim() || '',
      releaseDate: $('meta[property="video:release_date"]').attr('content')?.trim() || '',
      backdropPath: video.attr('data-poster'),
      videoUrl,
    };

    try {
      result.childItems = getVideoList($);
    } catch (error) {}

    return result;
  } catch (error) {
    console.error('视频详情加载失败', error);
    return null;
  }
}

export async function search(params: { keyword: string; page: number; base_url: string }) {
  params.keyword ||= '';
  params.page ||= 1;
  params.base_url ||= DEFAULT_BASE_URL;
  try {
    const $ = await getHtml(`${params.base_url}/search?keywords=${params.keyword}&page=${params.page}`);
    return getVideoList($, params.base_url);
  } catch (error) {
    console.error('视频列表加载失败', error);
    return [];
  }
}
