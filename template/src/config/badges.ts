/**
 * SARALÖWE Academy — Badge System Configuration
 *
 * Each badge is a gemstone engraved with the academy logo; the rarer the stone, the
 * harder the level. A student needs ALL of a level's requirements (finished courses,
 * average best quiz score, time as a member, and for Diamond a masterclass), and levels
 * are climbed in order.
 *
 *   1  Apprentice      Rose Quartz    — everyone starts here
 *   2  Commis Chef     Citrine        — 2 courses · quiz average 60% · 14 days
 *   3  Sous Chef       Amethyst       — 3 courses · quiz average 70% · 30 days
 *   4  Chef de Partie  Sapphire       — 4 courses · quiz average 75% · 60 days
 *   5  Executive Chef  Emerald        — 5 courses · quiz average 80% · 120 days
 *   6  Master Chef     Ruby           — 6 courses · quiz average 85% · 180 days
 *   7  Elite           Diamond        — 8 courses + 1 masterclass · quiz average 90% · 365 days
 *
 * Special roles:
 *   8  Instructor      Black Onyx     — role === 'INSTRUCTOR'
 *   9  Admin           Imperial Topaz — role === 'ADMIN'
 */

/** What a level asks for. A missing field = no requirement of that kind. */
export interface BadgeRequirements {
  courses: number;
  /** Average of the best score on each quiz taken, 0-100 (needs at least one quiz). */
  quizAvg?: number;
  /** Days since the account was created. */
  days?: number;
  /** Masterclasses booked or bought. */
  masterclasses?: number;
}

/** The student's numbers the rules are checked against (from /auth/me and admin lists). */
export interface BadgeProgress {
  completedCourses: number;
  completedMasterclasses?: number;
  quizzesTaken?: number;
  avgQuizScore?: number | null;
  /** ISO date the account was created */
  memberSince?: string | null;
}

export interface BadgeDefinition {
  id: number;
  /** i18n key used to resolve name */
  nameKey: string;
  /** i18n key used to resolve description */
  descKey: string;
  /** i18n key of the gemstone's name */
  gemKey: string;
  /** Minimum completed-course count (kept for simple displays; see `req` for the full rule) */
  minCourses: number;
  /** Full requirements (student levels only) */
  req?: BadgeRequirements;
  /** Which user roles this badge applies to (undefined = student progression) */
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  /** Path relative to /public */
  image: string;
  /** Accent colour for the popup border / glow (the gem's colour) */
  color: string;
  /** Star count displayed in the badge (for display purposes) */
  stars: number;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 1, nameKey: 'badges.apprentice.name', descKey: 'badges.apprentice.desc', gemKey: 'badges.gems.roseQuartz',
    minCourses: 0, req: { courses: 0 },
    image: '/assets/img/badge/badge-1.webp', color: '#e8a4b8', stars: 1,
  },
  {
    id: 2, nameKey: 'badges.commisChef.name', descKey: 'badges.commisChef.desc', gemKey: 'badges.gems.citrine',
    minCourses: 2, req: { courses: 2, quizAvg: 60, days: 14 },
    image: '/assets/img/badge/badge-2.webp', color: '#e0a030', stars: 1,
  },
  {
    id: 3, nameKey: 'badges.sousChef.name', descKey: 'badges.sousChef.desc', gemKey: 'badges.gems.amethyst',
    minCourses: 3, req: { courses: 3, quizAvg: 70, days: 30 },
    image: '/assets/img/badge/badge-3.webp', color: '#9b59b6', stars: 2,
  },
  {
    id: 4, nameKey: 'badges.chefDePartie.name', descKey: 'badges.chefDePartie.desc', gemKey: 'badges.gems.sapphire',
    minCourses: 4, req: { courses: 4, quizAvg: 75, days: 60 },
    image: '/assets/img/badge/badge-4.webp', color: '#2f6fd6', stars: 2,
  },
  {
    id: 5, nameKey: 'badges.executiveChef.name', descKey: 'badges.executiveChef.desc', gemKey: 'badges.gems.emerald',
    minCourses: 5, req: { courses: 5, quizAvg: 80, days: 120 },
    image: '/assets/img/badge/badge-5.webp', color: '#1f9d6a', stars: 3,
  },
  {
    id: 6, nameKey: 'badges.masterChef.name', descKey: 'badges.masterChef.desc', gemKey: 'badges.gems.ruby',
    minCourses: 6, req: { courses: 6, quizAvg: 85, days: 180 },
    image: '/assets/img/badge/badge-6.webp', color: '#c0172f', stars: 4,
  },
  {
    id: 7, nameKey: 'badges.elite.name', descKey: 'badges.elite.desc', gemKey: 'badges.gems.diamond',
    minCourses: 8, req: { courses: 8, quizAvg: 90, days: 365, masterclasses: 1 },
    image: '/assets/img/badge/badge-7.webp', color: '#b9d7f2', stars: 5,
  },
  {
    id: 8, nameKey: 'badges.instructor.name', descKey: 'badges.instructor.desc', gemKey: 'badges.gems.blackOnyx',
    minCourses: 0, role: 'INSTRUCTOR',
    image: '/assets/img/badge/badge-8.webp', color: '#8f8f8f', stars: 0,
  },
  {
    id: 9, nameKey: 'badges.admin.name', descKey: 'badges.admin.desc', gemKey: 'badges.gems.imperialTopaz',
    minCourses: 0, role: 'ADMIN',
    image: '/assets/img/badge/badge-9.webp', color: '#e8833a', stars: 0,
  },
];

