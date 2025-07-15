import React, { useState, useEffect } from 'react';
import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [validMinutes, setValidMinutes] = useState('');
  const [error, setError] = useState('');
  const [shortened, setShortened] = useState([]);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${backendURL}/all`);
      setShortened(res.data);
    } catch (err) {
      console.error(err);
      setError('Backend not reachable. Is it running?');
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!url.startsWith('http')) return setError('Please enter a valid URL starting with http or https');
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
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">🔗 URL Shortener</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          className="border w-full p-2 mb-2"
          placeholder="Enter URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          className="border w-full p-2 mb-2"
          placeholder="Custom short code (optional)..."
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
        />
        <input
          type="number"
          className="border w-full p-2 mb-4"
          placeholder="Valid for (minutes)..."
          value={validMinutes}
          onChange={(e) => setValidMinutes(e.target.value)}
        />
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
          Shorten
        </button>

        <h2 className="text-xl mt-6 mb-2">📜 Your Links</h2>
        <ul className="space-y-2">
          {shortened.map((link) => (
            <li key={link.shortCode} className="bg-gray-100 p-3 rounded shadow-sm">
              <a
                className="text-blue-600 underline"
                href={`${backendURL}/${link.shortCode}`}
                target="_blank"
                rel="noreferrer"
              >
                {backendURL}/{link.shortCode}
              </a>
              <p className="text-sm">Original: {link.originalUrl}</p>
              <p className="text-sm">Expires at: {new Date(link.expireAt).toLocaleString()}</p>
              <p className="text-sm">Clicks: {link.clicks.length}</p>
              {link.clicks.map((c, i) => (
                <p key={i} className="text-xs text-gray-600">
                  - {c.timestamp} from {c.source} ({c.geo})
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
