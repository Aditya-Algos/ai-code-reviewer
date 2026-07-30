import { useState } from 'react'
import './App.css'

function App() {
  const [prUrl, setPrUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleReview = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/review?pr_url=${encodeURIComponent(prUrl)}`
      )
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Could not connect to backend. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>AI Code Review Assistant</h1>
      <p>Paste a GitHub Pull Request URL to get an AI-generated review.</p>

      <input
        type="text"
        value={prUrl}
        onChange={(e) => setPrUrl(e.target.value)}
        placeholder="https://github.com/owner/repo/pull/123"
        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
      />

      <button
        onClick={handleReview}
        disabled={loading || !prUrl}
        style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        {loading ? 'Reviewing...' : 'Review PR'}
      </button>

      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '30px' }}>
          <h2>Summary</h2>
          <p>{result.summary}</p>

          <h2>Quality Score: {result.overall_quality_score} / 10</h2>

          <h2>Issues Found</h2>
          {result.issues && result.issues.length > 0 ? (
            result.issues.map((issue, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '10px',
                }}
              >
                <strong>{issue.file}</strong>
                <p>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {issue.severity}
                  </span>{' '}
                  — {issue.category}
                </p>
                <p>{issue.comment}</p>
              </div>
            ))
          ) : (
            <p>No issues found.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App