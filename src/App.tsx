function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-sm max-w-sm w-full">
        <div className="flex flex-col space-y-1.5 p-6">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-blue-500">
            Money Manager
          </h1>
          <p className="text-sm text-gray-500">
            Project initialized successfully.
          </p>
        </div>
        <div className="p-6 pt-0">
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-full bg-blue-600 text-white">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
