import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { initializeFirebase } from './services/firebase';
import Login from './pages/Login';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
    // Initialize auth from localStorage
    initAuth();
    setLoading(false);
  }, [initAuth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-whatsapp-dark">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-whatsapp-primary"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <Home />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
