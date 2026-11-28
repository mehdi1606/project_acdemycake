/**
 * MemberProfilePage — /members/:id
 *
 * Another member's profile, Spotify style: big photo and name, their 3D badge and how
 * close they are to the next one, and what they have achieved. Signed-in members only.
 * Contact details and marks are never sent by the server.
 */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import memberService, { MemberBadgeCheck, MemberProfile } from '../../services/api/member.service';
import { BADGES, BadgeCheck, badgeSrcSet } from '../../config/badges';
import { useCheckLabel } from '../../components/BadgeRequirementList';
import AvatarImage from '../../components/AvatarImage';
import { getFileUrl } from '../../environment';
import { all_routes } from '../router/all_routes';
import './member-profile.css';

const fmtMonthYear = (iso: string | undefined, lang: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  try {
    return d.toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang, { month: 'long', year: 'numeric' });
  } catch {
    return d.toLocaleDateString();
  }
};

const MemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const label = useCheckLabel();
  const [p, setP] = useState<MemberProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setState('loading');
    memberService.get(id)
      .then((r) => { if (alive) { setP(r); setState('ok'); } })
      .catch(() => { if (alive) setState('missing'); });
    return () => { alive = false; };
  }, [id]);

  if (state === 'loading') {
    return (
      <div className="mp mp--loading" aria-busy="true">
        <div className="mp-hero"><div className="mp-wrap mp-hero__in"><span className="mp-skel mp-skel--avatar" /><span className="mp-skel mp-skel--name" /></div></div>
      </div>
    );
  }
  if (state === 'missing' || !p) {
    return (
      <div className="mp">
        <div className="mp-wrap mp-missing">
          <i className="isax isax-profile-delete" />
          <h1>{t('member.notFound', 'This profile is not available')}</h1>
          <Link to={all_routes.community} className="mp-btn">{t('member.backToCommunity', 'Back to the community')}</Link>
        </div>
      </div>
    );
  }

  const badge = BADGES[Math.min(BADGES.length, Math.max(1, p.badgeId)) - 1];
  const next = p.nextBadgeId ? BADGES[p.nextBadgeId - 1] : null;
  const since = fmtMonthYear(p.memberSince, i18n.language);
  const roleLabel = p.role === 'INSTRUCTOR'
    ? t('member.roleInstructor', 'Instructor')
    : p.role === 'ADMIN' ? t('member.roleAdmin', 'SARALÖWE team') : t('member.roleMember', 'Member');

  const stats = [
    { icon: 'isax-teacher', value: p.completedCourses, label: t('member.statCourses', 'courses completed') },
    { icon: 'isax-crown-1', value: p.masterclasses, label: t('member.statMasterclasses', 'masterclasses attended') },
    { icon: 'isax-message-text', value: p.communityPosts, label: t('member.statPosts', 'community posts') },
  ];

  const haveText = (c: MemberBadgeCheck) => {
    if (c.met) return t('badges.req.done', 'done');
    if (c.have === undefined || c.have === null || c.need === undefined) return t('badges.req.notYet', 'not yet');
    return `${Math.min(c.have, c.need)}/${c.need}`;
  };

  return (
    <div className="mp" style={{ ['--mp-accent' as any]: badge.color }}>
      {/* ── Hero ── */}
      <section className="mp-hero">
        <div className="mp-wrap mp-hero__in">
          <div className="mp-avatar">
            <AvatarImage src={p.avatarUrl ? getFileUrl(p.avatarUrl) : null} name={p.fullName} alt={p.fullName} />
            <img className="mp-avatar__badge" src={badge.image} srcSet={badgeSrcSet(badge.image)} sizes="72px" alt={t(badge.nameKey)} />
          </div>
          <div className="mp-hero__copy">
            <span className="mp-kicker">{p.me ? t('member.yourProfile', 'Your profile') : t('member.profile', 'Profile')} · {roleLabel}</span>
            <h1 className="mp-name" dir="auto">{p.fullName}</h1>
            <p className="mp-meta">
              <span className="mp-meta__badge">{t(badge.nameKey)}{!p.badgeEarned ? ` · ${t('member.inProgress', 'in progress')}` : ''}</span>
              {since && <span>{t('member.since', 'Member since {{date}}', { date: since })}</span>}
            </p>
            <div className="mp-actions">
              {p.instagram && (
                <a className="mp-social" href={p.instagram} target="_blank" rel="noopener noreferrer nofollow">
                  <i className="fa-brands fa-instagram" /> Instagram
                </a>
              )}
              {p.tiktok && (
                <a className="mp-social" href={p.tiktok} target="_blank" rel="noopener noreferrer nofollow">
                  <i className="fa-brands fa-tiktok" /> TikTok
                </a>
              )}
              {p.me && (
                <Link className="mp-social mp-social--ghost" to={all_routes.studentSocialProfile}>
                  <i className="isax isax-edit-2" /> {t('member.editLinks', 'Edit my links')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mp-wrap mp-body">
        {p.me && <p className="mp-note"><i className="isax isax-eye" /> {t('member.howOthersSee', 'This is how other members see your profile.')}</p>}

        {/* ── Achievements ── */}
        <section className="mp-stats" aria-label={t('member.achievements', 'Achievements')}>
          {stats.map((s) => (
            <div key={s.label} className="mp-stat">
              <i className={`isax ${s.icon}`} aria-hidden="true" />
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
          {p.challenge?.registered && (
            <Link to={all_routes.challenge} className="mp-stat mp-stat--challenge">
              <i className="isax isax-cake" aria-hidden="true" />
              <b>2027</b>
              <span>{t('member.challengeIn', 'In the New Year Cake Challenge')}</span>
            </Link>
          )}
        </section>

        {/* ── Badge ── */}
        <section className="mp-badge">
          <div className="mp-badge__art">
            <img src={badge.image} srcSet={badgeSrcSet(badge.image)} sizes="180px" alt="" />
          </div>
          <div className="mp-badge__copy">
            <span className="mp-kicker mp-kicker--dark">{t('member.currentBadge', 'Current badge')}</span>
            <h2>{t(badge.nameKey)}</h2>
            {badge.mottoKey && <p className="mp-motto">{t(badge.mottoKey)}</p>}

            {next && (
              <div className="mp-next">
                <div className="mp-next__head">
                  <span>{next.id === badge.id ? t('badges.req.toEarn', 'To earn') : t('badges.popup.nextLevel', 'Next Level')}</span>
                  <b style={{ color: next.color }}>{t(next.nameKey)}</b>
                  <em>{p.nextBadgePercent ?? 0}%</em>
                </div>
                <div className="mp-bar"><span style={{ width: `${p.nextBadgePercent ?? 0}%`, background: `linear-gradient(90deg, ${badge.color}, ${next.color})` }} /></div>
                <ul className="mp-checks">
                  {(p.nextBadgeChecks ?? []).map((c) => (
                    <li key={c.kind} className={c.met ? 'is-met' : ''}>
                      <span className="mp-tick" aria-hidden="true">{c.met ? '✓' : ''}</span>
                      <span className="mp-checks__label">{label({ kind: c.kind, have: c.have ?? 0, need: c.need ?? 1, met: c.met } as BadgeCheck)}</span>
                      <span className="mp-checks__have">{haveText(c)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!next && p.role === 'STUDENT' && (
              <p className="mp-top">{t('member.topLevel', 'The highest level of the academy.')}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MemberProfilePage;
