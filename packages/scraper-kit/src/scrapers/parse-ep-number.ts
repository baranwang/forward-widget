export const parseEpNumber = (title: string): number | null => {
  if (!title) return null;

  const s = normalizeTitle(title);

  {
    const m = /第\s*([0-9]+)\s*(?:[集话話回期])\s*$/.exec(s);
    if (m) return toInt(m[1]);
  }

  {
    const m = /第\s*([零〇一二两三四五六七八九十百千万萬]+)\s*(?:[集话話回期])\s*$/.exec(s);
    if (m) {
      const n = parseChineseNumeral(m[1]);
      return Number.isFinite(n) ? n : null;
    }
  }

  {
    const m = /S\d{1,3}\s*E(\d{1,4})\s*$/i.exec(s);
    if (m) return toInt(m[1]);
  }

  {
    const m = /EP?\s*0*(\d{1,4})\s*$/i.exec(s);
    if (m) return toInt(m[1]);
  }

  {
    const m = /(?:^|[\s_\-（(【[])\s*0*(\d{1,5})\s*(?:[】\])）])?\s*(?:END|FIN|完|完结)?\s*$/i.exec(s);
    if (m) return toInt(m[1]);
  }

  return null;
};

function normalizeTitle(input: string): string {
  let s = input.trim();
  s = s.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  s = s.replace(/\u3000/g, " ");
  return s;
}

function toInt(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parseChineseNumeral(s: string): number {
  const numMap: Record<string, number> = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  const unitMap: Record<string, number> = {
    十: 10,
    百: 100,
    千: 1000,
    万: 10000,
    萬: 10000,
  };

  let result = 0;
  let section = 0;
  let number = 0;

  for (const ch of s) {
    if (ch in numMap) {
      number = numMap[ch];
    } else if (ch in unitMap) {
      const unit = unitMap[ch];
      if (unit === 10000) {
        section = (section + (number || 0)) * unit;
        result += section;
        section = 0;
      } else {
        section += (number || 1) * unit;
      }
      number = 0;
    }
  }
  return result + section + number;
}
