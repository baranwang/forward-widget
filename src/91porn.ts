import pLimit from 'p-limit';
import urlParse from 'url-parse';
import { getHtml } from './utils';

WidgetMetadata = {
  id: '91porn',
  title: '91Porn',
  description: '获取 91Porn 列表/视频',
  version: process.env.NODE_ENV === 'development' ? 'development' : process.env.PACKAGE_VERSION,
  requiredVersion: '0.0.1',
  site: 'https://github.com/baranwang/forward-widget',
  modules: [
    {
      id: '91porn.list',
      title: '91Porn 列表',
      functionName: 'get91pornList',
      params: [
        {
          name: 'category',
          title: '分类',
          description: '分类',
          type: 'enumeration',
          value: 'rf',
          enumOptions: [
            { value: 'ori', title: '91原创' },
            { value: 'hot', title: '当前最热' },
            { value: 'top', title: '本月最热' },
            { value: 'long', title: '10分钟以上 ' },
            { value: 'longer', title: '20分钟以上 ' },
            { value: 'tf', title: '本月收藏' },
            { value: 'rf', title: '最近加精' },
            { value: 'hd', title: '高清' },
            { value: 'top', title: '每月最热' },
            { value: 'md', title: '本月讨论' },
            { value: 'mf', title: ' 收藏最多' },
          ],
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

const BASE_URL = 'https://91porn.com';

async function getList(params: { category: string; page: number }) {
  const $ = await getHtml(`${BASE_URL}/v.php?category=${params.category}&viewtype=basic&page=${params.page}`);
  const videos = $('.videos-text-align');

  // 列表的数据不知道为什么图文和视频是对不上的，所有这里只获取视频ID，然后去详情页获取视频信息
  const list = Array.from(videos).map((el) => {
    const $el = $(el);
    const url = $el.find('a').attr('href');
    if (!url) {
      return null;
    }
    const id = urlParse(url, true).query.viewkey;
    if (!id) {
      return null;
    }
    return id;
  });

  const limit = pLimit(5);
  const results = await Promise.all(
    list.filter((item): item is string => Boolean(item)).map((item) => limit(() => getDetailInfo(item))),
  );
  return results.filter((item): item is VideoItem => Boolean(item));
}

async function getDetailInfo(id: string, withVideoUrl = false) {
  const url = `${BASE_URL}/view_video.php?viewkey=${id}`;
  const $ = await getHtml(url);
  const player = $('#player_one');
  const script = player.find('script').text();
  const sourceHtml = decodeURIComponent(script.match(/strencode2\("(.*?)"\)/)?.[1] || '');
  const result: VideoItem = {
    id: url,
    type: 'url',
    link: url,
    title: $('#videodetails h4').first().text().trim(),
    backdropPath: player.attr('poster'),
  };
  const duration = $('#useraction')
    .find('.info')
    .filter((_, el) => $(el).text().includes('时长'))
    .find('.video-info-span')
    .text()
    .trim();
  if (duration) {
    result.durationText = duration;
  }
  const releaseDate = $('.title-yakov').eq(0).text();
  if (releaseDate) {
    result.releaseDate = releaseDate;
  }
  try {
    const description = Widget.html
      .load(
        $('#v_desc')
          .html()!
          .replace(/<br\s*\/?>/g, '\n'),
      )
      .text();
    if (description) {
      result.description = description;
    }
  } catch (error) {}
  if (withVideoUrl) {
    const $source = Widget.html.load(sourceHtml);
    const source = $source('source').attr('src');
    if (!source) {
      return null;
    }
    result.videoUrl = source;
    result.type = 'detail';
    try {
      result.childItems = Array.from($('.well'))
        .map((el) => {
          const $el = $(el);
          const url = $el.find('a').attr('href');
          if (!url) {
            return null;
          }
          const id = urlParse(url, true).query.viewkey;
          const videoUrl = `${BASE_URL}/view_video.php?viewkey=${id}`;
          const title = $el.find('.video-title').text().trim();
          const durationText = $el.find('.duration').text().trim();
          return {
            id: videoUrl,
            type: 'url',
            link: videoUrl,
            title,
            durationText,
            backdropPath: $el.find('img').attr('src'),
          } as VideoItem;
        })
        .filter((item): item is VideoItem => Boolean(item));
    } catch (error) {}
  }
  return result;
}

export async function get91pornList(params: {
  category: string;
  page: number;
}) {
  return getList(params);
}

export async function loadDetail(link: string) {
  const urlObj = urlParse(link, true);
  const viewkey = urlObj.query.viewkey;
  if (!viewkey) {
    throw new Error('URL 错误');
  }
  const result = await getDetailInfo(viewkey, true);
  if (!result) {
    throw new Error('获取视频详情失败');
  }
  return result;
}
