/**
 * Everything the company publishes about itself, in one place.
 * Sourced from embercopilot.ai, its knowledge base, YC and press, July 2026.
 */

export const COMPANY = {
  founded: 2024,
  batch: 'Y Combinator, Fall 2024',
  hq: 'San Francisco',
  founders: ['Charlene Wang (CEO)', 'Warren Wang (CTO)'],
  origin:
    'CEO came from Healthcare AI product at Google and remote patient monitoring at Elevance; CTO from explainable-AI research at MIT CSAIL and medical AI with NVIDIA.',
  positioning:
    'An AI revenue integrity platform built for specialty physician practices and health systems — not a horizontal coding model with a specialty skin.',
  seed: '$4.3M seed led by Nexus Venture Partners, with Y Combinator participating.',
}

export const HEADLINE_STATS = [
  {
    value: '57%',
    label: 'fewer denials',
    note: 'Reduction in initial denial rate after pre-bill audit is switched on.',
  },
  {
    value: '100%',
    label: 'of encounters reviewed',
    note: 'The structural claim: audit stops being a 3% sample and becomes the whole population.',
  },
  {
    value: '+23%',
    label: 'clean claim rate',
    note: 'Claims that adjudicate on first submission with no human touch.',
  },
  {
    value: '3.3x',
    label: 'ROI in month one',
    note: 'Recovered and protected revenue against platform cost.',
  },
  {
    value: '+9.3%',
    label: 'net revenue per appointment',
    note: 'The number that actually matters — margin per unit of clinical capacity.',
  },
  {
    value: '3 days',
    label: 'to first results',
    note: 'Read-only EHR connection means value lands before any workflow change.',
  },
]

/** The three engines the product is organised around. */
export const ENGINES = [
  {
    id: 'data',
    role: 'Foundation',
    name: 'Data Engine',
    tagline: 'Joins the four documents that a claim actually depends on.',
    detail:
      'Clinical documentation, the coding decision, the payer policy in force on the date of service, and the contract rate — normally four systems owned by four teams. Nothing downstream is possible until they share a key.',
    inputs: ['Clinical note & path/imaging results', 'Coded claim lines', 'Payer medical policy', 'Contract rate sheet'],
  },
  {
    id: 'coding',
    role: 'Audit',
    name: 'Coding Engine',
    tagline: 'Reviews 100% of encounters before the claim leaves the building.',
    detail:
      'Every encounter is checked against national standards, payer-specific policy, internal guidelines and the contract. Findings carry a citation and a confidence score, and route to a human when the model is not sure.',
    inputs: ['CMS NCCI PTP & MUE', 'LCD / NCD coverage', 'Payer medical policy', 'Practice-specific guidelines'],
  },
  {
    id: 'appeal',
    role: 'Recovery',
    name: 'Appeal Engine',
    tagline: 'Turns a denial code into a filed, tracked, evidenced appeal.',
    detail:
      'Pulls denials off the 835, resolves the root cause behind the CARC/RARC pair, assembles the policy and contract argument, drafts the letter, attaches the chart, files through the payer portal and tracks to adjudication.',
    inputs: ['835 remittance (CARC/RARC)', 'Applicable LCD/NCD', 'Contract terms', 'Chart & supporting documentation'],
  },
]

/** Capabilities the site lists under the three engines. */
export const CAPABILITIES = [
  { name: 'Documentation Intelligence', detail: 'Reads the note the way an auditor would, and says what is missing before it matters.' },
  { name: 'Coding Compliance', detail: 'Bidirectional — catches undercoding and overcoding, because only one of those is a revenue problem and both are an audit problem.' },
  { name: 'Denial Intelligence', detail: 'Root-cause taxonomy over the denial population, not a list of rejected claims.' },
  { name: 'Appeals Automation', detail: 'Drafting, evidence assembly, filing and adjudication tracking.' },
  { name: 'Contract Intelligence', detail: 'Knows what each line should have paid, so an underpayment is detectable at all.' },
  { name: 'Revenue Recovery', detail: 'Underpayments, missed charges and appealable denials worked as one queue.' },
]

export const PAYERS = [
  { name: 'UnitedHealthcare', share: 0.21, kind: 'National commercial' },
  { name: 'Aetna', share: 0.16, kind: 'National commercial' },
  { name: 'Cigna', share: 0.12, kind: 'National commercial' },
  { name: 'BCBS (state plan)', share: 0.19, kind: 'Blues' },
  { name: 'Medicare Part B', share: 0.18, kind: 'Government' },
  { name: 'Medicare Advantage', share: 0.09, kind: 'Government (delegated)' },
  { name: 'Medicaid MCO', share: 0.05, kind: 'Government (delegated)' },
]

