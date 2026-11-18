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

/** Why a PDF could not be loaded — lets the reader show the right message. */
export type EbookAccessFailure = 'NOT_OWNED' | 'UNAVAILABLE' | 'FAILED';

export class EbookAccessError extends Error {
  constructor(public readonly reason: EbookAccessFailure, msg: string) {
    super(msg);
    this.name = 'EbookAccessError';
  }
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
   * The reader URL is ownership-checked server-side and needs the JWT, so the
   * PDF is fetched as data (token in the Authorization header, never in a
   * shareable URL) and drawn inside the platform. Ebooks cannot be downloaded.
   */
  async fetchContent(ebookId: string, language?: string): Promise<ArrayBuffer> {
    const blob = await this.fetchBlob(`/ebooks/${ebookId}/content`, language);
    return blob.arrayBuffer();
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
        // Ebook PDFs run to 70+ MB; the default 30 s limit cut them off on
        // ordinary connections, so the buyer saw an error after paying.
        timeout: 0,
      });
      return res.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 403) {
        throw new EbookAccessError('NOT_OWNED', 'You have not purchased this ebook');
      }
      if (isAxiosError(error) && error.response?.status === 404) {
        // Purchase is fine — the file is missing on the server.
        throw new EbookAccessError('UNAVAILABLE', 'This ebook file is temporarily unavailable');
      }
      throw new EbookAccessError('FAILED', 'Could not open this ebook');
    }
  }
}

export const ebookService = new EbookService();
export default ebookService;
