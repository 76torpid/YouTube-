import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-600">NewsWatch</h1>
        <p className="text-gray-600">YouTubeニュース監視 & AI要約通知システム</p>
      </header>
      <main className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">システム状態</h2>
        <p className="text-green-600 font-medium">Phase 1 Foundation Operational</p>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
