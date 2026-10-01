import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { StatusPage } from '@/pages/StatusPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PanchayatsPage } from '@/pages/PanchayatsPage';
import { UsersPage } from '@/pages/UsersPage';
import { CitizensPage } from '@/pages/CitizensPage';
import { AddCitizenPage } from '@/pages/AddCitizenPage';
import { CitizenDetailPage } from '@/pages/CitizenDetailPage';
import { ComplaintsPage } from '@/pages/ComplaintsPage';
import { CreateComplaintPage } from '@/pages/CreateComplaintPage';
import { ComplaintDetailPage } from '@/pages/ComplaintDetailPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RootLayout />}>
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/panchayats" element={<PanchayatsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/citizens" element={<CitizensPage />} />
          <Route path="/citizens/new" element={<AddCitizenPage />} />
          <Route path="/citizens/:id" element={<CitizenDetailPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/complaints/new" element={<CreateComplaintPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
