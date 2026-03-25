import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NJSearchPage } from './pages/NJSearchPage';
import { ChatPage } from './pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        {/* Legacy route kept for backward compatibility */}
        <Route path="/search" element={<NJSearchPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
