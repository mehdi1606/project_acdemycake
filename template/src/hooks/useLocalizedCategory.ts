import { useMemo } from 'react';
import { CourseCategory } from '../services/api/types';

type Lang = 'en' | 'ar';

function normLang(raw?: string): Lang {
  const s = (raw || 'en').toLowerCase().split('-')[0];
  return s === 'ar' ? 'ar' : 'en';
}

export interface LocalizedCategory {
  name: string;
  description: string;
}

export function getLocalizedCategory(
  category: CourseCategory,
  lang: string,
): LocalizedCategory {
  const uiLang = normLang(lang);

  const pickName = (): string => {
    if (uiLang === 'ar' && category.nameAr) return category.nameAr;
    if (uiLang === 'en' && category.nameEn) return category.nameEn;
    return category.name;
  };

  const pickDesc = (): string => {
    if (uiLang === 'ar' && category.descriptionAr) return category.descriptionAr;
    if (uiLang === 'en' && category.descriptionEn) return category.descriptionEn;
    return category.description || '';
  };

  return { name: pickName(), description: pickDesc() };
}

export function useLocalizedCategory(
  category: CourseCategory | null | undefined,
  lang: string,
): LocalizedCategory {
  return useMemo(() => {
    if (!category) return { name: '', description: '' };
    return getLocalizedCategory(category, lang);
  }, [category?.id, category?.name, category?.nameEn, category?.nameAr, lang]);
}
