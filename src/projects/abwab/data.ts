// Everything below was scraped from abwab.ai on 2026-09-23 (home, /about, /customers,
// /case-studies, /products/*). Single source of truth for the video — no invented numbers.

export const brand = {
  tagline: "Lend More. Risk Less.",
  hero: ["Grow Your MSME Book.", "Manage the Risk."],
  positioning:
    "AI across the full lending lifecycle for banks, NBFIs, fintechs, funds, and platforms. Plugs into your stack. No core replacement. Built in Saudi Arabia for MENA.",
  meaning: 'Abwab means "doors" in Arabic.',
  mission: "So every credible small business finds an open door.",
  founded: "2023, Riyadh",
  url: "abwab.ai",
  cta: "Request a demo",
  closer: "See what your credit team is missing.",
  colors: {
    violet: "#7C3AED", // primary, CTA, "Manage the Risk."
    violetBars: ["#A273F2", "#874BEE", "#7F3FED", "#7D3BED", "#7C3AED"], // hero cashflow chart
    ink: "#101828", // headings
    bg: "#FBF9FE", // page background
    border: "#E2E1E5",
    approveBg: "#DBFCE7",
    approveText: "#008236",
  },
  type: { family: "Inter", h1: { size: 60, weight: 600, tracking: -1.5 } },
};

// Proof numbers (home + /customers + /about)
export const stats = [
  { v: "SAR 1B+", k: "MSME loans processed" },
  { v: "13+", k: "financial institutions" },
  { v: "70%", k: "faster credit decisions" },
  { v: "90%", k: "lower cost per case" },
  { v: "40%", k: "fewer defaults" },
  { v: "13x", k: "growth in four quarters" },
  { v: "40+", k: "team members" },
  { v: "30%", k: "uplift in default prediction (independently validated)" },
];

// Market problem (/about)
export const problem = [
  { v: "99.6%", k: "of Saudi private businesses are SMEs" },
  { v: "~10%", k: "of bank credit reaches them" },
  { v: "$250B+", k: "GCC SME financing gap" },
  { v: "20%", k: "SAMA SME lending mandate for banks" },
];

// Hero product mockup — the site's own UI, rebuildable 1:1 in Remotion
export const heroCard = {
  url: "app.abwab.ai/decisioning",
  title: "Credit assessment · #4821",
  borrower: "Najd Trading Est.",
  verdict: "APPROVE",
  score: 742,
  checks: ["Bank statements verified", "VAT returns matched", "SIMAH bureau pulled"],
  chartLabel: "Cashflow, last 12 months",
  limit: "SAR 850,000",
  footer: ["Decisioned in 1.2s", "Next: upsell limit +25%"],
  badges: ["Auto-decisioned · No analyst touch", "SAMA-ready · Full audit trail"],
};

// Pipeline (home "The platform")
export const pipeline = [
  { k: "Intake", d: "Digital application, no RM for standard cases" },
  { k: "Parse & enrich", d: "Statements, CR, SIMAH, Qawaem" },
  { k: "Decision", d: "Your rules plus AI models, in real time" },
  { k: "Price & offer", d: "Risk-based terms, full audit log" },
  { k: "Monitor & grow", d: "24/7 signals, next best action" },
];

// Four products with the numbers each product page shows
export const products = {
  origination: {
    name: "Loan Origination",
    line: "Minutes, not weeks. No RM. No branch.",
    app: "Application #5102 · Retail SME · SAR 250k · 8 min · no analyst",
    steps: ["Intake", "KYC & onboarding", "Documents", "Eligibility", "Decision-ready"],
    funnel: [
      { k: "Internal criteria", cost: "$", pass: 100 },
      { k: "CR · Kafalah · sector", cost: "$", pass: 62 },
      { k: "Wathiq · open banking · Qawaem", cost: "$$", pass: 34 },
      { k: "SIMAH", cost: "$$$", pass: 14 },
    ],
  },
  decisioning: {
    name: "Credit Decisioning",
    line: "Instant, high-quality credit decisions. On your framework.",
    signals: ["Bank data", "Bureau", "VAT returns", "Cashflow"],
    score: 742,
    price: "SAR 250k · 14.5%",
    outcomes: ["Approve", "Refer", "Decline"],
    policy: [
      ["DSCR ≥ 1.3", "Pass"],
      ["Sector in allowed list", "Pass"],
      ["Exposure ≤ SAR 500k", "Refer"],
      ["PEP / sanctions screen", "Clear"],
    ],
    models: "150+ risk metrics · PD / LGD / NPL models",
  },
  agentic: {
    name: "Agentic Credit Intelligence",
    line: "A 24/7 virtual RM for your entire MSME book.",
    monitored: "12,480 SMEs monitored · live 24/7",
    triage: [
      { k: "Grow", n: 1204, a: "Upsell limit" },
      { k: "Watch", n: 318, a: "Review" },
      { k: "Act now", n: 27, a: "Restructure" },
    ],
    queued: "412 actions queued",
    pulse: [
      ["POS sales", "+SAR 312k"],
      ["Payroll", "−SAR 84k"],
      ["Suppliers", "−SAR 196k"],
      ["Financing", "−SAR 40k"],
    ],
    signalsUp: ["POS volume +38%", "VAT filings up", "Strong repayment"],
    signalsDown: ["Payment delay 12d", "Covenant breach"],
  },
  embedded: {
    name: "Embedded Financing",
    line: "One integration. Many platforms.",
    platforms: ["Payroll", "E-commerce", "POS", "Payments", "ERP"],
    lenders: ["Banks", "NBFIs", "Funds"],
    match: "62% match · 154,000 of 248,000 SMEs",
    offer: "You're pre-qualified for SAR 250,000 · Working capital · 12 months",
  },
};

export const compliance = [
  "SAMA Cybersecurity Framework",
  "PDPL-compliant",
  "Sharia-validated",
  "In-Kingdom data residency",
];

export const segments = ["Banks", "NBFIs", "Fintechs", "Development Funds", "Platforms"];

export const testimonials = [
  { who: "Shahad Hablain", role: "VP of Business Development, SurePay", q: "Abwab's credit engine enhanced our credit workflows." },
  { who: "Mohammed Damiri", role: "Chief Product Officer, SalesFine", q: "Instant, data-driven credit decisions with minimal integration effort." },
  { who: "Abid Butt", role: "Co-Founder & CGO, Watad", q: "Abwab removed friction from procurement and enabled faster financing." },
];

// File names = /images/... paths on abwab.ai (see ASSETS.md)
export const logos = {
  abwab: "abwab-logo.webp",
  clients: ["SME Bank", "Abdul Latif Jameel", "Lendo", "Hala", "Kafalah", "Raqamyah", "Watad", "SurePay", "SalesFine", "Ldun"],
  dataPartners: ["SIMAH", "Bayan", "Qawaem", "Lean", "Tarabut", "GOSI", "Balady", "Thiqah", "Focal"],
  recognition: ["Google for Startups", "Money20/20", "Plug and Play", "NTDP", "GITEX Global"],
};
