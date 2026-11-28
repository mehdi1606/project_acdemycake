/**
 * The New Year Cake Challenge 2027: story, dates, how to enter, the student's
 * own entry, the gallery with live ranking and voting, and the official rules.
 * Every rule is enforced by the server; this page only explains and asks.
 */
import MemberLink from '../../components/MemberLink';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import { useAppSelector } from '../../core/redux/hooks';
import { extractApiError } from '../../services/api/error.utils';
import { challengeService, ChallengeView, EntryCard, MyStatus } from '../../services/api/challenge.service';
import { moroccoDate, nextMilestone, phaseAt, refreshChallenge, serverNow, timeLeft } from '../../components/challenge/useChallenge';
import './challenge.css';
import { SLUG, VoteButton } from './ChallengeParts';
import ShareBar from '../../components/challenge/ShareBar';

const A = `${process.env.PUBLIC_URL}/assets/challenge/`;

const ChallengePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [ch, setCh] = useState<ChallengeView | null>(null);
  const [me, setMe] = useState<MyStatus | null>(null);
  const [cards, setCards] = useState<EntryCard[]>([]);
  const [loadError, setLoadError] = useState('');
  const [, tick] = useState(0);
  const [open, setOpen] = useState<EntryCard | null>(null);
  const [voteMsg, setVoteMsg] = useState('');
  const [busyVote, setBusyVote] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'rank' | 'new' | 'discover'>('rank');
  const filmSrc = `${A}how-to-enter-${lang.startsWith('ar') ? 'ar' : 'en'}.mp4`;
  const [filmOk, setFilmOk] = useState(false);
  useEffect(() => {
    // Show the film frame only once the film file is really there.
    let live = true;
    fetch(filmSrc, { method: 'HEAD' })
      .then((r) => { if (live) setFilmOk(r.ok && (r.headers.get('content-type') || '').includes('video')); })
      .catch(() => { if (live) setFilmOk(false); });
    return () => { live = false; };
  }, [filmSrc]);

  const loadAll = useCallback(async () => {
    try {
      const [v, g] = await Promise.all([challengeService.view(SLUG), challengeService.gallery(SLUG)]);
      setCh(v);
      setCards(g);
      setLoadError('');
    } catch (e) {
      setLoadError(extractApiError(e, t('challenge.loadError', 'The challenge could not be loaded. Please try again.')));
    }
  }, [t]);

  const loadMe = useCallback(async () => {
    if (!isAuthenticated) { setMe(null); return; }
    try { setMe(await challengeService.me(SLUG)); } catch { setMe(null); }
  }, [isAuthenticated]);

  useEffect(() => { loadAll(); refreshChallenge(); }, [loadAll]);
  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => { const id = window.setInterval(() => tick((n) => n + 1), 1000); return () => window.clearInterval(id); }, []);
  // live ranking: refresh the gallery every 30 s while voting is open
  const phase = ch ? phaseAt(ch, serverNow()) : null;
  useEffect(() => {
    if (phase !== 'VOTING') return;
    const id = window.setInterval(() => challengeService.gallery(SLUG).then(setCards).catch(() => {}), 30_000);
    return () => window.clearInterval(id);
  }, [phase]);

  const left = ch && phase ? timeLeft(nextMilestone(ch, phase)) : null;
  const voted = useMemo(() => new Set(me?.votedEntryIds ?? []), [me]);
  const myEntryId = me?.entry?.id;

  const vote = async (card: EntryCard) => {
    setVoteMsg('');
    if (!isAuthenticated) return;
    setBusyVote(card.id);
    try {
      const ids = voted.has(card.id)
        ? await challengeService.unvote(SLUG, card.id)
        : await challengeService.vote(SLUG, card.id);
      setMe((m) => (m ? { ...m, votedEntryIds: ids } : m));
      const g = await challengeService.gallery(SLUG);
      setCards(g);
      setOpen((o) => (o ? g.find((x) => x.id === o.id) ?? o : o));
    } catch (e) {
      setVoteMsg(extractApiError(e, t('challenge.voteError', 'Your vote could not be saved.')));
    } finally {
      setBusyVote(null);
    }
  };

  const phaseLine = (() => {
    if (!ch || !phase) return '';
    const close = moroccoDate(ch.submissionsCloseAt, lang);
    const vClose = moroccoDate(ch.votingCloseAt, lang);
    const res = moroccoDate(ch.resultsAt, lang);
    switch (phase) {
      case 'UPCOMING': return t('challenge.phase.upcoming', 'Opening soon');
      case 'SUBMISSIONS': return t('challenge.phase.submissions', { date: close, defaultValue: 'Entries open until {{date}}' });
      case 'BETWEEN': return t('challenge.phase.between', 'Entries are closed. Voting opens at midnight.');
      case 'VOTING': return t('challenge.phase.voting', { date: vClose, defaultValue: 'Voting is open until {{date}}' });
      case 'TALLYING': return t('challenge.phase.tallying', { date: res, defaultValue: 'Votes are being counted. Results on {{date}}' });
      case 'RESULTS': return t('challenge.phase.results', 'The winners are announced');
      default: return t('challenge.phase.closed', 'This challenge is closed');
    }
  })();

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? cards.filter((c) => `${c.title} ${c.authorName}`.toLowerCase().includes(needle)) : cards.slice();
    if (sort === 'new') list.sort((a, b) => (b.approvedAt || '').localeCompare(a.approvedAt || ''));
    if (sort === 'discover') {
      // a stable shuffle that changes every day, so every cake gets its moment at the top
      const day = Math.floor(Date.now() / 86_400_000);
      const h = (id: string) => { let x = day; for (let i = 0; i < id.length; i++) x = (x * 31 + id.charCodeAt(i)) >>> 0; return x; };
      list.sort((a, b) => h(a.id) - h(b.id));
    }
    return list;
  }, [cards, q, sort]);
  const myCard = cards.find((c) => c.id === myEntryId) || null;
  const shareText = t('challenge.share.challengeText', 'The New Year Cake Challenge at SARALÖWE Academy: one tier, one night of celebration. Enter or vote:');

  const podium = (phase === 'VOTING' || phase === 'TALLYING' || phase === 'RESULTS') ? cards.filter((c) => c.points > 0).slice(0, 3) : [];

  return (
    <div className="ch-page">
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="ch-hero">
        <div className="ch-hero__sky" aria-hidden="true"><span /><span /><span /></div>
        <div className="ch-hero__veil" aria-hidden="true" />
        <div className="ch-hero__inner">
          <p className="ch-eyebrow">{t('challenge.eyebrow', 'SARALÖWE Academy presents')}</p>
          <div className="ch-year" aria-hidden="true">2027</div>
          <h1 className="ch-title">{t('challenge.title', 'The New Year Cake Challenge')}</h1>
          <p className="ch-lead">{t('challenge.lead', 'One tier. One night of celebration. Show the academy how you welcome the new year, and let everyone vote for the most beautiful cake.')}</p>
          {phase && <p className="ch-phase"><span className="ch-dot" />{phaseLine}</p>}
          {left && !left.done && (
            <div className="ch-clock" role="timer" aria-label={t('challenge.countdown', 'Time left')}>
              <div><b>{left.d}</b><small>{t('challenge.days', 'days')}</small></div>
              <div><b>{left.h}</b><small>{t('challenge.hours', 'hours')}</small></div>
              <div><b>{left.m}</b><small>{t('challenge.minutes', 'min')}</small></div>
              <div><b>{left.s}</b><small>{t('challenge.seconds', 'sec')}</small></div>
            </div>
          )}
          <div className="ch-cta">
            {(phase === 'SUBMISSIONS' || phase === 'UPCOMING') && <a href="#ch-take-part" className="ch-btn ch-btn--gold">{t('challenge.ctaEnter', 'Enter the challenge')}</a>}
            {(phase === 'VOTING') && <a href="#ch-gallery" className="ch-btn ch-btn--gold">{t('challenge.ctaVote', 'Vote now')}</a>}
            {(phase === 'TALLYING' || phase === 'RESULTS' || phase === 'BETWEEN') && <a href="#ch-gallery" className="ch-btn ch-btn--gold">{t('challenge.ctaGallery', 'See the cakes')}</a>}
            <a href="#ch-rules" className="ch-btn ch-btn--line">{t('challenge.ctaRules', 'Read the rules')}</a>
          </div>
        </div>
      </section>

      {loadError && <div className="ch-wrap"><p className="ch-alert">{loadError}</p></div>}

      {/* ── dates ────────────────────────────────────────────────────────── */}
      {ch && (
        <section className="ch-wrap ch-timeline" aria-label={t('challenge.datesTitle', 'Key dates')}>
          {[
            { k: 'SUBMISSIONS', label: t('challenge.t1', 'Register & submit'), date: `${moroccoDate(ch.submissionsOpenAt, lang)} – ${moroccoDate(ch.submissionsCloseAt, lang)}`, note: t('challenge.t1n', 'until 23:59') },
            { k: 'VOTING', label: t('challenge.t2', 'Voting'), date: `${moroccoDate(ch.votingOpenAt, lang)} – ${moroccoDate(ch.votingCloseAt, lang, true)}`, note: t('challenge.t2n', 'live ranking') },
            { k: 'RESULTS', label: t('challenge.t3', 'Winners'), date: moroccoDate(ch.resultsAt, lang, true), note: t('challenge.t3n', 'announced on the platform') },
          ].map((s, i) => {
            const order = ['UPCOMING', 'SUBMISSIONS', 'BETWEEN', 'VOTING', 'TALLYING', 'RESULTS'];
            const cur = order.indexOf(phase || '');
            const mine = order.indexOf(s.k);
            const state = cur > mine || (s.k === 'SUBMISSIONS' && cur >= 2) ? 'done' : (cur === mine || (s.k === 'RESULTS' && cur === 4)) ? 'now' : 'next';
            return (
              <div key={s.k} className={`ch-step ch-step--${state}`}>
                <span className="ch-step__n">{i + 1}</span>
                <div>
                  <h3>{s.label}</h3>
                  <p className="ch-step__date">{s.date}</p>
                  <p className="ch-step__note">{s.note}</p>
                </div>
              </div>
            );
          })}
          <p className="ch-tz">{t('challenge.tz', 'All times are Morocco local time.')}</p>
        </section>
      )}

      {/* ── quick navigation (stays under the header while scrolling) ───── */}
      <nav className="ch-subnav" aria-label={t('challenge.nav.label', 'On this page')}>
        <div className="ch-wrap ch-subnav__in">
          <a href="#ch-how">{t('challenge.nav.how', 'How to enter')}</a>
          <a href="#ch-take-part">{t('challenge.nav.take', 'My entry')}</a>
          <a href="#ch-gallery">{t('challenge.nav.gallery', 'Gallery')}</a>
          <a href="#ch-faq">{t('challenge.nav.faq', 'FAQ')}</a>
          <a href="#ch-rules">{t('challenge.nav.rules', 'Rules')}</a>
        </div>
      </nav>

      {/* ── how to take part + your entry, side by side ───────────────────── */}
      <section id="ch-how" className="ch-wrap ch-join">
        <div className="ch-join__steps">
          <div className="ch-head ch-head--start">
            <p className="ch-kicker">{t('challenge.howKicker', 'How to take part')}</p>
            <h2>{t('challenge.howTitle', 'Four steps to the gallery')}</h2>
          </div>
          {filmOk && (
            <div className="ch-film">
              <video className="ch-film__video" controls playsInline preload="metadata" poster={`${A}film-poster.jpg`} src={filmSrc} />
            </div>
          )}
          <ol className="ch-steps">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="ch-steps__item">
                <span className="ch-steps__num" aria-hidden="true">{n}</span>
                <div>
                  <h3><i className={`isax ${['isax-edit-2', 'isax-cake', 'isax-camera', 'isax-send-2'][n - 1]}`} aria-hidden="true" /> {t(`challenge.step${n}.title`, ['Register', 'Create one tier', 'Photograph on white', 'Submit & certify'][n - 1])}</h3>
                  <p>{t(`challenge.step${n}.text`, [
                    'Join the challenge from this page before 25 December.',
                    'One single tier, real or dummy, in any technique: fondant, buttercream, ganache, modelling, airbrush, painting…',
                    '3 to 5 photos on a completely white background and white surface, with at least one full front view.',
                    'Upload your photos, certify that you made the cake yourself, and wait for the academy to approve it.',
                  ][n - 1])}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div id="ch-take-part" className="ch-join__panel">
          <div className="ch-panel">
            <TakePart
              ch={ch} phase={phase} me={me} isAuthenticated={isAuthenticated} role={user?.role} myCard={myCard}
              from={location.pathname} onChange={(m) => { setMe(m); loadAll(); }}
            />
          </div>
        </div>
      </section>

      {/* ── gallery & live ranking ───────────────────────────────────────── */}
      <section id="ch-gallery" className="ch-gallery">
        <div className="ch-wrap">
          <div className="ch-gallery__top">
            <div className="ch-head ch-head--start">
              <p className="ch-kicker">{phase === 'VOTING' ? t('challenge.liveRanking', 'Live ranking') : t('challenge.galleryKicker', 'The gallery')}</p>
              <h2>{phase === 'RESULTS' ? t('challenge.winnersTitle', 'Our New Year champions') : t('challenge.galleryTitle', 'The cakes of 2027')}</h2>
              {phase === 'SUBMISSIONS' && <p className="ch-sub">{t('challenge.galleryWait', 'Approved cakes appear here. Voting opens on 26 December.')}</p>}
            </div>
            {ch && (
              <div className="ch-live__stats">
                <span className="ch-live__tag"><span className="ch-live__dot" aria-hidden="true" />{t('challenge.live.tag', 'Live')}</span>
                {[
                  { n: ch.registrations, l: t('challenge.live.registered', 'registered') },
                  { n: ch.approvedEntries, l: t('challenge.live.cakes', 'cakes in the gallery') },
                  { n: ch.totalVotes, l: t('challenge.live.votes', 'votes cast') },
                  { n: ch.voters, l: t('challenge.live.voters', 'voters') },
                ].map((x) => (
                  <div key={x.l} className="ch-live__stat"><b>{x.n}</b><span>{x.l}</span></div>
                ))}
              </div>
            )}
          </div>

          <ul className="ch-points">
            <li><b>1</b>{t('challenge.ptStudent', 'point for a student vote')}</li>
            <li><b>10</b>{t('challenge.ptStaff', 'points for an instructor or admin vote')}</li>
            <li><b>{ch?.minVoters ?? 3}+</b>{t('challenge.ptMin', 'different accounts must vote for a cake before it can win')}</li>
          </ul>

          {voteMsg && <p className="ch-alert" role="alert">{voteMsg}</p>}
          {cards.length > 0 && (
            <div className="ch-tools">
              <label className="ch-search">
                <i className="isax isax-search-normal-1" aria-hidden="true" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('challenge.tools.search', 'Search a cake or a student')} aria-label={t('challenge.tools.search', 'Search a cake or a student')} />
              </label>
              <div className="ch-sort" role="radiogroup" aria-label={t('challenge.tools.sort', 'Sort')}>
                {([['rank', t('challenge.tools.rank', 'Ranking')], ['new', t('challenge.tools.new', 'Newest')], ['discover', t('challenge.tools.discover', 'Discover')]] as const).map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={sort === k} className={sort === k ? 'is-on' : ''} onClick={() => setSort(k)}>{l}</button>
                ))}
              </div>
            </div>
          )}

          {podium.length > 0 && (
            <div className="ch-podium">
              {podium.map((c) => (
                <button key={c.id} type="button" className={`ch-podium__item ch-podium__item--${c.rank}`} onClick={() => setOpen(c)}>
                  <span className="ch-podium__medal">{c.rank}</span>
                  <img src={c.photos[0]} alt={c.title} loading="lazy" />
                  <span className="ch-podium__name">{c.title}</span>
                  <span className="ch-podium__pts">{t('challenge.points', { count: c.points, defaultValue: '{{count}} pts' })}</span>
                </button>
              ))}
            </div>
          )}

          {cards.length > 0 && shown.length === 0 && <p className="ch-empty">{t('challenge.tools.none', 'No cake matches your search.')}</p>}
          {cards.length === 0 ? (
            <div className="ch-empty ch-empty--art">
              <i className="isax isax-cake" aria-hidden="true" />
              <p>{t('challenge.galleryEmpty', 'The first approved cakes will appear here soon.')}</p>
            </div>
          ) : (
            <div className="ch-grid">
              {shown.map((c) => (
                <article key={c.id} className="ch-entry">
                  <button type="button" className="ch-entry__photo" onClick={() => setOpen(c)} aria-label={t('challenge.openCake', { title: c.title, defaultValue: 'Open {{title}}' })}>
                    <img src={c.photos[0]} alt={c.title} loading="lazy" />
                    {(phase === 'VOTING' || phase === 'TALLYING' || phase === 'RESULTS') && <span className="ch-entry__rank">#{c.rank}</span>}
                  </button>
                  <div className="ch-entry__body">
                    <h3><Link to={`${all_routes.challenge}/cake/${c.id}`}>{c.title}</Link></h3>
                    <p className="ch-entry__by">
                      <MemberLink id={c.authorId} name={c.authorName}>{t('challenge.by', { name: c.authorName, defaultValue: 'by {{name}}' })}</MemberLink>
                    </p>
                    <div className="ch-entry__foot">
                      <span className="ch-entry__pts">
                        <b>{c.points}</b> {t('challenge.pts', 'pts')}
                        <small>{t('challenge.voters', { count: c.voters, defaultValue: '{{count}} voters' })}</small>
                      </span>
                      <VoteButton card={c} phase={phase} voted={voted.has(c.id)} own={c.id === myEntryId}
                        busy={busyVote === c.id} isAuthenticated={isAuthenticated} emailVerified={me?.emailVerified ?? true}
                        onVote={() => vote(c)} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {ch && (
            <div className="ch-invite">
              <div>
                <h3>{t('challenge.invite.title', 'Bring your people')}</h3>
                <p>{t('challenge.invite.text', 'Invite friends and family: anyone with a free account can vote, and every vote counts.')}</p>
              </div>
              <ShareBar url={challengeService.shareUrl(SLUG)} text={shareText} dark />
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ + rules, side by side ─────────────────────────────────────── */}
      <section className="ch-wrap ch-info">
        <div id="ch-faq" className="ch-info__col">
          <div className="ch-head ch-head--start">
            <p className="ch-kicker">{t('challenge.faq.kicker', 'Questions')}</p>
            <h2>{t('challenge.faq.title', 'Good to know')}</h2>
          </div>
          <div className="ch-faq__list">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <details key={n} className="ch-faq__item">
                <summary>{t(`challenge.faq.q${n}`)}</summary>
                <p>{t(`challenge.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
        <div id="ch-rules" className="ch-info__col">
          <div className="ch-head ch-head--start">
            <p className="ch-kicker">{t('challenge.rulesKicker', 'Official competition rules')}</p>
            <h2>{t('challenge.rulesTitle', 'The rules')}</h2>
          </div>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
            const items = t(`challenge.rules.r${n}.items`, { returnObjects: true }) as unknown;
            return (
              <details key={n} className="ch-rule" open={n === 1}>
                <summary><span>{n}</span>{t(`challenge.rules.r${n}.title`)}</summary>
                <ul>{Array.isArray(items) && (items as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul>
              </details>
            );
          })}
        </div>
      </section>
      <p className="ch-wrap ch-goal">{t('challenge.rules.goal', 'The goal is to celebrate creativity, originality, technical skill and the artistic talent of SARALÖWE Academy students.')}</p>

      {open && (
        <Lightbox card={open} onClose={() => setOpen(null)} shareUrl={challengeService.shareUrl(SLUG, open.id)}
          voteButton={<VoteButton card={open} phase={phase} voted={voted.has(open.id)} own={open.id === myEntryId}
            busy={busyVote === open.id} isAuthenticated={isAuthenticated} emailVerified={me?.emailVerified ?? true}
            onVote={() => vote(open)} />} />
      )}
    </div>
  );
};

/* ── lightbox ─────────────────────────────────────────────────────────────── */
const Lightbox: React.FC<{ card: EntryCard; onClose: () => void; voteButton: React.ReactNode; shareUrl: string }> = ({ card, onClose, voteButton, shareUrl }) => {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % card.photos.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + card.photos.length) % card.photos.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [card.photos.length, onClose]);
  return (
    <div className="ch-lb" role="dialog" aria-modal="true" aria-label={card.title} onClick={onClose}>
      <div className="ch-lb__box" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="ch-lb__close" onClick={onClose} aria-label={t('challenge.close', 'Close')}>✕</button>
        <div className="ch-lb__stage">
          <img src={card.photos[i]} alt={`${card.title} ${i + 1}/${card.photos.length}`} />
          {card.photos.length > 1 && (
            <>
              <button type="button" className="ch-lb__nav ch-lb__nav--prev" onClick={() => setI((x) => (x - 1 + card.photos.length) % card.photos.length)} aria-label={t('challenge.prevPhoto', 'Previous photo')}>‹</button>
              <button type="button" className="ch-lb__nav ch-lb__nav--next" onClick={() => setI((x) => (x + 1) % card.photos.length)} aria-label={t('challenge.nextPhoto', 'Next photo')}>›</button>
            </>
          )}
        </div>
        <div className="ch-lb__thumbs">
          {card.photos.map((p, k) => (
            <button key={p} type="button" className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}`}><img src={p} alt="" /></button>
          ))}
        </div>
        <div className="ch-lb__info">
          <div>
            <h3>{card.title}</h3>
            <p className="ch-entry__by">
              <MemberLink id={card.authorId} name={card.authorName} style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {t('challenge.by', { name: card.authorName, defaultValue: 'by {{name}}' })}
              </MemberLink>
            </p>
            {card.description && <p className="ch-lb__desc">{card.description}</p>}
            <div className="ch-lb__share">
              <ShareBar url={shareUrl} text={t('challenge.share.cakeText', { title: card.title, defaultValue: 'Vote for “{{title}}” in the SARALÖWE New Year Cake Challenge:' })} />
              <Link to={`${all_routes.challenge}/cake/${card.id}`} className="ch-lb__page" onClick={onClose}>{t('challenge.openPage', 'Open its page')} →</Link>
            </div>
          </div>
          <div className="ch-lb__score">
            <span><b>{card.points}</b> {t('challenge.pts', 'pts')} · {t('challenge.voters', { count: card.voters, defaultValue: '{{count}} voters' })}</span>
            {voteButton}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── register / submit ────────────────────────────────────────────────────── */
const TakePart: React.FC<{
  ch: ChallengeView | null; phase: string | null; me: MyStatus | null; isAuthenticated: boolean; role?: string;
  from: string; onChange: (m: MyStatus) => void; myCard: EntryCard | null;
}> = ({ ch, phase, me, isAuthenticated, role, from, onChange, myCard }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  if (!ch) return null;
  const open = phase === 'SUBMISSIONS';

  if (!isAuthenticated) {
    return (
      <div className="ch-take">
        <h2>{t('challenge.takeTitle', 'Take part')}</h2>
        <p>{t('challenge.takeSignedOut', 'Sign in or create a free account to enter the challenge and vote for your favourite cakes.')}</p>
        <div className="ch-cta">
          <Link className="ch-btn ch-btn--gold" to={all_routes.login} state={{ from: `${from}#ch-take-part` }}>{t('challenge.signIn', 'Sign in')}</Link>
          <Link className="ch-btn ch-btn--line" to={all_routes.register}>{t('challenge.createAccount', 'Create a free account')}</Link>
        </div>
      </div>
    );
  }
  if (!me) return null;
  if (role && role !== 'STUDENT') {
    return (
      <div className="ch-take">
        <h2>{t('challenge.staffTitle', 'Your role in the challenge')}</h2>
        <p>{t('challenge.staffText', 'The challenge is for students. As a member of the academy team, your vote counts 10 points during the voting week.')}</p>
      </div>
    );
  }
  if (!me.emailVerified) {
    return (
      <div className="ch-take">
        <h2>{t('challenge.takeTitle', 'Take part')}</h2>
        <p>{t('challenge.verifyFirst', 'Confirm your email address first: open the email we sent you when you created your account. Then come back to register.')}</p>
      </div>
    );
  }

  const register = async () => {
    setBusy(true); setErr('');
    try { onChange(await challengeService.register(ch.slug)); } catch (e) { setErr(extractApiError(e)); } finally { setBusy(false); }
  };

  if (!me.registered) {
    return (
      <div className="ch-take">
        <h2>{t('challenge.takeTitle', 'Take part')}</h2>
        {open || phase === 'UPCOMING' ? (
          <>
            <p>{t('challenge.registerText', 'Participation is free. Register now, then submit your cake before 25 December at 23:59.')}</p>
            <button type="button" className="ch-btn ch-btn--gold" onClick={register} disabled={busy}>{t('challenge.registerBtn', 'Register for the challenge')}</button>
          </>
        ) : (
          <p>{t('challenge.registerClosed', 'Registrations are closed. You can still enjoy the gallery and vote during the voting week.')}</p>
        )}
        {err && <p className="ch-alert" role="alert">{err}</p>}
      </div>
    );
  }

  return (
    <div className="ch-take">
      <h2>{me.entry ? t('challenge.yourEntry', 'Your entry') : t('challenge.submitTitle', 'Submit your cake')}</h2>
      {me.entry && <EntryStatus status={me.entry.status} note={me.entry.adminNote} />}
      {myCard && (
        <div className="ch-mine">
          <img src={myCard.photos[0]} alt="" />
          <div className="ch-mine__body">
            <p className="ch-mine__kicker">{t('challenge.mine.kicker', 'Your cake is in the gallery')}</p>
            <h3>{myCard.title}</h3>
            <div className="ch-mine__nums">
              <span><b>{myCard.rank ? `#${myCard.rank}` : '-'}</b>{t('challenge.mine.rank', 'rank')}</span>
              <span><b>{myCard.points}</b>{t('challenge.pts', 'pts')}</span>
              <span><b>{myCard.voters}</b>{t('challenge.mine.voters', 'voters')}</span>
            </div>
            <p className="ch-mine__hint">{t('challenge.mine.hint', 'Share your cake: the link shows its photo in WhatsApp and Facebook.')}</p>
            <ShareBar url={challengeService.shareUrl(ch.slug, myCard.id)} text={t('challenge.share.myText', { title: myCard.title, defaultValue: 'Vote for my cake “{{title}}” in the SARALÖWE New Year Cake Challenge:' })} />
            <Link className="ch-mine__page" to={`${all_routes.challenge}/cake/${myCard.id}`}>{t('challenge.mine.page', 'Open my cake page')} →</Link>
          </div>
        </div>
      )}
      {open && me.entry?.status !== 'REJECTED' && me.entry?.status !== 'DISQUALIFIED' ? (
        <EntryForm ch={ch} me={me} onSaved={(m) => { onChange(m); setOk(t('challenge.saved', 'Saved. The academy will review your cake before it appears in the gallery.')); }} />
      ) : !me.entry ? (
        <p>{t('challenge.noEntryClosed', 'Submissions are closed. Thank you for registering!')}</p>
      ) : null}
      {ok && <p className="ch-ok" role="status">{ok}</p>}
    </div>
  );
};

const EntryStatus: React.FC<{ status: string; note?: string }> = ({ status, note }) => {
  const { t } = useTranslation();
  const label: Record<string, string> = {
    PENDING: t('challenge.st.pending', 'Waiting for review'),
    APPROVED: t('challenge.st.approved', 'Approved: your cake is in the gallery'),
    CHANGES_REQUESTED: t('challenge.st.changes', 'The academy asks for a change'),
    REJECTED: t('challenge.st.rejected', 'Not accepted'),
    DISQUALIFIED: t('challenge.st.disqualified', 'Disqualified'),
  };
  return (
    <div className={`ch-status ch-status--${status.toLowerCase()}`}>
      <b>{label[status] ?? status}</b>
      {note && <p>{note}</p>}
    </div>
  );
};

const EntryForm: React.FC<{ ch: ChallengeView; me: MyStatus; onSaved: (m: MyStatus) => void }> = ({ ch, me, onSaved }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(me.entry?.title ?? '');
  const [desc, setDesc] = useState(me.entry?.description ?? '');
  const [photos, setPhotos] = useState<string[]>(me.entry?.photos ?? []);
  const [certified, setCertified] = useState(!!me.entry?.certified);
  const [consent, setConsent] = useState(!!me.entry?.publicationConsent);
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setErr('');
    const room = ch.maxPhotos - photos.length;
    const chosen = Array.from(list).slice(0, Math.max(0, room));
    if (list.length > room) setErr(t('challenge.tooMany', { max: ch.maxPhotos, defaultValue: 'You can add {{max}} photos at most.' }));
    for (const f of chosen) {
      setUploading((n) => n + 1);
      try {
        const url = await challengeService.uploadPhoto(ch.slug, f);
        setPhotos((p) => (p.length < ch.maxPhotos ? [...p, url] : p));
      } catch (e) {
        setErr(extractApiError(e));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const move = (i: number) => setPhotos((p) => { const n = [...p]; const [x] = n.splice(i, 1); n.unshift(x); return n; });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (photos.length < ch.minPhotos) { setErr(t('challenge.needPhotos', { min: ch.minPhotos, max: ch.maxPhotos, defaultValue: 'Add between {{min}} and {{max}} photos.' })); return; }
    setSaving(true);
    try {
      onSaved(await challengeService.saveEntry(ch.slug, { title, description: desc, photos, certified, publicationConsent: consent }));
    } catch (er) {
      setErr(extractApiError(er));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ch-form" onSubmit={save}>
      <label className="ch-field">
        <span>{t('challenge.fTitle', 'Name of your cake')}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required placeholder={t('challenge.fTitlePh', 'e.g. Midnight in Marrakech')} />
      </label>
      <label className="ch-field">
        <span>{t('challenge.fDesc', 'Tell us about it (optional)')}</span>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} rows={3} placeholder={t('challenge.fDescPh', 'Your idea, techniques, the story behind the design…')} />
      </label>

      <div className="ch-field">
        <span>{t('challenge.fPhotos', { min: ch.minPhotos, max: ch.maxPhotos, defaultValue: 'Photos ({{min}} to {{max}})' })}</span>
        <ul className="ch-tips">
          <li>{t('challenge.tip1', 'Completely white background and white table or surface')}</li>
          <li>{t('challenge.tip2', 'At least one full front view; close-ups of details are welcome')}</li>
          <li>{t('challenge.tip3', 'No collages, filters that change the cake, or watermarks')}</li>
        </ul>
        <div className="ch-photos">
          {photos.map((p, i) => (
            <figure key={p} className={i === 0 ? 'is-main' : ''}>
              <img src={p} alt={`${i + 1}`} />
              {i === 0 ? <figcaption>{t('challenge.mainPhoto', 'Main photo')}</figcaption> : (
                <button type="button" className="ch-photos__main" onClick={() => move(i)}>{t('challenge.makeMain', 'Make main')}</button>
              )}
              <button type="button" className="ch-photos__x" onClick={() => setPhotos((x) => x.filter((_, k) => k !== i))} aria-label={t('challenge.removePhoto', 'Remove photo')}>✕</button>
            </figure>
          ))}
          {photos.length < ch.maxPhotos && (
            <button type="button" className="ch-photos__add" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
              {uploading > 0 ? t('challenge.uploading', 'Uploading…') : <>＋<small>{t('challenge.addPhotos', 'Add photos')}</small></>}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      <label className="ch-check">
        <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} required />
        <span>{t('challenge.certify', 'I certify that this cake was created and decorated by me.')}</span>
      </label>
      <label className="ch-check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        <span>{t('challenge.consent', 'I agree that my photos are shown in the challenge gallery inside the academy, with my display name.')}</span>
      </label>

      {err && <p className="ch-alert" role="alert">{err}</p>}
      <button type="submit" className="ch-btn ch-btn--gold" disabled={saving || uploading > 0}>
        {me.entry ? t('challenge.update', 'Save changes') : t('challenge.submit', 'Submit my cake')}
      </button>
      <p className="ch-small">{t('challenge.editNote', 'You can edit your entry until 25 December at 23:59. Every change is reviewed again before it appears.')}</p>
    </form>
  );
};

export default ChallengePage;
