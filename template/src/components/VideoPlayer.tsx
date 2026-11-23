/**
 * VideoPlayer — SARALÖWE Academy
 *
 * Self-hosted streaming via Spring Boot HTTP Range endpoint.
 * Video.js v8 with `fill: true` so the CSS container controls all sizing.
 * No `fluid` / `responsive` — those fight with CSS aspect-ratio.
 */
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string | null;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  /** Resume playback from this offset (seconds) once metadata loads */
  startAt?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  /** Called when playback or source loading fails (e.g. expired streaming token) */
  onError?: (currentTime: number, wasPlaying: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Applies native HTML5 anti-download attributes directly to the underlying
 * <video> element inside Video.js so browsers never offer native download,
 * Picture-in-Picture popout, or remote-cast download options.
 */
const hardenNativeVideoElement = (root: HTMLElement | null) => {
  if (!root) return;
  const videoTag = root.querySelector('video');
  if (!videoTag) return;
  videoTag.setAttribute('controlsList', 'nodownload');
  videoTag.setAttribute('disablePictureInPicture', 'true');
  videoTag.setAttribute('disableRemotePlayback', 'true');
  (videoTag as any).disablePictureInPicture = true;
  (videoTag as any).disableRemotePlayback = true;
  videoTag.draggable = false;
  videoTag.oncontextmenu = (e) => {
    e.preventDefault();
    return false;
  };
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title: _title,
  poster,
  autoPlay = false,
  startAt,
  onTimeUpdate,
  onEnded,
  onError,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const lastKnownTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);

  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // ── Initialise / update player ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !src) return;

    if (!playerRef.current) {
      // Create the <video-js> host element inside our CSS container.
      // We use fill:true so Video.js respects our container size 100 %.
      const videoEl = document.createElement('video-js');
      videoEl.classList.add('vjs-big-play-centered');
      videoEl.setAttribute('controlsList', 'nodownload');
      videoEl.setAttribute('disablePictureInPicture', 'true');
      videoEl.setAttribute('disableRemotePlayback', 'true');
      // Make it fill the container div
      videoEl.style.width  = '100%';
      videoEl.style.height = '100%';
      containerRef.current.appendChild(videoEl);

      const player = videojs(videoEl, {
        autoplay:      autoPlay,
        controls:      true,
        fill:          true,   // fills whatever size the container div is
        preload:       'auto',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          pictureInPictureToggle: false,
          fullscreenToggle:       true,
        },
        html5: {
          vhs: {
            overrideNative: !videojs.browser.IS_SAFARI,
          },
          nativeVideoAttributes: {
            controlsList:            'nodownload',
            disablePictureInPicture: true,
            disableRemotePlayback:   true,
          },
        },
        sources: [{ src, type: 'video/mp4' }],
        poster:  poster || undefined,
      });

      playerRef.current = player;
      hardenNativeVideoElement(containerRef.current);

      player.ready(() => {
        hardenNativeVideoElement(containerRef.current);
      });

      if (startAt && startAt > 0) {
        lastKnownTimeRef.current = startAt;
        player.one('loadedmetadata', () => {
          player.currentTime(startAt);
        });
      }

      player.on('play', () => {
        wasPlayingRef.current = true;
      });

      player.on('pause', () => {
        // Ignore automatic pause events triggered immediately before an error
        if (!player.error()) {
          wasPlayingRef.current = false;
        }
      });

      player.on('timeupdate', () => {
        const cur = player.currentTime() || 0;
        const dur = player.duration() || 0;
        if (cur > 0) {
          lastKnownTimeRef.current = cur;
        }
        onTimeUpdateRef.current?.(cur, dur);
      });

      player.on('ended', () => {
        wasPlayingRef.current = false;
        onEndedRef.current?.();
      });

      player.on('error', () => {
        onErrorRef.current?.(lastKnownTimeRef.current, wasPlayingRef.current);
      });
    } else {
      // Hot-swap source when the lesson changes or when a streaming token is renewed
      const player = playerRef.current;
      const shouldResumePlay = autoPlay || wasPlayingRef.current;
      const resumeOffset = typeof startAt === 'number' && startAt > 0 ? startAt : 0;

      player.src([{ src, type: 'video/mp4' }]);
      if (poster) player.poster(poster);
      hardenNativeVideoElement(containerRef.current);

      if (resumeOffset > 0 || shouldResumePlay) {
        player.one('loadedmetadata', () => {
          if (resumeOffset > 0) {
            player.currentTime(resumeOffset);
          }
          if (shouldResumePlay) {
            const playPromise = player.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => { /* autoplay blocked by browser policy */ });
            }
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // ── Dispose on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // ── Empty / unavailable state ──────────────────────────────────────────
  if (!src) {
    return (
      <div
        className={className}
        style={{
          width:          '100%',
          aspectRatio:    '16/9',
          background:     '#0a0a0a',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:            16,
          ...style,
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(197,151,62,0.06)',
          border:     '2px solid rgba(197,151,62,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="fa-solid fa-film" style={{ fontSize: 30, color: 'rgba(197,151,62,0.35)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
            Video not available
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
            The instructor hasn't uploaded a video yet
          </p>
        </div>
      </div>
    );
  }

  // ── Player container ───────────────────────────────────────────────────
  // `aspect-ratio: 16/9` + `width: 100%` → height follows width naturally.
  // Video.js `fill: true` makes the inner player fill this box.
  return (
    <div
      data-vjs-player
      ref={containerRef}
      className={className}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        width:              '100%',
        aspectRatio:        '16/9',
        background:         '#000',
        overflow:           'hidden',
        display:            'block',
        userSelect:         'none',
        WebkitUserSelect:   'none',
        WebkitTouchCallout: 'none',
        ...style,
      } as React.CSSProperties}
    />
  );
};

export default VideoPlayer;
