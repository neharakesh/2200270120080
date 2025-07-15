import React, { useState, useEffect } from 'react';
import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [validMinutes, setValidMinutes] = useState('');
  const [error, setError] = useState('');
  const [shortened, setShortened] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendURL}/all`);
      setShortened(res.data);
    } catch (err) {
      console.error(err);
      setError(' Unable to connect to the backend. Please ensure it’s running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!url) return setError('Please enter a URL.');
    if (!url.startsWith('http')) return setError(' URL must start with http:// or https://');

    const validity = parseInt(validMinutes) || 30;

    try {
      await axios.post(`${backendURL}/shorten`, {
        url,
        customCode,
        validity,
      });
      setUrl('');
      setCustomCode('');
      setValidMinutes('');
      fetchLinks();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">🔗 Easy URL Shortener</h1>

        {error && <div className="text-red-600 font-medium mb-4">{error}</div>}

        <div className="space-y-4">
          <input
            type="text"
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Paste a long URL (must start with http/https)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            type="text"
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none"
            placeholder="Custom short code (optional, alphanumeric only)"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
          />
          <input
            type="number"
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none"
            placeholder="Valid duration in minutes (default: 30)"
            value={validMinutes}
            onChange={(e) => setValidMinutes(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition"
          >
             Generate Short Link
          </button>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-700">📋 Your Shortened URLs</h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading your links...</p>
        ) : shortened.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't shortened any links yet.</p>
        ) : (
          <ul className="space-y-4">
            {shortened.map((link) => (
              <li key={link.shortCode} className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="mb-1">
                  <a
                   href={`${backendURL}/${link.shortCode}`}
                    className="text-blue-700 underline font-medium"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {backendURL}/{link.shortCode}
                  </a>
                </div>
                <p className="text-sm text-gray-700">
                <span className="font-medium">Original:</span> {link.originalUrl}
                </p>
                <p className="text-sm text-gray-700">
                   <span className="font-medium">Expires:</span>{' '}
                  {new Date(link.expireAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-700">
                   <span className="font-medium">Total Clicks:</span> {link.clicks.length}
                </p>
                {link.clicks.length > 0 && (
                  <div className="mt-2 pl-2 border-l border-gray-300">
                    {link.clicks.map((click, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        • {click.timestamp} from {click.source} ({click.geo})
                      </p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
