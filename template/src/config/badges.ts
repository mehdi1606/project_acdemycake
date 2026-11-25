/**
 * SARALÖWE Academy — Badge ladder
 *
 * Each level is a step in a pastry chef's career. A student needs EVERY requirement of a
 * level, levels are climbed in order, and a badge once reached is shown while the numbers
 * hold (they only grow). Certificates come only from a passed assignment (≥70%).
 *
 *   1  Apprentice      "Welcome to the kitchen"   email verified · 1 course joined · 1 lesson finished
 *   2  Commis Chef     "Your first plate goes out" 3 certificates · member 2 months
 *   3  Sous Chef       "Consistency"               3 certificates · quiz avg 75% · active in 8 weeks · 10 posts/reviews · 4 months
 *   4  Chef de Partie  "Your own station"          6 certificates · one assignment ≥90% · 20 posts/reviews · 6 months
 *   5  Executive Chef  "You lead the brigade"      6 certificates · assignment & quiz avg 88% · 2 masterclasses · 9 months
 *   6  Master Chef     "Your signature creation"   10 certificates · assignment avg 95% · 3 masterclasses · 50 contributions · 1 year
 *   7  Elite           "The chef's blessing"       10 certificates · assignment avg 98% · 5 masterclasses · 100 contributions · 2 years · approved by the chef
 *
 * Special roles:  8 Instructor (role INSTRUCTOR) · 9 Admin (role ADMIN)
 *
 * The numbers come from the server (BadgeStatsService → /auth/me and the admin users list).
 */

/** What a level asks for. A missing field = no requirement of that kind. */
export interface BadgeRequirements {
  emailVerified?: boolean;
  enrolledCourses?: number;
  completedLessons?: number;
  certificates?: number;
  /** Average best quiz score, 0-100 (needs at least one quiz). */
  quizAvg?: number;
  /** Weeks with learning activity (lessons, quizzes, assignments). */
  activeWeeks?: number;
  /** At least one assignment marked this % or more. */
  bestAssignment?: number;
  /** Average assignment mark, %. */
  avgAssignment?: number;
  /** Community posts + course reviews. */
  shareOrReview?: number;
  /** Community posts + comments. */
  contributions?: number;
  masterclasses?: number;
  liveMasterclasses?: number;
  /** Days since the account was created. */
  days?: number;
  /** Elite: the chef's personal approval. */
  chefApproval?: boolean;
}

/** The student's numbers the rules are checked against. */
export interface BadgeProgress {
  emailVerified?: boolean;
  enrolledCourses?: number;
  completedLessons?: number;
  certificates?: number;
  quizzesTaken?: number;
  avgQuizScore?: number | null;
  gradedAssignments?: number;
  avgAssignmentScore?: number | null;
  bestAssignmentScore?: number | null;
  activeWeeks?: number;
  communityPosts?: number;
  communityContributions?: number;
  reviews?: number;
  masterclasses?: number;
  liveMasterclasses?: number;
  /** ISO date the account was created */
  memberSince?: string | null;
  eliteApproved?: boolean;
  /** Level kept from before the harder ladder: the badge never goes below it (0 = none). */
  floor?: number;
}

