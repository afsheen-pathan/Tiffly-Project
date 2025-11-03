// src/App.tsx
import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './AppRouter'; // Import the router

function App() {
  return (
    <AuthProvider>
      <AppRouter /> {/* Render the router */}
    </AuthProvider>
  );
}

export default App;