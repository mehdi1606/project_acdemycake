import { useEffect, useState } from 'react';

/** Same breakpoint as style/css/mobile-premium.css. Tablets and desktops are not phones. */
export const PHONE_QUERY = '(max-width: 767.98px)';

/** True on phones (< 768px); updates on rotation/resize. */
const useIsPhone = (): boolean => {
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = () => setPhone(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return phone;
};

export default useIsPhone;
