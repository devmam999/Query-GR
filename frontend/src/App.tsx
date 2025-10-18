import { type FC } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Chatbot } from './components/Chatbot';
import './App.css';

const App: FC = () => {
  return (
    <ThemeProvider>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <Chatbot />
      </div>
    </ThemeProvider>
  );
};

export default App;
