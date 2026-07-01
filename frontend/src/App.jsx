import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PredictReview from "./pages/PredictReview.jsx";
import UploadReviews from "./pages/UploadReviews.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import UserHome from "./pages/UserHome.jsx";
import AccessDenied from "./pages/AccessDenied.jsx";
import { AdminRoute, ProtectedRoute, GuestRoute } from "./components/RouteGuards.jsx";

/** Shared shell (sidebar + content area) for any signed-in page. */
function AppShell({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes -- redirect away if already signed in */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />

      {/* Any authenticated user */}
      <Route
        path="/access-denied"
        element={
          <ProtectedRoute>
            <AccessDenied />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <AppShell>
              <UserHome />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Admin-only analytics area */}
      <Route
        path="/"
        element={
          <AdminRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </AdminRoute>
        }
      />
      <Route
        path="/predict"
        element={
          <AdminRoute>
            <AppShell>
              <PredictReview />
            </AppShell>
          </AdminRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <AdminRoute>
            <AppShell>
              <UploadReviews />
            </AppShell>
          </AdminRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <AdminRoute>
            <AppShell>
              <Recommendations />
            </AppShell>
          </AdminRoute>
        }
      />
    </Routes>
  );
}
