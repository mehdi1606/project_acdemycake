/**
 * "What's new" patch notes, shown once to every signed-in user after an update
 * (and reopenable from the profile menu). Add a new entry at the TOP for each release;
 * its `id` decides who has already seen it.
 */
export type PatchTag = 'new' | 'changed' | 'improved' | 'admin';
export type Audience = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface PatchItem {
  tag: PatchTag;
  icon: string;               // isax icon class
  titleKey: string; title: string;
  textKey: string;  text: string;
  /** Who sees this line (default: everyone). */
  audience?: Audience[];
  /** Show the 7 student badges under this line. */
  showBadges?: boolean;
}

export interface Release {
  id: string;
  version: string;            // "2.0"
  date: string;               // ISO date
  nameKey: string; name: string;
  items: PatchItem[];
}

export const RELEASES: Release[] = [
  {
    id: '2026-11-25-brigade',
    version: '2.0',
    date: '2026-11-25',
    nameKey: 'whatsNew.r20.name', name: 'The Brigade Update',
    items: [
      {
        tag: 'new', icon: 'isax-medal-star', showBadges: true, audience: ['STUDENT'],
        titleKey: 'whatsNew.r20.ladderTitle', title: 'The Brigade badge ladder',
        textKey: 'whatsNew.r20.ladderText',
        text: 'Seven levels, from Apprentice to Elite. Each one asks for certificates, good marks, regular practice, sharing with the community and masterclasses. Open your badge to see exactly what your next level needs.',
      },
      {
        tag: 'new', icon: 'isax-shield-tick', audience: ['STUDENT'],
        titleKey: 'whatsNew.r20.keepTitle', title: 'Nobody goes down',
        textKey: 'whatsNew.r20.keepText',
        text: 'You keep the badge you already had. The new, harder rules only decide your next level-ups.',
      },
      {
        tag: 'new', icon: 'isax-crown-1',
        titleKey: 'whatsNew.r20.eliteTitle', title: "Elite: the chef's blessing",
        textKey: 'whatsNew.r20.eliteText',
        text: 'The top badge is now approved personally by Chef Sara: your signature showpiece, on top of two years of excellence.',
      },
      {
        tag: 'changed', icon: 'isax-award',
        titleKey: 'whatsNew.r20.certTitle', title: 'Certificates come from your assignment',
        textKey: 'whatsNew.r20.certText',
        text: 'A certificate is earned by passing the course assignment (70% or more), after finishing every lesson and quiz. A first mark that fails allows one resubmission.',
      },
      {
        tag: 'improved', icon: 'isax-home-2',
        titleKey: 'whatsNew.r20.topbarTitle', title: 'Move freely from your dashboard',
        textKey: 'whatsNew.r20.topbarText',
        text: 'The top bar now has Home, Masterclasses, Ebooks and Academy. On phones, tap the house icon. Search is a small icon that opens when you point at it or tap it.',
      },
      {
        tag: 'admin', icon: 'isax-people', audience: ['ADMIN'],
        titleKey: 'whatsNew.r20.adminTitle', title: 'Manage Users: badges with their numbers',
        textKey: 'whatsNew.r20.adminText',
        text: "Each student shows their badge, certificates, quiz and assignment averages and days as a member. From Master Chef, an \"Approve Elite showpiece\" button appears.",
      },
    ],
  },
];

export const LATEST_RELEASE = RELEASES[0];
export const OPEN_WHATS_NEW_EVENT = 'sl:open-whats-new';
export const openWhatsNew = () => window.dispatchEvent(new CustomEvent(OPEN_WHATS_NEW_EVENT));
