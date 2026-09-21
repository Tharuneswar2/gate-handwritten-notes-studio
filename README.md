# ✍️ GATE Handwritten Notes Studio

Convert structured study notes (from ChatGPT or your own study materials) into realistic, printable handwritten notebook pages with live KaTeX math rendering, notebook backgrounds, organic handwriting variation, and high-DPI PDF/PNG export.

![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)
![KaTeX](https://img.shields.io/badge/KaTeX-LaTeX-3298dc?logo=latex&logoColor=white)

---

## 🌟 Key Features

### 1. 3-Layer Handwriting Realism Engine
- **Layer 1 (Curated Fonts):** Pre-loaded with open-license handwriting fonts (Kalam, Caveat, Patrick Hand, Schoolbell, Indie Flower, Architects Daughter, etc.) plus custom `.ttf`, `.otf`, `.woff` font upload.
- **Layer 2 (Organic Micro-Variations):** Baseline jitter, character rotation (±0.4° to ±1.5°), organic margin drift, word/letter spacing shifts, and ink opacity fluctuations controlled by a single **Naturalness Slider (0–100%)**.
- **Layer 3 (Paper Physics):** CSS/SVG paper templates including Blue Ruled, Light Ruled, Engineering Graph, Dot Grid, and Blank Notebook paper with authentic red margin line and binding gutters.

### 2. Math & GATE-Specific Formatting
- **Full KaTeX Mathematics:** High-performance LaTeX rendering for matrices, determinants, fractions, integrals, and summations (`$$ ... $$` display math and `\( ... \)` inline math).
- **Specialized Revision Callouts:**
  - `> [!REMEMBER]`
  - `> [!GATE TRICK]`
  - `> [!IMPORTANT]`
  - `> [!SHORTCUT]`
  - `> [!COMMON MISTAKE]`
  - `> [!DEFINITION]`
  - `> [!EXAMPLE]`
  - `> [!FORMULA]`

### 3. Dual Document Modes
- **📝 Study Notes Mode:** Full narrative notes with standard margins, headings, paragraphs, worked examples, and callout blocks.
- **🔢 Formula Sheet Mode:** High-density cheatsheet mode with a column selector (**1 Column**, **2 Columns**, or **3 Columns**) for fast last-minute revision.

### 4. Smart Multi-Page Pagination
- Automatically splits content across printable pages (A4 / Letter).
- Formula protection: formulas are never cut across page boundaries.
- Keeps headings with their subsequent content blocks.

### 5. Multi-Format Export & Printing
- **Export PDF:** High-resolution multi-page PDF generation via `html2canvas-pro` + `jsPDF` at 2.6× scale (high DPI for printing on real paper).
- **Export PNG:** Download individual page images or batch-download all pages.
- **Vector Print (`Ctrl+P`):** Clean `@media print` layout without UI clutter for native browser "Save as PDF".

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 20.x recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Tharuneswar2/gate-handwritten-notes-studio.git
cd gate-handwritten-notes-studio

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## ☁️ Deploy to Vercel

This repository is ready to deploy directly to Vercel with zero configuration:

1. Push this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import `gate-handwritten-notes-studio`.
4. Framework Preset will automatically be detected as **Vite**.
5. Click **"Deploy"**!

---

## 📄 License

MIT License. Open-source handwriting fonts licensed under SIL Open Font License / Apache 2.0.
