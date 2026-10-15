import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Students from './pages/Students';
import Assessments from './pages/Assessments';
import Leaderboard from './pages/Leaderboard';
import BulkMarks from './pages/BulkMarks';
import Attendance from './pages/Attendance';
import ReportGenerator from './pages/ReportGenerator';
import Settings from './pages/Settings';
import Register from './pages/Register';
import TeacherManagement from './pages/TeacherManagement';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherMarks from './pages/TeacherMarks';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Billing from './pages/Billing';
import Promotion from './pages/Promotion';





function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/assessments" element={<Assessments />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/bulkmarks" element={<BulkMarks />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/reports" element={<ReportGenerator />} />
      <Route path="/settings" element={<Settings />} />
       <Route path="/billing" element={<Billing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/classes" element={<Classes/>} /> 
      <Route path="/dashboard/subjects" element={<Subjects />} />
      <Route path="/dashboard/teacher-management" element={<TeacherManagement />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/attendance" element={<TeacherAttendance />} />
      <Route path="/teacher/marks" element={<TeacherMarks />} />
      <Route
    path="/promotion" element={<Promotion />}/>
     
    </Routes>
  );
}

export default App;