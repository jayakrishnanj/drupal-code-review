'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/styles.css'; // Corrected import path

export default function Home() {
  const [path, setPath] = useState('');
  const [markdown, setMarkdown] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch('/api/analyse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    const data = await response.text();
    setMarkdown(data);
  };

  return (
    <div className="container">
      <h1 className="header">Drupal Custom Module Analyser</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Enter Drupal root folder path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="input"
        />
        <button type="submit" className="button">Analyse</button>
      </form>
      {markdown && (
        <div className="resultContainer">
          <h2 className="subHeader">Analysis Result</h2>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}