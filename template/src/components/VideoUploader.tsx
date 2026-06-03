/**
 * VideoUploader — SARALÖWE Academy
 *
 * Replaces MuxVideoUploader.  Uploads video files directly to
 *   POST /api/v1/videos/{lessonId}/upload
 * using the existing apiMultipart axios instance (auth headers already set).
 *
 * Features:
 * - Drag-and-drop or click-to-browse
 * - Real-time upload progress bar (via axios onUploadProgress)
 * - Client-side validation: video MIME type + 4 GB size limit
 * - Replaces any previously uploaded video for the same lesson automatically
 */
import React, { useCallback, useRef, useState } from 'react';
import { apiMultipart } from '../services/api/axios.config';

interface VideoUploaderProps {
  /** Lesson UUID — determines which lesson the video is attached to */
  lessonId: string;
  onUploadStart?: () => void;
  onUploadProgress?: (pct: number) => void;
  onUploadComplete?: () => void;
  onUploadError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB
const GOLD      = '#C9A227';

const VideoUploader: React.FC<VideoUploaderProps> = ({
  lessonId,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
}) => {
  const [uploading, setUploading]         = useState(false);
  const [progress, setProgress]           = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // ── Core upload ──────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      onUploadError?.('Please select a valid video file (MP4, MOV, WebM…)');
      return;
    }
    if (file.size > MAX_BYTES) {
      onUploadError?.('File exceeds the maximum allowed size of 4 GB');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadComplete(false);
    onUploadStart?.();

    const formData = new FormData();
    formData.append('video', file);

    try {
      await apiMultipart.post(`/videos/${lessonId}/upload`, formData, {
        timeout: 0, // disable timeout — large uploads can take minutes
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
            onUploadProgress?.(pct);
          }
        },
      });
      setProgress(100);
      setUploadComplete(true);
      onUploadComplete?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed. Please try again.';
      onUploadError?.(msg);
    } finally {
      setUploading(false);
    }
  }, [lessonId, onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so the same file can be re-selected after an error
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={className}>
      {/* Drop zone */}
      {disabled ? (
        <div style={{
          border: '2px dashed rgba(0,0,0,0.12)',
          borderRadius: 8,
          padding: '32px 16px',
          textAlign: 'center',
          opacity: 0.5,
          background: '#fafafa',
        }}>
          <i className="fa-solid fa-video-slash" style={{ fontSize: 32, color: '#999', display: 'block', marginBottom: 8 }} />
          <p style={{ color: '#999', margin: 0 }}>Video upload disabled</p>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) fileInputRef.current?.click(); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? GOLD : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 8,
              padding: '36px 16px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: dragOver ? 'rgba(201,162,39,0.04)' : '#fafafa',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            <i
              className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}
              style={{ fontSize: 36, color: GOLD, display: 'block', marginBottom: 10 }}
            />
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151', fontSize: 14 }}>
              {uploading ? 'Uploading…' : 'Click or drag-and-drop a video file'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
              MP4, MOV, WebM — max 4 GB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      )}

      {/* Progress bar */}
      {uploading && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Uploading video…</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{progress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 4,
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${GOLD}, #A67825)`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Success state */}
      {uploadComplete && !uploading && (
        <div style={{
          marginTop: 14,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className="fa-solid fa-circle-check" style={{ color: '#22C55E', fontSize: 18 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#15803D' }}>Upload complete!</p>
            <p style={{ margin: 0, fontSize: 12, color: '#16A34A' }}>Video is ready to stream immediately.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
