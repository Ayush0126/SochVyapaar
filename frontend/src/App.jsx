import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import History from './pages/History';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/data-entry" element={<DataEntry />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
