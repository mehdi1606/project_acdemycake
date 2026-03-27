declare module '@mux/mux-player-react' {
  import { FC, CSSProperties } from 'react';

  interface MuxPlayerProps {
    playbackId: string;
    metadata?: {
      video_title?: string;
      viewer_user_id?: string;
      [key: string]: any;
    };
    streamType?: 'on-demand' | 'live' | 'll-live';
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    style?: CSSProperties;
    className?: string;
    poster?: string;
    onTimeUpdate?: (event: any) => void;
    onEnded?: () => void;
    onError?: (error: any) => void;
    envKey?: string;
    [key: string]: any;
  }

  const MuxPlayer: FC<MuxPlayerProps>;
  export default MuxPlayer;
}

declare module '@mux/mux-uploader-react' {
  import { FC, CSSProperties } from 'react';

  interface MuxUploaderProps {
    endpoint: string;
    onUploadStart?: () => void;
    onProgress?: (event: CustomEvent) => void;
    onSuccess?: (event: CustomEvent) => void;
    onError?: (event: CustomEvent) => void;
    style?: CSSProperties;
    className?: string;
    id?: string;
    [key: string]: any;
  }

  const MuxUploader: FC<MuxUploaderProps>;
  export default MuxUploader;
}
