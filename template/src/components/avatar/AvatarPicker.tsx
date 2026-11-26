import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarPrepareError, prepareAvatar } from './avatarImage';
import './avatar-picker.css';

interface AvatarPickerProps {
  /** The prepared photo (always JPEG/PNG/WebP, 1 MB or less), or null. */
  value: File | null;
  onChange: (file: File | null) => void;
  /** An error to show under the picker (e.g. "required" from the form, or a server error). */
  error?: string | null;
  disabled?: boolean;
  /** "auth" sits on the sign-up form, "glass" in the dashboard modal. */
  variant?: 'auth' | 'glass';
  /** Reports while a chosen photo is being resized/compressed. */
  onBusyChange?: (busy: boolean) => void;
}

/**
 * Round photo picker: "Add your photo", change / remove, drag & drop on desktop.
 * Big photos are resized and compressed in the browser before they are handed on.
 */
const AvatarPicker: React.FC<AvatarPickerProps> = ({
  value, onChange, error, disabled, variant = 'auth', onBusyChange,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const setBusyState = (b: boolean) => { setBusy(b); onBusyChange?.(b); };

  const handleFile = async (file: File | undefined | null) => {
    if (!file || disabled) return;
    setLocalError(null);
    setBusyState(true);
    try {
      const ready = await prepareAvatar(file);
      onChange(ready);
    } catch (e) {
      const key = e instanceof AvatarPrepareError ? e.key : 'unreadable';
      setLocalError(t(`avatarRequired.errors.${key}`));
    } finally {
      setBusyState(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const openPicker = () => { if (!disabled && !busy) inputRef.current?.click(); };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const shownError = localError || error || null;
  const errorId = `${inputId}-err`;

  return (
    <div className={`slav slav--${variant}${dragOver ? ' slav--drag' : ''}${shownError ? ' slav--error' : ''}`}>
      <div
        className="slav__drop"
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          className="slav__circle"
          onClick={openPicker}
          disabled={disabled || busy}
          aria-describedby={shownError ? errorId : undefined}
          aria-label={value ? t('avatarRequired.picker.change') : t('avatarRequired.picker.add')}
        >
          {preview ? (
            <img src={preview} alt={t('avatarRequired.picker.previewAlt')} className="slav__img" />
          ) : (
            <span className="slav__placeholder" aria-hidden="true">
              <i className="isax isax-camera" />
            </span>
          )}
          {busy && <span className="slav__busy" aria-hidden="true"><span className="slav__spinner" /></span>}
          {!busy && value && <span className="slav__badge" aria-hidden="true"><i className="isax isax-edit-2" /></span>}
        </button>

        <div className="slav__body">
          <div className="slav__title">
            {busy
              ? t('avatarRequired.picker.processing')
              : dragOver
                ? t('avatarRequired.picker.dropHere')
                : value
                  ? t('avatarRequired.picker.ready')
                  : t('avatarRequired.picker.add')}
          </div>
          <div className="slav__actions">
            <button type="button" className="slav__btn slav__btn--main" onClick={openPicker} disabled={disabled || busy}>
              <i className={`isax ${value ? 'isax-refresh' : 'isax-gallery-add'}`} />
              {value ? t('avatarRequired.picker.change') : t('avatarRequired.picker.choose')}
            </button>
            {value && (
              <button
                type="button"
                className="slav__btn slav__btn--ghost"
                onClick={() => { setLocalError(null); onChange(null); }}
                disabled={disabled || busy}
              >
                <i className="isax isax-trash" />
                {t('avatarRequired.picker.remove')}
              </button>
            )}
          </div>
          <div className="slav__hint">
            <span className="slav__hint-drag">{t('avatarRequired.picker.dragHint')} </span>
            {t('avatarRequired.picker.hint')}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="slav__input"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />

      {shownError && (
        <div className="slav__error" id={errorId} role="alert">
          <i className="isax isax-info-circle" />
          {shownError}
        </div>
      )}
    </div>
  );
};

export default AvatarPicker;
