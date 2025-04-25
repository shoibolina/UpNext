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
import ForgotPassword from './components/forgotpassword/forgotpassword';
import ExploreVenues from "./components/venues/ExploreVenues";
import VenueDetail from "./components/venues/VenueDetail";
import CreateVenue from "./components/venues/CreateVenue";
import ManageAvailability from './components/venues/ManageAvailability';
import BookVenueForm from './components/venues/BookVenueForm';
import Messages from './components/messaging/Messaging';
import Conversation from './components/messaging/Conversation';
import NewConversation from './components/messaging/NewConversation'; // Note the plural 'NewConversations'
import ResetPassword from './components/forgotpassword/ResetPassword';
import EditVenue from "./components/venues/EditVenue";

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
        <Route
          path="/forgot-password"
          element={
            <Layout>
              <ForgotPassword />
            </Layout>
          }
        />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route
          path="/about"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />
        <Route
          path="/terms"
          element={
            <Layout>
              <Terms />
            </Layout>
          }
        />
        <Route
          path="/privacy"
          element={
            <Layout>
              <Privacy />
            </Layout>
          }
        />
        <Route
          path="/faq"
          element={
            <Layout>
              <FAQs />
            </Layout>
          }
        />

        {/* Venue routes */}
        <Route
          path="/venues"
          element={
            <Layout>
              <ExploreVenues />
            </Layout>
          }
        />

        <Route
          path="/venues/:id"
          element={
            <Layout>
              <VenueDetail />
            </Layout>
          }
        />

        <Route
          path="/create-venue"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateVenue />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues/:id/availability"
          element={
            <ProtectedRoute>
              <Layout>
                <ManageAvailability />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/venues/:id/book" element={<BookVenueForm />} />
        <Route path="/venues/:id/edit" element={<EditVenue />} />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Layout>
                <Messages />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Conversation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/new"
          element={
            <ProtectedRoute>
              <Layout>
                <NewConversation />
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

        {/* Route for viewing other user profiles */}
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Add more routes as needed */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
