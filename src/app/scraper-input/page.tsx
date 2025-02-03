/* eslint-disable */

"use client";
import { useState } from 'react';

export default function ScraperInput() {
  const [url, setUrl] = useState('');
  const [menu, setMenu] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setMenu(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Uber Eats URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">Scrape Menu</button>
      </form>
      {menu && (
        <pre>{JSON.stringify(menu, null, 2)}</pre>
      )}
    </div>
  );
}
