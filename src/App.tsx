import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoChatPage } from './pages/DemoChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<DemoChatPage />} />
        <Route path="/chat/*" element={<DemoChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
