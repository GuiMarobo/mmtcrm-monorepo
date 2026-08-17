import React from 'react'
import ReactDOM from 'react-dom/client'
import { LicenseInfo } from '@mui/x-license'
import App from './App'
import './styles/index.css'

const licenseKey = import.meta.env.VITE_MUI_LICENSE_KEY
if (licenseKey) LicenseInfo.setLicenseKey(licenseKey)

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
