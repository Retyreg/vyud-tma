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

const GraphPage = lazy(() => import('./pages/GraphPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<UploadPage />} />
            <Route path="/graph" element={<Suspense fallback={null}><GraphPage /></Suspense>} />
            <Route path="/leaderboard" element={<Suspense fallback={null}><LeaderboardPage /></Suspense>} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>
          <Route path="/test/:id" element={<TestPlayerPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
