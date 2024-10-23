import { Toaster } from 'react-hot-toast';
import './App.css';
import Navbar from './components/Navbar';
import FillingForm from './pages/FillingForm';
import Login from './pages/Login';
import React from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext'; // Ensure AuthContext is exported
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Toaster position="top-center" reverseOrder={false} />
        <MainContent />
      </div>
    </AuthProvider>
  );
}

const MainContent = () => {
  const { token, loading, user } = React.useContext(AuthContext);

  console.log(JSON.stringify(user, null, 2));
  

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return token ? (
    <>
      <Navbar />
    </>
  ) : (
    <Login />
  );
};

export default App;