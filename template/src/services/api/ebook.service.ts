import api from './axios.config';
import { isAxiosError } from 'axios';

export interface Ebook {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  titleFr?: string;
  titleAr?: string;
  subtitle?: string;
  description?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  descriptionAr?: string;
  coverUrl?: string;
  price: number;
  currency: string;
  pageCount?: number;
  status?: string;
  purchaseCount?: number;
  /** Language editions on offer, e.g. ["fr","ar"]. */
  languages: string[];
  isOwned?: boolean;
  purchasedAt?: string;
}

/**
 * NOTE: the axios interceptor already unwraps the backend's
 * `ApiResponse { success, message, data }` envelope into `response.data`.
 * Read `res.data` once — reading `res.data.data` yields undefined.
 */
class EbookService {
  async getEbooks(): Promise<Ebook[]> {
    const res = await api.get<Ebook[]>('/ebooks');
    return res.data;
  }

  async getBySlug(slug: string): Promise<Ebook> {
    const res = await api.get<Ebook>(`/ebooks/${slug}`);
    return res.data;
  }

  async getMyLibrary(): Promise<Ebook[]> {
    const res = await api.get<Ebook[]>('/ebooks/my-library');
    return res.data;
  }

  /**
   * The reader/download URLs are ownership-checked server-side and need the JWT.
   * They are fetched as blobs so the token travels in the Authorization header
   * rather than in a shareable URL.
   */
  async fetchContentBlobUrl(ebookId: string, language?: string): Promise<string> {
    const blob = await this.fetchBlob(`/ebooks/${ebookId}/content`, language);
    return URL.createObjectURL(blob);
  }

  async download(ebookId: string, filename: string, language?: string): Promise<void> {
    const blob = await this.fetchBlob(`/ebooks/${ebookId}/download`, language);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  // Goes through the shared axios instance so an expired access token is
  // refreshed transparently (raw fetch broke after the 15-min token expiry).
  // The response interceptor only unwraps JSON objects with a `success` key,
  // so the Blob is returned untouched.
  private async fetchBlob(path: string, language?: string): Promise<Blob> {
    try {
      const res = await api.get<Blob>(path, {
        responseType: 'blob',
        params: language ? { language } : undefined,
      });
      return res.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 403) {
        throw new Error('You have not purchased this ebook');
      }
      throw new Error('Could not open this ebook');
    }
  }
}

export const ebookService = new EbookService();
export default ebookService;
