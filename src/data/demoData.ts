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
  // Clip-specific
  speaker?: { name: string; role: string };
  clipDuration?: number;      // clip length in seconds (5-30)
  startTime?: number;         // start of clip in source video
  endTime?: number;           // end of clip in source video
  relevanceRank?: number;     // for sorting clips by relevance
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
  clipLayout?: 'highlight' | 'grid';
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
      'Searching 85M government records',
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
    clipLayout: 'highlight' as const,
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
        speaker: { name: 'Chair Diane Gutierrez-Scaccetti', role: 'NJ Transit Board Chair' },
        clipDuration: 4,
        startTime: 263,
        endTime: 281,
        relevanceRank: 1,
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
        speaker: { name: 'Kevin Corbett', role: 'NJ Transit CEO' },
        clipDuration: 5,
        startTime: 1847,
        endTime: 1871,
        relevanceRank: 2,
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
      'Searching 85M documents across 23 agencies',
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
      {
        type: 'video',
        category: 'supporting',
        title: 'DEP Aerial Survey — Raritan River',
        url: 'https://www.nj.gov/dep/surveys/',
        agency: 'NJ DEP',
        freshness: 'Recorded Nov 2022',
        contribution: 'Aerial footage showing discoloration patterns near industrial discharge point',
        excerpt: 'Aerial footage showing discoloration patterns along the northern bank of the Raritan River near the industrial discharge point.',
        speaker: { name: 'Aerial Survey', role: 'No audio — visual footage only' },
        clipDuration: 3,
        startTime: 0,
        endTime: 8,
        relevanceRank: 1,
      },
    ],
    clipLayout: 'highlight',
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
    clipLayout: 'highlight' as const,
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
        speaker: { name: 'John D. Porcari', role: 'GDC Chairman' },
        clipDuration: 5,
        startTime: 734,
        endTime: 756,
        relevanceRank: 1,
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
      'Searching 85M documents across 23 agencies',
      'Reading Gateway Program EIS documentation',
      'Analyzing NJ Transit project status reports',
      'Cross-referencing Amtrak/FRA federal filings',
      'Pulling Gateway Development Commission records',
      'Synthesizing funding commitment timeline',
      'Connecting insights...',
    ],
  },

  // ─── Legal Video Demo Questions ──────────────────────────────────────────────
  {
    id: 'zoning-decision',
    keywords: ['council', 'zoning', 'downtown', 'decision', 'vote', 'approve', 'zone', 'legal'],
    query: 'What did the council decide about the downtown zoning proposal?',
    mode: 'quick',
    answer: `The City Council voted **5-2 to approve** the downtown zoning amendment (Resolution 2024-127) during the March 15 session [1]. Council President Maria Torres led the motion, citing the need for mixed-use development to address housing shortages [2].

The amendment changes the downtown core from C-2 (Commercial) to MU-1 (Mixed Use), allowing residential units above ground-floor retail. Key provisions include:

| Provision | Details |
|---|---|
| Height limit | Increased from 4 to 8 stories |
| Residential density | Up to 60 units per acre |
| Affordable housing | 15% mandatory inclusionary |
| Parking requirement | Reduced to 0.75 spaces per unit |
| Green space | 10% of lot area required |

The two dissenting votes came from Council Members Park and Williams, who raised concerns about infrastructure capacity [3]. An environmental impact review was completed in January showing no significant adverse effects [4].`,
    clipLayout: 'highlight',
    sources: [
      {
        type: 'video' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'City Council Meeting — March 15, 2026 (Vote & Discussion)',
        url: 'https://www.youtube.com/watch?v=example1',
        agency: 'City Council',
        freshness: 'Recorded Mar 15, 2026',
        contribution: 'Contains the full council discussion and 5-2 vote on Resolution 2024-127',
        timestamp: 872,
        videoDuration: 5400,
        excerpt: 'Council President Torres: "I move to approve Resolution 2024-127, the downtown zoning amendment. This is about creating housing our community needs while maintaining the character of our downtown corridor."',
        speaker: { name: 'Maria Torres', role: 'Council President' },
        clipDuration: 7,
        startTime: 872,
        endTime: 900,
        relevanceRank: 1,
      },
      {
        type: 'video' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'City Council Meeting — March 15, 2026 (Opposition Remarks)',
        url: 'https://www.youtube.com/watch?v=example1b',
        agency: 'City Council',
        freshness: 'Recorded Mar 15, 2026',
        contribution: 'Council Member Park\'s dissenting statement on infrastructure capacity concerns',
        timestamp: 1120,
        videoDuration: 5400,
        excerpt: '"My concern is not with mixed-use itself but with the infrastructure. Our water and sewer systems downtown were built for commercial loads, not 60 units per acre residential density."',
        speaker: { name: 'David Park', role: 'Council Member' },
        clipDuration: 5,
        startTime: 1120,
        endTime: 1142,
        relevanceRank: 2,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Planning Commission Review — February 22, 2026',
        url: 'https://www.youtube.com/watch?v=example1c',
        agency: 'City Planning Commission',
        freshness: 'Recorded Feb 22, 2026',
        contribution: 'Planning Commission recommendation to approve the zoning change with conditions',
        timestamp: 645,
        videoDuration: 3600,
        excerpt: '"The commission recommends approval with three conditions: a traffic impact study, a stormwater management plan, and phased density increases over five years."',
        speaker: { name: 'Angela Martinez', role: 'Planning Commission Chair' },
        clipDuration: 4,
        startTime: 645,
        endTime: 663,
        relevanceRank: 3,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Public Comment Period — March 15, 2026',
        url: 'https://www.youtube.com/watch?v=example1d',
        agency: 'City Council',
        freshness: 'Recorded Mar 15, 2026',
        contribution: 'Resident testimony supporting the zoning change for affordable housing',
        timestamp: 2100,
        videoDuration: 5400,
        excerpt: '"I\'ve lived here 20 years and watched rents double. If mixed-use brings even a few dozen affordable units downtown, that changes lives in this community."',
        speaker: { name: 'Janet Liu', role: 'Resident / Public Comment' },
        clipDuration: 3,
        startTime: 2100,
        endTime: 2114,
        relevanceRank: 4,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'City Council Meeting — March 15, 2026 (Legal Review)',
        url: 'https://www.youtube.com/watch?v=example1e',
        agency: 'City Council',
        freshness: 'Recorded Mar 15, 2026',
        contribution: 'City Attorney confirms the amendment complies with state zoning statutes',
        timestamp: 780,
        videoDuration: 5400,
        excerpt: '"I can confirm that Resolution 2024-127 is consistent with the Municipal Land Use Law and our comprehensive plan. No legal impediments to adoption."',
        speaker: { name: 'Thomas Reed', role: 'City Attorney' },
        clipDuration: 3,
        startTime: 780,
        endTime: 790,
        relevanceRank: 5,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'Housing Committee Workshop — January 18, 2026',
        url: 'https://www.youtube.com/watch?v=example1f',
        agency: 'City Council',
        freshness: 'Recorded Jan 18, 2026',
        contribution: 'Early discussion of housing density targets that shaped the final amendment',
        timestamp: 1890,
        videoDuration: 4800,
        excerpt: '"The housing needs analysis shows we need 1,200 new units by 2030. Downtown mixed-use is the most viable path to meet even half of that target."',
        speaker: { name: 'Priya Patel', role: 'Council Member' },
        clipDuration: 3,
        startTime: 1890,
        endTime: 1906,
        relevanceRank: 6,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'Environmental Impact Review Presentation — January 28, 2026',
        url: 'https://www.youtube.com/watch?v=example1g',
        agency: 'City Planning Department',
        freshness: 'Recorded Jan 28, 2026',
        contribution: 'Environmental consultant presents findings of no significant adverse effects',
        timestamp: 420,
        videoDuration: 3000,
        excerpt: '"Our assessment concludes that the proposed rezoning will not result in significant adverse environmental effects, provided the stormwater conditions in our report are adopted."',
        speaker: { name: 'Dr. Kevin Moss', role: 'Environmental Consultant' },
        clipDuration: 3,
        startTime: 420,
        endTime: 432,
        relevanceRank: 7,
      },
      {
        type: 'document' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'Resolution 2024-127: Downtown Zoning Amendment',
        url: 'https://example.com/resolution-2024-127.pdf',
        agency: 'City Planning Department',
        freshness: 'Filed Mar 16, 2026',
        contribution: 'Full text of the zoning amendment with all provisions, setback requirements, and compliance conditions',
        excerpt: 'Section 3.2: The downtown core zone designation is hereby amended from C-2 (General Commercial) to MU-1 (Mixed Use) for all parcels within the boundaries described in Exhibit A...'
      },
      {
        type: 'structured' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Council Voting Record — Resolution 2024-127',
        url: 'https://example.com/votes',
        agency: 'City Clerk',
        freshness: 'Updated Mar 15, 2026',
        contribution: 'Official roll call vote showing each council member\'s position',
        excerpt: 'Torres (Y), Rodriguez (Y), Chen (Y), Patel (Y), Johnson (Y), Park (N), Williams (N)'
      },
      {
        type: 'image' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Downtown Zoning Map — Amended Boundaries',
        url: 'https://example.com/zoning-map',
        agency: 'City Planning Department',
        freshness: 'Published Mar 16, 2026',
        contribution: 'Visual map showing the rezoned area boundaries and adjacent zones',
        imageUrl: '',
        region: { x: 30, y: 20, w: 40, h: 50 }
      }
    ],
    confidence: 'high' as const,
    crossSiloAgencies: ['City Council', 'City Planning Department', 'City Clerk', 'City Planning Commission'],
    elapsedMs: 180,
    relatedQuestions: [
      'What were the specific objections raised by Council Members Park and Williams?',
      'How does the new MU-1 zoning compare to other mixed-use zones in the city?',
      'What is the timeline for the environmental impact review process?'
    ],
    thinkingSteps: [
      'Understood query about council zoning decision',
      'Searching across 100K+ hours of council video recordings',
      'Found vote discussion at timestamp 14:32 in March 15 session',
      'Cross-referencing with official resolution documents',
      'Retrieving voting record from city clerk database',
      'Locating relevant zoning maps',
      'Synthesizing cross-modal answer with citations'
    ]
  },

  {
    id: 'budget-cuts',
    keywords: ['budget', 'cuts', 'spending', 'reduce', 'fiscal', 'finance', 'money', 'funding'],
    query: 'Show me all discussions about budget cuts in the last 6 months',
    mode: 'deeper',
    answer: `Budget cut discussions appeared in **4 council sessions** over the past 6 months, with the most significant debate occurring during the February budget hearing [1].

**Key discussions by date:**

**February 12, 2026 — Budget Hearing** [1]
The Finance Committee proposed a 7% across-the-board cut to non-essential services. Director of Finance James Wright presented projections showing a $3.2M revenue shortfall. The public safety budget was exempted from cuts after strong pushback from the police and fire unions.

**January 8, 2026 — Special Session** [2]
Emergency discussion about declining sales tax revenue. Controller's office reported Q4 revenue was 11% below forecast. Council authorized a hiring freeze for all non-public-safety positions.

**December 5, 2025 — Year-End Review** [3]
Preliminary budget analysis revealed $4.8M in unfunded obligations for FY2026. Public works department flagged that a 5% cut would delay the Main Street bridge repair by 18 months.

**October 15, 2025 — Quarterly Financial Review** [4]
First indication of budget pressure. Revenue tracking 4% below projections. No cuts proposed yet but the finance committee was instructed to prepare contingency scenarios.

Total proposed cuts across all departments: **$8.7M** against a $142M operating budget, representing a **6.1% reduction** [5].`,
    clipLayout: 'grid',
    sources: [
      {
        type: 'video' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'City Council Budget Hearing — February 12, 2026',
        url: 'https://www.youtube.com/watch?v=example2',
        agency: 'City Council',
        freshness: 'Recorded Feb 12, 2026',
        contribution: 'Full budget hearing with Finance Director presentation and council debate on the 7% cut proposal',
        timestamp: 1245,
        videoDuration: 7200,
        excerpt: '"We are facing a $3.2 million revenue shortfall. Without corrective action, we will exhaust our reserve fund by Q3 of the fiscal year."',
        speaker: { name: 'James Wright', role: 'Director of Finance' },
        clipDuration: 3,
        startTime: 1245,
        endTime: 1260,
        relevanceRank: 1,
      },
      {
        type: 'video' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'Special Session on Revenue Shortfall — January 8, 2026',
        url: 'https://www.youtube.com/watch?v=example3',
        agency: 'City Council',
        freshness: 'Recorded Jan 8, 2026',
        contribution: 'Emergency session discussing Q4 revenue decline and hiring freeze authorization',
        timestamp: 456,
        videoDuration: 3600,
        excerpt: '"Given the severity of the revenue decline, I recommend an immediate hiring freeze across all non-public-safety departments effective today."',
        speaker: { name: 'Maria Torres', role: 'Council President' },
        clipDuration: 3,
        startTime: 456,
        endTime: 468,
        relevanceRank: 2,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Year-End Financial Review — December 5, 2025',
        url: 'https://www.youtube.com/watch?v=example4',
        agency: 'City Council',
        freshness: 'Recorded Dec 5, 2025',
        contribution: 'Preliminary budget analysis revealing $4.8M in unfunded obligations',
        timestamp: 2340,
        videoDuration: 5400,
        excerpt: '"A 5% cut to our department would mean delaying the Main Street bridge repair by at least 18 months. That bridge is currently rated as structurally deficient."',
        speaker: { name: 'Robert Kane', role: 'Public Works Director' },
        clipDuration: 4,
        startTime: 2340,
        endTime: 2360,
        relevanceRank: 3,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Quarterly Financial Review — October 15, 2025',
        url: 'https://www.youtube.com/watch?v=example5',
        agency: 'City Council',
        freshness: 'Recorded Oct 15, 2025',
        contribution: 'First indication of budget pressure with revenue tracking below projections',
        timestamp: 780,
        videoDuration: 4800,
        excerpt: '"Revenue is tracking 4% below our Q4 projections. I strongly recommend the finance committee prepare contingency scenarios for potential across-the-board reductions."',
        speaker: { name: 'Lisa Nguyen', role: 'City Controller' },
        clipDuration: 4,
        startTime: 780,
        endTime: 798,
        relevanceRank: 4,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Budget Hearing — Parks & Recreation Impact — February 12, 2026',
        url: 'https://www.youtube.com/watch?v=example2b',
        agency: 'City Council',
        freshness: 'Recorded Feb 12, 2026',
        contribution: 'Parks Director details impact of $1.8M cut on summer programs',
        timestamp: 2890,
        videoDuration: 7200,
        excerpt: '"A $1.8 million reduction means we lose all three summer youth programs and close the Riverside community pool. That affects 4,000 families."',
        speaker: { name: 'Carmen Diaz', role: 'Parks & Recreation Director' },
        clipDuration: 3,
        startTime: 2890,
        endTime: 2906,
        relevanceRank: 5,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'Police Union Budget Response — February 18, 2026',
        url: 'https://www.youtube.com/watch?v=example2c',
        agency: 'City Council',
        freshness: 'Recorded Feb 18, 2026',
        contribution: 'Police union president argues for public safety budget exemption',
        timestamp: 340,
        videoDuration: 2400,
        excerpt: '"We cannot absorb any cuts without reducing patrol coverage. Response times are already averaging 8 minutes, well above the 5-minute target."',
        speaker: { name: 'Sgt. Michael Torres', role: 'Police Union President' },
        clipDuration: 3,
        startTime: 340,
        endTime: 351,
        relevanceRank: 6,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'Budget Hearing — Administrative Cuts Proposal — February 12, 2026',
        url: 'https://www.youtube.com/watch?v=example2d',
        agency: 'City Council',
        freshness: 'Recorded Feb 12, 2026',
        contribution: 'City Manager outlines $1.4M in administrative savings including position consolidation',
        timestamp: 3450,
        videoDuration: 7200,
        excerpt: '"We can achieve $1.4 million in administrative savings through position consolidation, technology upgrades, and renegotiating vendor contracts without impacting front-line services."',
        speaker: { name: 'Patricia Holmes', role: 'City Manager' },
        clipDuration: 4,
        startTime: 3450,
        endTime: 3469,
        relevanceRank: 7,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'Public Comment on Budget Cuts — February 12, 2026',
        url: 'https://www.youtube.com/watch?v=example2e',
        agency: 'City Council',
        freshness: 'Recorded Feb 12, 2026',
        contribution: 'Resident pushback on proposed library branch closures',
        timestamp: 4100,
        videoDuration: 7200,
        excerpt: '"Closing the Eastside branch library would remove the only free internet access point for 3,000 households in our neighborhood. This is not a luxury — it is essential infrastructure."',
        speaker: { name: 'Denise Walker', role: 'Resident / Public Comment' },
        clipDuration: 3,
        startTime: 4100,
        endTime: 4113,
        relevanceRank: 8,
      },
      {
        type: 'structured' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'FY2026 Budget Revision Summary — Department Cuts',
        url: 'https://example.com/budget',
        agency: 'Finance Department',
        freshness: 'Updated Feb 15, 2026',
        contribution: 'Detailed breakdown of proposed cuts by department with dollar amounts and percentages',
        excerpt: 'Total proposed reductions: $8.7M (6.1% of $142M operating budget). Public Safety: exempt. Public Works: -$2.1M. Parks & Recreation: -$1.8M. Administration: -$1.4M.'
      }
    ],
    confidence: 'high' as const,
    crossSiloAgencies: ['City Council', 'Finance Department', 'Public Works'],
    elapsedMs: 340,
    relatedQuestions: [
      'Which departments were most affected by the proposed budget cuts?',
      'What was the public reaction to the hiring freeze?',
      'Has the Main Street bridge repair been rescheduled?'
    ],
    thinkingSteps: [
      'Understood query about budget cut discussions over 6 months',
      'Searching across all council session recordings from Oct 2025 to Apr 2026',
      'Found 4 relevant sessions with budget-related discussions',
      'Analyzing video transcripts for budget cut mentions',
      'Cross-referencing with finance department records',
      'Ordering by significance and date',
      'Compiling timeline with key quotes and data points'
    ]
  },

  {
    id: 'environmental-river',
    keywords: ['environment', 'river', 'pollution', 'water', 'impact', 'contamination', 'ecological', 'testimony'],
    query: 'Has anyone raised concerns about the environmental impact on the river?',
    mode: 'quick',
    answer: `Yes, environmental concerns about the Millstone River have been raised in **3 separate proceedings** over the past year, with the most detailed testimony coming from Dr. Sarah Chen of the State Environmental Commission [1].

**Key concerns raised:**

**Water quality:** Dr. Chen's testimony presented data showing phosphorus levels 2.3x above EPA limits downstream of the industrial zone [1]. She attributed the increase to stormwater runoff from the expanded development area.

**Ecological impact:** The Millstone River Conservancy submitted a 47-page assessment documenting a 34% decline in native fish populations over 3 years [2]. The assessment includes satellite imagery showing visible sediment plumes after heavy rainfall events [4].

**Regulatory compliance:** The State Department of Environmental Protection (DEP) issued a Notice of Violation to two facilities in the industrial zone for exceeding discharge limits [3]. Combined excess discharge was estimated at 12,000 gallons per day above permitted levels.

**Current status:** The council has ordered an independent environmental audit, due for completion by June 2026. Until the audit is complete, no new development permits will be issued within 500 feet of the riverbank.`,
    clipLayout: 'highlight',
    sources: [
      {
        type: 'video' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'Environmental Commission Hearing — Dr. Sarah Chen Testimony',
        url: 'https://www.youtube.com/watch?v=example6',
        agency: 'State Environmental Commission',
        freshness: 'Recorded Feb 28, 2026',
        contribution: 'Expert testimony with water quality data showing phosphorus levels 2.3x above EPA limits',
        timestamp: 1567,
        videoDuration: 4200,
        excerpt: '"Our water sampling data from twelve monitoring stations along the Millstone River shows a consistent pattern. Phosphorus concentrations downstream of the industrial zone are 2.3 times the EPA recommended limit."',
        speaker: { name: 'Dr. Sarah Chen', role: 'Environmental Scientist' },
        clipDuration: 6,
        startTime: 1567,
        endTime: 1593,
        relevanceRank: 1,
      },
      {
        type: 'video' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'City Council Session — Environmental Audit Authorization',
        url: 'https://www.youtube.com/watch?v=example7',
        agency: 'City Council',
        freshness: 'Recorded Mar 10, 2026',
        contribution: 'Council vote authorizing independent environmental audit and development moratorium near riverbank',
        timestamp: 3456,
        videoDuration: 6000,
        excerpt: '"Until the independent audit is complete, I am ordering a moratorium on all new development permits within 500 feet of the Millstone River bank."',
        speaker: { name: 'Mayor Rodriguez', role: 'City Mayor' },
        clipDuration: 3,
        startTime: 3456,
        endTime: 3470,
        relevanceRank: 2,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Environmental Commission Hearing — DEP Enforcement Update',
        url: 'https://www.youtube.com/watch?v=example6b',
        agency: 'NJ DEP',
        freshness: 'Recorded Feb 28, 2026',
        contribution: 'DEP inspector details the violations found at both industrial zone facilities',
        timestamp: 2100,
        videoDuration: 4200,
        excerpt: '"Both facilities were found to be discharging above permitted levels. Combined excess discharge totals approximately 12,000 gallons per day. We have issued formal Notices of Violation."',
        speaker: { name: 'Mark Sullivan', role: 'DEP Senior Inspector' },
        clipDuration: 4,
        startTime: 2100,
        endTime: 2117,
        relevanceRank: 3,
      },
      {
        type: 'video' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Conservancy Presentation — Fish Population Data',
        url: 'https://www.youtube.com/watch?v=example6c',
        agency: 'Millstone River Conservancy',
        freshness: 'Recorded Feb 28, 2026',
        contribution: 'Conservancy biologist presents 3-year fish population decline data',
        timestamp: 890,
        videoDuration: 4200,
        excerpt: '"Over three years we documented a 34% decline in native fish populations. The most affected species are those sensitive to phosphorus loading — sunfish, darters, and native brook trout."',
        speaker: { name: 'Dr. Emily Voss', role: 'Conservancy Biologist' },
        clipDuration: 5,
        startTime: 890,
        endTime: 911,
        relevanceRank: 4,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'City Council — Resident Testimony on River Quality',
        url: 'https://www.youtube.com/watch?v=example6d',
        agency: 'City Council',
        freshness: 'Recorded Mar 10, 2026',
        contribution: 'Long-time resident describes visible changes in river water quality',
        timestamp: 4200,
        videoDuration: 6000,
        excerpt: '"I have fished this river for 30 years. In the last two years the water has turned cloudy after every rain. My grandchildren can no longer swim at our usual spot. Something has changed."',
        speaker: { name: 'Harold Green', role: 'Resident / Public Comment' },
        clipDuration: 3,
        startTime: 4200,
        endTime: 4215,
        relevanceRank: 5,
      },
      {
        type: 'video' as SourceType,
        category: 'additional' as SourceCategory,
        title: 'Planning Board — Stormwater Runoff Discussion',
        url: 'https://www.youtube.com/watch?v=example6e',
        agency: 'City Planning Board',
        freshness: 'Recorded Jan 12, 2026',
        contribution: 'City engineer links stormwater runoff from expanded development to river contamination',
        timestamp: 1340,
        videoDuration: 3600,
        excerpt: '"The expanded impervious surface area in the industrial zone has increased stormwater runoff volume by an estimated 40%. That runoff carries pollutants directly into the Millstone."',
        speaker: { name: 'Rachel Kim', role: 'City Engineer' },
        clipDuration: 4,
        startTime: 1340,
        endTime: 1358,
        relevanceRank: 6,
      },
      {
        type: 'document' as SourceType,
        category: 'primary' as SourceCategory,
        title: 'Millstone River Ecological Impact Assessment',
        url: 'https://example.com/river-assessment.pdf',
        agency: 'Millstone River Conservancy',
        freshness: 'Published Jan 15, 2026',
        contribution: '47-page assessment documenting 34% decline in native fish populations with methodology and satellite data',
        excerpt: 'Executive Summary: Over the study period (2023-2025), native fish populations in the lower Millstone River declined by 34%, with the sharpest decline observed in species sensitive to phosphorus loading...'
      },
      {
        type: 'structured' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'DEP Notice of Violation — Industrial Zone Facilities',
        url: 'https://example.com/dep-violations',
        agency: 'NJ Department of Environmental Protection',
        freshness: 'Issued Mar 1, 2026',
        contribution: 'Official violation records for two facilities exceeding discharge permits',
        excerpt: 'Facility A: 8,200 gal/day excess. Facility B: 3,800 gal/day excess. Combined: 12,000 gal/day above permitted levels.'
      },
      {
        type: 'image' as SourceType,
        category: 'supporting' as SourceCategory,
        title: 'Satellite Imagery — Sediment Plume After Rainfall Event',
        url: 'https://example.com/satellite',
        agency: 'Millstone River Conservancy',
        freshness: 'Captured Feb 10, 2026',
        contribution: 'Satellite image showing visible sediment plume extending 1.2 miles downstream after heavy rainfall',
        imageUrl: '',
        region: { x: 20, y: 30, w: 60, h: 40 }
      }
    ],
    confidence: 'high' as const,
    crossSiloAgencies: ['State Environmental Commission', 'Millstone River Conservancy', 'NJ DEP', 'City Council'],
    elapsedMs: 220,
    relatedQuestions: [
      'What specific facilities are cited in the DEP Notice of Violation?',
      'When is the independent environmental audit expected to be completed?',
      'What remediation steps have been proposed for the phosphorus contamination?'
    ],
    thinkingSteps: [
      'Understood query about environmental impact on river',
      'Searching across environmental hearings, council sessions, and regulatory records',
      'Found expert testimony from Dr. Sarah Chen with water quality data',
      'Located ecological assessment from Millstone River Conservancy',
      'Cross-referencing with DEP violation records',
      'Found satellite imagery showing sediment plumes',
      'Compiling answer with multi-source evidence'
    ]
  },
];

