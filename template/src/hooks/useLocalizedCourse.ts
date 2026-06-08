/**
 * useLocalizedCourse
 *
 * Returns course title/description in the active UI language.
 *
 * Resolution order:
 *  1. DB-stored translation (titleEn / titleAr / titleFr)     → instant
 *  2. localStorage cache from a previous auto-translation       → instant
 *  3. Live call to the MyMemory API (free, no key)              → async, ~500 ms
 *  4. Fallback: original title/description                       → always available
 *
 * Once translated, the result is cached in localStorage under the key
 *   slw_trans_{courseId}_{lang}
 * so subsequent language switches are instant.
 */

import { useState, useEffect, useRef } from 'react';
import { translateText } from '../services/api/translation.service';

const LS_PREFIX = 'slw_trans_';

// ── helpers ──────────────────────────────────────────────────────────────────

type Lang = 'en' | 'fr' | 'ar';

function normLang(raw?: string): Lang {
  const s = (raw || 'fr').toLowerCase().split('-')[0];
  if (s === 'ar' || s === 'arabic')  return 'ar';
  if (s === 'fr' || s === 'french')  return 'fr';
  return 'en';
}

export interface LocalizedContent {
  title: string;
  description: string;
  shortDescription: string;
}

export interface LocalizableCourse {
  id: string;
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
}

/** Check whether a DB-stored translation covers the requested language. */
function getDbTranslation(
  course: LocalizableCourse,
  uiLang: Lang,
): LocalizedContent | null {
  const baseLang = normLang(course.language);

  // No translation needed — source language matches UI language
  if (baseLang === uiLang) {
    return {
      title:            course.title,
      description:      course.description      || '',
      shortDescription: course.shortDescription || '',
    };
  }

  if (uiLang === 'en' && course.titleEn) {
    return {
      title:            course.titleEn,
      description:      course.descriptionEn    || course.description      || '',
      shortDescription: course.shortDescription || '',
    };
  }
  if (uiLang === 'ar' && course.titleAr) {
    return {
      title:            course.titleAr,
      description:      course.descriptionAr    || course.description      || '',
      shortDescription: course.shortDescription || '',
    };
  }
  if (uiLang === 'fr' && course.titleFr) {
    return {
      title:            course.titleFr,
      description:      course.descriptionFr    || course.description      || '',
      shortDescription: course.shortDescription || '',
    };
  }

  return null; // translation not yet stored in DB
}

function readCache(courseId: string, uiLang: Lang): LocalizedContent | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${courseId}_${uiLang}`);
    if (raw) return JSON.parse(raw) as LocalizedContent;
  } catch { /* ignore */ }
  return null;
}

function writeCache(courseId: string, uiLang: Lang, data: LocalizedContent): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${courseId}_${uiLang}`, JSON.stringify(data));
  } catch { /* storage full — ignore */ }
}

function fallback(course: LocalizableCourse): LocalizedContent {
  return {
    title:            course.title,
    description:      course.description      || '',
    shortDescription: course.shortDescription || '',
  };
}

// ── hook ─────────────────────────────────────────────────────────────────────

/**
 * @param course  - course object (may be null/undefined during loading)
 * @param lang    - active i18n language (e.g. 'en', 'ar', 'fr')
 */
export function useLocalizedCourse(
  course: LocalizableCourse | null | undefined,
  lang: string,
): LocalizedContent {
  const uiLang = normLang(lang);

  // Compute the best available content synchronously for the initial render
  const computeInitial = (): LocalizedContent => {
    if (!course) return { title: '', description: '', shortDescription: '' };
    return (
      getDbTranslation(course, uiLang) ??
      readCache(course.id, uiLang)      ??
      fallback(course)
    );
  };

  const [content, setContent] = useState<LocalizedContent>(computeInitial);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    if (!course) {
      setContent({ title: '', description: '', shortDescription: '' });
      return;
    }

    // 1. DB-stored translation
    const db = getDbTranslation(course, uiLang);
    if (db) { setContent(db); return; }

    // 2. localStorage cache
    const cached = readCache(course.id, uiLang);
    if (cached) { setContent(cached); return; }

    // 3. Show original while the async translation loads
    setContent(fallback(course));

    const baseLang = normLang(course.language);

    // Strip HTML tags, limit to 500 chars (MyMemory free limit)
    const rawDesc = (course.description || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 500);

    (async () => {
      try {
        const [translatedTitle, translatedDesc] = await Promise.all([
          translateText(course.title, baseLang, uiLang),
          rawDesc ? translateText(rawDesc, baseLang, uiLang) : Promise.resolve(''),
        ]);

        if (cancelRef.current) return;

        const result: LocalizedContent = {
          title:            translatedTitle,
          description:      translatedDesc,
          shortDescription: course.shortDescription || '',
        };

        writeCache(course.id, uiLang, result);
        setContent(result);
      } catch {
        // Network failure — keep the fallback; will retry on next mount
      }
    })();

    // Cleanup: ignore stale async result if lang / course changes
    return () => { cancelRef.current = true; };
  }, [course?.id, uiLang]);

  return content;
}
