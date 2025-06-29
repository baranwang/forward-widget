import { unescape as _unescape } from 'lodash-es';
import { WidgetAPI, getStorageItem, setStorageItem } from './utils';

const BASE_URL = 'https://www.xvideos.com';

const widgetAPI = new WidgetAPI(async () => {
  try {
    const sessionToken = await getStorageItem('xvideos.session_token');
    console.log('sessionToken', sessionToken);
    return {
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
    };
  } catch (error) {
    console.error('获取默认配置失败，使用基础配置:', error);
    return {};
  }
});

WidgetMetadata = {
  id: 'xvideos',
  title: 'XVideos',
  description: 'XVideos',
  version: process.env.NODE_ENV === 'development' ? 'development' : process.env.PACKAGE_VERSION,
  requiredVersion: '0.0.1',
  site: 'https://github.com/baranwang/forward-widget',
  detailCacheDuration: 1,
  modules: [
    {
      id: 'xvideos.new',
      title: '最新视频',
      description: 'XVideos 最新视频',
      functionName: 'getNewList',
      params: [
        // {
        //   name: 'region',
        //   title: '地区',
        //   type: 'enumeration',
        //   value: 'cn',
        //   enumOptions: [
        //     { value: 'cn', title: '中国大陆' },
        //     { value: 'id', title: '印度尼西亚' },
        //     { value: 'at', title: '奥地利' },
        //     { value: 'lk', title: '斯里兰卡' },
        //     { value: 'ch', title: '瑞士' },
        //     { value: 'es', title: '西班牙' },
        //     { value: 'dk', title: '丹麦' },
        //     { value: 'gt', title: '危地马拉' },
        //     { value: 've', title: '委内瑞拉' },
        //     { value: 'sg', title: '新加坡' },
        //     { value: 'pe', title: '秘鲁' },
        //     { value: 'vn', title: '越南' },
        //     { value: 'ua', title: '乌克兰' },
        //     { value: 'ec', title: '厄瓜多尔' },
        //     { value: 'bd', title: '孟加拉国' },
        //     { value: 'nz', title: '新西兰' },
        //     { value: 'tn', title: '突尼斯' },
        //     { value: 'az', title: '阿塞拜疆' },
        //     { value: 'ge', title: '乔治亚' },
        //     { value: 'tw', title: '台湾' },
        //     { value: 'pk', title: '巴基斯坦' },
        //     { value: 'jp', title: '日本' },
        //     { value: 'jo', title: '约旦' },
        //     { value: 'af', title: '阿富汗' },
        //     { value: 'il', title: '以色列' },
        //     { value: 'co', title: '哥伦比亚' },
        //     { value: 'br', title: '巴西' },
        //     { value: 'cl', title: '智利' },
        //     { value: 'mm', title: '缅甸' },
        //     { value: 'ar', title: '阿根廷' },
        //     { value: 'iq', title: '伊拉克' },
        //     { value: 'cm', title: '喀麦隆' },
        //     { value: 'gr', title: '希腊' },
        //     { value: 'kh', title: '柬埔寨' },
        //     { value: 'ro', title: '罗马尼亚' },
        //     { value: 'kr', title: '韩国' },
        //     { value: 'ru', title: '俄罗斯' },
        //     { value: 'tz', title: '坦桑尼亚' },
        //     { value: 'de', title: '德国' },
        //     { value: 'be', title: '比利时' },
        //     { value: 'us', title: '美国' },
        //     { value: 'hk', title: '香港' },
        //     { value: 'bg', title: '保加利亚' },
        //     { value: 'eg', title: '埃及' },
        //     { value: 'it', title: '意大利' },
        //     { value: 'fr', title: '法国' },
        //     { value: 'la', title: '老挝' },
        //     { value: 'my', title: '马来西亚' },
        //     { value: 'is', title: '冰岛' },
        //     { value: 'sn', title: '塞内加尔' },
        //     { value: 'lv', title: '拉脱维亚' },
        //     { value: 'pl', title: '波兰' },
        //     { value: 'ke', title: '肯尼亚' },
        //     { value: 'mt', title: '马耳他' },
        //     { value: 'ca', title: '加拿大' },
        //     { value: 'rs', title: '塞尔维亚' },
        //     { value: 'no', title: '挪威' },
        //     { value: 'th', title: '泰国' },
        //     { value: 'fi', title: '芬兰' },
        //     { value: 'lb', title: '黎巴嫩' },
        //     { value: 'hu', title: '匈牙利' },
        //     { value: 'cy', title: '塞浦路斯' },
        //     { value: 'cz', title: '捷克' },
        //     { value: 'au', title: '澳大利亚' },
        //     { value: 'gb', title: '英国' },
        //     { value: 'za', title: '南非' },
        //     { value: 'mx', title: '墨西哥' },
        //     { value: 'md', title: '摩尔多瓦' },
        //     { value: 'ie', title: '爱尔兰' },
        //     { value: 'nl', title: '荷兰' },
        //     { value: 'qa', title: '卡塔尔' },
        //     { value: 'do', title: '多明尼加' },
        //     { value: 'ma', title: '摩洛哥' },
        //     { value: 'bo', title: '玻利维亚' },
        //     { value: 'ph', title: '菲律宾' },
        //     { value: 'in', title: '印度' },
        //     { value: 'ng', title: '奈及利亚' },
        //     { value: 'sk', title: '斯洛伐克' },
        //     { value: 'se', title: '瑞典' },
        //     { value: 'pt', title: '葡萄牙' },
        //   ],
        // },
        {
          name: 'page',
          title: '页码',
          type: 'page',
          value: '0',
        },
      ],
    },
    {
      id: 'xvideos.channel',
      title: '频道',
      description: 'XVideos 频道',
      functionName: 'getChannelList',
      params: [
        {
          name: 'channel',
          title: '频道',
          type: 'input',
          value: '',
          placeholders: [
            { title: 'AsiaM', value: 'asiam' },
            { title: 'AV Jiali', value: 'av-jiali' },
            { title: 'Japanesecreampiesystem717', value: 'japanese_creampie_system717' },
            { title: 'StockingsCat', value: 'stockingscat' },
            { title: 'Japan HDV', value: 'japan-hdv' },
            { title: 'Jav HD', value: 'javhd' },
            { title: 'Caribbeancom', value: 'caribbeancom' },
            { title: 'Hisidepon', value: 'hisidepon' },
            { title: 'Monmon Tw', value: 'monmon_tw' },
            { title: 'MOON FORCE', value: 'moonforce' },
            { title: 'Mya Mya', value: 'myanma_porn' },
            { title: 'Zzzgirlxxx', value: 'zzzgirlxxx' },
            { title: 'Guodong Media', value: 'guodong_media' },
            { title: 'Aipornmix', value: 'aipornmix1' },
            { title: 'YOSUGA', value: 'yosuga' },
            { title: 'Momoka', value: 'japanese31' },
            { title: 'Raptor Inc', value: 'raptor_inc' },
            { title: 'Girls of HEL', value: 'girlsofhel_official' },
            { title: 'Armadillo', value: 'shiroutotv' },
            { title: '1pondo', value: 'ipondo' },
            { title: 'Swaglive', value: 'swaglive' },
            { title: 'NIKSINDIAN', value: 'niks_indian' },
            { title: 'Jimmyreload', value: 'jimmyreload' },
            { title: 'S Cute Official', value: 's-cute-official' },
            { title: 'Zenra', value: 'zenra-subtitled-japanese-av' },
            { title: 'Japaneserxrx', value: 'japaneserxrx' },
            { title: 'Claire0607018', value: 'claire0607018' },
            { title: 'JapBliss', value: 'japbliss' },
            { title: 'Hey Milf', value: 'heymilf' },
            { title: 'Tenshigao', value: 'tenshigao' },
            { title: 'AV 69', value: 'av69tv' },
            { title: 'Ronysworld', value: 'ronysworld' },
            { title: 'Uttaran20', value: 'uttaran20' },
            { title: 'Jukujosukidesu', value: 'jukujosukidesu' },
            { title: 'Schoolgirls HD', value: 'schoolgirlshd' },
            { title: 'Psychoporn Tw', value: 'psychoporn_tw' },
            { title: 'Hotxvip', value: 'hotxvip1' },
            { title: 'Kmib', value: 'k-mib' },
            { title: 'Javhub', value: 'javhub' },
            { title: 'DirectorTONG', value: 'directortong1' },
            { title: 'Toptenxx', value: 'top_tenxxx' },
            { title: 'Kimberlisah', value: 'rapliandae' },
            { title: 'Xx66689', value: 'xx66689' },
            { title: 'Indigosin', value: 'indigo_sin' },
            { title: 'HEYZO', value: 'heyzo-xxx' },
            { title: 'Elle Lee Official', value: 'elle_lee_official' },
            { title: 'MAX-Japanese', value: 'max-japanese' },
            { title: 'Kninebox', value: 'kninebox' },
            { title: 'HotyNitu', value: 'villagefuke1_official' },
            { title: 'Ferame', value: 'ferame' },
            { title: 'Babeneso', value: 'babeneso' },
            { title: 'Yellowgamesbyjason', value: 'yellow_games_by_jason' },
            { title: 'Creampiedaily', value: 'creampiedaily' },
            { title: 'YellowPlum', value: 'yellowplum' },
            { title: 'Pikkur.com', value: 'pikkurcom' },
            { title: 'Hotxcreator', value: 'hotxcreator' },
            { title: 'Kopihitamenak', value: 'kopihitamenak' },
            { title: 'Mistress Land', value: 'mistressland' },
            { title: 'Gogouncensored', value: 'gogouncensored' },
            { title: 'AV Tits', value: 'avtits' },
            { title: 'Peach Japan', value: 'peach_japan' },
            { title: 'Marutahub', value: 'marutahub' },
            { title: 'Neonxvip', value: 'neonxvip' },
            { title: 'Emuyumi Couple', value: 'emuyumi-couple' },
            { title: 'Venna', value: 'venna84' },
            { title: 'Monger In Asia', value: 'monger-in-asia' },
            { title: 'All Japanese Pass', value: 'alljapanesepass' },
            { title: 'Indianxworld', value: 'indianxworld' },
            { title: 'Golupaa', value: 'ratanprem009' },
            { title: 'Riya Bhabhi1', value: 'riya_bhabhi1' },
            { title: 'Horny Indian Couple', value: 'hornyindiancouple' },
            { title: 'AV Stockings', value: 'avstockings' },
            { title: 'Asians Bondage', value: 'asians-bondage' },
            { title: 'sexworld', value: 'sexworld72' },
            { title: 'Eagle MILF', value: 'eagle-milf' },
            { title: 'Nana69', value: 'nana01921' },
            { title: 'Doggy', value: 'doggy2198' },
            { title: 'Netuandhubby', value: 'netu_and_hubby' },
            { title: 'PETERS', value: 'peters-1' },
            { title: 'Osakaporn', value: 'osakaporn' },
          ],
        },
        {
          name: 'page',
          title: '页码',
          type: 'page',
          value: '0',
        },
      ],
    },
    {
      id: 'xvideos.pornstars',
      title: '色情明星',
      description: 'XVideos 色情明星',
      functionName: 'getPornstarsList',
      params: [
        {
          name: 'pornstar',
          title: '色情明星',
          type: 'input',
          placeholders: [
            { title: 'Chicken1806', value: 'chicken18061' },
            { title: 'Momoka', value: 'momoka142' },
            { title: 'Yui Hatano', value: 'yui-hatano-1' },
            { title: 'Rae Lil Black', value: 'rae-lil-black' },
            { title: 'Hushixiaolu', value: 'hushixiaolu2' },
            { title: 'Monmon Tw', value: 'monmon_tw1' },
            { title: 'Emiri Momota', value: 'emiri-momota' },
            { title: 'Mao Hamasaki', value: 'mao-hamasaki' },
            { title: 'Anri Okita', value: 'anri-okita' },
            { title: 'Eimi Fukada', value: 'eimi-fukada' },
            { title: 'Ai Li', value: 'ai-li-model' },
            { title: 'Azumi Miz', value: 'azumi-miz' },
            { title: 'Rei Mizuna', value: 'rei_mizuna' },
            { title: 'Suzu Ichinose', value: 'suzu-ichinose' },
            { title: 'Yuuri Himeno', value: 'yuuri-himeno' },
            { title: 'May Thai', value: 'may-thai' },
            { title: 'Cantika', value: 'cantika259' },
            { title: 'Aimi Yoshikawa', value: 'aimi-yoshikawa' },
            { title: 'Miku Ohashi', value: 'miku-ohashi-1' },
            { title: 'Sudipa', value: 'sudipa20' },
            { title: 'Timepasserby', value: 'timepasserby2' },
            { title: 'Lee Chae Dam', value: 'lee-chae-dam' },
            { title: 'Teju', value: 'teju-model' },
            { title: '李蓉蓉 Li Rong Rong', value: 'li-rong-rong' },
            { title: 'Erika Momotani', value: 'erika-momotani' },
            { title: 'Reiko Kobayakawa', value: 'reiko-kobayakawa' },
            { title: 'Maki Houjo', value: 'maki-houjo' },
            { title: 'Miho Ichiki', value: 'miho-ichiki-model' },
            { title: 'Ai Uehara', value: 'ai-uehara' },
            { title: 'Maron Natsuki', value: 'maron-natsuki' },
            { title: 'Kaori Maeda', value: 'kaori-maeda' },
            { title: 'Sangecrot4', value: 'tika1093' },
            { title: 'Ai Xi', value: 'ai-xi' },
            { title: 'Ranako', value: 'ranako-model' },
            { title: 'Iori Kogawa', value: 'iori-kogawa' },
            { title: 'Rei Kitajima', value: 'rei-kitajima-1' },
            { title: 'Su Chang', value: 'su-chang-model' },
            { title: 'Kana Morisawa', value: 'kana-morisawa' },
            { title: 'Maria Nagai', value: 'maria-nagai' },
            { title: 'Mei Matsumoto', value: 'mei-matsumoto' },
            { title: 'Akari Asagiri', value: 'akari-asagiri' },
            { title: 'Yuu Shinoda', value: 'yuu-shinoda' },
            { title: 'Ren Azumi', value: 'ren-azumi' },
            { title: 'Xiao Ye Ye', value: 'xiao-ye-ye' },
            { title: 'Mitsuki Akai', value: 'marie-konishi' },
            { title: 'Kaede Niiyama', value: 'kaede-niiyama' },
            { title: 'Aoi Shirosaki', value: 'aoi-shirosaki-1' },
            { title: 'Hitomi Tanaka', value: 'hitomi-tanaka' },
            { title: 'Baebi Hel', value: 'baebi-hel' },
            { title: 'Hana Haruna', value: 'haruna-hana' },
            { title: 'Satomi Suzuki', value: 'satomi-suzuki' },
            { title: 'Ruka Kanae', value: 'ruka-kanae' },
            { title: 'Li998', value: 'li998-model' },
            { title: 'Wudalan', value: 'wudalan3' },
            { title: 'Tuna Kimura', value: 'tsuna-kimura' },
            { title: 'Misaki', value: 'misaki467' },
            { title: 'Julia Boin', value: 'julia-kyoka' },
            { title: 'Shathi Khatun', value: 'shathi-khatun1' },
            { title: 'Ruri Saijo', value: 'ruri_saijo_official1' },
            { title: 'Cherrycat', value: 'cherrycat-model' },
            { title: 'Reona Kirishima', value: 'reona-kirishima' },
            { title: 'Emiri Suzuhara', value: 'emiri-suzuhara-1' },
            { title: 'Yua Mikami', value: 'yua-mikami' },
            { title: 'Sisty', value: 'sisty-model' },
            { title: 'Rie Tachikawa', value: 'rie-tachikawa' },
            { title: 'Momoka Nishina', value: 'momoka-nishina-1' },
            { title: 'Una', value: 'pptw2' },
            { title: 'Mia Khalifa', value: 'mia-khalifa-model' },
            { title: 'Emiri Okazaki', value: 'emiri-okazaki' },
            { title: 'Aditi Arya', value: 'aditi-arya-model' },
            { title: 'Marina Yuzuki', value: 'marina-yuzuki' },
            { title: 'Shen Na Na', value: 'shen-na-na' },
            { title: 'Jimmys Model L', value: 'jimmys-model-l' },
            { title: 'Maria Ozawa', value: 'maria-ozawa' },
            { title: 'Nono', value: 'nono13884' },
            { title: 'Sakura Soh', value: 'sakura-soh-model' },
            { title: 'Ichika Matsumoto', value: 'ichika-matsumoto' },
            { title: 'Xia Qing Zi', value: 'xia-qing-zi1' },
            { title: 'Risa Murakami', value: 'risa-murakami' },
            { title: 'Radha786', value: 'radha7862' },
          ],
        },
        {
          name: 'page',
          title: '页码',
          type: 'page',
          value: '0',
        },
      ],
    },
  ],
};

