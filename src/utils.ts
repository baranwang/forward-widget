export async function getHtml(url: string) {
  const resp = await Widget.http.get<string>(url, {
    headers: {
      'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7',
    },
  });
  if (!resp || resp.statusCode !== 200) {
    throw new Error('获取数据失败');
  }

  return Widget.html.load(resp.data);
}
