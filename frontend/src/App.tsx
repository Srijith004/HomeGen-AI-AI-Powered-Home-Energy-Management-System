import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EnergyProvider } from './context/EnergyContext';
import { AppLayout } from './components/layout/AppLayout';

// 12 Application Pages
import { Dashboard } from './pages/Dashboard';
import { Appliances } from './pages/Appliances';
import { DataGenerator } from './pages/DataGenerator';
import { Analytics } from './pages/Analytics';
import { BillEstimator } from './pages/BillEstimator';
import { Predictions } from './pages/Predictions';
import { Simulator } from './pages/Simulator';
import { GeminiAssistant } from './pages/GeminiAssistant';
import { DatasetExplorer } from './pages/DatasetExplorer';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { About } from './pages/About';

export function App() {
  return (
    <EnergyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="appliances" element={<Appliances />} />
            <Route path="generator" element={<DataGenerator />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="billing" element={<BillEstimator />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="simulator" element={<Simulator />} />
            <Route path="ai-assistant" element={<GeminiAssistant />} />
            <Route path="explorer" element={<DatasetExplorer />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EnergyProvider>
  );
}

export default App;
