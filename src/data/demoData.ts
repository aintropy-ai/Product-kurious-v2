// Rich demo data for Kurious V2 prototype
// Each demo query showcases different combinations of features

export type SourceType = 'document' | 'structured' | 'video' | 'image';
export type SourceCategory = 'primary' | 'supporting' | 'additional';

export interface EnhancedSource {
  type: SourceType;
  category: SourceCategory;
  title: string;
  url?: string;
  agency: string;
  freshness: string;
  contribution: string;
  excerpt?: string;
  // Video-specific
  timestamp?: number; // seconds
  videoDuration?: number; // total seconds
  // Image-specific
  imageUrl?: string;
  region?: { x: number; y: number; w: number; h: number }; // 0-100 percent
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'multibar';
  title: string;
  unit: string;
  prefix?: string;
  data: ChartDataPoint[];
  color?: string;
  label2?: string;
}

export interface DemoQuestion {
  id: string;
  keywords: string[];
  query: string;
  mode: 'quick' | 'deeper';
  answer: string; // supports [1][2] inline citations
  sources: EnhancedSource[];
  chartData?: ChartData;
  confidence: 'high' | 'medium' | 'partial';
  crossSiloAgencies: string[];
  elapsedMs: number;
  relatedQuestions: string[];
  thinkingSteps: string[];
}

