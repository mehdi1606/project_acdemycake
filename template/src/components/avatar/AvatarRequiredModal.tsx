import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../core/redux/hooks';
import { logout, setUser } from '../../core/redux/authSlice';
import profileService from '../../services/api/profile.service';
import { extractApiErrorCode } from '../../services/api/error.utils';
import { all_routes } from '../../feature-module/router/all_routes';
import AvatarPicker from './AvatarPicker';
import { avatarErrorKeyFromCode } from './avatarImage';
import './avatar-required-modal.css';

/** Never interrupt sign-in, sign-up, email verification or a payment. */
const excludedPage = (p: string) => /login|register|verify-email|payment|checkout/i.test(p);

/**
 * A profile photo is mandatory. Members who signed up before that rule (any role)
 * see this dialog on the dashboard until they add one; it cannot be dismissed,
 * the only other way out is to log out.
 */
const AvatarRequiredModal: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const missingPhoto = isAuthenticated && !!user && !(user.avatarUrl && user.avatarUrl.trim());
  const open = missingPhoto && !done && !excludedPage(pathname);

  // Lock the page behind the dialog and keep focus inside it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key !== 'Tab' || !boxRef.current) return;
      const items = Array.from(
        boxRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]):not([tabindex="-1"])'),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  if (!open || !user) return null;

  const save = async () => {
    if (!file) { setError(t('avatarRequired.errors.required')); return; }
    setBusy(true);
    setError(null);
    try {
      const avatarUrl = await profileService.uploadAvatar(file); // also updates localStorage "user"
      dispatch(setUser({ ...user, avatarUrl }));
      setDone(true);
    } catch (e) {
      const key = avatarErrorKeyFromCode(extractApiErrorCode(e)) || 'uploadFailed';
      setError(t(`avatarRequired.errors.${key}`));
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    setBusy(true);
    try { await dispatch(logout()); } finally { navigate(all_routes.homeone); }
  };

  return createPortal(
    <div className="slavm" role="presentation">
      <div
        className="slavm__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slavm-title"
        aria-describedby="slavm-text"
        tabIndex={-1}
        ref={boxRef}
      >
        <div className="slavm__eyebrow">{t('avatarRequired.modal.eyebrow')}</div>
        <h2 className="slavm__title" id="slavm-title">{t('avatarRequired.modal.title')}</h2>
        <p className="slavm__text" id="slavm-text">
          {t('avatarRequired.modal.text')}
        </p>

        <AvatarPicker
          variant="glass"
          value={file}
          onChange={(f) => { setFile(f); setError(null); }}
          onBusyChange={setPreparing}
          error={error}
          disabled={busy}
        />

        <div className="slavm__actions">
          <button
            type="button"
            className="slavm__primary"
            onClick={save}
            disabled={busy || preparing || !file}
          >
            {busy ? (
              <><span className="slavm__spin" aria-hidden="true" />{t('avatarRequired.modal.saving')}</>
            ) : (
              <><i className="isax isax-tick-circle" />{t('avatarRequired.modal.save')}</>
            )}
          </button>
          <button type="button" className="slavm__logout" onClick={doLogout} disabled={busy}>
            <i className="isax isax-logout" />
            {t('avatarRequired.modal.logout')}
          </button>
        </div>
        <div className="slavm__note">{t('avatarRequired.modal.note')}</div>
      </div>
    </div>,
    document.body,
  );
};

export default AvatarRequiredModal;
