import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PdfToolsPage from './components/PdfToolsPage';
import ImageToPdfPage from './components/ImageToPdfPage';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PdfToolsPage />} />
          <Route path="/image-to-pdf" element={<ImageToPdfPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
