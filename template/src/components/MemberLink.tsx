/**
 * MemberLink — wraps a member's avatar or name so a click opens their profile.
 * Renders the children unchanged when there is no id (e.g. deleted author).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../feature-module/router/all_routes';

export const memberProfilePath = (id: string) => all_routes.memberProfile.replace(':id', id);

interface Props {
  id?: string | null;
  name?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const MemberLink: React.FC<Props> = ({ id, name, children, className, style }) => {
  const { t } = useTranslation();
  if (!id) return <>{children}</>;
  return (
    <Link
      to={memberProfilePath(id)}
      className={className}
      style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer', ...style }}
      aria-label={name ? t('member.openProfileOf', "Open {{name}}'s profile", { name }) : t('member.openProfile', 'Open profile')}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
};

export default MemberLink;
