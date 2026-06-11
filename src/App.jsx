import React from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const element = useRoutes(routes);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-slate-200 selection:bg-primary-cyan/30 selection:text-primary-cyan">
        {element}
      </div>
    </ErrorBoundary>
  );
}

export default App;