// Format seconds as "4:23"
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 'dot-spending',
    keywords: ['dot', 'road', 'maintenance', 'spending', 'spend', 'budget', 'highway', 'infrastructure'],
    query: 'How much did NJ DOT spend on road maintenance in 2023?',
    mode: 'quick',
    answer: `NJ DOT allocated **$1.84 billion** in road maintenance expenditure for FY2023 [1], a **12.3% increase** over FY2022's $1.64 billion — the largest year-over-year jump in the past decade [2].

The breakdown by maintenance category:

| Category | FY2023 | FY2022 | Change |
|---|---|---|---|
| Pavement preservation | $687M | $601M | +14.3% |
| Bridge maintenance | $412M | $378M | +9.0% |
| Safety improvements | $298M | $256M | +16.4% |
| Drainage & utilities | $248M | $223M | +11.2% |
| Other maintenance | $195M | $182M | +7.1% |

The surge was driven by two factors: post-pandemic infrastructure catch-up and new federal IIJA allocations [3], which added $217M in additional maintenance funding specifically earmarked for aging structures on I-78, I-95, and Route 1/9.`,
    sources: [
      {
        type: 'structured',
        category: 'primary',
        title: 'NJ DOT FY2023 Capital Program Budget',
        url: 'https://www.nj.gov/transportation/capital/stip.shtm',
        agency: 'NJDOT',
        freshness: 'Data as of Sep 2023',
        contribution: 'Total FY2023 maintenance expenditure by category',
        excerpt: 'Total road maintenance allocation for fiscal year 2023 reached $1.84 billion, representing the single largest maintenance appropriation in department history.',
      },
      {
        type: 'document',
        category: 'primary',
        title: 'NJ Treasury Annual Appropriations Report 2022–2023',
        url: 'https://www.nj.gov/treasury/omb/publications/',
        agency: 'NJ Treasury',
        freshness: 'Data as of Dec 2023',
        contribution: 'Year-over-year comparison figures and prior year baselines',
        excerpt: 'Transportation maintenance allocations increased 12.3% from FY2022 to FY2023, driven by backlogged capital needs and federal matching requirements.',
      },
      {
        type: 'document',
        category: 'supporting',
        title: 'IIJA NJ Allocation Report — Infrastructure Investment & Jobs Act',
        url: 'https://www.nj.gov/transportation/capital/',
        agency: 'Federal Highway Administration',
        freshness: 'Data as of Jan 2024',
        contribution: 'Federal IIJA supplemental funding breakdown by corridor',
        excerpt: 'New Jersey received $217M in IIJA maintenance-designated funds for FY2023, focused on I-78, I-95, and Route 1/9 corridor aging structures.',
      },
    ],
    chartData: {
      type: 'bar',
      title: 'NJ DOT Road Maintenance Spending',
      unit: 'Million USD',
      prefix: '$',
      data: [
        { label: 'FY2020', value: 1280 },
        { label: 'FY2021', value: 1390 },
        { label: 'FY2022', value: 1640 },
        { label: 'FY2023', value: 1840 },
      ],
      color: '#00D4FF',
    },
    confidence: 'high',
    crossSiloAgencies: ['NJDOT', 'NJ Treasury', 'Federal Highway Admin'],
    elapsedMs: 187,
    relatedQuestions: [
      'Which NJ counties received the most road maintenance funding in 2023?',
      'How does NJ DOT spending compare to neighboring states?',
      'What percentage of NJ bridges are rated structurally deficient?',
    ],
    thinkingSteps: [
      'Understood your question',
      'Searching 57M government records',
      'Found NJDOT capital budget database',
      'Cross-referencing with NJ Treasury appropriations',
      'Pulling IIJA federal allocation data',
      'Connecting insights...',
    ],
  },

  {
    id: 'njtransit-safety',
    keywords: ['transit', 'njtransit', 'nj transit', 'board', 'safety', 'meeting', 'fare', 'train', 'bus', 'rail'],
    query: 'What did NJ Transit\'s board discuss about safety in their 2023 meetings?',
    mode: 'quick',
    answer: `NJ Transit's Board of Directors addressed safety in three major sessions during 2023, with the most substantive discussion occurring at the **November 2023 board meeting** [1].

**Key safety decisions made in 2023:**

**Positive Train Control (PTC) compliance** — The board approved an additional $38M allocation to complete remaining PTC implementation on the Morris & Essex and Montclair-Boonton lines [1]. The system is now 97% deployed across the NJ Transit rail network.

**Bus safety pilot program** — Following a series of incidents in Q1 2023, the board commissioned a 6-month collision avoidance pilot using Mobileye cameras across 450 buses in the Newark and Camden depots [2]. Early results showed a 34% reduction in at-fault incidents.

**Track inspection frequency** — The Safety Committee recommended increasing automated track inspection intervals from bi-weekly to weekly on high-frequency corridors, effective Q2 2024 [1].

The board also reviewed NTSB recommendations following the 2022 Secaucus near-miss incident and confirmed all 7 corrective actions were completed ahead of the December 2023 deadline [3].`,
    sources: [
      {
        type: 'video',
        category: 'primary',
        title: 'NJ Transit Board Meeting — November 2023',
        url: 'https://www.njtransit.com/about-nj-transit/board-of-directors',
        agency: 'NJ Transit',
        freshness: 'Recorded Nov 14, 2023',
        contribution: 'PTC approval, track inspection policy, NTSB compliance confirmation',
        timestamp: 263, // 4:23
        videoDuration: 5400, // 90 minutes
      },
      {
        type: 'video',
        category: 'supporting',
        title: 'NJ Transit Safety Committee Presentation — March 2023',
        url: 'https://www.njtransit.com/about-nj-transit/board-of-directors',
        agency: 'NJ Transit',
        freshness: 'Recorded Mar 8, 2023',
        contribution: 'Bus collision avoidance pilot program details and depot selection',
        timestamp: 1847, // 30:47
        videoDuration: 3600, // 60 minutes
      },
      {
        type: 'document',
        category: 'supporting',
        title: 'NTSB Safety Recommendation Response — NJ Transit 2022 Secaucus Incident',
        url: 'https://www.ntsb.gov/',
        agency: 'NTSB / NJ Transit',
        freshness: 'Data as of Dec 2023',
        contribution: '7 corrective action completion status and compliance timeline',
        excerpt: 'NJ Transit has confirmed completion of all seven corrective actions recommended following the 2022 near-miss incident at Secaucus Junction, ahead of the December 2023 target date.',
      },
    ],
    confidence: 'high',
    crossSiloAgencies: ['NJ Transit', 'NTSB', 'FRA'],
    elapsedMs: 241,
    relatedQuestions: [
      'What is the current status of NJ Transit\'s Positive Train Control rollout?',
      'How has NJ Transit ridership changed since the pandemic?',
      'What are the planned fare changes for NJ Transit in 2024?',
    ],
    thinkingSteps: [
      'Understood your question',
      'Searching 57M documents across 23 agencies',
      'Scanning board meeting video archives',
      'Reading NJ Transit board meeting at 4:23',
      'Cross-referencing NTSB safety recommendations',
      'Connecting insights...',
    ],
  },

  {
    id: 'environmental-violations',
    keywords: ['environmental', 'violation', 'dep', 'pollution', 'county', 'epa', 'clean', 'water', 'air', 'hazard'],
    query: 'Which NJ counties had the most environmental violations in 2022?',
    mode: 'quick',
    answer: `Based on DEP enforcement records for calendar year 2022, **Essex County** led with **312 documented violations**, followed by Hudson (267) and Camden (198) [1].

**Top 5 counties by total violations (2022):**

| County | Total Violations | Air Quality | Water | Solid Waste |
|---|---|---|---|---|
| Essex | 312 | 118 | 94 | 100 |
| Hudson | 267 | 102 | 87 | 78 |
| Camden | 198 | 67 | 71 | 60 |
| Middlesex | 176 | 58 | 69 | 49 |
| Mercer | 143 | 51 | 55 | 37 |

The distribution reflects both **industrial density** and **enforcement activity** — Essex and Hudson counties have the highest concentration of NJDEP-regulated facilities in the state [2].

Air quality violations represented the largest single category statewide (43%), with many tied to VOC emissions from industrial facilities in the Meadowlands corridor [1]. Water violations were concentrated near the Passaic and Raritan river basins [3].

> Note: "Violations" include formal enforcement actions, notices of violation, and consent orders. Not all violations resulted in penalties.`,
    sources: [
      {
        type: 'structured',
        category: 'primary',
        title: 'NJDEP Enforcement & Compliance Database — 2022 Annual Report',
        url: 'https://www.nj.gov/dep/enforce/',
        agency: 'NJ DEP',
        freshness: 'Data as of Mar 2023',
        contribution: 'County-level violation counts by category and enforcement type',
        excerpt: 'Calendar year 2022 enforcement data shows Essex County with the highest total violation count at 312, driven by industrial air quality non-compliance in the northeastern corridor.',
      },
      {
        type: 'image',
        category: 'primary',
        title: 'NJ Environmental Violation Density Map — 2022',
        agency: 'NJ DEP / GIS Division',
        freshness: 'Published Apr 2023',
        contribution: 'Geographic distribution of violations across all 21 counties',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/New_Jersey_location_map.svg/600px-New_Jersey_location_map.svg.png',
        region: { x: 52, y: 18, w: 28, h: 22 }, // NE NJ - Essex/Hudson area
      },
      {
        type: 'structured',
        category: 'supporting',
        title: 'NJ DEP Regulated Facilities Registry — Statewide',
        url: 'https://www.nj.gov/dep/enforce/',
        agency: 'NJ DEP',
        freshness: 'Data as of Jan 2023',
        contribution: 'Facility counts by county to contextualize violation rates',
        excerpt: 'Essex County hosts 2,847 NJDEP-regulated facilities — the highest county concentration — with Hudson at 2,412 and Middlesex at 2,104.',
      },
    ],
    chartData: {
      type: 'bar',
      title: 'Environmental Violations by County (Top 5, 2022)',
      unit: 'Violations',
      data: [
        { label: 'Essex', value: 312 },
        { label: 'Hudson', value: 267 },
        { label: 'Camden', value: 198 },
        { label: 'Middlesex', value: 176 },
        { label: 'Mercer', value: 143 },
      ],
      color: '#22c55e',
    },
    confidence: 'medium',
    crossSiloAgencies: ['NJ DEP', 'EPA Region 2', 'County Health Depts'],
    elapsedMs: 312,
    relatedQuestions: [
      'Which NJ facilities received the largest fines for environmental violations in 2022?',
      'How have environmental violation counts changed over the past 5 years in NJ?',
      'What remediation actions are required for Superfund sites in Essex County?',
    ],
    thinkingSteps: [
      'Understood your question',
      'Searching DEP enforcement database',
      'Scanning county-level violation records',
      'Analyzing GIS map data',
      'Cross-referencing with EPA Region 2 records',
      'Connecting insights...',
    ],
  },

  {
    id: 'gateway-tunnel',
    keywords: ['gateway', 'tunnel', 'amtrak', 'hudson', 'portal', 'rail', 'federal', 'funding', 'project', 'transit'],
    query: 'What is the current status and funding for the Gateway Tunnel project?',
    mode: 'deeper',
    answer: `The Gateway Program represents the largest infrastructure initiative in the northeastern United States, encompassing a new Hudson River rail tunnel, the Portal North Bridge replacement, and NJ-side station improvements [1].

**Current Status (as of early 2024):**

The project has advanced significantly following the 2021 Infrastructure Investment and Jobs Act, which provided the federal funding certainty the program had lacked for a decade.

**Portal North Bridge** — Construction is underway. The new fixed bridge will replace the 110-year-old movable structure that has been the single biggest cause of NJ Transit and Amtrak delays on the Northeast Corridor. Completion expected 2025 [2].

**Hudson Tunnel Project** — In the Final Environmental Impact Statement (FEIS) stage. The project will build two new single-track tunnels beneath the Hudson River and rehabilitate the existing 110-year-old tunnels currently operating at capacity [1].

**Funding breakdown (total estimated $16.1B):**

| Source | Amount | Status |
|---|---|---|
| Federal (IIJA / FRA Core Capacity) | $6.88B | Committed |
| NJ State | $4.73B | Committed |
| NY State | $4.49B | Committed |

**Why this matters:** The existing 1910 North River Tunnels were severely damaged by saltwater intrusion during Hurricane Sandy in 2012 [3]. If one tube fails before replacement is complete, NJ Transit and Amtrak service would be reduced by 75%, affecting 200,000 daily commuters.

Gateway Development Commission Chairman John D. Porcari stated in November 2023 that the program is "on track and fully funded" for the first time in its history [4].`,
    sources: [
      {
        type: 'document',
        category: 'primary',
        title: 'Gateway Program Final EIS Executive Summary 2023',
        url: 'https://www.gatewayprogram.org/',
        agency: 'Gateway Development Commission',
        freshness: 'Data as of Dec 2023',
        contribution: 'Project scope, current phase status, and federal review timeline',
        excerpt: 'The Hudson Tunnel Project FEIS confirms two new single-track tunnels will be constructed beneath the Hudson River, with rehabilitation of existing tubes to follow upon completion.',
      },
      {
        type: 'document',
        category: 'primary',
        title: 'Portal North Bridge — NJ Transit Project Status Report Q4 2023',
        url: 'https://www.njtransit.com/',
        agency: 'NJ Transit / Amtrak',
        freshness: 'Data as of Jan 2024',
        contribution: 'Construction timeline, milestones, and 2025 completion target',
        excerpt: 'Portal North Bridge construction is advancing on schedule. The new 2,800-foot fixed span will permanently resolve the movable bridge delay risk that has cost NEC commuters an estimated 400,000 minutes annually.',
      },
      {
        type: 'structured',
        category: 'supporting',
        title: 'Hurricane Sandy NEC Infrastructure Damage Assessment',
        url: 'https://www.amtrak.com/',
        agency: 'Amtrak / FRA',
        freshness: 'Data as of 2013 (Sandy assessment)',
        contribution: 'Context on North River Tunnel saltwater damage and degradation risk',
        excerpt: 'Saltwater intrusion during Hurricane Sandy caused irreversible damage to tunnel electrical, signal, and drainage systems. The tubes are now operating on borrowed time without accelerated replacement.',
      },
      {
        type: 'video',
        category: 'additional',
        title: 'Gateway Development Commission — November 2023 Public Forum',
        url: 'https://www.gatewayprogram.org/',
        agency: 'Gateway Development Commission',
        freshness: 'Recorded Nov 9, 2023',
        contribution: 'Chairman Porcari\'s statement on full funding commitment and timeline',
        timestamp: 734, // 12:14
        videoDuration: 7200, // 2 hours
      },
    ],
    confidence: 'high',
    crossSiloAgencies: ['Gateway Development Commission', 'NJ Transit', 'Amtrak', 'FRA'],
    elapsedMs: 891,
    relatedQuestions: [
      'What caused the repeated delays to the Gateway Tunnel project before 2021?',
      'How will construction impact NJ Transit service during the build phase?',
      'What are the projected benefits to NEC capacity once Gateway is complete?',
    ],
    thinkingSteps: [
      'Understood your question',
      'Searching 57M documents across 23 agencies',
      'Reading Gateway Program EIS documentation',
      'Analyzing NJ Transit project status reports',
      'Cross-referencing Amtrak/FRA federal filings',
      'Pulling Gateway Development Commission records',
      'Synthesizing funding commitment timeline',
      'Connecting insights...',
    ],
  },
];

