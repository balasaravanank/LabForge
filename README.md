# LabForge (Lab Record Generator)

LabForge is a specialized, client-side web application designed to generate, manage, and share laboratory records efficiently. Built entirely with React Server Components (where applicable) and Client Components on **Next.js 15+**, it runs entirely in the browser without requiring a backend database, leveraging modern native APIs and URL state mapping.

## Technical Architecture

LabForge relies heavily on a state-driven approach within the Next.js App Router paradigm. 
- **Framework:** Next.js (App Router)
- **Engine:** React 19
- **Styling:** Tailwind CSS v4
- **State Persistence:** LocalStorage APIs
- **State Sharing:** URL Encoding using LZ-based Compression
- **Document Generation:** `jspdf` and `docx` (Dynamically imported for performance)

## Core Implementation Details

### Client-Side Document Processing
LabForge builds PDFs and DOCX files without server-side processing. This ensures complete privacy for student records and instantaneous responses. 
- **`src/lib/generatePdf.ts`:** Uses `jspdf` to systematically measure text and draw elements on canvas.
- **`src/lib/generateDocx.ts`:** Implements `docx`'s structured programmatic API to assemble Microsoft Word-compatible layouts.
To minimize bundle size, document generators are dynamically imported (lazy-loaded) via `await import(...)` only when the user executes a download.

### Shareable Links via URL Payload
To maintain the "No DB" architecture while allowing users to share document configurations, LabForge serializes the current form state (student details, course data, and experiments list) into a compressed URL fragment.
- **Library:** `lz-string` (Lempel-Ziv-based compression) compresses the JSON payload.
- **Hook `useShareableLink`:** Handles serialization and browser clipboard integration.
When a URL containing a payload is loaded, `readShareFromUrl()` intercepts the payload and actively hydrates the React state before the initial render.

### Persistent Local History
History elements are managed by caching user inputs into `localStorage`. 
- **Hook `useHistory`:** Exposes a simple `addEntry`, `deleteEntry`, and `clearAll` interface. Each entry maps a snapshot of the `DocumentInfo` and `Experiment[]` configurations alongside a timestamp.
- **`useStudentProfile`:** Specifically isolates and restores the student's name and registration number, ensuring users do not need to retype their details on subsequent visits.

## Directory Structure

```text
d:/DEV/LabForge/
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind v4 directives and CSS variables
│   │   ├── layout.tsx          # Root layout and Next-Themes Provider wrapping
│   │   └── page.tsx            # Main View Controller and orchestrator
│   ├── components/             # Reusable UI Elements
│   │   ├── DocumentInfoForm.tsx# Core data intake interface
│   │   ├── ExperimentList.tsx  # Dynamic list manager for experiments
│   │   ├── HistoryPanel.tsx    # Slide-over UI mapping LocalStorage reads
│   │   ├── PreviewModal.tsx    # Mock visual representation of the final doc
│   │   └── ...
│   └── lib/                    # Business Logic and Utilities
│       ├── generateDocx.ts
│       ├── generatePdf.ts
│       ├── types.ts            # Global TypeScript definitions
│       ├── useHistory.ts       # History Context / Hook
│       ├── useShareableLink.ts # URL Encoding Context
│       └── useStudentProfile.ts# Identity Persistence Hook
```

## Running the Project Locally

### Prerequisites
- **Node.js**: v18 or newer
- **Package Manager**: npm, yarn, or pnpm

### Setup
1. Clone the repository and navigate into the `LabForge` directory:
   ```bash
   git clone <your-repository-url>
   cd lab-record-generator
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the environment at `http://localhost:3000`.

## Scripts
- `npm run dev` - Initializes the local development server.
- `npm run build` - Statically analyzes and builds for production deployment.
- `npm run start` - Serves the production build.
- `npm run lint` - Executes Next.js standard ESLint checks.
