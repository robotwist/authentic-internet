import React from 'react';
import Navbar from '../Navbar';

/**
 * AppLayout - Handles the main application layout structure
 * 
 * Separates layout concerns from routing and business logic,
 * making it easier to modify the layout without affecting other parts.
 */
export const AppLayout = ({ children }) => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;