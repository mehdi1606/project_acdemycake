import React from 'react';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../../feature-module/router/all_routes';
import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  title: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title }) => {
  const { t } = useTranslation()
  return (
    <div
      className="breadcrumb-bar text-center"
      style={{
        paddingTop: 85,
        paddingBottom: 24,
        marginTop: 0,
      }}
    >
      <div className="container">
        <h2
          className="breadcrumb-title"
          style={{ marginBottom: 6, fontSize: 26, fontWeight: 700 }}
        >
          {title}
        </h2>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item">
              <Link to={all_routes.homeone}>Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;
