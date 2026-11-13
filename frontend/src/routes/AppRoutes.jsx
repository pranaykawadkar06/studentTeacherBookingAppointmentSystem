import { Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import Landing from '../pages/public/Landing.jsx';
import TeacherDirectory from '../pages/public/TeacherDirectory.jsx';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import ForgotPassword from '../pages/public/ForgotPassword.jsx';
import ResetPassword from '../pages/public/ResetPassword.jsx';
import PendingApproval from '../pages/public/PendingApproval.jsx';
import { Unauthorized, NotFound } from '../pages/public/ErrorPages.jsx';

import TeacherDetails from '../pages/shared/TeacherDetails.jsx';
import ProfilePage from '../pages/shared/ProfilePage.jsx';
import MessagesPage from '../pages/shared/MessagesPage.jsx';

import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ManageTeachers from '../pages/admin/ManageTeachers.jsx';
import TeacherForm from '../pages/admin/TeacherForm.jsx';
import StudentApprovals from '../pages/admin/StudentApprovals.jsx';
import AdminAppointments from '../pages/admin/AdminAppointments.jsx';

import TeacherDashboard from '../pages/teacher/TeacherDashboard.jsx';
import MyAvailability from '../pages/teacher/MyAvailability.jsx';
import AvailabilityForm from '../pages/teacher/AvailabilityForm.jsx';
import AppointmentRequests from '../pages/teacher/AppointmentRequests.jsx';
import TeacherAppointments from '../pages/teacher/TeacherAppointments.jsx';

import StudentDashboard from '../pages/student/StudentDashboard.jsx';
import BrowseTeachers from '../pages/student/BrowseTeachers.jsx';
import MyAppointments from '../pages/student/MyAppointments.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/teachers" element={<TeacherDirectory />} />
        <Route path="/teachers/:id" element={<TeacherDetails basePath="/teachers" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="teachers/new" element={<TeacherForm />} />
          <Route path="teachers/:id/edit" element={<TeacherForm />} />
          <Route path="students" element={<StudentApprovals />} />
          <Route path="appointments" element={<AdminAppointments />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['teacher']} />}>
        <Route path="/teacher" element={<DashboardLayout />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="availability" element={<MyAvailability />} />
          <Route path="availability/new" element={<AvailabilityForm />} />
          <Route path="availability/:id/edit" element={<AvailabilityForm />} />
          <Route path="requests" element={<AppointmentRequests />} />
          <Route path="appointments" element={<TeacherAppointments />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="/student" element={<DashboardLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="teachers" element={<BrowseTeachers />} />
          <Route path="teachers/:id" element={<TeacherDetails basePath="/student/teachers" />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