export const toProgress = (progress: number | BadgeProgress | null | undefined): BadgeProgress =>
  typeof progress === 'number' ? { completedCourses: progress } : (progress ?? { completedCourses: 0 });

/** Days since the account was created (0 when unknown). */
export function memberDays(memberSince?: string | null): number {
  if (!memberSince) return 0;
  const t = new Date(memberSince).getTime();
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : 0;
}

export type BadgeCheckKind = 'courses' | 'quizAvg' | 'days' | 'masterclasses';
export interface BadgeCheck { kind: BadgeCheckKind; have: number; need: number; met: boolean }

/** Each requirement of a level with the student's current value (checklists + progress bars). */
export function badgeChecks(badge: BadgeDefinition, progress: number | BadgeProgress | null | undefined): BadgeCheck[] {
  const p = toProgress(progress);
  const r = badge.req;
  if (!r) return [];
  const checks: BadgeCheck[] = [];
  const add = (kind: BadgeCheckKind, have: number, need: number) => checks.push({ kind, have, need, met: have >= need });
  if (r.courses > 0) add('courses', p.completedCourses ?? 0, r.courses);
  if (r.quizAvg) add('quizAvg', p.avgQuizScore ?? 0, r.quizAvg);
  if (r.days) add('days', memberDays(p.memberSince), r.days);
  if (r.masterclasses) add('masterclasses', p.completedMasterclasses ?? 0, r.masterclasses);
  return checks;
}

/** Overall progress towards a level, 0-100 (average of each requirement's progress). */
export function badgeProgressPercent(badge: BadgeDefinition, progress: number | BadgeProgress | null | undefined): number {
  const checks = badgeChecks(badge, progress);
  if (!checks.length) return 100;
  const sum = checks.reduce((acc, c) => acc + Math.min(1, c.need ? c.have / c.need : 1), 0);
  return Math.round((sum / checks.length) * 100);
}

/**
 * Resolve the badge for a given user.
 *
 * @param role     - user role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
 * @param progress - the student's badge numbers (a plain number = completed courses only)
 */
export function getBadgeForUser(
  role: string,
  progress: number | BadgeProgress | null | undefined,
): BadgeDefinition {
  if (role === 'ADMIN') return BADGES[8];      // badge 9
  if (role === 'INSTRUCTOR') return BADGES[7]; // badge 8

  // Student progression: climbed in order, each level needs ALL its requirements.
  let badge = BADGES[0]; // Apprentice — always at least this
  for (const b of BADGES.slice(1, 7)) {
    if (!badgeChecks(b, progress).every((c) => c.met)) break;
    badge = b;
  }
  return badge;
}

/** Next badge in the student progression (null if already at Elite) */
export function getNextBadge(current: BadgeDefinition): BadgeDefinition | null {
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

/** Build the badge numbers from the student stats slice and/or a user object. */
export function progressOf(
  stats?: (Partial<BadgeProgress> & { badgeCompletedCourses?: number }) | null,
  user?: { createdAt?: string | null; completedCourses?: number; completedMasterclasses?: number; quizzesTaken?: number; avgQuizScore?: number | null } | null,
): BadgeProgress {
  return {
    completedCourses: stats?.badgeCompletedCourses ?? stats?.completedCourses ?? user?.completedCourses ?? 0,
    completedMasterclasses: stats?.completedMasterclasses ?? user?.completedMasterclasses ?? 0,
    quizzesTaken: stats?.quizzesTaken ?? user?.quizzesTaken ?? 0,
    avgQuizScore: stats?.avgQuizScore ?? user?.avgQuizScore ?? null,
    memberSince: stats?.memberSince ?? user?.createdAt ?? null,
  };
}
