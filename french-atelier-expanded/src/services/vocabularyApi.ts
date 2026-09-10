import type {Level, Vocabulary} from '../types';
import {vocabulary as localVocabulary} from '../data/content';

const COMMUNITY_BASE = 'https://raw.githubusercontent.com/Talhakasikci/cefr-vocabulary-dataset/main/vocab_json';
const FREQ_URL = 'https://gist.githubusercontent.com/cofinley/262765821e4defbc8ff2bdb3356a853b/raw/frequency.txt';
const LEVELS: Level[] = ['A1','A2','B1','B2','C1'];
const TARGET_PER_LEVEL = 1000;

export type VocabularyEntry = Vocabulary & {
  sourceLabel: string;
  frequencyRank?: number;
  genderInfo?: string;
};

type CommunityRow = {
  id: string;
  lemma: string;
  language: string;
  cefr_level: string;
  pos?: string | null;
  ipa?: string | null;
  definition_target?: string | null;
  audio_url?: string | null;
};

type DictionaryResult = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{text?: string; audio?: string}>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{definition?: string; example?: string}>
  }>;
};
type WiktEntry = {
  word?: string;
  lang?: string;
  lang_code?: string;
  pos?: string;
  tags?: string[];
  senses?: Array<{glosses?: string[]; examples?: Array<{text?: string}>; tags?: string[]}>;
  sounds?: Array<{ipa?: string; audio?: string}>;
  translations?: Array<{lang_code?: string; code?: string; word?: string; sense?: string}>;
};
type WiktResult = {entries?: WiktEntry[]};

const cacheKey = (key: string) => `fr-${key}`;
const safeJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
};
const putJson = (key: string, value: unknown) => {
  try { localStorage.setItem(cacheKey(key), JSON.stringify(value)); } catch { /* storage may be full */ }
};

const hash = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  return 100000 + Math.abs(h);
};

function guessGenderVariant(word: string, pos: string): string | undefined {
  const lower = pos.toLowerCase();
  if (!lower.includes('adj') && !lower.includes('adject') && !lower.includes('nom') && !lower.includes('noun')) return undefined;
  const pairs: Record<string,string> = {
    acteur:'actrice', ami:'amie', ancien:'ancienne', blanc:'blanche', beau:'belle', bon:'bonne', canadien:'canadienne', certain:'certaine', complet:'complète', court:'courte', dernier:'dernière', doux:'douce', entier:'entière', européen:'européenne', étranger:'étrangère', heureux:'heureuse', inquiet:'inquiète', jaloux:'jalouse', long:'longue', mauvais:'mauvaise', national:'nationale', nouveau:'nouvelle', premier:'première', prêt:'prête', sérieux:'sérieuse', sportif:'sportive', vieux:'vieille', voisin:'voisine', vieux:'vieille', gentil:'gentille', gros:'grosse', gros:'grosse', français:'française', japonais:'japonaise', italien:'italienne', espagnol:'espagnole', vietnamien:'vietnamienne'
  };
  if (pairs[word.toLowerCase()]) return `Féminin : ${pairs[word.toLowerCase()]}`;
  if (lower.includes('adj')) {
    if (word.endsWith('eux')) return `Féminin probable : ${word.slice(0,-3)}euse`;
    if (word.endsWith('if')) return `Féminin probable : ${word.slice(0,-2)}ive`;
    if (word.endsWith('ien')) return `Féminin probable : ${word}ne`;
    if (word.endsWith('er')) return `Féminin probable : ${word.slice(0,-2)}ère`;
    if (word.endsWith('el')) return `Féminin probable : ${word}le`;
  }
  return undefined;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {headers: {'Accept': 'application/json'}});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchFrequency(): Promise<string[]> {
  const cached = safeJson<string[]>('frequency-5000');
  if (cached?.length) return cached;
  const res = await fetch(FREQ_URL);
  if (!res.ok) throw new Error(`Frequency HTTP ${res.status}`);
  const text = await res.text();
  const words = text.split(/\r?\n/).map(line => line.replace(/^\s*\|\s*/, '').trim()).filter(Boolean);
  putJson('frequency-5000', words);
  return words;
}

const localSeed = (level: Level) => {
  const source = safeJson<Vocabulary[]>(`seed-${level}`) || [];
  return source.map((v) => ({...v, sourceLabel: 'Dữ liệu có sẵn'} as VocabularyEntry));
};

function rowToEntry(row: CommunityRow): VocabularyEntry {
  const id = hash(`${row.cefr_level}-${row.lemma}-${row.pos ?? ''}`);
  const pos = (row.pos ?? 'word').toString();
  return {
    id,
    level: row.cefr_level as Level,
    topic: 'Kho mở rộng',
    word: row.lemma,
    pos,
    ipa: row.ipa || 'Tra từ điển',
    meaning: row.definition_target || 'Đang lấy nghĩa tiếng Việt…',
    example: '',
    translation: '',
    sourceLabel: 'CEFR Vocabulary Dataset',
    genderInfo: guessGenderVariant(row.lemma, pos),
  };
}

