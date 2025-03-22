import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home'; 
import './App.css';

function App() {

  const [token, setToken] = useState(null);

  const handleLoginSuccess = (accessToken) => {
    setToken(accessToken);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />
          {/* uncomment code block below to make it mandatory to login --> preferably after signup code is ready */}
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
