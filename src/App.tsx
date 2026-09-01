/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

// Lazy load pages for better performance
const MapPage = lazy(() =>
  import("./pages/MapPage").then((module) => ({ default: module.MapPage })),
);
const ReportPage = lazy(() =>
  import("./pages/ReportPage").then((module) => ({
    default: module.ReportPage,
  })),
);
const FeedPage = lazy(() =>
  import("./pages/FeedPage").then((module) => ({ default: module.FeedPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const RoutePage = lazy(() =>
  import("./pages/RoutePage").then((module) => ({ default: module.RoutePage })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const TipsPage = lazy(() =>
  import("./pages/TipsPage").then((module) => ({ default: module.TipsPage })),
);
const GamificationPage = lazy(() =>
  import("./pages/GamificationPage").then((module) => ({
    default: module.GamificationPage,
  })),
);
const ReferralPage = lazy(() =>
  import("./pages/ReferralPage").then((module) => ({
    default: module.ReferralPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const AccountSettingsPage = lazy(() =>
  import("./pages/AccountSettingsPage").then((module) => ({
    default: module.AccountSettingsPage,
  })),
);
const NotificationSettingsPage = lazy(() =>
  import("./pages/NotificationSettingsPage").then((module) => ({
    default: module.NotificationSettingsPage,
  })),
);
const PrivacySettingsPage = lazy(() =>
  import("./pages/PrivacySettingsPage").then((module) => ({
    default: module.PrivacySettingsPage,
  })),
);
const SecuritySettingsPage = lazy(() =>
  import("./pages/SecuritySettingsPage").then((module) => ({
    default: module.SecuritySettingsPage,
  })),
);
const HelpPage = lazy(() =>
  import("./pages/HelpPage").then((module) => ({ default: module.HelpPage })),
);
const TrustedContactsPage = lazy(() =>
  import("./pages/TrustedContactsPage").then((module) => ({
    default: module.TrustedContactsPage,
  })),
);
const TrackingPage = lazy(() =>
  import("./pages/TrackingPage").then((module) => ({
    default: module.TrackingPage,
  })),
);
const FeedbackPage = lazy(() =>
  import("./pages/FeedbackPage").then((module) => ({
    default: module.FeedbackPage,
  })),
);
const TutorialPage = lazy(() =>
  import("./pages/TutorialPage").then((module) => ({
    default: module.TutorialPage,
  })),
);
const ComoUsarPage = lazy(() =>
  import("./pages/ComoUsarPage").then((module) => ({
    default: module.ComoUsarPage,
  })),
);
const TermsPage = lazy(() =>
  import("./pages/TermsPage").then((module) => ({ default: module.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("./pages/PrivacyPage").then((module) => ({
    default: module.PrivacyPage,
  })),
);
const SupportPage = lazy(() =>
  import("./pages/SupportPage").then((module) => ({
    default: module.SupportPage,
  })),
);
const FaqPage = lazy(() =>
  import("./pages/FaqPage").then((module) => ({ default: module.FaqPage })),
);
const AcceptTermsPage = lazy(() =>
  import("./pages/AcceptTermsPage").then((module) => ({
    default: module.AcceptTermsPage,
  })),
);

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, termsAccepted } = useAuth();
  const location = useLocation();

  if (loading || termsAccepted === null) {
    // termsAccepted is null when checking or unauthenticated
    if (loading) return <PageLoader />;
    if (!user)
      return <Navigate to="/login" state={{ from: location }} replace />;
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (termsAccepted === false && location.pathname !== "/accept-terms") {
    return <Navigate to="/accept-terms" replace />;
  }

  if (termsAccepted === true && location.pathname === "/accept-terms") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <PWAInstallPrompt />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/track/:sessionId" element={<TrackingPage />} />
            <Route path="/como-usar" element={<ComoUsarPage lang="pt" />} />
            <Route path="/en/how-to-use" element={<ComoUsarPage lang="en" />} />
            <Route path="/es/como-usar" element={<ComoUsarPage lang="es" />} />

            {/* Term Acceptance is a separate flow but protected */}
            <Route
              path="/accept-terms"
              element={
                <ProtectedRoute>
                  <AcceptTermsPage />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<MapPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/route" element={<RoutePage />} />

              <Route path="/tips" element={<TipsPage />} />
              <Route path="/gamification" element={<GamificationPage />} />
              <Route path="/referral" element={<ReferralPage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/settings/account"
                element={<AccountSettingsPage />}
              />
              <Route
                path="/settings/notifications"
                element={<NotificationSettingsPage />}
              />
              <Route
                path="/settings/privacy"
                element={<PrivacySettingsPage />}
              />
              <Route
                path="/settings/security"
                element={<SecuritySettingsPage />}
              />

              <Route path="/help" element={<HelpPage />} />
              <Route path="/help/feedback" element={<FeedbackPage />} />
              <Route path="/help/terms" element={<TermsPage />} />
              <Route path="/help/privacy" element={<PrivacyPage />} />
              <Route path="/help/support" element={<SupportPage />} />
              <Route path="/help/faq" element={<FaqPage />} />

              <Route
                path="/trusted-contacts"
                element={<TrustedContactsPage />}
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
// Lockfile sync commit
