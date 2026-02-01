# Assignment Documenter

A professional web application for students to document their assignments, problems, solutions, and learnings. Create well-formatted documents with multiple problems, images, and automatic grammar checking, then download them as professional PDFs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## ✨ Features

### 📝 Document Management
- **Multiple Problems Support** - Document multiple problems in a single assignment
- **Structured Sections** - Organize your work with Problem Description, Issues, Solutions, and Notes
- **Image Support** - Upload and embed screenshots, diagrams, or photos for each problem
- **Professional PDF Export** - Generate beautifully formatted PDFs with automatic page breaks

### ✨ Text Enhancement
- **Grammar & Spell Check** - One-click rephrase button for each text field
- **Automatic Text Improvement** - Fixes grammar, spelling, and sentence structure
- **LanguageTool Integration** - Uses advanced grammar checking API
- **Fallback Support** - Works even when API is unavailable

### 🎨 User Experience
- **Modern UI** - Clean, intuitive interface with gradient design
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-time Preview** - See your images and content before generating PDF
- **Loading States** - Visual feedback during PDF generation and text rephrasing

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/assignment-documenter.git
   cd assignment-documenter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
npm run preview
```

## 📖 Usage Guide

### Creating a Document

1. **Fill in Assignment Information**
   - Assignment Title (required)
   - Course Name (required)
   - Student Name (required)
   - Date (required)

2. **Add Problems**
   - Click "+ Add Problem" to add multiple problems
   - Each problem can have:
     - Problem Description
     - Issues Identified
     - Solutions Implemented
     - Related Images

3. **Enhance Your Text**
   - Click the "✨ Rephrase" button next to any text field
   - The tool will automatically improve grammar and fix errors
   - Wait for processing to complete

4. **Add Images**
   - Click "📷 Upload Images" for any problem
   - Select one or multiple images
   - Preview images before generating PDF
   - Remove images if needed

5. **Add Additional Notes**
   - Include any extra observations or learnings
   - Use the rephrase button here too!

6. **Generate PDF**
   - Click "📄 Download PDF" when ready
   - Your document will be automatically downloaded
   - Filename format: `assignment_title_student_name_date.pdf`

## 🎯 Use Cases

- **Technical Assignments** - Document coding problems, debugging steps, and solutions
- **Lab Reports** - Structure your experiments, findings, and conclusions
- **Project Documentation** - Track issues, solutions, and learnings
- **Academic Assignments** - Professional documentation for any course
- **Problem-Solving Logs** - Keep detailed records of problems and solutions

## 🛠️ Technologies Used

- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **jsPDF** - PDF generation library
- **LanguageTool API** - Grammar and spell checking

## 📁 Project Structure

```
assignment-documenter/
├── src/
│   ├── components/
│   │   ├── DocumentEditor.tsx    # Main editor component
│   │   └── DocumentEditor.css    # Component styles
│   ├── utils/
│   │   ├── pdfGenerator.ts        # PDF generation logic
│   │   └── textRephrase.ts        # Grammar checking utility
│   ├── App.tsx                    # Main app component
│   ├── App.css                    # App styles
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔧 Configuration

The app uses LanguageTool's public API for grammar checking. No API key is required, but there are rate limits for the free tier. If you need higher limits, you can:

1. Set up your own LanguageTool server
2. Use a different grammar checking service
3. Modify `src/utils/textRephrase.ts` to use your preferred service

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [LanguageTool](https://languagetool.org/) - Free grammar checking API
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation library
- [Vite](https://vitejs.dev/) - Build tool

## 💡 Tips

- **Save your work** - Copy important content before generating PDF (browser refresh will clear data)
- **Image formats** - Supports JPG, PNG, GIF, and other common image formats
- **Text length** - No limits on text length, PDF will automatically add pages
- **Multiple problems** - Use multiple problems to organize complex assignments
- **Rephrase feature** - Use it multiple times if needed to get the best results

## 🐛 Known Issues

- Large images may take time to process in PDF
- Grammar checking requires internet connection
- Browser refresh will clear all entered data (consider adding local storage in future)

## 🔮 Future Enhancements

- [ ] Local storage to save drafts
- [ ] Export to other formats (DOCX, Markdown)
- [ ] Templates for different assignment types
- [ ] Dark mode support
- [ ] Collaborative editing
- [ ] Cloud storage integration

---

**Made with ❤️ for students everywhere**
