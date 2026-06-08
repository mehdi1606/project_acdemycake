/**
 * Translation service using the MyMemory API (free, no API key required).
 *   https://api.mymemory.translated.net/get?q={text}&langpair={from}|{to}
 *
 * Free quota: 100 000 characters/day per IP.
 * Supported language codes:  en, fr, ar
 */

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

/**
 * Translate a single text string.
 * @param text  - source text
 * @param from  - source language code (e.g. 'fr', 'ar', 'en')
 * @param to    - target language code
 * @returns translated text, or the original text if the call fails
 */
export async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text?.trim() || from === to) return text;

  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    if (!res.ok) return text;

    const json = await res.json();
    const translated: string = json?.responseData?.translatedText;

    // MyMemory returns "PLEASE SELECT TWO DISTINCT LANGUAGES" on bad pairs
    if (!translated || translated.startsWith('PLEASE SELECT')) return text;
    return translated;
  } catch {
    return text;
  }
}

export type LangCode = 'en' | 'fr' | 'ar';

export interface CourseTranslations {
  /** Stored when source language is AR or FR — so EN switcher has something to show */
  titleEn?: string;
  descriptionEn?: string;
  titleAr?: string;
  titleFr?: string;
  descriptionAr?: string;
  descriptionFr?: string;
}

/**
 * Translate course title + description from the source language into ALL
 * other supported languages (EN / FR / AR).
 *
 * Key fix: when the course is authored in Arabic or French we also produce
 * an English translation (titleEn / descriptionEn) so the EN language
 * switcher always shows meaningful text instead of the raw Arabic/French.
 */
export async function translateCourseContent(
  title: string,
  description: string,
  sourceLang: LangCode,
): Promise<CourseTranslations> {
  const targets: LangCode[] = (['en', 'fr', 'ar'] as LangCode[]).filter(l => l !== sourceLang);

  const results: CourseTranslations = {};

  await Promise.all(
    targets.map(async (target) => {
      const [t, d] = await Promise.all([
        translateText(title, sourceLang, target),
        translateText(description, sourceLang, target),
      ]);

      if (target === 'en') {
        // Only needed when source is AR or FR — stores the English translation
        results.titleEn = t;
        results.descriptionEn = d;
      } else if (target === 'ar') {
        results.titleAr = t;
        results.descriptionAr = d;
      } else if (target === 'fr') {
        results.titleFr = t;
        results.descriptionFr = d;
      }
    }),
  );

  return results;
}

/** Normalise language code from course.language value or i18n locale */
function normaliseLang(raw: string | undefined): 'en' | 'fr' | 'ar' {
  const s = (raw || 'en').toLowerCase().split('-')[0];
  if (s === 'ar' || s === 'arabic')  return 'ar';
  if (s === 'fr' || s === 'french')  return 'fr';
  return 'en';
}

/**
 * Pick the localised title/description for a course based on the current UI language.
 *
 * Resolution order for each UI language:
 *  EN → titleEn (if course was authored in AR/FR) → title (if authored in EN)
 *  AR → titleAr → title (fallback)
 *  FR → titleFr → title (fallback)
 */
export function getLocalizedCourseContent(
  course: {
    title: string;
    description?: string;
    shortDescription?: string;
    language?: string;
    titleEn?: string;
    titleAr?: string;
    titleFr?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    descriptionFr?: string;
  },
  lang: string,
): { title: string; description: string; shortDescription: string } {
  const uiLang   = normaliseLang(lang);
  const baseLang = normaliseLang(course.language);

  const pickTitle = (): string => {
    if (uiLang === 'ar') return course.titleAr || course.title;
    if (uiLang === 'fr') return course.titleFr || course.title;
    // English UI:
    // – if the course was authored in English, `title` already is English
    // – if authored in AR/FR, use the stored English translation
    if (baseLang === 'en') return course.title;
    return course.titleEn || course.title;
  };

  const pickDesc = (): string => {
    if (uiLang === 'ar') return course.descriptionAr || course.description || '';
    if (uiLang === 'fr') return course.descriptionFr || course.description || '';
    if (baseLang === 'en') return course.description || '';
    return course.descriptionEn || course.description || '';
  };

  return {
    title:            pickTitle(),
    description:      pickDesc(),
    shortDescription: course.shortDescription || '',
  };
}
