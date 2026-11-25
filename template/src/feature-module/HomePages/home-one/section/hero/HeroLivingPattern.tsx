/**
 * The Living Pattern — home hero.
 *
 * The SARALÖWE toile grows into existence (WebGL), the camera glides through the
 * courtyard, then pulls back so the whole illustration becomes the hero background
 * with a soft clearing behind the words. The academy's own hero content (badge,
 * tagline, headline, search, buttons, live stats) fades in on top when it lands.
 *
 *  - First visit: the full 16.5 s intro. Later visits: the final 3.6 s.
 *  - Scrolling, "Skip intro" or Escape jumps straight to the finished hero; the
 *    site header stays usable the whole time.
 *  - Christmas edition (snow, lights, hats) automatically in the festive season.
 *  - Reduced motion → no animation; no WebGL2 / slow network → still image.
 *  - Preview: ?intro=full | short | off, ?edition=winter | classic
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../../../router/all_routes';
import { courseService } from '../../../../../services/api/course.service';
import { PlatformStats } from '../../../../../services/api/types';
import { useCountUp } from '../../hooks/useCountUp';
import { Renderer, Edition } from './living/renderer';
import { CameraPath, CamKey } from './living/camera';
import './living/living-hero.css';

const BASE = `${process.env.PUBLIC_URL || ''}/assets/hero/living/`;
const SEEN_KEY = 'sl_living_intro_seen';
const LOAD_TIMEOUT = 7000;   // never hold the page hostage to the textures
const RETURN_START = 12.9;   // returning visitors join for the final bloom and pull-back

interface Choreography { duration: number; uiAt: number; camera: CamKey[] }
type Phase = 'loading' | 'running' | 'done';

// ── easing (the original used GSAP; these are its curves) ────────────────────
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const backOut = (x: number, s = 3) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const sineInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
const power2In = (x: number) => x * x;
const seg = (t: number, start: number, dur: number) => clamp01((t - start) / dur);

/** The first point of life: appears, breathes once, then is swallowed by the trunk. */
function seedAmount(t: number, first: number): number {
  if (t < first - 0.75) return 0;
  if (t < first - 0.25) return backOut(seg(t, first - 0.75, 0.5));
  if (t < first + 0.25) return 1 - 0.3 * sineInOut(seg(t, first - 0.25, 0.25));
  return 0.7 * (1 - power2In(seg(t, first + 0.25, 0.6)));
}

/** Festive season: the Christmas edition from late November to the first week of January. */
function pickEdition(): Edition {
  const q = new URLSearchParams(window.location.search).get('edition');
  if (q === 'winter' || q === 'classic') return q;
  const d = new Date(); const m = d.getMonth(), day = d.getDate();
  return (m === 10 && day >= 20) || m === 11 || (m === 0 && day <= 7) ? 'winter' : 'classic';
}

function pickMode(): 'full' | 'short' | 'off' {
  const q = new URLSearchParams(window.location.search).get('intro');
  if (q === 'off') return 'off';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
  if (q === 'full' || q === 'short') return q;
  try { return localStorage.getItem(SEEN_KEY) ? 'short' : 'full'; } catch { return 'full'; }
}

// ── stats (same as the classic hero, in the light palette) ───────────────────
const formatK = (n: number) => (n >= 1000 ? { value: Math.floor(n / 1000), suffix: 'K+' } : { value: n, suffix: '+' });
const Stat: React.FC<{ raw: number; label: string; run: boolean }> = ({ raw, label, run }) => {
  const { value, suffix } = formatK(raw);
  const count = useCountUp(value, 2000, 0, run);
  return (
    <div className="lp-stat">
      <span className="lp-stat__num">{count}<small>{suffix}</small></span>
      <span className="lp-stat__label">{label}</span>
    </div>
  );
};

