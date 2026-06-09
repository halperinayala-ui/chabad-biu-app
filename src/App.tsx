import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import AdminEventEditor from './pages/admin/AdminEventEditor';
import AdminRegistrants from './pages/admin/AdminRegistrants';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCRM from './pages/admin/AdminCRM';
import AdminStudentProfile from './pages/admin/AdminStudentProfile';
import AdminMediaManager from './pages/admin/AdminMediaManager';
import Auth from './pages/Auth';
import ProfileSettings from './pages/ProfileSettings';
import Community from './pages/Community';
import InstallBanner from './components/InstallBanner';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './App.css'; 
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Rubik, sans-serif' } }} />
      <div className="app-container">
        <InstallBanner />
        {/* Global Animated Background */}
        <div className="global-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>

        <Navbar />
        <main className="container" style={{ marginTop: '80px', minHeight: 'calc(100vh - 80px - 300px)', paddingBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/community" element={<Community />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/event/view/:id" element={<EventDetails />} />
            
            {/* Protected User Routes */}
            <Route path="/profile" element={
              <ProtectedRoute><ProfileSettings /></ProtectedRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/events/new" element={
              <ProtectedRoute requireAdmin><AdminEventEditor /></ProtectedRoute>
            } />
            <Route path="/admin/events/edit/:id" element={
              <ProtectedRoute requireAdmin><AdminEventEditor /></ProtectedRoute>
            } />
            <Route path="/admin/events/:id/registrants" element={
              <ProtectedRoute requireAdmin><AdminRegistrants /></ProtectedRoute>
            } />
            <Route path="/admin/media" element={
              <ProtectedRoute requireAdmin><AdminMediaManager /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>
            } />
            <Route path="/admin/crm" element={
              <ProtectedRoute requireAdmin><AdminCRM /></ProtectedRoute>
            } />
            <Route path="/admin/crm/:studentId" element={
              <ProtectedRoute requireAdmin><AdminStudentProfile /></ProtectedRoute>
            } />
            {/* We will add more routes later */}
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
