/**
 * SARALÖWE Academy — Badge System Configuration
 *
 * Hierarchy (students, by completed courses):
 *   1  Apprentice         — 0  completed courses  (brand new)
 *   2  Commis Chef        — 1+ completed courses
 *   3  Sous Chef          — 3+ completed courses
 *   4  Chef de Partie     — 6+ completed courses
 *   5  Executive Chef     — 12+ completed courses
 *   6  Master Chef        — 20+ completed courses
 *   7  Elite              — 35+ completed courses
 *
 * Special roles:
 *   8  Instructor         — role === 'INSTRUCTOR'
 *   9  Admin              — role === 'ADMIN'
 */

export interface BadgeDefinition {
  id: number;
  /** i18n key used to resolve name */
  nameKey: string;
  /** i18n key used to resolve description */
  descKey: string;
  /** Minimum completed-course count (ignored for special role badges) */
  minCourses: number;
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
    id: 1,
    nameKey: 'badges.apprentice.name',
    descKey: 'badges.apprentice.desc',
    minCourses: 0,
    image: '/images/badges/badge-1.png',
    color: '#e8a4b8',
    stars: 1,
  },
  {
    id: 2,
    nameKey: 'badges.commisChef.name',
    descKey: 'badges.commisChef.desc',
    minCourses: 1,
    image: '/images/badges/badge-2.png',
    color: '#c8a96e',
    stars: 1,
  },
  {
    id: 3,
    nameKey: 'badges.sousChef.name',
    descKey: 'badges.sousChef.desc',
    minCourses: 3,
    image: '/images/badges/badge-3.png',
    color: '#b8973e',
    stars: 2,
  },
  {
    id: 4,
    nameKey: 'badges.chefDePartie.name',
    descKey: 'badges.chefDePartie.desc',
    minCourses: 6,
    image: '/images/badges/badge-4.png',
    color: '#c0392b',
    stars: 2,
  },
  {
    id: 5,
    nameKey: 'badges.executiveChef.name',
    descKey: 'badges.executiveChef.desc',
    minCourses: 12,
    image: '/images/badges/badge-5.png',
    color: '#2e7d52',
    stars: 3,
  },
  {
    id: 6,
    nameKey: 'badges.masterChef.name',
    descKey: 'badges.masterChef.desc',
    minCourses: 20,
    image: '/images/badges/badge-6.png',
    color: '#c8a030',
    stars: 4,
  },
  {
    id: 7,
    nameKey: 'badges.elite.name',
    descKey: 'badges.elite.desc',
    minCourses: 35,
    image: '/images/badges/badge-7.png',
    color: '#d4a017',
    stars: 5,
  },
  {
    id: 8,
    nameKey: 'badges.instructor.name',
    descKey: 'badges.instructor.desc',
    minCourses: 0,
    role: 'INSTRUCTOR',
    image: '/images/badges/badge-8.png',
    color: '#2e7d52',
    stars: 0,
  },
  {
    id: 9,
    nameKey: 'badges.admin.name',
    descKey: 'badges.admin.desc',
    minCourses: 0,
    role: 'ADMIN',
    image: '/images/badges/badge-9.png',
    color: '#1565c0',
    stars: 0,
  },
];

/**
 * Resolve the badge for a given user.
 *
 * @param role            - user role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
 * @param completedCourses - number of courses the student has fully completed
 */
export function getBadgeForUser(
  role: string,
  completedCourses: number,
): BadgeDefinition {
  if (role === 'ADMIN') return BADGES[8];      // badge 9
  if (role === 'INSTRUCTOR') return BADGES[7]; // badge 8

  // Student progression — pick the highest badge whose threshold is met
  let badge = BADGES[0]; // Apprentice — always at least this
  for (const b of BADGES.slice(0, 7)) {
    if (completedCourses >= b.minCourses) badge = b;
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