export interface BadgeDefinition {
  id: number;
  /** i18n key used to resolve name */
  nameKey: string;
  /** i18n key used to resolve description */
  descKey: string;
  /** i18n key of the level's short motto ("Welcome to the kitchen"…) */
  mottoKey?: string;
  /** Kept for older displays; the full rule is `req`. */
  minCourses: number;
  /** Full requirements (student levels only) */
  req?: BadgeRequirements;
  /** Which user roles this badge applies to (undefined = student progression) */
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  /** Path relative to /public */
  image: string;
  /** Accent colour for the popup border / glow */
  color: string;
  /** Star count displayed in the badge (for display purposes) */
  stars: number;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 1, nameKey: 'badges.apprentice.name', descKey: 'badges.apprentice.desc', mottoKey: 'badges.apprentice.motto',
    minCourses: 0, req: { emailVerified: true, enrolledCourses: 1, completedLessons: 1 },
    image: '/assets/img/badge/badge-1.webp', color: '#e8a4b8', stars: 1,
  },
  {
    id: 2, nameKey: 'badges.commisChef.name', descKey: 'badges.commisChef.desc', mottoKey: 'badges.commisChef.motto',
    minCourses: 3, req: { certificates: 3, days: 60 },
    image: '/assets/img/badge/badge-2.webp', color: '#c8a96e', stars: 1,
  },
  {
    id: 3, nameKey: 'badges.sousChef.name', descKey: 'badges.sousChef.desc', mottoKey: 'badges.sousChef.motto',
    minCourses: 3, req: { certificates: 3, quizAvg: 75, activeWeeks: 8, shareOrReview: 10, days: 120 },
    image: '/assets/img/badge/badge-3.webp', color: '#b8973e', stars: 2,
  },
  {
    id: 4, nameKey: 'badges.chefDePartie.name', descKey: 'badges.chefDePartie.desc', mottoKey: 'badges.chefDePartie.motto',
    minCourses: 6, req: { certificates: 6, bestAssignment: 90, shareOrReview: 20, days: 180 },
    image: '/assets/img/badge/badge-4.webp', color: '#c0392b', stars: 2,
  },
  {
    id: 5, nameKey: 'badges.executiveChef.name', descKey: 'badges.executiveChef.desc', mottoKey: 'badges.executiveChef.motto',
    minCourses: 6, req: { certificates: 6, avgAssignment: 88, quizAvg: 88, masterclasses: 2, days: 270 },
    image: '/assets/img/badge/badge-5.webp', color: '#2e7d52', stars: 3,
  },
  {
    id: 6, nameKey: 'badges.masterChef.name', descKey: 'badges.masterChef.desc', mottoKey: 'badges.masterChef.motto',
    minCourses: 10, req: { certificates: 10, avgAssignment: 95, masterclasses: 3, contributions: 50, days: 365 },
    image: '/assets/img/badge/badge-6.webp', color: '#c8a030', stars: 4,
  },
  {
    id: 7, nameKey: 'badges.elite.name', descKey: 'badges.elite.desc', mottoKey: 'badges.elite.motto',
    minCourses: 10, req: { certificates: 10, avgAssignment: 98, masterclasses: 5, contributions: 100, days: 730, chefApproval: true },
    image: '/assets/img/badge/badge-7.webp', color: '#d4a017', stars: 5,
  },
  {
    id: 8, nameKey: 'badges.instructor.name', descKey: 'badges.instructor.desc',
    minCourses: 0, role: 'INSTRUCTOR',
    image: '/assets/img/badge/badge-8.webp', color: '#2e7d52', stars: 0,
  },
  {
    id: 9, nameKey: 'badges.admin.name', descKey: 'badges.admin.desc',
    minCourses: 0, role: 'ADMIN',
    image: '/assets/img/badge/badge-9.webp', color: '#1565c0', stars: 0,
  },
];

/** A plain number (older callers) only means "nothing known yet". */
export const toProgress = (progress: number | BadgeProgress | null | undefined): BadgeProgress =>
  typeof progress === 'number' || !progress ? {} : progress;

/** Days since the account was created (0 when unknown). */
export function memberDays(memberSince?: string | null): number {
  if (!memberSince) return 0;
  const t = new Date(memberSince).getTime();
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : 0;
}

export type BadgeCheckKind =
  | 'emailVerified' | 'enrolledCourses' | 'completedLessons' | 'certificates' | 'quizAvg' | 'activeWeeks'
  | 'bestAssignment' | 'avgAssignment' | 'shareOrReview' | 'contributions' | 'masterclasses'
  | 'liveMasterclasses' | 'days' | 'chefApproval';
export interface BadgeCheck { kind: BadgeCheckKind; have: number; need: number; met: boolean }

