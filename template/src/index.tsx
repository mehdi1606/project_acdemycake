import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/i18n'; // ← must be imported before any component
import "../src/style/css/iconsax.css";
import ALLRoutes from './feature-module/router/router';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { base_path } from './environment';
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import './index.scss';
import { Provider } from 'react-redux';
import store from './core/redux/store';
import "../node_modules/@tabler/icons-webfont/dist/tabler-icons.css";
import "../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import { App as AntdApp, notification } from 'antd';

// Global listener for background API errors (server errors, network failures)
window.addEventListener('app:api-error', (e) => {
  const msg = (e as CustomEvent<{ message: string }>).detail?.message;
  if (msg) {
    notification.error({
      message: 'Request Failed',
      description: msg,
      placement: 'topRight',
      duration: 5,
    });
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={base_path}>
        <AntdApp>
          <ErrorBoundary>
            <ALLRoutes />
          </ErrorBoundary>
        </AntdApp>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
