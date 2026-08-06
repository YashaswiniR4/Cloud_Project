import React from 'react';
import ReactDOM from 'react-dom/client';
import AppPortal from './AppPortal.jsx';
import AppSoc from './AppSoc.jsx';
import './index.css';

// Dynamic Entry point selector based on execution port:
// - Port 5173 loads ONLY Corporate Web Portal (AppPortal)
// - Port 5174 loads ONLY SOC Analyst Command Center (AppSoc)
const port = window.location.port;
const isPortalApp = port === '5173';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPortalApp ? <AppPortal /> : <AppSoc />}
  </React.StrictMode>,
);