const HeroLivingPattern: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>('loading');
  const [poster, setPoster] = useState(false);
  const [ready, setReady] = useState(false);
  const [edition] = useState<Edition>(() => pickEdition());
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => { courseService.getPlatformStats().then(setStats).catch(() => {}); }, []);

  const reveal = useCallback(() => setPhase('done'), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mode = pickMode();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let raf = 0;
    let ambientRaf = 0;
    let renderer: Renderer | null = null;
    const cleanups: (() => void)[] = [];

    const fallback = () => {
      if (disposed) return;
      renderer?.dispose();
      renderer = null;
      setPoster(true);
      reveal();
    };

    try {
      renderer = new Renderer(canvas, edition, BASE);
    } catch {
      fallback();
      return;
    }

    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), LOAD_TIMEOUT);
    const json = (url: string) => fetch(url, { signal: abort.signal }).then((r) => { if (!r.ok) throw new Error(url); return r.json(); });

    Promise.all([json(BASE + 'choreography.json'), json(renderer.dir + 'seeds.json'), renderer.load(abort.signal)])
      .then(([ch, seeds]: [Choreography, { x: number; y: number; t: number }[], void]) => {
        window.clearTimeout(timer);
        if (disposed || !renderer) return;
        const r = renderer;
        const camera = new CameraPath(ch.camera);
        const first = seeds[0];
        const began = performance.now();
        let clock = mode === 'short' ? RETURN_START : 0;
        let revealed = false;

        const draw = () => {
          const veil = sineInOut(seg(clock, ch.uiAt - 0.5, 1.6));
          r.render({
            now: still ? 4 : (performance.now() - began) / 1000,
            cam: camera.at(clock, r.aspect),
            t: clock,
            seed: first,
            seedAmt: seedAmount(clock, first.t),
            veil,
          });
        };

        const finish = () => {
          clock = ch.duration;
          cancelAnimationFrame(raf);
          raf = 0;
          try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
          if (!revealed) { revealed = true; reveal(); }
          draw();
        };
        skipRef.current = finish;

        // keep the still frame right after the show
        let resizeRaf = 0;
        const onResize = () => {
          cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(() => { r.resize(); draw(); });
        };
        window.addEventListener('resize', onResize);
        cleanups.push(() => { window.removeEventListener('resize', onResize); cancelAnimationFrame(resizeRaf); });
        const onLost = (e: Event) => { e.preventDefault(); fallback(); };
        canvas.addEventListener('webglcontextlost', onLost);
        cleanups.push(() => canvas.removeEventListener('webglcontextlost', onLost));

        setReady(true);

        // Christmas edition: snow keeps falling and lights keep breathing afterwards,
        // at ~30 fps and only while the hero is on screen and the tab is visible.
        if (edition === 'winter' && !still) {
          let last = 0;
          let onScreen = true;
          const tick = (ms: number) => {
            ambientRaf = requestAnimationFrame(tick);
            if (raf || ms - last < 32) return;     // the intro loop draws every frame itself
            last = ms;
            draw();
          };
          const update = () => {
            const want = onScreen && !document.hidden;
            if (want && !ambientRaf) ambientRaf = requestAnimationFrame(tick);
            if (!want && ambientRaf) { cancelAnimationFrame(ambientRaf); ambientRaf = 0; }
          };
          const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); });
          io.observe(canvas);
          document.addEventListener('visibilitychange', update);
          cleanups.push(() => { io.disconnect(); document.removeEventListener('visibilitychange', update); cancelAnimationFrame(ambientRaf); ambientRaf = 0; });
          update();
        }

        if (mode === 'off') { finish(); return; }

        // ── the intro ─────────────────────────────────────────────────────
        setPhase('running');
        let prev = performance.now();
        const loop = (now: number) => {
          clock = Math.min(ch.duration, clock + (now - prev) / 1000);
          prev = now;
          if (!revealed && clock >= ch.uiAt) { revealed = true; reveal(); }
          draw();
          if (clock >= ch.duration) { finish(); return; }
          raf = requestAnimationFrame(loop);
        };
        draw();
        raf = requestAnimationFrame(loop);

        // Any sign the visitor wants the page: go straight to the finished hero.
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && raf) finish(); };
        const onScroll = () => { if (raf && window.scrollY > 40) finish(); };
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, { passive: true });
        cleanups.push(() => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); });
      })
      .catch(() => { window.clearTimeout(timer); fallback(); });

    return () => {
      disposed = true;
      abort.abort();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(ambientRaf);
      cleanups.forEach((c) => c());
      renderer?.dispose();
    };
  }, [edition, reveal]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `${all_routes.courseList}?search=${encodeURIComponent(q)}` : all_routes.courseList);
  };

  const shown = phase === 'done';

  return (
    <section
      className={`lp-hero lp-hero--${edition}${poster ? ' lp-hero--poster' : ''}${shown ? ' is-shown' : ''}`}
      aria-labelledby="lp-hero-title"
      style={poster ? { backgroundImage: `url(${BASE}${edition === 'winter' ? 'tex/winter/' : 'tex/'}poster.jpg)` } : undefined}
    >
      <canvas ref={canvasRef} className={`lp-hero__canvas${ready ? ' is-ready' : ''}`} aria-hidden="true" />

      <div className="lp-hero__content" aria-hidden={!shown}>
        <span className="lp-hero__badge lp-r" style={{ '--i': 0 } as React.CSSProperties}>
          {t('banner.couturePastry', 'Couture Pastry · Academy Est. 2010')}
        </span>
        <span className="lp-hero__tagline lp-r" style={{ '--i': 1 } as React.CSSProperties}>
          {t('banner.theArtOfCake', 'The first Arabic academy & community specialised in patisserie and cake design')}
        </span>
        <h1 id="lp-hero-title" className="lp-hero__title lp-r" style={{ '--i': 2 } as React.CSSProperties}>
          {t('banner.academyHeadline', 'Build Your Future in the World of Patisserie')}
        </h1>
        <p className="lp-hero__desc lp-r" style={{ '--i': 3 } as React.CSSProperties}>
          {t('banner.description', "Master the world's most coveted sugar art techniques under elite pastry artists. Bespoke programmes, lifetime access, and certificates recognised by luxury hospitality brands globally.")}
        </p>

        <form className="lp-hero__search lp-r" role="search" onSubmit={onSearch} style={{ '--i': 4 } as React.CSSProperties}>
          <Link to={all_routes.courseList} className="lp-hero__browse" tabIndex={shown ? 0 : -1}>
            {t('banner.browseAll', 'Browse all')}
          </Link>
          <input
            type="text"
            enterKeyHint="search"
            tabIndex={shown ? 0 : -1}
            aria-label={t('banner.searchLabel', 'Search courses')}
            placeholder={t('banner.searchPlaceholder', 'Search courses, techniques…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" tabIndex={shown ? 0 : -1} aria-label={t('common.search', 'Search')}>
            <i className="isax isax-search-normal" aria-hidden="true" />
            <span>{t('common.search', 'Search')}</span>
          </button>
        </form>

        <div className="lp-hero__actions lp-r" style={{ '--i': 5 } as React.CSSProperties}>
          <Link to={all_routes.courseList} className="lp-btn lp-btn--solid" tabIndex={shown ? 0 : -1}>
            {t('banner.exploreCourses', 'Explore Courses')} <i className="isax isax-arrow-right-1" aria-hidden="true" />
          </Link>
          <Link to={all_routes.register} className="lp-btn lp-btn--line" tabIndex={shown ? 0 : -1}>
            {t('banner.createFreeAccount', 'Create free account')}
          </Link>
        </div>

        <div className="lp-hero__stats lp-r" style={{ '--i': 6 } as React.CSSProperties}>
          {stats ? (
            <>
              <Stat raw={stats.totalCourses} label={t('banner.courses', 'Courses')} run={shown} />
              <span className="lp-hero__divider" aria-hidden="true" />
              <Stat raw={stats.totalStudents} label={t('banner.enrolments', 'Enrolments')} run={shown} />
              <span className="lp-hero__divider" aria-hidden="true" />
              <Stat raw={stats.totalInstructors} label={t('banner.expertTutors', 'Expert Tutors')} run={shown} />
            </>
          ) : <span className="lp-hero__loading">{t('banner.loading', '— Loading —')}</span>}
        </div>
      </div>

      {phase === 'running' && (
        <button type="button" className="lp-hero__skip" onClick={() => skipRef.current()}>
          {t('banner.skipIntro', 'Skip intro')}
        </button>
      )}
      {shown && (
        <button
          type="button"
          className="lp-hero__scroll"
          aria-label={t('banner.scrollDown', 'Scroll down')}
          onClick={(e) => {
            const next = (e.currentTarget.closest('section')?.nextElementSibling as HTMLElement | null);
            if (next) window.scrollTo({ top: next.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
          }}
        ><span /></button>
      )}
    </section>
  );
};

export default HeroLivingPattern;
