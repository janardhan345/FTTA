import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ftta_theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Apply theme by setting CSS variables and data attribute
  function applyTheme(newTheme) {
    const root = document.documentElement;

    if (newTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#1a1a2e';
      document.body.style.color = '#e0e0e0';
    } else {
      root.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#f0f2f5';
      document.body.style.color = '#333';
    }
  }

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('ftta_theme', newTheme);
    applyTheme(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
