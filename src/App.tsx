import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { NewCasePage } from './pages/NewCasePage';
import { CaseDetails } from './pages/CaseDetails';
import { ForgotPassword } from './pages/ForgotPassword';
import { NotificationManager } from './components/NotificationManager';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) return null;

  return (
    <Router>
      <NotificationManager user={user} />
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="pb-24 md:pb-8">
          <Routes>
            <Route
              path="/login"
              element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/recover"
              element={!user ? <ForgotPassword /> : <Navigate to="/" />}
            />
            <Route
              path="/register"
              element={!user ? <RegisterPage onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/new-case"
              element={user?.role === 'lawyer' ? <NewCasePage user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/case/:id"
              element={user ? <CaseDetails user={user} /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
