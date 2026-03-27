# AIntropy Kurious Engine - Frontend

A React-based web application for managing knowledge perception pipelines and searching across multiple datasets using the Kurious RAG (Retrieval-Augmented Generation) engine.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.4
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Deployment**: Cloudflare Pages with serverless functions
- **State Management**: React hooks (useState, useEffect)
- **Storage**: Browser localStorage for client-side persistence

## Project Architecture

### Pages
- **HomePage** (`/`): Project management dashboard with project tiles
- **PerceptionPage** (`/project/:id/perception`): Pipeline configuration and execution
- **ProjectPage** (`/project/:id/search`): Search interface with LLM comparison

### Key Features

#### 1. Project Management
- Create projects with multiple data sources
- Select from 35+ available data sources across different modalities
- Projects persist in localStorage
- Modality annotations (text, rich text, video, audio, image, structured, SMILES, 3D gameplay)

#### 2. Perception Pipeline
- Two-level YAML configuration:
  - `global_perception.yaml` - Project-wide configuration
  - `datasource_config/` - Individual YAML files per data source (lowercase_with_underscores.yaml)
- VS Code-like interface with file explorer sidebar
- Live terminal for Kurious Agent interactions
- 8-stage pipeline execution:
  1. Ingestion
  2. Knowledge Extraction
  3. Knowledge Summarization
  4. Knowledge Partitioning (Chunking)
  5. Entity Mining
  6. Relationship Mining
  7. Semantic Vector Computation
  8. Indexing

#### 3. Search & Comparison
- Search across PubmedQA, Squad, ChemRAG, NJ Open Data datasets
- Compare Kurious-enhanced Llama-3.1-70B results with frontier LLMs:
  - GPT-3.5 Turbo
  - Gemini 3 Pro
  - Claude 3.5 Sonnet
- Preloaded questions for each dataset
- Golden answer evaluation
- Latency tracking
- Toggle comparison view on/off

## Data Sources

### Available Datasets (35 total)

**PubmedQA** (1 source):
- PubMed Abstracts (61.2K)

**Squad** (1 source):
- Wikipedia Articles (100K)

**ChemRAG** (6 sources):
- PubChem (14.6M), PubMed (23.9M), Semantic Scholar (32.7M), USPTO Chemistry (143K), OpenStax Chemistry (5.5K), Wikipedia (29.9M)

**NJ Open Data** (23 agencies):
- Department of Transportation (8.5M), Department of Health (7.2M), etc.
- Total: 85M documents

**Legal Understanding** (1 source):
- Local View (2.5K hours)

**New Media** (2 sources):
- Surgery Videos (100K hours)
- Gameplay Recordings (1M hours)

## File Structure

```
src/
├── components/
│   ├── EnhancedCreateProjectModal.tsx    # Multi-step project creation
│   ├── SearchBar.tsx                     # Search interface
│   ├── ResultPanel.tsx                   # Search results display
│   ├── FrontierAPISelector.tsx           # LLM selection
│   └── GoldenAnswerBox.tsx              # Golden answer display
├── pages/
│   ├── HomePage.tsx                      # Project dashboard
│   ├── PerceptionPage.tsx               # Pipeline configuration
│   └── ProjectPage.tsx                   # Search interface
├── services/
│   ├── backendApi.ts                    # Kurious backend API
│   └── frontierApi.ts                   # Frontier LLM APIs
├── types/
│   ├── project.ts                       # Project & data source types
│   ├── perception.ts                    # Pipeline types & configs
│   └── index.ts                         # API response types
├── utils/
│   └── storage.ts                       # localStorage wrapper
└── App.tsx                              # Router configuration
```

## Important Patterns

### State Management
- Use `useState` with lazy initialization for objects from storage
- Always use `projectId` as dependency, never `project` object (prevents infinite loops)
- Example:
  ```typescript
  const [project, setProject] = useState(() => storage.getProject(projectId || ''));

  useEffect(() => {
    const loadedProject = storage.getProject(projectId || '');
    setProject(loadedProject);
  }, [projectId]); // NOT [project]!
  ```

### YAML File Naming
- Global config: `global_perception.yaml`
- Data source configs: `lowercase_with_underscores.yaml`
- Example: "Department of Transportation" → `department_of_transportation.yaml`

### Modality Icons
```typescript
const modalityIcons = {
  'text': '📝',
  'rich text': '📄',
  'video': '🎥',
  'audio': '🎵',
  'image': '🖼️',
  'structured': '📊',
  'SMILES': '🧪',
  '3D gameplay': '🎮'
};
```

### Checkbox Styling
Custom CSS in `index.css` for dark theme checkboxes with grey checkmarks instead of default blue.

## API Integration

### Backend API (Kurious)
- Base URL: `https://kurious-backend-api.centralus.cloudapp.azure.com`
- Endpoints:
  - `GET /api/v1/indices` - Get available indices
  - `POST /api/v1/blended/:index/_search` - Search with query
