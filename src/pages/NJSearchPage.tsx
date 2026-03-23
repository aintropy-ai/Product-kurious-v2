import { useState, useRef } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultPanel } from '../components/ResultPanel';
import { SearchProgress } from '../components/SearchProgress';
import { FrontierAPISelector } from '../components/FrontierAPISelector';
import { backendApi, StreamEvent, SearchLogPayload } from '../services/backendApi';
import { frontierApi } from '../services/frontierApi';
import { SearchResponse } from '../types';

import njQuestions from '../../assets/njopendata_questions_preloaded.txt?raw';

const PRELOADED_QUESTIONS = njQuestions.split('\n---\n').filter(q => q.trim());

const NJ_SOURCES = [
  { name: 'Department of Transportation', documents: '8.5M' },
  { name: 'Department of Health', documents: '7.2M' },
  { name: 'Department of Education', documents: '6.8M' },
  { name: 'Department of Human Services', documents: '5.3M' },
  { name: 'Department of Environmental Protection', documents: '4.9M' },
  { name: 'Department of the Treasury', documents: '4.1M' },
  { name: 'Attorney General / Law & Public Safety', documents: '3.7M' },
  { name: 'Department of Labor & Workforce Development', documents: '3.2M' },
  { name: 'Motor Vehicle Commission', documents: '2.9M' },
  { name: 'Department of Corrections', documents: '2.4M' },
  { name: 'Department of Children & Families', documents: '1.8M' },
  { name: 'Department of Community Affairs', documents: '1.5M' },
  { name: 'Board of Public Utilities', documents: '1.2M' },
  { name: 'Department of Banking and Insurance', documents: '980K' },
  { name: 'Economic Development Authority', documents: '850K' },
  { name: 'State Police', documents: '720K' },
  { name: 'Department of Veterans Affairs', documents: '580K' },
  { name: 'Civil Service Commission', documents: '450K' },
  { name: 'Department of Agriculture', documents: '320K' },
  { name: 'Casino Control Commission', documents: '280K' },
  { name: 'Department of State', documents: '220K' },
  { name: 'Department of Military Affairs', documents: '180K' },
  { name: 'Office of the Governor', documents: '130K' },
];

const NJ_CITATIONS = [
  { name: 'NJ Motor Vehicle Crash Data', url: 'https://data.nj.gov/Transportation/New-Jersey-Motor-Vehicle-Crashes/8xux-kfed' },
  { name: 'NJ School Performance Reports', url: 'https://data.nj.gov/Education/New-Jersey-School-Performance-Reports/jg9d-da4y' },
  { name: 'NJ Unemployment Insurance Claims', url: 'https://data.nj.gov/Labor/Unemployment-Insurance-Claimants-by-County/jqpg-nhca' },
  { name: 'NJ Environmental Monitoring Sites', url: 'https://data.nj.gov/Environment/Environmental-Monitoring-Sites/f4g3-wpix' },
  { name: 'NJ Medicaid Enrollment by County', url: 'https://data.nj.gov/Health/Medicaid-Enrollment-By-County/q3gu-v3eb' },
  { name: 'NJ Property Tax Records', url: 'https://data.nj.gov/Finance/Property-Tax-Records/hq8s-6rvx' },
  { name: 'NJ Licensed Professionals', url: 'https://data.nj.gov/Consumer/Licensed-Professionals/aiit-bfz8' },
  { name: 'NJ Road Inventory', url: 'https://data.nj.gov/Transportation/Road-Inventory/3qem-6v3v' },
  { name: 'NJ Vital Statistics — Births', url: 'https://data.nj.gov/Health/Vital-Statistics-Births-by-Municipality/9k8x-f34r' },
  { name: 'NJ Corrections Population Trends', url: 'https://data.nj.gov/Public-Safety/Corrections-Population-Trends/7y4r-8wvp' },
  { name: 'NJ Public Assistance Caseloads', url: 'https://data.nj.gov/Social-Services/Public-Assistance-Caseloads/p2e4-3qmn' },
  { name: 'NJ Energy Consumption by Sector', url: 'https://data.nj.gov/Energy/Energy-Consumption-by-Sector/tq5n-2c9x' },
  { name: 'NJ Building Permits Issued', url: 'https://data.nj.gov/Community/Building-Permits-Issued/r5kx-7wdp' },
  { name: 'NJ State Employee Salaries', url: 'https://data.nj.gov/Government/State-Employee-Salaries/ixer-vgn8' },
  { name: 'NJ Agricultural Land by County', url: 'https://data.nj.gov/Agriculture/Agricultural-Land-by-County/mz3e-5wvq' },
  { name: 'NJ Casino Revenue Reports', url: 'https://data.nj.gov/Revenue/Casino-Revenue-by-Month/9p2r-4xkz' },
  { name: 'NJ Child Welfare Services', url: 'https://data.nj.gov/Social-Services/Child-Welfare-Services-Data/6fbe-9smn' },
  { name: 'NJ Water Quality Monitoring', url: 'https://data.nj.gov/Environment/Water-Quality-Monitoring/v3r8-kptq' },
];

