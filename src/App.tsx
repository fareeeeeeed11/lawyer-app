import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CaseDetails } from './pages/CaseDetails';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NewCasePage } from './pages/NewCasePage';
import { CasesPage } from './pages/CasesPage';
import { ClientsPage } from './pages/ClientsPage';
import { CalendarPage } from './pages/CalendarPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ForgotPassword } from './pages/ForgotPassword';
import { NotificationManager } from './components/NotificationManager';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { User } from './types';

import { notificationService } from './services/notificationService';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  React.useEffect(() => {
    notificationService.requestPermissions();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <NotificationManager user={user} />
      <div className="min-h-screen bg-[#030712] bg-mesh text-white font-sans flex overflow-hidden" dir="rtl">
        {user && <Sidebar user={user} onLogout={handleLogout} />}

        <main className={`flex-1 overflow-y-auto h-screen ${user ? 'mr-20 md:mr-24' : ''}`}>
          <div className="max-w-[1600px] mx-auto p-4 md:p-8">
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
                path="/"
                element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
              />
              <Route
                path="/case/:id"
                element={user ? <CaseDetails user={user} /> : <Navigate to="/login" />}
              />
              <Route
                path="/new-case"
                element={user ? <NewCasePage user={user} /> : <Navigate to="/login" />}
              />
              {/* Sidebar Placeholder Routes */}
              <Route path="/cases" element={user ? <CasesPage user={user} /> : <Navigate to="/login" />} />
              <Route path="/clients" element={user ? <ClientsPage user={user} /> : <Navigate to="/login" />} />
              <Route path="/calendar" element={user ? <CalendarPage user={user} /> : <Navigate to="/login" />} />
              <Route path="/documents" element={user ? <DocumentsPage user={user} /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