- Headers: `X-API-Key`, `X-Company-ID`
- Proxied through Cloudflare Functions

### Frontier APIs (OpenRouter)
- Unified endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Models:
  - `openai/gpt-3.5-turbo`
  - `google/gemini-pro-1.5`
  - `anthropic/claude-3.5-sonnet`

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Environment Variables
```bash
# .env
VITE_BACKEND_API_URL=https://kurious-backend-api.centralus.cloudapp.azure.com
VITE_BACKEND_API_KEY=your_api_key
VITE_BACKEND_COMPANY_ID=your_company_id
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

### Commands
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (localhost:3002)
npm run build       # Build for production
npm run preview     # Preview production build
```

### Dev Server
- Runs on available port (3000, 3001, 3002, etc.)
- Hot Module Reload (HMR) enabled
- Check output: `tail /private/tmp/claude-501/-Users-nirmitdesai-Documents-Code-frontend-aintropy-engine-product/tasks/bdbc909.output`

## Deployment

### Cloudflare Pages
1. Connected to GitHub repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables set in Cloudflare dashboard
5. Functions in `/functions` directory for API proxying

### Common Build Issues
- **Unused imports**: TypeScript strict mode - remove all unused imports
- **Infinite loops**: Use `projectId` as dependency, not `project` object
- **Type mismatches**: Ensure consistent typing in Promise arrays

## Storage Schema

### localStorage Key: `kurious_projects`
```typescript
interface Project {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  datasets?: Dataset[];
  sources: number;
  documents: string;
  createdAt: string;
  perceptionStatus?: 'not_started' | 'configuring' | 'running' | 'completed';
  perceptionConfig?: string;  // Global YAML
  modalities?: string[];
}

interface Dataset {
  id: string;
  name: string;
  sources: number;
  documents: string;
  dataSourceList?: DataSource[];
  localConfig?: string;  // Local YAML
}

interface DataSource {
  name: string;
  documents: string;
  enabled: boolean;
  modalities?: string[];
}
```

## UI/UX Guidelines

### Color Scheme
- Primary background: `bg-gray-900`
- Secondary background: `bg-gray-800`
- Borders: `border-gray-700`
- Text: `text-white`, `text-gray-400`
- Accent: `bg-blue-600`, `text-blue-400`
- Success: `text-green-500`
- Terminal: Black background, green text (`text-green-400`)

### Modality Badge Colors
- Text: Blue (`bg-blue-900 text-blue-200`)
- Rich text: Purple (`bg-purple-900 text-purple-200`)
- Structured: Green (`bg-green-900 text-green-200`)
- Image: Pink (`bg-pink-900 text-pink-200`)
- Audio: Yellow (`bg-yellow-900 text-yellow-200`)
- Video: Red (`bg-red-900 text-red-200`)
- SMILES: Orange (`bg-orange-900 text-orange-200`)

### Terminal Interface
- Monospace font
- Black background (`bg-black`)
- Green prompt (`text-green-400`)
- Gray output (`text-gray-300`)
- Auto-scroll to bottom
- Command history display

## Testing Datasets

### PubmedQA
- Type: Medical research Q&A
- Source: PubMed abstracts
- Questions: Yes/No/Maybe format

### Squad
- Type: Reading comprehension
- Source: Wikipedia articles
- Questions: Extractive QA

### ChemRAG
- Type: Chemistry knowledge
- Sources: PubChem, PubMed, Semantic Scholar, USPTO, OpenStax, Wikipedia
- Questions: Chemistry-specific

## Future Enhancements

### Backend Integration
- Replace localStorage with backend database (PostgreSQL, Cloudflare D1)
- User authentication (Clerk, Auth0, Cloudflare Access)
- API endpoints for CRUD operations
- Real-time pipeline status updates
- Collaborative project sharing

### Features
- Export search results
- Save search history
- Custom dataset uploads
- Advanced filtering
- Visualization of pipeline progress
- Performance analytics dashboard

## Troubleshooting

### "Project not found" error
- Check localStorage: `localStorage.getItem('kurious_projects')`
- Ensure project was saved: `storage.addProject(project)`
- Verify projectId in URL matches stored project

### Infinite re-render loop
- Check useEffect dependencies
- Never use object references as dependencies (use primitive values like IDs)
- Use lazy initialization for expensive computations

### Search not working
- Verify backend API is accessible
- Check environment variables are set
- Ensure selectedIndex matches backend index ID
- Check browser console for errors

### Build fails on Cloudflare
- Remove all unused imports and variables
- Check TypeScript strict mode compliance
- Ensure type consistency in arrays
- Verify all environment variables are set

## Support

For issues or questions:
- Check browser console for errors
- Review Cloudflare Pages deployment logs
- Verify backend API health
- Check localStorage data integrity
