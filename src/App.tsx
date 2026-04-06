import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoChatPage } from './pages/DemoChatPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<DemoChatPage />} />
        <Route path="/chat/*" element={<DemoChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
