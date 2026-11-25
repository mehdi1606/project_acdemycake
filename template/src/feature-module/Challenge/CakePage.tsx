/**
 * One cake's own page (/challenge/cake/:id): the link students share to bring
 * in votes. Large photos, the story, the live score, the vote button, sharing,
 * and more cakes to discover.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import { useAppSelector } from '../../core/redux/hooks';
import { extractApiError } from '../../services/api/error.utils';
import { challengeService, ChallengeView, EntryCard, MyStatus } from '../../services/api/challenge.service';
import { moroccoDate, phaseAt, serverNow } from '../../components/challenge/useChallenge';
import ShareBar from '../../components/challenge/ShareBar';
import { SLUG, VoteButton } from './ChallengeParts';
import './challenge.css';
import './cake-page.css';

const CakePage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [ch, setCh] = useState<ChallengeView | null>(null);
  const [cards, setCards] = useState<EntryCard[]>([]);
  const [me, setMe] = useState<MyStatus | null>(null);
  const [err, setErr] = useState('');
  const [missing, setMissing] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [v, g] = await Promise.all([challengeService.view(SLUG), challengeService.gallery(SLUG)]);
      setCh(v);
      setCards(g);
      setMissing(!g.some((c) => c.id === id));
    } catch (e) {
      setErr(extractApiError(e));
    }
  }, [id]);

  useEffect(() => { load(); setPhoto(0); window.scrollTo(0, 0); }, [load]);
  useEffect(() => {
    if (!isAuthenticated) { setMe(null); return; }
    challengeService.me(SLUG).then(setMe).catch(() => setMe(null));
  }, [isAuthenticated]);

  const card = cards.find((c) => c.id === id) || null;
  const phase = ch ? phaseAt(ch, serverNow()) : null;
  const more = useMemo(() => cards.filter((c) => c.id !== id).slice(0, 6), [cards, id]);
  const voted = !!me?.votedEntryIds.includes(id);

  useEffect(() => {
    if (card) document.title = `${card.title} · ${t('challenge.title', 'The New Year Cake Challenge')} · SARALÖWE`;
  }, [card, t]);

  const vote = async () => {
    if (!card) return;
    setBusy(true); setErr('');
    try {
      const ids = voted ? await challengeService.unvote(SLUG, card.id) : await challengeService.vote(SLUG, card.id);
      setMe((m) => (m ? { ...m, votedEntryIds: ids } : m));
      setCards(await challengeService.gallery(SLUG));
    } catch (e) {
      setErr(extractApiError(e, t('challenge.voteError', 'Your vote could not be saved.')));
    } finally {
      setBusy(false);
    }
  };

  if (missing) {
    return (
      <div className="ch-page cp">
        <section className="cp-missing ch-wrap">
          <h1>{t('challenge.cake.missingTitle', 'This cake is not in the gallery')}</h1>
          <p>{t('challenge.cake.missingText', 'It may be waiting for approval, or it was removed.')}</p>
          <Link to={all_routes.challenge} className="ch-btn ch-btn--gold">{t('challenge.cake.backAll', 'See all the cakes')}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="ch-page cp">
      <div className="cp-top">
        <div className="ch-wrap cp-top__inner">
          <Link to={`${all_routes.challenge}#ch-gallery`} className="cp-back">← {t('challenge.cake.back', 'All the cakes')}</Link>
          <span className="cp-top__tag">{t('challenge.title', 'The New Year Cake Challenge')} · 2027</span>
        </div>
      </div>

      {!card ? (
        <div className="ch-wrap cp-loading">{err || t('common.loading', 'Loading…')}</div>
      ) : (
        <>
          <section className="ch-wrap cp-main">
            <div className="cp-photos">
              <div className="cp-stage">
                <img src={card.photos[photo]} alt={`${card.title} ${photo + 1}/${card.photos.length}`} />
                {(phase === 'VOTING' || phase === 'TALLYING' || phase === 'RESULTS') && card.rank > 0 && (
                  <span className={`cp-rank${card.rank <= 3 ? ` cp-rank--${card.rank}` : ''}`}>#{card.rank}</span>
                )}
              </div>
              {card.photos.length > 1 && (
                <div className="cp-thumbs">
                  {card.photos.map((p, i) => (
                    <button key={p} type="button" className={i === photo ? 'is-on' : ''} onClick={() => setPhoto(i)} aria-label={`${i + 1}`}>
                      <img src={p} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="cp-side">
              <p className="ch-kicker">{t('challenge.cake.kicker', 'In the gallery')}</p>
              <h1 className="cp-title">{card.title}</h1>
              <p className="cp-by">{t('challenge.by', { name: card.authorName, defaultValue: 'by {{name}}' })}</p>
              {card.description && <p className="cp-desc">{card.description}</p>}

              <div className="cp-score">
                <div><b>{card.points}</b><span>{t('challenge.pts', 'pts')}</span></div>
                <div><b>{card.voters}</b><span>{t('challenge.mine.voters', 'voters')}</span></div>
                <div><b>{card.rank ? `#${card.rank}` : '-'}</b><span>{t('challenge.mine.rank', 'rank')}</span></div>
              </div>
              {!card.eligible && ch && (
                <p className="cp-note">{t('challenge.cake.needVoters', { n: ch.minVoters, defaultValue: 'A cake needs votes from {{n}} different accounts to be able to win.' })}</p>
              )}

              <div className="cp-vote">
                {phase === 'VOTING' ? (
                  <VoteButton card={card} phase={phase} voted={voted} own={card.id === me?.entry?.id} busy={busy}
                    isAuthenticated={isAuthenticated} emailVerified={me?.emailVerified ?? true} onVote={vote} />
                ) : ch && (
                  <p className="cp-when">
                    {phase === 'SUBMISSIONS' || phase === 'BETWEEN' || phase === 'UPCOMING'
                      ? t('challenge.cake.votingFrom', { from: moroccoDate(ch.votingOpenAt, lang), to: moroccoDate(ch.votingCloseAt, lang, true), defaultValue: 'Voting opens {{from}} and closes {{to}}.' })
                      : t('challenge.cake.votingClosed', 'Voting is closed.')}
                  </p>
                )}
                {!isAuthenticated && phase === 'VOTING' && (
                  <p className="cp-note">{t('challenge.cake.freeAccount', 'Voting needs a free SARALÖWE account. It takes a minute.')}</p>
                )}
              </div>
              {err && <p className="ch-alert" role="alert">{err}</p>}

              <div className="cp-share">
                <p className="cp-share__label">{t('challenge.cake.shareLabel', 'Help this cake: share it')}</p>
                <ShareBar big url={challengeService.shareUrl(SLUG, card.id)}
                  text={t('challenge.share.cakeText', { title: card.title, defaultValue: 'Vote for “{{title}}” in the SARALÖWE New Year Cake Challenge:' })} />
              </div>
            </aside>
          </section>

          {more.length > 0 && (
            <section className="ch-wrap cp-more">
              <div className="ch-head">
                <p className="ch-kicker">{t('challenge.cake.moreKicker', 'Keep discovering')}</p>
                <h2>{t('challenge.cake.moreTitle', 'More cakes of 2027')}</h2>
              </div>
              <div className="ch-grid">
                {more.map((c) => (
                  <Link key={c.id} to={`${all_routes.challenge}/cake/${c.id}`} className="ch-entry cp-mini">
                    <span className="ch-entry__photo"><img src={c.photos[0]} alt={c.title} loading="lazy" /></span>
                    <span className="ch-entry__body">
                      <h3>{c.title}</h3>
                      <span className="ch-entry__by">{t('challenge.by', { name: c.authorName, defaultValue: 'by {{name}}' })}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="ch-wrap cp-cta">
            <div>
              <h2>{t('challenge.cake.ctaTitle', 'Your cake belongs here too')}</h2>
              <p>{t('challenge.cake.ctaText', 'One tier, photographed on white. Entries are open until 25 December.')}</p>
            </div>
            <Link to={`${all_routes.challenge}#ch-take-part`} className="ch-btn ch-btn--gold">{t('challenge.ctaEnter', 'Enter the challenge')}</Link>
          </section>
        </>
      )}
    </div>
  );
};

export default CakePage;
