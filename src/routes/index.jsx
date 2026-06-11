import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

// Layouts
const AuthLayout = lazy(() => import('../layouts/AuthLayout'));
const PatientLayout = lazy(() => import('../layouts/PatientLayout'));
const CaregiverLayout = lazy(() => import('../layouts/CaregiverLayout'));

// Auth Pages
const Splash = lazy(() => import('../pages/auth/Splash'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ModeSelection = lazy(() => import('../pages/auth/ModeSelection'));

// Patient Pages
const PatientDashboard = lazy(() => import('../pages/patient/Dashboard'));
const Medicines = lazy(() => import('../pages/patient/Medicines'));
const PatientAlerts = lazy(() => import('../pages/patient/Alerts'));
const PatientAnalytics = lazy(() => import('../pages/patient/Analytics'));
const PatientReports = lazy(() => import('../pages/patient/Reports'));
const Inventory = lazy(() => import('../pages/patient/Inventory'));
const PatientProfile = lazy(() => import('../pages/patient/Profile'));
const PatientSettings = lazy(() => import('../pages/patient/Settings'));
const CareCircle = lazy(() => import('../pages/patient/CareCircle'));

// Caregiver Pages
const CaregiverDashboard = lazy(() => import('../pages/caregiver/Dashboard'));
const Patients = lazy(() => import('../pages/caregiver/Patients'));
const PatientDetails = lazy(() => import('../pages/caregiver/PatientDetails'));
const CaregiverAlerts = lazy(() => import('../pages/caregiver/Alerts'));
const CaregiverAnalytics = lazy(() => import('../pages/caregiver/Analytics'));
const CaregiverReports = lazy(() => import('../pages/caregiver/Reports'));
const CaregiverProfile = lazy(() => import('../pages/caregiver/Profile'));
const CaregiverSettings = lazy(() => import('../pages/caregiver/Settings'));

// Components
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

export const routes = [
  {
    path: '/',
    element: Loadable(AuthLayout)(),
    children: [
      { index: true, element: Loadable(Splash)() },
      {
        path: 'login',
        element: (
          <PublicRoute>
            {Loadable(Login)()}
          </PublicRoute>
        )
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            {Loadable(Register)()}
          </PublicRoute>
        )
      },
      {
        path: 'mode-selection',
        element: (
          <ProtectedRoute>
            {Loadable(ModeSelection)()}
          </ProtectedRoute>
        )
      },
    ],
  },
  {
    path: '/patient',
    element: (
      <ProtectedRoute>
        {Loadable(PatientLayout)()}
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/patient/dashboard" replace /> },
      { path: 'dashboard', element: Loadable(PatientDashboard)() },
      { path: 'medicines', element: Loadable(Medicines)() },
      { path: 'alerts', element: Loadable(PatientAlerts)() },
      { path: 'analytics', element: Loadable(PatientAnalytics)() },
      { path: 'reports', element: Loadable(PatientReports)() },
      { path: 'inventory', element: Loadable(Inventory)() },
      { path: 'care-circle', element: Loadable(CareCircle)() },
      { path: 'profile', element: Loadable(PatientProfile)() },
      { path: 'settings', element: Loadable(PatientSettings)() },
    ],
  },
  {
    path: '/caregiver',
    element: (
      <ProtectedRoute>
        {Loadable(CaregiverLayout)()}
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/caregiver/dashboard" replace /> },
      { path: 'dashboard', element: Loadable(CaregiverDashboard)() },
      { path: 'patients', element: Loadable(Patients)() },
      { path: 'patient/:id', element: Loadable(PatientDetails)() },
      { path: 'alerts', element: Loadable(CaregiverAlerts)() },
      { path: 'analytics', element: Loadable(CaregiverAnalytics)() },
      { path: 'reports', element: Loadable(CaregiverReports)() },
      { path: 'profile', element: Loadable(CaregiverProfile)() },
      { path: 'settings', element: Loadable(CaregiverSettings)() },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
