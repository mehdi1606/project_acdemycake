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
  titleAr?: string;
  titleFr?: string;
  descriptionAr?: string;
  descriptionFr?: string;
}

/**
 * Translate course title + description from the source language into all
 * other supported languages (EN / FR / AR).
 * Returns only the fields that differ from the source language.
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

      if (target === 'ar') {
        results.titleAr = t;
        results.descriptionAr = d;
      } else if (target === 'fr') {
        results.titleFr = t;
        results.descriptionFr = d;
      }
      // EN is stored in the base title/description field — no extra column needed
    }),
  );

  return results;
}

/**
 * Pick the localised title/description for a course based on the current UI language.
 * Falls back to the base title/description if no translation exists for that language.
 */
export function getLocalizedCourseContent(
  course: {
    title: string;
    description?: string;
    shortDescription?: string;
    titleAr?: string;
    titleFr?: string;
    descriptionAr?: string;
    descriptionFr?: string;
  },
  lang: string,
): { title: string; description: string; shortDescription: string } {
  const l = lang?.split('-')[0]?.toLowerCase();

  const title =
    l === 'ar' ? course.titleAr || course.title :
    l === 'fr' ? course.titleFr || course.title :
    course.title;

  const description =
    l === 'ar' ? course.descriptionAr || course.description || '' :
    l === 'fr' ? course.descriptionFr || course.description || '' :
    course.description || '';

  return {
    title,
    description,
    shortDescription: course.shortDescription || '',
  };
}
