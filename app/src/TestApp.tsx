import { useState } from 'react'
import './App.css'

function TestApp() {
  const [count, setCount] = useState(0)

  return (
    <div className="relative min-h-screen bg-offwhite">
      <div className="grain-overlay" />
      
      {/* Simple test content */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sage-900 py-6 px-12">
        <div className="flex justify-between items-center">
          <h1 className="text-white font-bold text-xl">NOMAD GEAR TEST</h1>
          <p className="text-white">Frontend is loading...</p>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">✓ Frontend is working!</h2>
          <p className="text-xl text-gray-600 mb-8">Testing basic React functionality</p>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <p className="mb-4">Count: {count}</p>
            <button
              onClick={() => setCount(count + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Increment
            </button>
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded text-left max-w-md">
            <p className="text-sm text-gray-700">
              If you can see this page, React is working correctly.
              <br /><br />
              <strong>Next steps:</strong>
              <ul className="list-disc ml-4 mt-2">
                <li>Check browser console (F12) for JavaScript errors</li>
                <li>Verify backend is running: http://localhost:8000</li>
                <li>Check .env file has: VITE_API_BASE=http://localhost:8000/api/v1</li>
              </ul>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TestApp
