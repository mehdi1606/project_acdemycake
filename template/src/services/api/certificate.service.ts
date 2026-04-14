import api from './axios.config';
import { Certificate } from './types';

interface CertificatePageResponse {
  content: Certificate[];
  page: number;
  totalPages: number;
  totalElements: number;
}

class CertificateService {
  // ── Student endpoints ──────────────────────────────────────────────────

  /** Get the current student's earned certificates (paginated) */
  async getMyCertificates(page = 0, size = 10): Promise<CertificatePageResponse> {
    const response = await api.get<CertificatePageResponse>('/certificates', {
      params: { page, size },
    });
    return response.data;
  }

  /** Get a single certificate by ID (must belong to current user) */
  async getCertificateById(id: string): Promise<Certificate> {
    const response = await api.get<Certificate>(`/certificates/${id}`);
    return response.data;
  }

  /** Download certificate PDF as a Blob (student access) */
  async downloadCertificate(id: string): Promise<Blob> {
    const response = await api.get(`/certificates/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /** Verify a certificate by its certificate number (public) */
  async verifyCertificate(certificateNumber: string): Promise<Certificate> {
    const response = await api.get<Certificate>(`/certificates/verify/${certificateNumber}`);
    return response.data;
  }

  // ── Instructor endpoints ───────────────────────────────────────────────

  /** Get all certificates issued for the instructor's courses (paginated) */
  async getInstructorCertificates(page = 0, size = 10): Promise<CertificatePageResponse> {
    const response = await api.get<CertificatePageResponse>('/instructor/certificates', {
      params: { page, size },
    });
    return response.data;
  }

  /** Download a certificate PDF as instructor (any cert from their courses) */
  async downloadCertificateByInstructor(id: string): Promise<Blob> {
    const response = await api.get(`/instructor/certificates/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ── Helper ─────────────────────────────────────────────────────────────

  /** Trigger browser download from a Blob */
  triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const certificateService = new CertificateService();
export default certificateService;
