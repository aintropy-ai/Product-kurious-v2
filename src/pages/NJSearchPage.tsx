import { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultPanel } from '../components/ResultPanel';
import { SearchProgress } from '../components/SearchProgress';
import { FrontierAPISelector } from '../components/FrontierAPISelector';
import { GoldenAnswerBox } from '../components/GoldenAnswerBox';
import { backendApi } from '../services/backendApi';
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


const INDEX_NAME = 'njopen';

export const NJSearchPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFrontierAPI, setSelectedFrontierAPI] = useState<string>('claude');
  const [showComparison, setShowComparison] = useState(false);

  const [backendResult, setBackendResult] = useState<SearchResponse | null>(null);
  const [frontierResult, setFrontierResult] = useState<SearchResponse | null>(null);

  const [backendLoading, setBackendLoading] = useState(false);
  const [progressDone, setProgressDone] = useState(true);
  const [frontierLoading, setFrontierLoading] = useState(false);

  const [backendRating, setBackendRating] = useState<number | null>(null);
  const [frontierRating, setFrontierRating] = useState<number | null>(null);

  const [backendError, setBackendError] = useState<string | null>(null);
  const [frontierError, setFrontierError] = useState<string | null>(null);

  const [goldenAnswer, setGoldenAnswer] = useState<string | string[] | null>(null);
  const [backendCorrect, setBackendCorrect] = useState<boolean | null>(null);
  const [frontierCorrect, setFrontierCorrect] = useState<boolean | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [frontierLatency, setFrontierLatency] = useState<number | null>(null);

  const handleSearch = async (query: string) => {
    setBackendResult(null);
    setFrontierResult(null);
    setBackendError(null);
    setFrontierError(null);
    setGoldenAnswer(null);
    setBackendCorrect(null);
    setFrontierCorrect(null);
    setBackendLatency(null);
    setFrontierLatency(null);

    setProgressDone(false);
    setBackendRating(null);
    setFrontierRating(null);
    setBackendLoading(true);
    if (showComparison) {
      setFrontierLoading(true);
    }

    let currentGoldenAnswers: string[] = [];

    const backendStartTime = Date.now();
    const frontierStartTime = Date.now();

    const backendRequest = (async () => {
      const response = await backendApi.search(query, INDEX_NAME);
      const latency = (Date.now() - backendStartTime) / 1000;
      return { response, latency };
    })();

    const frontierRequest = showComparison ? (async () => {
      let result: SearchResponse;
      switch (selectedFrontierAPI) {
        case 'gpt5':
          result = await frontierApi.searchWithGPT5(query);
          break;
        case 'gemini3':
          result = await frontierApi.searchWithGemini3(query);
          break;
        case 'claude':
          result = await frontierApi.searchWithClaude(query);
          break;
        default:
          throw new Error('Invalid API selected');
      }
      const latency = (Date.now() - frontierStartTime) / 1000;
      return { response: result, latency };
    })() : null;

    const results = await Promise.allSettled([
      backendRequest,
      ...(frontierRequest ? [frontierRequest] : []),
    ]);
    const [backendRes, frontierRes] = results;

    if (backendRes.status === 'fulfilled') {
      const { response, latency } = backendRes.value;
      const { evaluation_result } = response;

      if (evaluation_result) {
        const goldenAnswerDisplay =
          evaluation_result.golden_answer_texts ||
          evaluation_result.golden_answer ||
          null;

        if (evaluation_result.golden_answer_texts) {
          currentGoldenAnswers = evaluation_result.golden_answer_texts;
        } else if (evaluation_result.golden_answer) {
          currentGoldenAnswers = [evaluation_result.golden_answer];
        }

        setGoldenAnswer(goldenAnswerDisplay);
        setBackendResult({ answer: evaluation_result.generated_answer });
        setBackendCorrect(evaluation_result.correct);
        setBackendLatency(latency);
      } else {
        setBackendResult({ answer: response.answer || 'No answer available' });
        setBackendLatency(latency);
      }
    } else {
      const error = backendRes.reason;
      const errorMsg =
        error?.response?.data?.detail ||
        error?.message ||
        'Network Error - Check console for details';
      setBackendError(errorMsg);
    }
    setBackendLoading(false);

    if (showComparison && frontierRes && frontierRes.status === 'fulfilled') {
      const { response, latency } = frontierRes.value;
      setFrontierResult(response);
      setFrontierLatency(latency);

      if (currentGoldenAnswers.length > 0) {
        const frontierAnswer = response.answer.toLowerCase().trim();
        const isCorrect = currentGoldenAnswers.some(golden =>
          frontierAnswer.includes(golden.toLowerCase().trim())
        );
        setFrontierCorrect(isCorrect);
      }
    } else if (showComparison && frontierRes && frontierRes.status === 'rejected') {
      setFrontierError(frontierRes.reason?.message || 'Failed to search frontier API');
    }

    if (showComparison) {
      setFrontierLoading(false);
    }
  };

  const getFrontierAPIName = () => {
    switch (selectedFrontierAPI) {
      case 'gpt5': return 'GPT-3.5 Turbo';
      case 'gemini3': return 'Gemini 3 Pro';
      case 'claude': return 'Claude 3.5 Sonnet';
      default: return 'AI';
    }
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
            {/* Header with collapse arrow */}
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
            {/* Source list */}
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
          /* Collapsed — just the expand arrow, vertically centered */
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

      {/* Right Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">AIntropy Kurious Engine</h1>
            <p className="text-sm text-gray-400">New Jersey Open Data — 57M documents across 23 agencies</p>
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-1.5 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors border border-gray-600"
          >
            {showComparison ? 'Hide LLM Comparison' : 'Compare with LLM'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`mx-auto ${showComparison ? 'max-w-6xl' : 'max-w-4xl'}`}>
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar
                onSearch={handleSearch}
                disabled={backendLoading || frontierLoading}
                preloadedQuestions={PRELOADED_QUESTIONS}
              />
            </div>

            {/* Golden Answer */}
            <GoldenAnswerBox goldenAnswer={goldenAnswer} />

            {/* Frontier API Selector (when comparison shown) */}
            {showComparison && (
              <div className="mb-4">
                <FrontierAPISelector
                  selectedAPI={selectedFrontierAPI}
                  onAPIChange={setSelectedFrontierAPI}
                />
              </div>
            )}

            {/* Results */}
            <div className={`grid grid-cols-1 ${showComparison ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Left panel: show progress until animation completes, then show result */}
              {!progressDone ? (
                <SearchProgress
                  loading={backendLoading}
                  onComplete={() => setProgressDone(true)}
                />
              ) : (
                <ResultPanel
                  title="Llama-3.1-70B-Instruct with Kurious"
                  result={backendResult}
                  loading={false}
                  error={backendError}
                  isCorrect={backendCorrect}
                  latency={backendLatency}
                  rating={backendRating}
                  onRate={setBackendRating}
                  showProcessSteps
                />
              )}

              {/* Right panel: frontier LLM, no progress steps */}
              {showComparison && (
                <ResultPanel
                  title={`${getFrontierAPIName()} without Kurious`}
                  result={frontierResult}
                  loading={frontierLoading}
                  error={frontierError}
                  isCorrect={frontierCorrect}
                  latency={frontierLatency}
                  rating={frontierRating}
                  onRate={setFrontierRating}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
