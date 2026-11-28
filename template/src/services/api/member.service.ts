import api from './axios.config';

/** A requirement of the next badge. Score requirements come without `have` (marks stay private). */
export interface MemberBadgeCheck {
  kind: string;
  have?: number;
  need?: number;
  met: boolean;
}

export interface MemberProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  memberSince?: string;
  badgeId: number;
  badgeEarned: boolean;
  nextBadgeId?: number;
  nextBadgePercent?: number;
  nextBadgeChecks?: MemberBadgeCheck[];
  completedCourses: number;
  certificates: number;
  masterclasses: number;
  communityPosts: number;
  challenge?: { slug: string; registered: boolean };
  instagram?: string;
  tiktok?: string;
  me: boolean;
}

export const memberService = {
  async get(id: string): Promise<MemberProfile> {
    const r = await api.get<MemberProfile>(`/members/${id}`);
    return r.data;
  },
};

export default memberService;
