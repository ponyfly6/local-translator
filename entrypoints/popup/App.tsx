import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-900">
      <div className="flex gap-4 mb-8">
        <a href="https://wxt.dev" target="_blank" className="transition-transform hover:scale-110">
          <img src={wxtLogo} className="h-24 w-24" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="transition-transform hover:scale-110">
          <img src={reactLogo} className="h-24 w-24" alt="React logo" />
        </a>
      </div>
      <h1 className="text-5xl font-bold text-white mb-8">WXT + React</h1>
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          count is {count}
        </button>
        <p className="mt-4 text-gray-300">
          Edit <code className="bg-slate-700 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="mt-8 text-gray-400">
        Click on the WXT and React logos to learn more
      </p>
    </div>
  );
}

export default App;