const generateVideoPreviewUrl = (thumbnailUrl: string) => {
  return `${thumbnailUrl
    .substring(0, thumbnailUrl.lastIndexOf('/'))
    .replace(/\/thumbs(169)?(xnxx)?((l*)|(poster))\//, '/videopreview/')
    .replace(/(-[0-9]+)_([0-9]+)/, '_$2$1')}_169.mp4`;
};

const formatUrl = (url: string) => {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }
  return url;
};

interface XVideosItem {
  /** URL */
  u: string;
  /** 缩略图 */
  i: string;
  /** 标题 */
  tf: string;
  /** 标题（缩略） */
  t: string;
  /** 时长 */
  d: string;
}

const formatXVideosItem = (item: XVideosItem): VideoItem => {
  const url = formatUrl(item.u);
  const childItem: VideoItem = {
    id: url,
    type: 'url',
    mediaType: 'movie',
    link: url,
    title: _unescape(item.tf || item.t),
    backdropPath: item.i,
    previewUrl: generateVideoPreviewUrl(item.i),
  };
  return childItem;
};

export async function getNewList(params: { region: string; page: string }) {
  try {
    const currentRegion = await getStorageItem('xvideos.region');
    if (currentRegion !== params.region) {
      setStorageItem('xvideos.region', params.region);
      const resp = await Widget.http.get(`${BASE_URL}/change-country/${params.region}`);
      if (resp.headers['set-cookie']) {
        const cookies = resp.headers['set-cookie'].split(';');
        for (const cookie of cookies) {
          const [key, value] = cookie.split('=');
          if (key === 'session_token') {
            setStorageItem('xvideos.session_token', value);
            break;
          }
        }
      }
    }
  } catch (error) {}

  const page = params.page ? Number.parseInt(params.page) : 0;
  let url = `${BASE_URL}/`;
  if (page > 0) {
    url += `new/${page}`;
  }
  const $ = await widgetAPI.getHtml(url);
  const list = Array.from($('#content .thumb-block:not(.thumb-ad)')).map<VideoItem | null>((el) => {
    const $el = $(el);
    const $title = $el.find('.title a');
    let link = $title.attr('href');
    if (!link) {
      return null;
    }
    link = formatUrl(link);
    const backdropPath = $el.find('.thumb img').attr('data-src');
    const title = $title.text().trim();
    const result: VideoItem = {
      id: link,
      type: 'url',
      mediaType: 'movie',
      link,
      title,
      backdropPath,
    };
    if (backdropPath) {
      result.previewUrl = generateVideoPreviewUrl(backdropPath);
    }
    return result;
  });
  return list.filter((item) => item !== null);
}