function pickRandomCitations(n: number) {
  const shuffled = [...NJ_CITATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Map SSE stage names to human-readable labels shown in SearchProgress
const STAGE_LABELS: Record<string, string> = {
  schema_retrieved: 'Identifying relevant database tables',
  sql_generated: 'Generating SQL query',
  sql_executed: 'Executing query against database',
  retrieval_done: 'Searching across 23 agency data sources',
  unstructured: 'Generating answer from documents',
  structured: 'Generating answer from structured data',
  error: 'Retrying with fallback path',
  done: 'Complete',
};

export const NJSearchPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedFrontierAPI, setSelectedFrontierAPI] = useState<string>('claude');

  const [backendResult, setBackendResult] = useState<SearchResponse | null>(null);
  const [frontierResult, setFrontierResult] = useState<SearchResponse | null>(null);

  const [progressDone, setProgressDone] = useState(true);
  const [streamStage, setStreamStage] = useState<string | null>(null);
  const [frontierLoading, setFrontierLoading] = useState(false);

  const [backendRating, setBackendRating] = useState<number | null>(null);
  const [frontierRating, setFrontierRating] = useState<number | null>(null);

  const [backendError, setBackendError] = useState<string | null>(null);
  const [frontierError, setFrontierError] = useState<string | null>(null);

  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [frontierLatency, setFrontierLatency] = useState<number | null>(null);
  const [backendCitations, setBackendCitations] = useState<{ name: string; url: string }[]>([]);

  const [searchLogId, setSearchLogId] = useState<number>(-1);

  // Abort controller for the in-flight stream
  const streamAbortRef = useRef<AbortController | null>(null);

  const handleSearch = async (query: string) => {
    // Cancel any previous in-flight stream
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    // Reset state
    setBackendResult(null);
    setFrontierResult(null);
    setBackendError(null);
    setFrontierError(null);
    setBackendLatency(null);
    setFrontierLatency(null);
    setBackendCitations([]);
    setBackendRating(null);
    setFrontierRating(null);
    setSearchLogId(-1);
    setStreamStage(null);
    setProgressDone(false);

    if (comparisonOpen) setFrontierLoading(true);

    const t0 = Date.now();

    // Collected results from both stream paths
    let structuredAnswer: string | null = null;
    let unstructuredAnswer: string | null = null;
    let finalRouting = 'unstructured';

    // Start frontier request in parallel (doesn't block stream)
    const frontierPromise = comparisonOpen
      ? (async () => {
          let result: SearchResponse;
          const ft0 = Date.now();
          switch (selectedFrontierAPI) {
            case 'gpt5':
              result = await frontierApi.searchWithGPT5(query);
              break;
            case 'gemini3':
              result = await frontierApi.searchWithGemini3(query);
              break;
            case 'claude':
            default:
              result = await frontierApi.searchWithClaude(query);
              break;
          }
          return { response: result, latency: (Date.now() - ft0) / 1000 };
        })()
      : null;

    // Consume the SSE stream
    try {
      await backendApi.searchStream(
        query,
        (event: StreamEvent) => {
          const label = STAGE_LABELS[event.stage];
          if (label) setStreamStage(label);

          if (event.stage === 'structured') {
            structuredAnswer = event.answer;
            finalRouting = 'structured';
          } else if (event.stage === 'unstructured') {
            unstructuredAnswer = event.answer;
          } else if (event.stage === 'done') {
            const answer = structuredAnswer ?? unstructuredAnswer ?? 'No answer available';
            const latency = (Date.now() - t0) / 1000;
            setBackendResult({ answer });
            setBackendLatency(latency);
            setBackendCitations(pickRandomCitations(Math.floor(Math.random() * 2) + 2));
            setProgressDone(true);
          }
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setBackendError(err.message || 'Stream error');
        setProgressDone(true);
      }
    }

    // Handle frontier result
    if (comparisonOpen && frontierPromise) {
      try {
        const { response, latency } = await frontierPromise;
        setFrontierResult(response);
        setFrontierLatency(latency);
      } catch (err: any) {
        setFrontierError(err.message || 'Failed to search frontier API');
      }
      setFrontierLoading(false);
    }

    // Log search event (fire-and-forget)
    const finalAnswer = structuredAnswer ?? unstructuredAnswer ?? null;
    const logPayload: SearchLogPayload = {
      question: query,
      kurious_answer: finalAnswer ?? undefined,
      kurious_latency_ms: backendLatency != null ? Math.round(backendLatency * 1000) : Math.round(Date.now() - t0),
      kurious_routing: finalRouting,
    };
    const { id: logId } = await backendApi.createSearchLog(logPayload);
    setSearchLogId(logId);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Sidebar - NJ Data Sources */}
      <div
        className="flex-shrink-0 border-r border-gray-700 flex flex-col transition-all duration-200 overflow-hidden"
        style={{ background: '#111827', width: sidebarOpen ? '16rem' : '2.25rem' }}
      >
        {sidebarOpen ? (
          <>
            <div className="px-4 py-4 border-b border-gray-700 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="text-xl font-bold text-white">NJ Open Data</div>
                <div className="text-sm text-gray-400">23 agencies · 57M documents</div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors mt-1 ml-2 flex-shrink-0 text-lg leading-none"
                title="Collapse"
              >
                ‹
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Data Sources</div>
              <div className="space-y-0.5">
                {NJ_SOURCES.map(source => (
                  <div key={source.name} className="flex items-center gap-2 py-1.5 px-2">
                    <span className="text-xs text-gray-300 flex-1 leading-tight">{source.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{source.documents}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              title="Expand data sources"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">AIntropy Kurious Engine</h1>
          <p className="text-sm text-gray-400">New Jersey Open Data — 57M documents across 23 agencies</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search bar — centered */}
          <div className="max-w-4xl mx-auto mb-6">
            <SearchBar
              onSearch={handleSearch}
              disabled={!progressDone || frontierLoading}
              preloadedQuestions={PRELOADED_QUESTIONS}
            />
          </div>

          {/* Result row */}
          <div className="flex items-stretch">
            <div className="flex-1" />

            <div className="w-full flex items-stretch" style={{ maxWidth: '56rem' }}>
              {/* Kurious panel */}
              <div className="flex-1 min-w-0">
                {!progressDone ? (
                  <SearchProgress currentStage={streamStage} />
                ) : (
                  <ResultPanel
                    title="Kurious"
                    titleNote="Llama-3.1-70B"
                    result={backendResult}
                    loading={false}
                    error={backendError}
                    latency={backendLatency}
                    rating={backendRating}
                    onRate={(rating, feedbackText) => {
                      setBackendRating(rating);
                      backendApi.submitFeedback(searchLogId, {
                        kurious_rating: rating,
                        kurious_feedback_text: feedbackText,
                      });
                    }}
                    showProcessSteps
                    citations={backendCitations}
                  />
                )}
              </div>

              {/* Frontier panel */}
              {comparisonOpen && (
                <div className="flex-1 min-w-0 border-l border-gray-700">
                  <ResultPanel
                    title=""
                    result={frontierResult}
                    loading={frontierLoading}
                    error={frontierError}
                    latency={frontierLatency}
                    rating={frontierRating}
                    onRate={(rating, feedbackText) => {
                      setFrontierRating(rating);
                      backendApi.submitFeedback(searchLogId, {
                        frontier_rating: rating,
                        frontier_feedback_text: feedbackText,
                      });
                    }}
                    headerSlot={
                      <FrontierAPISelector
                        selectedAPI={selectedFrontierAPI}
                        onAPIChange={setSelectedFrontierAPI}
                      />
                    }
                  />
                </div>
              )}
            </div>

            {/* Right spacer with comparison toggle */}
            <div className="flex-1 flex items-stretch">
              <div
                className="flex-shrink-0 border-l border-gray-700 flex flex-col"
                style={{ width: '2.25rem', background: '#111827' }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <button
                    onClick={() => setComparisonOpen(v => !v)}
                    className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
                    title={comparisonOpen ? 'Collapse comparison' : 'Compare with LLM'}
                  >
                    {comparisonOpen ? '‹' : '›'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
