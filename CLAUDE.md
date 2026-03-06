# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeChat Mini Program for generating PDFs from voucher/ticket images. Users upload images, the system performs OCR recognition, and generates downloadable PDF files.

## Development Commands

- **Open in WeChat DevTools**: Use WeChat Developer Tools to open the project directory
- **Build**: Compile in WeChat DevTools (Ctrl+B)
- **Preview**: Preview on WeChat (Ctrl+Shift+P)
- **Upload**: Upload to WeChat admin platform via WeChat DevTools

## Architecture

### Tech Stack
- **Frontend**: WeChat Mini Program (WXML, WXSS, JS)
- **Backend API**: Node.js at `http://8.145.60.225:80`
- **Authentication**: WeChat OAuth (code-based login flow)

### Directory Structure
```
├── app.js              # App entry, OAuth login, global state
├── app.json            # Page routing configuration
├── app.wxss            # Global styles
├── config.js           # API base URL configuration
├── pages/
│   ├── home/           # Landing page (login check, navigation)
│   ├── index/          # Image upload page
│   ├── confirm/        # OCR result confirmation
│   ├── detail/         # Task details view
│   ├── pdf-preview/    # PDF preview/download
│   └── history/        # Task history list
└── utils/
    ├── http.js         # HTTP client with auth headers
    └── status.js       # Task status utilities
```

### Task Flow
1. **Home** → Check login status, navigate to index or history
2. **Index** → Upload voucher images, create task
3. **Confirm** → Review OCR results, enter voucher details
4. **PDF Generation** → Backend generates PDF
5. **PDF Preview** → View and download generated PDF

### Key API Endpoints (via utils/http.js)
- `POST /auth/wechat/login` - WeChat OAuth login
- `POST /voucher-tasks` - Create new task
- `POST /voucher-tasks/:id/pages` - Upload page images
- `POST /voucher-tasks/:id/finish-upload` - Mark upload complete
- `POST /voucher-tasks/:id/recognize` - Trigger OCR
- `POST /voucher-tasks/:id/confirm-generate` - Confirm and generate PDF
- `GET /voucher-tasks/:id` - Get task details
- `GET /voucher-tasks` - List all tasks
- `DELETE /voucher-tasks/:id` - Delete task

### Task Status States
- `draft` → `uploaded` → `recognized` → `confirmed` → `pdf_generated`
- Failed tasks: `failed`

## Configuration

- `config.js` - Base URL: `http://8.145.60.225:80`
- `project.config.json` - AppID: `wx5e74d9b0730125bd`
