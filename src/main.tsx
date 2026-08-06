import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ProveedoresProvider } from './providers/ProveedoresContext';
import { TenantProvider } from './tenant/TenantContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<TenantProvider>
					<ProveedoresProvider>
						<App />
					</ProveedoresProvider>
				</TenantProvider>
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
