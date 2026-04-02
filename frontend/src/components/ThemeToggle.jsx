import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const styles = {
    button: {
      background: theme === 'dark' ? '#333' : '#e0e0e0',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s ease',
      color: theme === 'dark' ? '#e0e0e0' : '#333',
    }
  };

  return (
    <button
      style={styles.button}
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
