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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && prUrl && !loading) {
      handleReview()
    }
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div className="eyebrow">// ai code review</div>
          <h1 className="title">Code Review Assistant</h1>
          <p className="subtitle">
            Paste a GitHub Pull Request URL and get an instant AI-generated review.
          </p>
        </div>

        <div className="terminal-card">
          <div className="terminal-bar">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-label">review.sh</span>
          </div>
          <div className="terminal-body">
            <div className="input-row">
              <span className="prompt-symbol">$</span>
              <input
                type="text"
                className="url-input"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="paste PR url — https://github.com/owner/repo/pull/123"
              />
            </div>
            <button
              className="review-button"
              onClick={handleReview}
              disabled={loading || !prUrl}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Reviewing...
                </>
              ) : (
                'Review PR'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box">✗ {error}</div>
        )}

        {result && (
          <div className="results">
            <div className="summary-card">
              <div className="summary-text">
                <p className="section-label">Summary</p>
                <p className="summary-body">{result.summary}</p>
              </div>
              <div className="score-badge">
                <div className="score-value">{result.overall_quality_score}</div>
                <div className="score-max">/ 10</div>
              </div>
            </div>

            <p className="issues-heading">
              Issues ({result.issues ? result.issues.length : 0})
            </p>

            {result.issues && result.issues.length > 0 ? (
              result.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`issue-card severity-${issue.severity}`}
                >
                  <div className="issue-header">
                    <span className="issue-file">{issue.file}</span>
                    <span className={`badge severity-${issue.severity}`}>
                      {issue.severity}
                    </span>
                    <span className="badge category">{issue.category}</span>
                  </div>
                  <p className="issue-comment">{issue.comment}</p>
                </div>
              ))
            ) : (
              <div className="no-issues">✓ No issues found — clean PR</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App