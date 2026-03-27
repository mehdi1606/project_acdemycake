import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  title: string;
  parent?: {
    label: string;
    path: string;
  };
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, parent }) => {
  return (
    <div className="content-header py-3 border-bottom mb-4 bg-white">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">{title}</h4>

            <nav>
              <ol className="breadcrumb mb-0 small">
                {parent && (
                  <li className="breadcrumb-item">
                    <Link to={parent.path}>{parent.label}</Link>
                  </li>
                )}
                <li className="breadcrumb-item active">{title}</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;