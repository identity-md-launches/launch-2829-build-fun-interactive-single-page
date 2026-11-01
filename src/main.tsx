import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config';
import { App } from './App';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } });

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <main className="app-error"><h1>The garden needs a refresh.</h1><p>Your saved plants are still in this browser.</p><button className="button primary" onClick={() => location.reload()}>Reload garden</button></main> : this.props.children; }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><WagmiProvider config={config}><QueryClientProvider client={queryClient}><App /></QueryClientProvider></WagmiProvider></ErrorBoundary></React.StrictMode>);
