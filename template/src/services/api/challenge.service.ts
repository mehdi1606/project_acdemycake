import api from './axios.config';
import { API_URL } from '../../environment';

/** Phases come from the server clock, never from the visitor's device. */
export type ChallengePhase = 'UPCOMING' | 'SUBMISSIONS' | 'BETWEEN' | 'VOTING' | 'TALLYING' | 'RESULTS' | 'CLOSED';
export type EntryStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'DISQUALIFIED';

export interface ChallengeView {
  slug: string;
  phase: ChallengePhase;
  serverNow: string;
  submissionsOpenAt: string;
  submissionsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  resultsAt: string;
  bannerUntil: string;
  minPhotos: number;
  maxPhotos: number;
  minVoters: number;
  registrations: number;
  approvedEntries: number;
  totalVotes: number;
  voters: number;
}

export interface EntryCard {
  id: string;
  title: string;
  description?: string;
  photos: string[];
  authorName: string;
  authorAvatar?: string;
  /** Opens the author's member profile. */
  authorId?: string;
  points: number;
  voters: number;
  rank: number;
  eligible: boolean;
  approvedAt?: string;
}

export interface MyEntry {
  id: string;
  title: string;
  description?: string;
  photos: string[];
  certified: boolean;
  publicationConsent: boolean;
  status: EntryStatus;
  adminNote?: string;
  updatedAt?: string;
}

export interface MyStatus {
  registered: boolean;
  emailVerified: boolean;
  role: string;
  canEnter: boolean;
  entry: MyEntry | null;
  votedEntryIds: string[];
}

export interface SaveEntry {
  title: string;
  description?: string;
  photos: string[];
  certified: boolean;
  publicationConsent: boolean;
}

export interface AdminEntry extends Omit<MyEntry, 'updatedAt'> {
  createdAt: string;
  updatedAt?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCreatedAt?: string;
  points: number;
  voters: number;
  rank: number;
  flaggedVotes: number;
}

export interface AdminVote {
  id: string;
  voterName: string;
  voterEmail: string;
  voterRole: string;
  points: number;
  accountCreatedAt?: string;
  newAccount: boolean;
  emailVerified: boolean;
  ipAddress?: string;
  sameIpVotes: number;
  voided: boolean;
  voidedReason?: string;
  createdAt: string;
}

export interface CampaignStatus {
  key: string;
  status: 'IDLE' | 'SENDING' | 'DONE';
  audience: number;
  sent: number;
  failed: number;
  skipped: number;
  sentLast24h: number;
  dailyCap: number;
}

// The axios interceptor unwraps { success, data } into response.data.
const d = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const challengeService = {
  current: () => d<ChallengeView | null>(api.get('/public/challenges/current')),
  view: (slug: string) => d<ChallengeView>(api.get(`/public/challenges/${slug}`)),
  gallery: (slug: string) => d<EntryCard[]>(api.get(`/public/challenges/${slug}/entries`)),
  entry: (slug: string, id: string) => d<EntryCard>(api.get(`/public/challenges/${slug}/entries/${id}`)),
  /** Links to share: they show the cake's photo in WhatsApp / Facebook previews, then open the page. */
  shareUrl: (slug: string, entryId?: string) =>
    entryId ? `${API_URL}/public/challenges/${slug}/entries/${entryId}/share` : `${API_URL}/public/challenges/${slug}/share`,

  campaignStatus: (key: string) => d<CampaignStatus>(api.get(`/admin/campaigns/${key}/status`)),
  campaignPreview: (key: string) => api.get(`/admin/campaigns/${key}/preview`, { responseType: 'text', transformResponse: (x) => x }).then((r) => r.data as unknown as string),
  campaignTest: (key: string) => d<string>(api.post(`/admin/campaigns/${key}/test`)),
  campaignLaunch: (key: string) => d<CampaignStatus>(api.post(`/admin/campaigns/${key}/launch`)),

  me: (slug: string) => d<MyStatus>(api.get(`/challenges/${slug}/me`)),
  register: (slug: string) => d<MyStatus>(api.post(`/challenges/${slug}/register`)),
  uploadPhoto: (slug: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return d<string>(api.post(`/challenges/${slug}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  saveEntry: (slug: string, body: SaveEntry) => d<MyStatus>(api.put(`/challenges/${slug}/entry`, body)),
  vote: (slug: string, entryId: string) => d<string[]>(api.post(`/challenges/${slug}/entries/${entryId}/vote`)),
  unvote: (slug: string, entryId: string) => d<string[]>(api.delete(`/challenges/${slug}/entries/${entryId}/vote`)),

  adminEntries: (slug: string) => d<AdminEntry[]>(api.get(`/admin/challenges/${slug}/entries`)),
  setStatus: (slug: string, entryId: string, status: EntryStatus, note?: string) =>
    d<AdminEntry>(api.put(`/admin/challenges/${slug}/entries/${entryId}/status`, { status, note })),
  adminVotes: (slug: string, entryId: string) => d<AdminVote[]>(api.get(`/admin/challenges/${slug}/entries/${entryId}/votes`)),
  voidVote: (voteId: string, voided: boolean, reason?: string) =>
    d<void>(api.put(`/admin/challenges/votes/${voteId}`, { voided, reason })),
};
