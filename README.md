# Aintropy Search Engine Frontend

A modern React application that compares search results between a custom backend API and frontier AI models (GPT-5, Gemini 3, Claude).

## Features

- **Dual-Panel Search Interface**: Compare backend search results with frontier AI responses side-by-side
- **Multi-Index Support**: Select from available indices (Squad, PubmedQA, etc.)
- **Preloaded Questions**: 50 randomly selected questions per index for quick testing
- **Frontier API Selection**: Choose between GPT-5, Gemini 3, or Claude for comparison
- **Google-Style Search Bar**: Prominent 3-line search interface with autocomplete suggestions
- **Responsive Design**: Beautiful, modern UI built with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Axios** for API requests
- **XLSX** for reading Excel files

## Prerequisites

- Node.js 18+ and npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend-aintropy-engine-product
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` to add your API keys for frontier AI services if you want real responses instead of placeholders.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/         # React components
│   │   ├── IndexSelector.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ResultPanel.tsx
│   │   └── FrontierAPISelector.tsx
│   ├── services/          # API service modules
│   │   ├── backendApi.ts
│   │   └── frontierApi.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── assets/                # Static assets
│   ├── KNN_enriched_metadata_K1_squad.xlsx
│   ├── PUBMEDQA_Rag_results.xlsx
│   ├── squad_questions_preloaded.txt
│   └── pubmedqa_questions_preloaded.txt
└── index.html             # HTML template
```

## Backend API Integration

The application connects to the backend API at `http://20.15.153.179:8000/api`. The following endpoints are expected:

- `GET /api/indices` - Retrieve available indices
- `POST /api/search` - Search with query and index_name

If the backend is unavailable, the application will fall back to mock data for indices.

## Frontier API Integration

The application includes placeholder implementations for three frontier AI APIs:

1. **GPT-5** (OpenAI API)
2. **Gemini 3** (Google AI Studio)
3. **Claude** (Anthropic API)

To enable real responses, add your API keys to the `.env` file and update the implementation in `src/services/frontierApi.ts`.

## Preloaded Questions

The application includes 50 randomly selected questions for each index:

- **Squad**: Questions from the Stanford Question Answering Dataset
- **PubmedQA**: Medical research questions from PubMed

These questions are extracted from the Excel files in the `assets/` folder using the `extractQuestions.js` script.

To regenerate the preloaded questions:

```bash
node extractQuestions.js
```

## Development

### Adding New Indices

1. Update the backend API to return the new index
2. Add preloaded questions to the `assets/` folder
3. Update the question loading logic in `App.tsx`

### Customizing the UI

The application uses Tailwind CSS for styling. Modify the components in `src/components/` to customize the appearance.

### Adding New Frontier APIs

1. Add the new API to `FRONTIER_APIS` in `src/types/index.ts`
2. Implement the search function in `src/services/frontierApi.ts`
3. Update the switch statement in `App.tsx`

## License

MIT
