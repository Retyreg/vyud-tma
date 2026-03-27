import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateCourse from './pages/CreateCourse';
import CourseDetail from './pages/CourseDetail';
import TestsPage from './pages/TestsPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/shared/BottomNav';

function App() {
  return (
    <div style={{ padding: '16px 16px 76px', width: '100%', boxSizing: 'border-box' }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateCourse />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default App;
