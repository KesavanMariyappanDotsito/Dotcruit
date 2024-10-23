// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { jwtDecode } from "jwt-decode"


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("dotoken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("dotoken");
    if (storedToken) {
      validateToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URI}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const decoded = jwtDecode(token);
      setUser(decoded)
      
      setToken(token);
      setLoading(false);
    } catch (error) {
      logout();
      setLoading(false);
    }
  };

  const login = (newToken) => {
    localStorage.setItem("dotoken", newToken);
    validateToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("dotoken");
    setToken(null);
    setUser(null);
    toast.success('Logout Successful!')
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};