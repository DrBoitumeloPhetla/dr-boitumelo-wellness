import { useState } from 'react';
import { generateDemoData, clearDemoData } from '../../utils/generateDemoData';
import { FaDatabase, FaTrash } from 'react-icons/fa';

const DemoDataButton = () => {
  const [message, setMessage] = useState('');

  const handleGenerate = () => {
    generateDemoData();
    setMessage('Demo data generated! Refresh the page to see it.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClear = () => {
    clearDemoData();
    setMessage('Demo data cleared! Refresh the page.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2 z-50">
      {message && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {message}
        </div>
      )}
      <div className="flex space-x-2">
        <button
          onClick={handleGenerate}
          className="bg-primary-green text-white px-4 py-2 rounded-lg shadow-lg hover:bg-opacity-90 transition-all flex items-center space-x-2"
          title="Generate demo data for testing"
        >
          <FaDatabase />
          <span>Generate Demo Data</span>
        </button>
        <button
          onClick={handleClear}
          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-opacity-90 transition-all flex items-center space-x-2"
          title="Clear all demo data"
        >
          <FaTrash />
          <span>Clear Data</span>
        </button>
      </div>
    </div>
  );
};

export default DemoDataButton;
