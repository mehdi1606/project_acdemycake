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
  className?: string;
  style?: React.CSSProperties;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  poster,
  autoPlay = false,
  startAt,
  onTimeUpdate,
  onEnded,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  // ── Initialise / update player ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !src) return;

    if (!playerRef.current) {
      // Create the <video-js> host element inside our CSS container.
      // We use fill:true so Video.js respects our container size 100 %.
      const videoEl = document.createElement('video-js');
      videoEl.classList.add('vjs-big-play-centered');
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
        html5: {
          vhs: {
            overrideNative: !videojs.browser.IS_SAFARI,
          },
        },
        sources: [{ src, type: 'video/mp4' }],
        poster:  poster || undefined,
      });

      playerRef.current = player;

      if (startAt) {
        player.one('loadedmetadata', () => player.currentTime(startAt));
      }

      player.on('timeupdate', () => {
        onTimeUpdate?.(player.currentTime() || 0, player.duration() || 0);
      });

      player.on('ended', () => onEnded?.());
    } else {
      // Hot-swap source when the lesson changes
      const player = playerRef.current;
      player.src([{ src, type: 'video/mp4' }]);
      if (poster) player.poster(poster);
      if (startAt) {
        player.one('loadedmetadata', () => player.currentTime(startAt!));
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
      style={{
        width:       '100%',
        aspectRatio: '16/9',
        background:  '#000',
        overflow:    'hidden',
        display:     'block',
        ...style,
      }}
    />
  );
};

export default VideoPlayer;
