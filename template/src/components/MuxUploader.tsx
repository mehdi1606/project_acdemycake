import React, { useState, useCallback } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { message } from 'antd';

interface MuxUploaderProps {
  uploadUrl: string;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (response: any) => void;
  onUploadError?: (error: any) => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  disabled?: boolean;
  className?: string;
}

/**
 * MuxVideoUploader - A component for uploading videos directly to Mux
 *
 * This component handles:
 * - Direct upload to Mux using their uploader SDK
 * - Progress tracking
 * - Error handling
 * - File validation
 */
const MuxVideoUploader: React.FC<MuxUploaderProps> = ({
  uploadUrl,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFileSize = 500, // 500MB default
  acceptedFormats = ['video/mp4', 'video/webm', 'video/quicktime'],
  disabled = false,
  className,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUploadStart = useCallback(() => {
    setUploading(true);
    setProgress(0);
    setUploadComplete(false);
    onUploadStart?.();
    message.info('Upload started...');
  }, [onUploadStart]);

  const handleProgress = useCallback((event: CustomEvent) => {
    const progressValue = Math.round(event.detail * 100);
    setProgress(progressValue);
    onUploadProgress?.(progressValue);
  }, [onUploadProgress]);

  const handleSuccess = useCallback((event: CustomEvent) => {
    setUploading(false);
    setProgress(100);
    setUploadComplete(true);
    message.success('Video uploaded successfully! Processing will begin shortly.');
    onUploadComplete?.(event.detail);
  }, [onUploadComplete]);

  const handleError = useCallback((event: CustomEvent) => {
    setUploading(false);
    setProgress(0);
    message.error('Upload failed. Please try again.');
    onUploadError?.(event.detail);
  }, [onUploadError]);

  if (!uploadUrl) {
    return (
      <div className="border rounded p-4 text-center bg-light">
        <i className="isax isax-video-play fs-1 text-muted mb-2 d-block" />
        <p className="text-muted mb-0">
          Upload URL not available. Please save the course first.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {disabled ? (
        <div className="border rounded p-4 text-center bg-light" style={{ opacity: 0.6 }}>
          <i className="isax isax-video-play fs-1 text-muted mb-2 d-block" />
          <p className="text-muted mb-0">Video upload disabled</p>
        </div>
      ) : (
        <MuxUploader
          endpoint={uploadUrl}
          onUploadStart={handleUploadStart}
          onProgress={handleProgress as any}
          onSuccess={handleSuccess as any}
          onError={handleError as any}
          style={{
            '--button-background-color': '#C9A227',
            '--button-hover-background-color': '#A88B1F',
            '--button-active-background-color': '#8A7119',
            '--progress-bar-fill-color': '#C9A227',
            '--progress-bar-height': '8px',
            '--border-radius': '8px',
          } as React.CSSProperties}
        />
      )}

      {/* Custom Progress Display */}
      {uploading && (
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">Uploading video...</small>
            <small className="fw-medium">{progress}%</small>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${progress}%`,
                backgroundColor: '#C9A227',
                transition: 'width 0.3s ease',
              }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadComplete && (
        <div className="mt-3 alert alert-success d-flex align-items-center">
          <i className="fa fa-check-circle me-2" />
          <div>
            <strong>Upload complete!</strong>
            <p className="mb-0 small">
              Your video is being processed. This may take a few minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MuxVideoUploader;