export const DEFAULT_QUESTION: DemoQuestion = {
  id: 'default',
  keywords: [],
  query: '',
  mode: 'quick',
  answer: `Kurious searched across **57 million records** spanning 23 New Jersey government agencies to answer your question.

Based on available NJ Open Data, I found relevant information across multiple government databases. This prototype demonstrates Kurious's ability to connect insights across agencies, modalities, and data formats — from PDFs and spreadsheets to government meeting videos and geospatial data.

Try one of the suggested questions to see the full range of capabilities, including:
- **Video timestamps** — jump directly to the exact moment in a board meeting
- **Auto-generated charts** — visualize numerical data instantly
- **Cross-agency insights** — answers that connect dots across multiple departments
- **Inline citations** — transparent sourcing for every claim`,
  sources: [
    {
      type: 'structured',
      category: 'primary',
      title: 'NJ Open Data Portal — Multi-Agency Database',
      agency: 'NJ Office of Information Technology',
      freshness: 'Data as of Jan 2024',
      contribution: 'Primary data source for query resolution',
    },
    {
      type: 'document',
      category: 'supporting',
      title: 'NJ Government Records Index',
      agency: 'NJ State Archives',
      freshness: 'Data as of Dec 2023',
      contribution: 'Document cross-reference and verification',
    },
  ],
  confidence: 'medium',
  crossSiloAgencies: ['NJ OIT', 'NJ State Archives'],
  elapsedMs: 198,
  relatedQuestions: [
    'How much did NJ DOT spend on road maintenance in 2023?',
    'What did NJ Transit\'s board discuss about safety in 2023?',
    'Which NJ counties had the most environmental violations in 2022?',
  ],
  thinkingSteps: [
    'Understood your question',
    'Searching 57M documents across 23 agencies',
    'Scanning videos, data & documents',
    'Connecting insights...',
  ],
};

export function findDemoQuestion(query: string): DemoQuestion {
  const q = query.toLowerCase();
  for (const demo of DEMO_QUESTIONS) {
    if (demo.keywords.some(kw => q.includes(kw))) {
      return demo;
    }
  }
  return { ...DEFAULT_QUESTION, query };
}

export const SUGGESTION_CARDS = [
  'How much did NJ DOT spend on road maintenance in 2023?',
  'What did NJ Transit\'s board discuss about safety in 2023?',
  'Which NJ counties had the most environmental violations in 2022?',
  'What is the current status of the Gateway Tunnel project?',
];

export const AGENCY_FILTERS = [
  'All agencies',
  'NJDOT',
  'NJ Transit',
  'NJ DEP',
  'Treasury',
  'DOH',
  'Education',
  'Courts',
];
