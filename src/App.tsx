import DocumentEditor from './components/DocumentEditor'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Assignment Documenter</h1>
        <p className="subtitle">Professional Assignment Documentation Tool</p>
      </header>
      <main className="app-main">
        <DocumentEditor />
      </main>
    </div>
  )
}

export default App