/** Each requirement of a level with the student's current value (checklists + progress bars). */
export function badgeChecks(badge: BadgeDefinition, progress: number | BadgeProgress | null | undefined): BadgeCheck[] {
  const p = toProgress(progress);
  const r = badge.req;
  if (!r) return [];
  const checks: BadgeCheck[] = [];
  const add = (kind: BadgeCheckKind, have: number, need: number) => checks.push({ kind, have, need, met: have >= need });
  if (r.emailVerified) add('emailVerified', p.emailVerified ? 1 : 0, 1);
  if (r.enrolledCourses) add('enrolledCourses', p.enrolledCourses ?? 0, r.enrolledCourses);
  if (r.completedLessons) add('completedLessons', p.completedLessons ?? 0, r.completedLessons);
  if (r.certificates) add('certificates', p.certificates ?? 0, r.certificates);
  if (r.quizAvg) add('quizAvg', p.avgQuizScore ?? 0, r.quizAvg);
  if (r.activeWeeks) add('activeWeeks', p.activeWeeks ?? 0, r.activeWeeks);
  if (r.bestAssignment) add('bestAssignment', p.bestAssignmentScore ?? 0, r.bestAssignment);
  if (r.avgAssignment) add('avgAssignment', p.avgAssignmentScore ?? 0, r.avgAssignment);
  if (r.shareOrReview) add('shareOrReview', (p.communityPosts ?? 0) + (p.reviews ?? 0), r.shareOrReview);
  if (r.contributions) add('contributions', p.communityContributions ?? 0, r.contributions);
  if (r.masterclasses) add('masterclasses', p.masterclasses ?? 0, r.masterclasses);
  if (r.liveMasterclasses) add('liveMasterclasses', p.liveMasterclasses ?? 0, r.liveMasterclasses);
  if (r.days) add('days', memberDays(p.memberSince), r.days);
  if (r.chefApproval) add('chefApproval', p.eliteApproved ? 1 : 0, 1);
  return checks;
}

const levelMet = (b: BadgeDefinition, p: number | BadgeProgress | null | undefined) =>
  badgeChecks(b, p).every((c) => c.met);

/** Overall progress towards a level, 0-100 (average of each requirement's progress). */
export function badgeProgressPercent(badge: BadgeDefinition, progress: number | BadgeProgress | null | undefined): number {
  const checks = badgeChecks(badge, progress);
  if (!checks.length) return 100;
  const sum = checks.reduce((acc, c) => acc + Math.min(1, c.need ? c.have / c.need : 1), 0);
  return Math.round((sum / checks.length) * 100);
}

/**
 * Student level, 0 (Apprentice not earned yet) … 7 (Elite): the levels reached in a row
 * under the current rules, but never below the level kept from before (`floor`).
 */
export function studentLevel(progress: number | BadgeProgress | null | undefined): number {
  let level = 0;
  for (const b of BADGES.slice(0, 7)) {
    if (!levelMet(b, progress)) break;
    level = b.id;
  }
  const floor = Math.min(7, Math.max(0, toProgress(progress).floor ?? 0));
  return Math.max(level, floor);
}

/**
 * Resolve the badge to show for a user. A new student who hasn't earned Apprentice yet
 * still shows the Apprentice badge (as "in progress"); see `isBadgeEarned`.
 */
export function getBadgeForUser(
  role: string,
  progress: number | BadgeProgress | null | undefined,
): BadgeDefinition {
  if (role === 'ADMIN') return BADGES[8];      // badge 9
  if (role === 'INSTRUCTOR') return BADGES[7]; // badge 8
  return BADGES[Math.max(0, studentLevel(progress) - 1)];
}

/** True once the student has really earned the badge shown (false = still working on Apprentice). */
export function isBadgeEarned(role: string, progress: number | BadgeProgress | null | undefined): boolean {
  if (role === 'ADMIN' || role === 'INSTRUCTOR') return true;
  return studentLevel(progress) >= 1;
}

/** The level the student is working towards (null at Elite). With progress, Apprentice-in-progress points at Apprentice. */
export function getNextBadge(current: BadgeDefinition, progress?: number | BadgeProgress | null): BadgeDefinition | null {
  if (current.role) return null;
  if (progress !== undefined && current.id === 1 && studentLevel(progress) < 1) return BADGES[0];
  if (current.id >= 7) return null;
  return BADGES[current.id] ?? null; // BADGES is 0-indexed; badge id 1 is BADGES[0]
}

/**
 * Get the badge for a user when only their role is known (no completedCourses).
 * Used for OTHER users' avatars (community posts, messages, instructor cards).
 * - INSTRUCTOR → instructor badge (8)
 * - ADMIN      → admin badge (9)
 * - STUDENT / unknown → apprentice badge (1) as visual placeholder
 */
