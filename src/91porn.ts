import urlParse from 'url-parse';

WidgetMetadata = {
  id: '91porn',
  title: '91Porn',
  version: __VERSION__,
  requiredVersion: '0.0.1',
  modules: [
    {
      id: '91porn.list',
      title: '91porn 列表',
      functionName: 'get91pornList',
      params: [
        {
          name: 'category',
          title: '分类',
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

class Widget91Porn {
  readonly BASE_URL = 'https://91porn.com';

  async getList(params: { category: string; page: number }) {
    const html = await this.fetch<string>(
      `${this.BASE_URL}/v.php?category=${params.category}&viewtype=basic&page=${params.page}`,
    );
    const $ = Widget.html.load(html);
    const videos = $('.videos-text-align');
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

    const results = await Promise.all(
      list
        .filter((item): item is string => Boolean(item))
        .map((item) => this.getDetailInfo(item)),
    );
    return results.filter(Boolean);
  }

  async getDetailInfo(id: string, withVideoUrl = false) {
    const url = `${this.BASE_URL}/view_video.php?viewkey=${id}`;
    const html = await this.fetch<string>(url);
    const $ = Widget.html.load(html);
    const player = $('#player_one');
    const script = player.find('script').text();
    const sourceHtml = decodeURIComponent(
      script.match(/strencode2\("(.*?)"\)/)?.[1] || '',
    );
    const useraction = $('#useraction');
    const result: VideoItem = {
      id: url,
      type: 'url',
      link: url,
      title: $('#videodetails h4').first().text().trim(),
      backdropPath: player.attr('poster'),
      durationText: $('.duration').text(),
    };
    const duration = useraction
      .find('.info')
      .filter((_, el) => $(el).text().includes('时长'))
      .find('.video-info-span')
      .text()
      .trim();
    if (duration) {
      result.durationText = duration;
    }
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
            const videoUrl = `${this.BASE_URL}/view_video.php?viewkey=${id}`;
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

  private async fetch<T>(url: string) {
    const resp = await Widget.http.get<T>(url, {
      headers: {
        'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7',
      },
    });
    if (!resp || resp.statusCode !== 200) {
      throw new Error('获取数据失败');
    }
    return resp.data;
  }
}

const widget91Porn = new Widget91Porn();

export async function get91pornList(params: {
  category: string;
  page: number;
}) {
  return widget91Porn.getList(params);
}

export async function loadDetail(link: string) {
  const urlObj = urlParse(link, true);
  if (
    urlObj.hostname === urlParse(widget91Porn.BASE_URL).hostname &&
    urlObj.query.viewkey
  ) {
    const result = await widget91Porn.getDetailInfo(urlObj.query.viewkey, true);
    if (!result) {
      throw new Error('获取视频详情失败');
    }
    return result;
  }
}
