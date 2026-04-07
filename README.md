# PDF Studio

**Online PDF editor — all processing happens in your browser. No files are uploaded to any server.**

![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### PDF Tools (/)
| Feature | Description |
|---------|-------------|
| **Merge** | Combine multiple PDF files into one. Drag & drop to reorder pages across files. |
| **Split** | Split a PDF into separate files — each page as a PDF, or by custom ranges. Download as ZIP. |
| **Extract** | Select specific pages and export them as a new PDF. |
| **Delete** | Remove selected pages and download the modified PDF. |
| **OCR** | Recognize text from scanned PDF pages using Tesseract.js (eng, rus, deu, fra, spa). Download results as TXT. |

### Image → PDF (/image-to-pdf)
| Feature | Description |
|---------|-------------|
| **Convert** | Turn PNG/JPG/WEBP images into a single PDF document. |
| **Settings** | Page size (A4/Letter/Fit to image), orientation (auto/portrait/landscape), margins (none/small/custom). |
| **Reorder** | Drag & drop to arrange image order before conversion. |

## Privacy

🔒 **All processing is done entirely in your browser.**
- Files never leave your device
- No server uploads, no cloud storage
- Uses WebAssembly-based libraries for PDF and OCR operations

## Getting Started

```bash
npm install
npm run dev     # Start development server
npm run build   # Build for production
```

## Limits

| Parameter | Default |
|-----------|---------|
| Max file size | 100 MB |
| Max pages per file | 500 |
| Max images for Image→PDF | 100 |

## OCR Tips

- **Supported languages:** English (eng), Russian (rus), German (deu), French (fra), Spanish (spa)
- OCR runs entirely in the browser using [Tesseract.js](https://tesseract.projectnaptha.com/)
- Processing time depends on page count and image quality
- Higher-resolution scans produce better OCR results
- Multiple languages can be selected simultaneously for multilingual documents
- First run may take longer as language data is downloaded and cached

## Tech Stack

- **React** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Tailwind CSS** — Styling (black & blue theme)
- **PDF.js** (pdfjs-dist) — PDF rendering & thumbnails
- **pdf-lib** — PDF manipulation (merge, split, extract, create)
- **Tesseract.js** — OCR (WebAssembly)
- **JSZip** — ZIP archive creation
- **@dnd-kit** — Drag & drop page reordering
- **react-router-dom** — Client-side routing
- **file-saver** — File download helper

## GitHub Pages Deployment

The app is deployed at **https://nemnok.github.io/NEMNOK-S-FREEDOM/**.

### How it works

1. Every push to `main` triggers the **Deploy to GitHub Pages** GitHub Actions workflow (`.github/workflows/deploy.yml`).
2. The workflow runs `npm ci && npm run build`, then deploys the `dist/` folder using `actions/deploy-pages`.
3. Vite is configured with `base: '/NEMNOK-S-FREEDOM/'` in `vite.config.ts` so all asset paths are correctly prefixed for the GitHub Pages subpath.

### Base path constraints

- All asset URLs in the built output are relative to `/NEMNOK-S-FREEDOM/` — this is handled automatically by Vite.
- The PDF.js worker (`pdf.worker.min.mjs`) is served from the `public/` folder and referenced via `import.meta.env.BASE_URL` so it resolves correctly at the subpath.
- The app uses `HashRouter` (`#/` style URLs) so deep links work without any server-side routing configuration.

### Verifying the deployment in browser DevTools

1. Open https://nemnok.github.io/NEMNOK-S-FREEDOM/ in Chrome/Edge.
2. Open DevTools → **Console** tab: there should be no errors.
3. Open DevTools → **Network** tab: the main JS bundle (`/NEMNOK-S-FREEDOM/assets/index-*.js`), CSS (`/NEMNOK-S-FREEDOM/assets/index-*.css`), and favicon (`/NEMNOK-S-FREEDOM/favicon.svg`) should all return **200**.
4. You should see the app header with **"Nemnok's Freedom"** and two navigation tabs.

## Design

Dark theme with **black and blue** color scheme for comfortable extended use.
