import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { LegalHelp } from './pages/LegalHelp';
import { NyaySathiList } from './pages/NyaySathiList';
import { NyaySathiDetails } from './pages/NyaySathiDetails';
import { AboutUs } from './pages/AboutUs';
import { Services } from './pages/Services';
import { Resources } from './pages/Resources';
import { SuccessStories } from './pages/SuccessStories';
import { Auth } from './pages/auth/Auth';
import { UserProfile } from './pages/profile/UserProfile';
import { FindHelp } from './pages/FindHelp';
import { DirectChat } from './pages/DirectChat';
import { AppointmentSchedule } from './pages/appointments/AppointmentSchedule';
import { CaseQuery } from './pages/CaseQuery';
import './App.css';

// Define ProtectedRoute component and actually use it
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const token = localStorage.getItem('token');

  if (!isLoggedIn || !token) {
    return <Navigate to="/auth" />;
  }

  return children;
};

// Verify the backend URL
console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<><Home /><Footer /></>} />
            <Route path="/legal-help" element={<><LegalHelp /><Footer /></>} />
            <Route path="/nearby-help" element={<><FindHelp /><Footer /></>} />
            <Route path="/nyaysathi" element={<><NyaySathiList /><Footer /></>} />
            <Route path="/nyaysathi/public/:nyaysathi_id" element={<NyaySathiDetails />} />
            <Route path="/about" element={<><AboutUs /><Footer /></>} />
            <Route path="/services" element={<><Services /><Footer /></>} />
            <Route path="/resources" element={<><Resources /><Footer /></>} />
            <Route path="/success-stories" element={<><SuccessStories /><Footer /></>} />
            <Route path="/auth" element={<><Auth /><Footer /></>} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/chat/:chat_id" element={
              <ProtectedRoute>
                <DirectChat />
              </ProtectedRoute>
            } />
            <Route path="/appointment/:nyaysathi_id" element={
              <ProtectedRoute>
                <AppointmentSchedule />
              </ProtectedRoute>
            } />
            <Route path="/case-query" element={
              <ProtectedRoute>
                <CaseQuery />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
