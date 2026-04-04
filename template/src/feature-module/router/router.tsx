import React, { Suspense } from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import Feature from "../feature";
import AuthFeature from "../authFeature";

const PageLoader: React.FC = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--lx-bg, #faf9f7)', zIndex: 9999,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '3px solid rgba(107, 29, 42, 0.15)',
      borderTopColor: 'var(--lx-primary, #6B1D2A)',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
);

const ALLRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Feature />}>
          {publicRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>

        <Route element={<AuthFeature />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default ALLRoutes;
