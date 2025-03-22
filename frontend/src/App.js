import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
//import Signup from './components/Signup'
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />


          {/*<Route path="/signup" element={token ? (
              <Navigate to="/" replace />) : (
              <Signup onSignupSuccess={handleSignupSuccess} onSwitchToLogin={handleSwitchToLogin} />)}/>*/}


        </Routes>
      </div>
    </Router>
  );
}

export default App;