export const EHRS = [
  { name: 'Epic', kind: 'Health system', method: 'FHIR R4 + Kit/Toolbox', note: 'Bulk export for backfill, subscriptions for live encounters.' },
  { name: 'athenahealth', kind: 'Ambulatory', method: 'athenaOne API + FHIR', note: 'Largest specialty-group footprint in the knowledge base.' },
  { name: 'ModMed', kind: 'Specialty-native', method: 'FHIR R4', note: 'Derm, ophtho, ortho, GI — structured exam data is unusually good.' },
  { name: 'Nextech', kind: 'Specialty-native', method: 'REST + FHIR', note: 'Ophthalmology and plastics.' },
  { name: 'eClinicalWorks', kind: 'Ambulatory', method: 'FHIR R4', note: 'Broad small-practice coverage.' },
  { name: 'Open Dental', kind: 'Dental', method: 'REST', note: 'Adjacent market the knowledge base courts.' },
]

/** Where a dollar of billed charge leaks on its way to the bank. */
export const LEAKAGE = [
  {
    stage: 'Documentation',
    loss: 'Under-specified diagnosis, missing time, missing laterality, path result not reconciled to the note.',
    engine: 'Data',
  },
  {
    stage: 'Coding',
    loss: 'Wrong code family, missing modifier, unbundled line that should be bundled, bundled line that should be separate.',
    engine: 'Coding',
  },
  {
    stage: 'Submission',
    loss: 'Prior auth not on file, eligibility stale, policy changed since the last time this code was billed.',
    engine: 'Coding',
  },
  {
    stage: 'Adjudication',
    loss: 'Denied outright, or downcoded silently. About 60% of denials are never worked at all.',
    engine: 'Appeal',
  },
  {
    stage: 'Payment',
    loss: 'Paid — but below the contracted rate. Nobody notices, because nobody has the rate sheet in the same system as the remit.',
    engine: 'Appeal',
  },
]

/** Claim adjustment reason codes that carry most of the appealable dollars. */
export const CARC_CATALOG = [
  { code: 'CO-197', label: 'Precertification / authorization absent', appealable: true, note: 'Often winnable on retro-auth or on a policy that did not require auth on the DOS.' },
  { code: 'CO-50', label: 'Not deemed medically necessary', appealable: true, note: 'The LCD/NCD argument. Highest-value appeal category.' },
  { code: 'CO-16', label: 'Claim lacks information', appealable: true, note: 'Usually a missing modifier or an unpopulated field — cheap to overturn.' },
  { code: 'CO-11', label: 'Diagnosis inconsistent with procedure', appealable: true, note: 'Specificity failure upstream in the note.' },
  { code: 'CO-97', label: 'Bundled / included in another service', appealable: true, note: 'Global-period and NCCI disputes.' },
  { code: 'CO-45', label: 'Charge exceeds fee schedule', appealable: false, note: 'Contractual write-off — but the amount is worth checking against the rate sheet.' },
  { code: 'CO-4', label: 'Procedure inconsistent with modifier', appealable: true, note: 'Modifier missing, invalid, or applied to the wrong line.' },
  { code: 'CO-29', label: 'Time limit for filing expired', appealable: false, note: 'Unrecoverable. Prevention is the only lever.' },
]

export const SECURITY = [
  { name: 'HIPAA', detail: 'Business Associate Agreement signed with each practice.' },
  { name: 'SOC 2 Type II', detail: 'Attested.' },
  { name: 'HITRUST e1', detail: 'Certified.' },
  { name: 'Encryption', detail: 'In transit and at rest.' },
  { name: 'Access control', detail: 'Role-based, with audit logging on every model decision.' },
]

export const SOURCES = [
  { label: 'embercopilot.ai', url: 'https://www.embercopilot.ai/' },
  { label: 'Cardiology page', url: 'https://www.embercopilot.ai/specialties/cardiology' },
  { label: 'Knowledge base', url: 'https://www.embercopilot.ai/knowledge' },
  { label: 'Y Combinator', url: 'https://www.ycombinator.com/companies/ember' },
  { label: 'Seed announcement', url: 'https://www.embercopilot.ai/nexus-venture-partners-leads-4-3m-seed-funding-in-healthcare-ai-startup-ember' },
  { label: 'CMS NCCI policy manual', url: 'https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits' },
]
