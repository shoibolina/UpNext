import React from 'react';


import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Signup from './components/Signup'
import './App.css';

function App() {

  const [token, setToken] = useState(null);

  const handleLoginSuccess = (accessToken) => {
    setToken(accessToken);
  };

  const handleSignupSuccess = (accessToken) => {
    setToken(accessToken);
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Signup Route*/}
          <Route path="/Signup" element={<Signup />} />
          {/*<Route path="/signup" element={token ? (
              <Navigate to="/" replace />) : (
              <Signup onSignupSuccess={handleSignupSuccess} onSwitchToLogin={handleSwitchToLogin} />)}/>*/}



          {/* Login Route */}
          <Route path="/login" element={<Login />} />
          {/* uncomment code block below to make it mandatory to login */}
          {/* <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/"
            element={token ? <Home /> : <Navigate to="/login" replace />}
          /> */}
          <Route path="/" element={<Home />} />


        </Routes>
      </div>
    </Router>
  );
}

export default App;
