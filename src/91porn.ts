import { getHtml } from './utils';

const DEFAULT_BASE_URL = 'https://91porn.com';

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
      functionName: 'getList',
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
        {
          name: 'base_url',
          title: '基础 URL',
          type: 'input',
          value: DEFAULT_BASE_URL,
        },
      ],
    },
  ],
};

export async function getList(params: { category: string; page: number; base_url: string }) {
  params.category ||= 'ori';
  params.page ||= 1;
  params.base_url ||= DEFAULT_BASE_URL;
  try {
    const $ = await getHtml(`${params.base_url}/v.php?category=${params.category}&viewtype=basic&page=${params.page}`);

    const list = Array.from($('.videos-text-align')).map<VideoItem | null>((el) => {
      const $el = $(el);
      const $parent = $el.closest('.col-lg-8');
      if ($parent.length > 0) {
        console.debug('跳过蜜罐');
        return null;
      }
      const link = $el.find('a').attr('href');
      if (!link) {
        console.debug('跳过没有链接的元素');
        return null;
      }

      const backdropPath = $el.find('.img-responsive').attr('src');

      const result: VideoItem = {
        id: link,
        type: 'url',
        link,
        title: $el.find('.video-title').text().trim(),
        backdropPath,
      };

      try {
        result.durationText = $el.find('.duration').text().trim();
      } catch (error) {}

      try {
        const videoID = backdropPath?.split('/').pop()?.split('.').shift();
        if (videoID) {
          result.previewUrl = `https://vthumb.killcovid2021.com/thumb/${videoID}.mp4`;
        }
      } catch (error) {}

      try {
        const addTimeEl = $el.find('.info').filter((_, el) => $(el).text().includes('添加时间'));
        const nextSibling = addTimeEl[0]?.nextSibling;
        const addTime = nextSibling && 'textContent' in nextSibling ? nextSibling.textContent : undefined;
        if (addTime && typeof addTime === 'string') {
          result.releaseDate = addTime.trim();
        }
      } catch (error) {}

      return result;
    });

    return list.filter((item): item is VideoItem => Boolean(item));
  } catch (error) {
    console.error('视频列表加载失败', error);
    return [];
  }
}

export async function loadDetail(url: string) {
  try {
    const $ = await getHtml(url);
    const player = $('#player_one');
    const script = player.find('script').text();
    const sourceHtml = decodeURIComponent(script.match(/strencode2\("(.*?)"\)/)?.[1] || '');
    const $source = Widget.html.load(sourceHtml);
    const videoUrl = $source('source').attr('src');
    if (!videoUrl) {
      throw new Error('未找到视频资源');
    }
    const result: VideoItem = {
      id: url,
      type: 'detail',
      link: url,
      title: $('#videodetails h4').first().text().trim(),
      backdropPath: player.attr('poster'),
      videoUrl,
    };
    try {
      const duration = $('#useraction')
        .find('.info')
        .filter((_, el) => $(el).text().includes('时长'))
        .find('.video-info-span')
        .text()
        .trim();
      if (duration) {
        result.durationText = duration;
      }
    } catch (error) {}

    try {
      const releaseDate = $('.title-yakov').eq(0).text();
      if (releaseDate) {
        result.releaseDate = releaseDate;
      }
    } catch (error) {}

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

    try {
      result.childItems = Array.from($('.well'))
        .map((el) => {
          const $el = $(el);
          const link = $el.find('a').attr('href');
          if (!link) {
            return null;
          }
          const title = $el.find('.video-title').text().trim();
          const durationText = $el.find('.duration').text().trim();
          return {
            id: link,
            type: 'url',
            link: link,
            title,
            durationText,
            backdropPath: $el.find('.img-responsive').attr('src'),
          } as VideoItem;
        })
        .filter((item): item is VideoItem => Boolean(item));
    } catch (error) {}

    return result;
  } catch (error) {
    console.error('视频详情加载失败', error);
    return null;
  }
}