export function getBadgeFromRole(role?: string | null): BadgeDefinition {
  if (role === 'ADMIN')      return BADGES[8]; // badge 9
  if (role === 'INSTRUCTOR') return BADGES[7]; // badge 8
  return BADGES[0];                            // badge 1 — Apprentice
}

// ── Responsive image helpers ─────────────────────────────────────────────────
//
// Each badge ships in three downscaled WebP sizes (see scripts/optimize-badges.js):
//   badge-N-128.webp (128px) · badge-N.webp (256px) · badge-N-512.webp (512px)
// All are well under 50 KB. `badgeSrcSet` lets the browser pick the right one for
// the rendered size + device DPR, so a 24px corner avatar never downloads the 512px
// file and a 168px showcase slide stays crisp on retina.

/** Build a srcset string ("…-128.webp 128w, ….webp 256w, …-512.webp 512w") from a badge image path. */
export function badgeSrcSet(image: string): string {
  const base = image.replace(/\.webp$/i, '');
  return `${base}-128.webp 128w, ${image} 256w, ${base}-512.webp 512w`;
}

// In-memory record of badge URLs whose <img> has finished loading at least once.
// Lets components skip the skeleton/placeholder on subsequent renders (no flicker,
// no duplicate work) — the browser HTTP cache handles the bytes, this handles the UI.
const loadedBadges = new Set<string>();

export function markBadgeLoaded(image: string): void {
  loadedBadges.add(image);
}

export function isBadgeLoaded(image: string): boolean {
  return loadedBadges.has(image);
}

/**
 * Warm the browser cache for a badge (current + next) before it is shown.
 * Uses a detached Image() so the fetch is async and non-blocking; resolves the
 * 256px default which is what the showcase renders at 1x.
 */
export function preloadBadge(image?: string | null): void {
  if (!image || loadedBadges.has(image) || typeof window === 'undefined') return;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => loadedBadges.add(image);
  img.srcset = badgeSrcSet(image);
  img.src = image;
}

/** The badge fields the server sends on a user (/auth/me, admin users list). */
export interface BadgeSource {
  isEmailVerified?: boolean;
  createdAt?: string | null;
  enrolledCourses?: number;
  completedLessons?: number;
  certificates?: number;
  quizzesTaken?: number;
  avgQuizScore?: number | null;
  gradedAssignments?: number;
  avgAssignmentScore?: number | null;
  bestAssignmentScore?: number | null;
  activeWeeks?: number;
  communityPosts?: number;
  communityContributions?: number;
  reviews?: number;
  completedMasterclasses?: number;
  liveMasterclasses?: number;
  eliteApprovedAt?: string | null;
  badgeFloor?: number;
}

/**
 * Build the badge numbers from the student stats slice (`badgeStats`, loaded from /auth/me)
 * or, failing that, from a user object that carries the same fields (admin list).
 */
export function progressOf(
  stats?: { badgeStats?: BadgeSource | null } | null,
  user?: BadgeSource | null,
): BadgeProgress {
  const s: BadgeSource = { ...(user ?? {}), ...(stats?.badgeStats ?? {}) };
  return {
    emailVerified: !!s.isEmailVerified,
    enrolledCourses: s.enrolledCourses ?? 0,
    completedLessons: s.completedLessons ?? 0,
    certificates: s.certificates ?? 0,
    quizzesTaken: s.quizzesTaken ?? 0,
    avgQuizScore: s.avgQuizScore ?? null,
    gradedAssignments: s.gradedAssignments ?? 0,
    avgAssignmentScore: s.avgAssignmentScore ?? null,
    bestAssignmentScore: s.bestAssignmentScore ?? null,
    activeWeeks: s.activeWeeks ?? 0,
    communityPosts: s.communityPosts ?? 0,
    communityContributions: s.communityContributions ?? 0,
    reviews: s.reviews ?? 0,
    masterclasses: s.completedMasterclasses ?? 0,
    liveMasterclasses: s.liveMasterclasses ?? 0,
    memberSince: s.createdAt ?? null,
    eliteApproved: !!s.eliteApprovedAt,
    floor: s.badgeFloor ?? 0,
  };
}
