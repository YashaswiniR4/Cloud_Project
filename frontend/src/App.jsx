import React from 'react';
import AppPortal from './AppPortal';
import AppSoc from './AppSoc';

export default function App() {
  const port = window.location.port;
  return port === '5173' ? <AppPortal /> : <AppSoc />;
}
