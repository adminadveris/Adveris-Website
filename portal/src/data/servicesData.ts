export interface ServiceCategory {
  id: string;
  name: string;
  subServices: string[];
}

export const servicesData: ServiceCategory[] = [
  {
    id: "01",
    name: "Corporate Advisory & Structuring",
    subServices: [
      "Company & LLP Incorporation in India and Entity set-up",
      "Entry strategy for foreign businesses and IP Protection",
      "Post-incorporation compliances (Record Maintenance, Regulatory/Secretarial/Sectoral)",
      "Corporate structuring, capital alteration, joint ventures, and financial restructuring",
      "Insider Trading health checks and ongoing corporate governance",
      "IPO lifecycle support (VDRs, Certificates, BRLM coordination, Offer Documents)",
      "Direct and Indirect Taxation advisory"
    ]
  },
  {
    id: "02",
    name: "Venture Capital, Private Equity & Fundraises",
    subServices: [
      "Angel, seed, growth-stage, and late-stage investments",
      "Drafting and negotiation of term sheets",
      "Share subscription, share purchase, and shareholders’ agreements",
      "Founder arrangements and equity structuring",
      "FEMA and FDI compliance for inbound and outbound investments",
      "Post-closing filings and ongoing regulatory support"
    ]
  },
  {
    id: "03",
    name: "Mergers & Acquisitions",
    subServices: [
      "Acquisitions, divestments, and exit transactions",
      "Buy-side and sell-side due diligence",
      "Transaction documentation and negotiations",
      "Cross-border M&A support with regulatory compliance"
    ]
  },
  {
    id: "04",
    name: "Loans & Debt Financing",
    subServices: [
      "Advisory on secured and unsecured lending arrangements",
      "Venture debt, structured debt, and working capital facilities",
      "Drafting and negotiating loan agreements, security documents, and guarantees",
      "Lender and borrower-side transaction advisory",
      "Regulatory and compliance framework relative to debt transactions"
    ]
  },
  {
    id: "05",
    name: "Commercial Contracts",
    subServices: [
      "SaaS and technology agreements",
      "Vendor, procurement, supply, and services contracts",
      "Distribution, franchise, and licensing agreements",
      "Consultancy and non-disclosure / confidentiality agreements",
      "Contract risk assessment and complex negotiation support",
      "Standardization of recurring agreements for operational efficiency"
    ]
  },
  {
    id: "06",
    name: "Employment Law",
    subServices: [
      "Drafting and review of employment agreements, offer letters, and consultancy arrangements",
      "Advisory on employment law compliance, HR policies, and POSH frameworks",
      "ESOP structuring, documentation, implementation, and liquidity support",
      "Advisory on workforce structuring, exits, terminations, and separation documentation"
    ]
  },
  {
    id: "07",
    name: "Regulatory Compliance & Risk Management",
    subServices: [
      "Advisory on FEMA, FDI Policy, OI Rules, Companies Act, Contract Act, and allied laws",
      "Corporate governance, board-level advisory, and compliance reviews",
      "Ongoing compliance management, risk assessment, and monitoring",
      "Advisory on all statutory and sector-specific regulatory filings"
    ]
  },
  {
    id: "08",
    name: "Due Diligence Report",
    subServices: [
      "Comprehensive Legal, Secretarial, and Financial Due Diligence",
      "Transactional due diligence for investments, debt financing, and M&A transactions",
      "Contractual and regulatory risk assessment audits",
      "Issue-based due diligence reports supported by practical remediation guidance"
    ]
  },
  {
    id: "09",
    name: "Dispute & Pre-Litigation Support",
    subServices: [
      "Advisory on complex contractual and employment-related disputes",
      "Drafting and negotiation of settlement and separation agreements",
      "Robust pre-litigation strategy to mitigate cost and timeline risks",
      "Risk evaluation, assessment, and dispute management support"
    ]
  },
  {
    id: "10",
    name: "Business Valuation",
    subServices: [
      "Business Valuation of Securities or Financial Assets (SFA)",
      "Valuation required for share issuance, buybacks, amalgamation, and demergers",
      "Statutory valuation services for Insolvency & Bankruptcy Law (IBC)",
      "Determination of fair value of investments under Ind As 113"
    ]
  },
  {
    id: "11",
    name: "Representation before Authorities",
    subServices: [
      "Registrar of Companies (ROC) and Regional Director (RD) proceedings",
      "National Company Law Tribunal (NCLT) & NCLAT representation",
      "Debt Recovery Tribunal (DRT & DRAT) and High Court matters",
      "Securities & Exchange Board of India (SEBI) & Economic Offense Court",
      "Arbitration representation and strategic litigation guidance"
    ]
  },
  {
    id: "12",
    name: "Bankruptcy and Insolvency",
    subServices: [
      "Advisory on Corporate Insolvency Resolution Process (CIRP) under IBC",
      "Representation for Financial/Operational Creditors, RP, and Corporate Debtors",
      "Drafting and review of Resolution Plans",
      "Advisory on Voluntary Liquidation and Winding-up proceedings"
    ]
  }
];
