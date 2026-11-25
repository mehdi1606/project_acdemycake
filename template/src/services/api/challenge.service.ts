import api from './axios.config';

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
}

export interface EntryCard {
  id: string;
  title: string;
  description?: string;
  photos: string[];
  authorName: string;
  authorAvatar?: string;
  points: number;
  voters: number;
  rank: number;
  eligible: boolean;
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

// The axios interceptor unwraps { success, data } into response.data.
const d = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const challengeService = {
  current: () => d<ChallengeView | null>(api.get('/public/challenges/current')),
  view: (slug: string) => d<ChallengeView>(api.get(`/public/challenges/${slug}`)),
  gallery: (slug: string) => d<EntryCard[]>(api.get(`/public/challenges/${slug}/entries`)),

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
