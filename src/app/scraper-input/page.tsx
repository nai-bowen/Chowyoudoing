/* eslint-disable */

'use client';

import { useState } from 'react';

export default function ScraperInput() {
    const [url, setUrl] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/scraper', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error submitting URL:', error);
            setMessage('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Scrape Uber Eats Menu</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Enter Uber Eats restaurant URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    {loading ? 'Scraping...' : 'Scrape Menu'}
                </button>
            </form>

            {message && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                    <p>{message}</p>
                </div>
            )}
        </div>
    );
}
