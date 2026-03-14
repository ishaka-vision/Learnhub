import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/common/Layout";
import { ProtectedRoute, RoleRoute } from "./components/common/ProtectedRoute";

import Home from "./pages/public/Home";
import Courses from "./pages/public/Courses";
import CourseDetail from "./pages/public/CourseDetail";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import StudentDashboard from "./pages/student/Dashboard";
import Learn from "./pages/student/Learn";

import InstructorDashboard from "./pages/instructor/Dashboard";
import CreateCourse from "./pages/instructor/CreateCourse";
import EditCourse from "./pages/instructor/EditCourse";
import Corrections from "./pages/instructor/Corrections";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/AdminCourses";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Layout>
        <Routes>

          {/* Pages publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Pages étudiant */}
          <Route path="/dashboard" element={
            <ProtectedRoute><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/learn/:courseId" element={
            <ProtectedRoute><Learn /></ProtectedRoute>
          } />

          {/* Pages instructeur */}
          <Route path="/instructor/dashboard" element={
            <RoleRoute allowedRoles={["instructor"]}><InstructorDashboard /></RoleRoute>
          } />
          <Route path="/instructor/courses/new" element={
            <RoleRoute allowedRoles={["instructor"]}><CreateCourse /></RoleRoute>
          } />
          <Route path="/instructor/courses/:id/edit" element={
            <RoleRoute allowedRoles={["instructor"]}><EditCourse /></RoleRoute>
          } />
          <Route path="/instructor/corrections" element={
            <RoleRoute allowedRoles={["instructor"]}><Corrections /></RoleRoute>
          } />

          {/* Pages admin */}
          <Route path="/admin/dashboard" element={
            <RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>
          } />
          <Route path="/admin/users" element={
            <RoleRoute allowedRoles={["admin"]}><AdminUsers /></RoleRoute>
          } />
          <Route path="/admin/courses" element={
            <RoleRoute allowedRoles={["admin"]}><AdminCourses /></RoleRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="text-gray-500 mt-4">Page introuvable</p>
              <Link to="/" className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg">
                Retour à l'accueil
              </Link>
            </div>
          } />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