async function fetchCommunityLevel(level: Level): Promise<VocabularyEntry[]> {
  if (!LEVELS.includes(level)) return [];
  const key = `community-${level}`;
  const cached = safeJson<VocabularyEntry[]>(key);
  if (cached?.length) return cached;
  try {
    const rows = await fetchJson<CommunityRow[]>(`${COMMUNITY_BASE}/fr-${level}.json`);
    const entries = rows.filter(r => r?.lemma).map(rowToEntry);
    putJson(key, entries);
    return entries;
  } catch {
    return [];
  }
}

export async function getVocabulary(level: Level): Promise<VocabularyEntry[]> {
  const local = vocabularySeed(level);
  if (level === 'A0') return local;
  const [community, frequency] = await Promise.all([fetchCommunityLevel(level), fetchFrequency().catch(() => [])]);
  const byWord = new Map<string, VocabularyEntry>();
  for (const entry of [...community, ...local]) byWord.set(entry.word.toLowerCase(), entry);

  // CEFR-labelled entries are preferred. Frequency data fills the minimum 1,000-word target.
  const levelEntries = community.slice();
  if (frequency.length) {
    const desiredStart = (LEVELS.indexOf(level)) * TARGET_PER_LEVEL;
    const desiredWords = frequency.slice(desiredStart, desiredStart + TARGET_PER_LEVEL);
    desiredWords.forEach((word, index) => {
      const key = word.toLowerCase();
      if (!byWord.has(key) && levelEntries.length < TARGET_PER_LEVEL) {
        levelEntries.push({
          id: hash(`${level}-freq-${key}`),
          level,
          topic: 'Từ thông dụng',
          word,
          pos: 'từ vựng',
          ipa: 'Tra từ điển',
          meaning: 'Nhấn “Tra từ điển” để lấy nghĩa Việt',
          example: `J’apprends le mot « ${word} ».`,
          translation: '',
          sourceLabel: 'French frequency list',
          frequencyRank: desiredStart + index + 1,
        });
        byWord.set(key, levelEntries[levelEntries.length - 1]);
      }
    });
  }
  const result = [...levelEntries, ...local.filter(v => !byWord.has(v.word.toLowerCase()))].slice(0, Math.max(TARGET_PER_LEVEL, 1000));
  return result;
}

// Kept separate so the app still has a useful offline A0 experience.
function vocabularySeed(level: Level): VocabularyEntry[] {
  return localVocabulary.filter(v => v.level === level).map(v => ({...v, sourceLabel: 'Dữ liệu mẫu'}));
}

export async function enrichVocabulary(entry: VocabularyEntry): Promise<VocabularyEntry> {
  const key = `dictionary-${entry.word.toLowerCase()}`;
  const cached = safeJson<VocabularyEntry>(key);
  if (cached) return {...entry, ...cached};

  let enriched: VocabularyEntry = {...entry};
  try {
    // WiktApi exposes structured French Wiktionary data (IPA, POS, definitions, forms).
    const wikt = await fetchJson<WiktResult>(`https://api.wiktapi.dev/v1/fr/word/${encodeURIComponent(entry.word)}?lang=fr`);
    const hit = wikt.entries?.find(item => item.lang_code === 'fr') || wikt.entries?.[0];
    const sense = hit?.senses?.find(x => x.glosses?.length) || hit?.senses?.[0];
    const ipa = hit?.sounds?.find(x => x.ipa)?.ipa || entry.ipa;
    const definition = sense?.glosses?.[0] || entry.meaning;
    const example = sense?.examples?.find(x => x.text)?.text || entry.example;
    const genderTag = [...(hit?.tags || []), ...(sense?.tags || [])].find(tag => /masculin|f[ée]minin/i.test(tag));
    const wiktTranslation = hit?.translations?.find(x => x.lang_code === 'vi' || x.code === 'vi')?.word || '';
    enriched = {
      ...entry,
      ipa,
      pos: hit?.pos || entry.pos,
      meaning: wiktTranslation || definition,
      example,
      translation: wiktTranslation || entry.translation,
      sourceLabel: 'WiktApi / Wiktionary',
      genderInfo: genderTag ? `${genderTag}` : guessGenderVariant(entry.word, hit?.pos || entry.pos) || entry.genderInfo,
    };
  } catch {
    try {
      // Fallback for entries unavailable in WiktApi.
      const data = await fetchJson<DictionaryResult[]>(`https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(entry.word)}`);
      const first = data?.[0];
      const ipa = first?.phonetic || first?.phonetics?.find(p => p.text)?.text || entry.ipa;
      const meaning = first?.meanings?.[0]?.definitions?.[0]?.definition || entry.meaning;
      const pos = first?.meanings?.[0]?.partOfSpeech || entry.pos;
      const example = first?.meanings?.[0]?.definitions?.find(d => d.example)?.example || entry.example;
      enriched = {...entry, ipa, pos, meaning, example, sourceLabel: 'Free Dictionary API'};
    } catch {
      return entry;
    }
  }

  // Translate the French definition to Vietnamese when the dictionary does not provide a Vietnamese gloss.
  if (enriched.meaning && enriched.translation === entry.translation) {
    try {
      const tr = await fetchJson<{responseData?: {translatedText?: string}}>(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(enriched.meaning.slice(0, 400))}&langpair=fr|vi`);
      const vi = tr.responseData?.translatedText || '';
      if (vi) enriched = {...enriched, translation: vi};
    } catch { /* keep French definition when translation is unavailable */ }
  }
  putJson(key, enriched);
  return enriched;
}
