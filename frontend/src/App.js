import React, { useEffect, useState } from 'react';
/*import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';*/
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import Profile from './components/Profile';
import Search from './components/Search';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


{/*import Login from './components/Login';
import Signup from './components/Signup';
import LogoutButton from './components/logoutbutton';
import authService from './services/auth';


import './App.css';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = authService.getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const handleLoginSuccess = (accessToken, username) => {
    authService.login(accessToken, username);
    setToken(accessToken);
  };

  const handleSignupSuccess = (accessToken, username) => {
    authService.login(accessToken, username);
    setToken(accessToken);
  };

  const handleLogout = () => {
    authService.logout();
    setToken(null);
  };

  return (
    <Router>
      <div className="App">
        {token && <LogoutButton onLogout={handleLogout} />}
        <Routes>
          <Route
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
            path="/Signup"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Signup onSignupSuccess={handleSignupSuccess} />
              )
            }
          />

          <Route
            path="/"
            element={
              token ? <Home /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
  
export default App;

*/}



