import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateCourse from './pages/CreateCourse';
import CourseDetail from './pages/CourseDetail';
import DevJournal from './pages/DevJournal';

function App() {
  return (
    <div style={{ padding: '20px', width: '100%' }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateCourse />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/journal" element={<DevJournal />} />
      </Routes>
    </div>
  );
}

export default App;
