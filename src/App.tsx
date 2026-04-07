import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PdfToolsPage from './components/PdfToolsPage';
import ImageToPdfPage from './components/ImageToPdfPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PdfToolsPage />} />
          <Route path="/image-to-pdf" element={<ImageToPdfPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
