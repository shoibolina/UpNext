import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './components/home/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Profile from './components/profile/Profile';
import Dashboard from './components/dashboard/Dashboard';
import Events from './components/events/Events';
import EventDetail from './components/events/EventDetail';
import EventEdit from './components/events/EventEdit';
import CreateEvent from './components/events/CreateEvent';
import TicketVerification from './components/tickets/TicketVerification'; // Ticket verification component
import authService from './services/authService';
import About from './components/about/about';
import Privacy from './components/help/privacy';
import Contact from './components/help/contact';
import Terms from './components/help/terms';
import FAQs from './components/help/faq';

import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/signup"
          element={
            <Layout>
              <Signup />
            </Layout>
          }
        />
        <Route
          path="/events"
          element={
            <Layout>
              <Events />
            </Layout>
          }
        />
        {/* Event detail route */}
        <Route
          path="/events/:id"
          element={
            <Layout>
              <EventDetail />
            </Layout>
          }
        />
        {/* Ticket verification route for organizers */}
        <Route
          path="/ticket-verification/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketVerification />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Event edit route */}
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EventEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateEvent />
              </Layout>
            </ProtectedRoute>
          }
        />
<<<<<<< HEAD
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQs />} />
        <Route path="/terms" element={<Terms />} />
        {/* Add more routes as needed */}
=======
        {/* Catch-all route */}
>>>>>>> d712c2f93ecab4102e188a05ef449a5745c6a6b2
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