export const DEFAULT_QUESTION: DemoQuestion = {
  id: 'default',
  keywords: [],
  query: '',
  mode: 'quick',
  answer: `Right now, Kurious is searching across **NJ Open Data** — **85 million records**, **23 agencies**, **8+ formats** including documents, videos, spreadsheets, and images. Try asking anything about New Jersey!

Here are some things Kurious can do:
- **Search government meeting videos** — find the exact moment a decision was made
- **Visualize data** — auto-generate charts from budget and spending records
- **Connect agencies** — answer questions that span DOT, DEP, Treasury, and more
- **Cite everything** — every claim links back to its source`,
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
    'Searching 85M documents across 23 agencies',
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
  '\uD83D\uDCCA How much did NJ DOT spend on road maintenance in 2023?',
  '\uD83C\uDFAC What did the council decide about the downtown zoning proposal?',
  '\uD83D\uDCC4 Which NJ counties had the most environmental violations in 2022?',
  '\uD83C\uDFAC Show me all discussions about budget cuts in the last 6 months',
  'What did NJ Transit\'s board discuss about safety in 2023?',
  'What is the current status of the Gateway Tunnel project?',
  'Has anyone raised concerns about the environmental impact on the river?',
  'How has NJ school enrollment changed over the last 5 years?',
  'What are the top causes of bridge deficiencies in NJ?',
  'Which NJ agencies had the highest overtime expenditure in 2023?',
  'What environmental remediation projects are active in Bergen County?',
  'How much has NJ Transit\'s ridership recovered since 2020?',
  'What is the NJ DEP\'s budget allocation for clean water initiatives?',
  'Which NJ counties have the highest air quality violations?',
  'How has NJ property tax revenue changed in the last decade?',
];

export interface SuggestionGroup {
  label: string;
  cards: string[];
}

export const SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    label: '\uD83C\uDFAC Try a video search',
    cards: [
      '\uD83C\uDFAC What did the council decide about the downtown zoning proposal?',
      '\uD83C\uDFAC Show me all discussions about budget cuts in the last 6 months',
    ],
  },
  {
    label: '\uD83D\uDCCA Try a data question',
    cards: [
      '\uD83D\uDCCA How much did NJ DOT spend on road maintenance in 2023?',
      '\uD83D\uDCCA Which NJ agencies had the highest overtime expenditure in 2023?',
    ],
  },
  {
    label: '\uD83D\uDD17 Try a cross-agency question',
    cards: [
      '\uD83D\uDD17 What is the current status of the Gateway Tunnel project?',
      '\uD83D\uDD17 Has anyone raised concerns about the environmental impact on the river?',
    ],
  },
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
