import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import UploadPage from './pages/UploadPage';
import TestsPage from './pages/TestsPage';
import TestPlayerPage from './pages/TestPlayerPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import SOPListPage from './pages/SOPListPage';
import SOPPlayerPage from './pages/SOPPlayerPage';
import ManagerDashboard from './pages/ManagerDashboard';
import TemplatesPage from './pages/TemplatesPage';
import SOPEditPage from './pages/SOPEditPage';
import OnboardingPage from './pages/OnboardingPage';
import SOPUploadPage from './pages/SOPUploadPage';

const GraphPage = lazy(() => import('./pages/GraphPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<SOPListPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/graph" element={<Suspense fallback={null}><GraphPage /></Suspense>} />
            <Route path="/leaderboard" element={<Suspense fallback={null}><LeaderboardPage /></Suspense>} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/templates" element={<TemplatesPage />} />
          </Route>
          <Route path="/test/:id" element={<TestPlayerPage />} />
          <Route path="/sop/:id" element={<SOPPlayerPage />} />
          <Route path="/sop/:id/edit" element={<SOPEditPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/upload-sop" element={<SOPUploadPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
