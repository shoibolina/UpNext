import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="site-wrapper">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;