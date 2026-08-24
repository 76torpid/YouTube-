import fs from 'node:fs';
import path from 'node:path';

export function validateGraph(graphPath: string, baselineMarkdownPath: string): boolean {
  if (!fs.existsSync(graphPath)) {
    console.error(`VALIDATION FAIL: Graph file does not exist at ${graphPath}`);
    return false;
  }

  const rawGraph = fs.readFileSync(graphPath, 'utf8');
  const graph = JSON.parse(rawGraph);
  const baselineMarkdown = fs.readFileSync(baselineMarkdownPath, 'utf8');

  let passed = true;

  // 1. Required nodes check
  const requiredNodeNames = [
    'NewsWatch System Architecture',
    'NewsWatch Production Contract',
    'NewsWatch Development Lifecycle Policy',
    'NewsWatch YouTube Ingestion Contract',
    'NewsWatch Video Deduplication Contract',
    'NewsWatch Canonical Data Flow',
    'NewsWatch AI Source Boundary',
    'NewsWatch Location Extraction Contract',
    'NewsWatch LINE Notification Contract',
    'NewsWatch Scheduler Contract',
    'NewsWatch Security Boundary',
    'NewsWatch Admin Authentication Contract',
    'NewsWatch Production Deployment Contract'
  ];

  const nodeNames = new Set(graph.nodes.map((n: any) => n.name));
  for (const req of requiredNodeNames) {
    if (!nodeNames.has(req)) {
      console.error(`VALIDATION FAIL: Required node missing: "${req}"`);
      passed = false;
    }
  }

  // 2. Required relationships check
  const requiredEdges = [
    { source: 'NewsWatch System Architecture', target: 'Cloudflare Workers', type: 'USES' },
    { source: 'Cloudflare Workers', target: 'D1', type: 'USES' },
    { source: 'Cloudflare Workers', target: 'Workers AI', type: 'USES' },
    { source: 'YouTube Video', target: 'videoId', type: 'IDENTIFIED_BY' },
    { source: 'Admin', target: 'Cloudflare Access', type: 'PROTECTED_BY' }
  ];

  for (const reqEdge of requiredEdges) {
    const found = graph.edges.some(
      (e: any) => e.source === reqEdge.source && e.target === reqEdge.target && e.type === reqEdge.type
    );
    if (!found) {
      console.error(`VALIDATION FAIL: Required edge missing: ${reqEdge.source} -[${reqEdge.type}]-> ${reqEdge.target}`);
      passed = false;
    }
  }

  // 3. Production Contract validation (news.akimu.org MUST be present, news.cr24h.org MUST be 0)
  if (!baselineMarkdown.includes('news.akimu.org')) {
    console.error('VALIDATION FAIL: Baseline markdown missing production domain news.akimu.org');
    passed = false;
  }

  if (baselineMarkdown.includes('news.cr24h.org')) {
    console.error('VALIDATION FAIL: Legacy domain news.cr24h.org found in baseline markdown!');
    passed = false;
  }

  const rawGraphStr = JSON.stringify(graph);
  if (rawGraphStr.includes('news.cr24h.org')) {
    console.error('VALIDATION FAIL: Legacy domain news.cr24h.org found in generated graph!');
    passed = false;
  }

  // 4. Specific contract assertions
  if (!baselineMarkdown.includes('youtube_metadata')) {
    console.error('VALIDATION FAIL: AI source basis youtube_metadata not found');
    passed = false;
  }

  if (!baselineMarkdown.includes('Cloudflare Access')) {
    console.error('VALIDATION FAIL: Admin protection Cloudflare Access not found');
    passed = false;
  }

  if (passed) {
    console.log('GRAPHIFY VALIDATION SUCCESS: All constraints, nodes, and contracts PASSED.');
  }

  return passed;
}

if (process.argv[1] && process.argv[1].endsWith('validator.ts')) {
  const graphPath = process.argv[2] || path.join(process.cwd(), 'graphify-out', 'graph.json');
  const baselinePath = process.argv[3] || path.join(process.cwd(), 'graphify-baseline.md');

  const success = validateGraph(graphPath, baselinePath);
  process.exit(success ? 0 : 1);
}
