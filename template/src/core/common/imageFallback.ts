import type { SyntheticEvent } from 'react';

/**
 * onError handlers for images whose URL comes from the server (thumbnails,
 * post photos, category images). A deleted or moved file would otherwise show
 * the browser's broken-image glyph.
 *
 * Fallback paths use PUBLIC_URL so they also resolve on nested routes
 * (a relative `assets/...` breaks under e.g. /admin/dashboard).
 */

export const COURSE_PLACEHOLDER = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;

/** Swap to a placeholder image once; never loops if the placeholder fails too. */
export const fallbackTo =
  (placeholder: string = COURSE_PLACEHOLDER) =>
  (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.src = placeholder;
  };

/** Hide the image entirely (for optional photos where a placeholder adds nothing). */
export const hideOnError = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};
