import DOMPurify from 'dompurify';
import { API_BASE_URL } from '../../environment';

/**
 * Cleans instructor-authored HTML (course descriptions, lesson content) before it
 * is rendered with dangerouslySetInnerHTML. Removes <script>, event handlers
 * (onerror, onclick…), javascript: URLs and iframes, while keeping normal
 * formatting and the lesson PDF marker (div.sl-pdf-embed[data-pdf-url]).
 *
 * The backend also cleans this HTML on save; this protects content that was
 * stored before that, and any future path that skips it.
 */
export const sanitizeHtml = (html?: string | null): string =>
  DOMPurify.sanitize(html ?? '', {
    ADD_ATTR: ['data-pdf-url', 'target'],
    FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'form'],
  });

/**
 * Only file paths of our own API may be shown in the lesson PDF viewer
 * (blocks javascript:, data: and third-party URLs in data-pdf-url).
 * Also decodes the HTML-escaped "&amp;" of signed links.
 */
export const safePdfPath = (raw: string): string | null => {
  const url = raw.replace(/&amp;/g, '&').trim();
  if (/^lesson-resources\/[A-Za-z0-9._-]+(\?[A-Za-z0-9=&_-]*)?$/.test(url)) return url;
  if (url.startsWith(`${API_BASE_URL}/files/`)) return url;
  return null;
};
