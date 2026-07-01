import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PredictReview from "./pages/PredictReview.jsx";
import UploadReviews from "./pages/UploadReviews.jsx";
import Recommendations from "./pages/Recommendations.jsx";

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<PredictReview />} />
          <Route path="/upload" element={<UploadReviews />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </main>
    </div>
  );
}
