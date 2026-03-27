import React from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface MuxVideoPlayerProps {
  playbackId: string;
  token?: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
  style?: React.CSSProperties;
  envKey?: string; // Mux Data environment key for analytics
}

/**
 * MuxVideoPlayer - A React component for playing videos hosted on Mux
 *
 * Uses @mux/mux-player-react which provides:
 * - Adaptive streaming (HLS)
 * - Quality selection
 * - Keyboard accessibility
 * - Mobile-friendly controls
 * - Mux Data integration for analytics (when envKey is provided)
 */
const MuxVideoPlayer: React.FC<MuxVideoPlayerProps> = ({
  playbackId,
  token,
  title,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  onTimeUpdate,
  onEnded,
  onError,
  className,
  style,
  envKey,
}) => {
  // Build the playback URL - for signed playback IDs, we need to include the token
  const playbackUrl = token
    ? `${playbackId}?token=${token}`
    : playbackId;

  return (
    <MuxPlayer
      playbackId={playbackUrl}
      metadata={{
        video_title: title || 'Course Video',
        viewer_user_id: localStorage.getItem('userId') || 'anonymous',
      }}
      streamType="on-demand"
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      primaryColor="#C9A227" // SARALÖWE gold
      secondaryColor="#1A1A1A"
      accentColor="#C9A227"
      style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
      poster={poster}
      onTimeUpdate={(e: any) => {
        if (onTimeUpdate && e.target) {
          onTimeUpdate(e.target.currentTime, e.target.duration);
        }
      }}
      onEnded={onEnded}
      onError={onError}
      // Mux Data configuration for analytics
      envKey={envKey}
    />
  );
};

export default MuxVideoPlayer;