export async function getChannelList(params: { channel: string; page: string }) {
  const page = params.page ? Number.parseInt(params.page) : 0;
  try {
    const resp = await widgetAPI.get<{ videos: XVideosItem[] }>(
      `${BASE_URL}/channels/${params.channel}/videos/best/${page}`,
    );
    const list = resp.videos.map(formatXVideosItem);
    return list;
  } catch (error) {
    console.error('频道视频加载失败', error);
    return [];
  }
}

export async function getPornstarsList(params: { pornstar: string; page: string }) {
  const page = params.page ? Number.parseInt(params.page) : 0;
  try {
    const resp = await widgetAPI.get<{ videos: XVideosItem[] }>(
      `${BASE_URL}/pornstars/${params.pornstar}/videos/best/${page}`,
    );
    const list = resp.videos.map(formatXVideosItem);
    return list;
  } catch (error) {
    console.error('色情明星视频加载失败', error);
    return [];
  }
}

const VIDEO_URL_KEYWORDS = ['html5player.setVideoUrlHigh', 'html5player.setVideoHLS', 'html5player.setVideoUrlLow'];

export async function loadDetail(url: string) {
  try {
    const $ = await widgetAPI.getHtml(url);
    const script = $('script').filter((_, el) => {
      const text = $(el).text();
      return VIDEO_URL_KEYWORDS.some((keyword) => text.includes(keyword));
    });
    let videoUrl = '';
    for (const keyword of VIDEO_URL_KEYWORDS) {
      videoUrl = script.text().match(new RegExp(`${keyword}\\('(.*?)'`))?.[1] || '';
      if (videoUrl) {
        break;
      }
    }
    const ldJson = $('script[type="application/ld+json"]').text();
    const ldJsonData = JSON.parse(ldJson);
    videoUrl ||= ldJsonData.contentUrl;

    if (!videoUrl) {
      throw new Error('未找到视频资源');
    }

    const result: VideoItem = {
      id: url,
      type: 'detail',
      mediaType: 'movie',
      link: url,
      videoUrl,
      title: ldJsonData.name,
      description: ldJsonData.description,
      backdropPath: ldJsonData.thumbnailUrl[0],
      releaseDate: ldJsonData.uploadDate,
    };
    try {
      const videoRelated = $('script').filter((_, el) => {
        const text = $(el).text();
        return text.includes('var video_related=');
      });
      const videoRelatedData = videoRelated.text().match(/video_related=\[(.*?)\];/)?.[1];
      if (videoRelatedData) {
        const videoRelatedList = JSON.parse(`[${videoRelatedData}]`);

        result.childItems = videoRelatedList.map(formatXVideosItem);
      }
    } catch (error) {
      console.error('视频相关视频加载失败', error);
    }
    return result;
  } catch (error) {
    console.error('视频详情加载失败', error);
    return null;
  }
}
