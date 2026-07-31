/**
 * Ember's wedge is that revenue integrity is *not* a horizontal problem. A
 * denial in cardiology is a cath-lab bundling dispute; in dermatology it is a
 * lesion-count and medical-necessity dispute; in behavioral health it is a
 * time-threshold dispute. The rules, the codes, the payers and the appeal
 * arguments are different in each.
 *
 * So the switcher in this teardown swaps *specialty*, not brand — and it swaps
 * the whole domain underneath the prototypes, not just the accent colour. That
 * is the structural claim being tested: a horizontal coding model that scores
 * well on average is still wrong on the 8 codes that carry a practice's margin.
 */
export type SpecialtyId =
  | 'cardiology'
  | 'dermatology'
  | 'ophthalmology'
  | 'orthopedics'
  | 'gastroenterology'
  | 'behavioral'

export type Specialty = {
  id: SpecialtyId
  name: string
  /** One line on why this specialty leaks revenue in a way generic RCM misses. */
  thesis: string
  /** The site of service that generates most of the disputed dollars. */
  setting: string
  /** Representative annual encounter volume for a mid-size group. */
  encountersPerYear: number
  /** Average allowed amount per encounter — sets the stakes of a single error. */
  avgAllowed: number
  /** Industry-typical initial denial rate before intervention. */
  baselineDenialRate: number
  primary: string
  accent: string
  accentInk: string
  tint: string
  ring: string
  surface: string
}

export const SPECIALTIES: Specialty[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    thesis:
      'Diagnostic and interventional components of the same cath session are separately payable only under specific modifier and add-on rules. Get the split wrong and the payer bundles the whole session.',
    setting: 'Cath lab, advanced imaging, device implant',
    encountersPerYear: 84_000,
    avgAllowed: 612,
    baselineDenialRate: 0.114,
    primary: '#1e293b',
    accent: '#e11d48',
    accentInk: '#881337',
    tint: '#fff1f3',
    ring: '#fecdd6',
    surface: '#faf8f8',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    thesis:
      'Lesion destruction and excision pay by count, size and malignancy — all of which live in the pathology report, not the procedure note. The note and the bill are written days apart from different documents.',
    setting: 'Office procedure, Mohs suite, path lab',
    encountersPerYear: 138_000,
    avgAllowed: 248,
    baselineDenialRate: 0.098,
    primary: '#2e1f1a',
    accent: '#ea7317',
    accentInk: '#7c2d12',
    tint: '#fff6ed',
    ring: '#fed7aa',
    surface: '#fbf8f5',
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    thesis:
      'Cataract, injection and imaging volume is enormous and the unit economics are thin, so a 3% policy drift on one J-code quietly costs more than a whole denied surgical day.',
    setting: 'ASC, clinic, retina injection suite',
    encountersPerYear: 156_000,
    avgAllowed: 194,
    baselineDenialRate: 0.087,
    primary: '#152b3f',
    accent: '#0d9488',
    accentInk: '#115e59',
    tint: '#effcfa',
    ring: '#bfe9e3',
    surface: '#f6faf9',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    thesis:
      'Global surgical periods swallow legitimately separate visits. Modifier 24/25/79 decisions made months apart by different people are where the money goes.',
    setting: 'ASC, hospital OR, clinic follow-up',
    encountersPerYear: 96_000,
    avgAllowed: 741,
    baselineDenialRate: 0.121,
    primary: '#1c2541',
    accent: '#3b6ef0',
    accentInk: '#1e3a8a',
    tint: '#eff4ff',
    ring: '#cfdefd',
    surface: '#f7f9fd',
  },
  {
    id: 'gastroenterology',
    name: 'Gastroenterology',
    thesis:
      'Screening versus diagnostic colonoscopy is a one-character modifier difference that flips patient cost-share to zero — and flips the denial risk onto the practice when it is wrong.',
    setting: 'Endoscopy suite, ASC',
    encountersPerYear: 72_000,
    avgAllowed: 486,
    baselineDenialRate: 0.104,
    primary: '#22303c',
    accent: '#7c3aed',
    accentInk: '#5b21b6',
    tint: '#f6f2ff',
    ring: '#ddd0fb',
    surface: '#f9f8fd',
  },
  {
    id: 'behavioral',
    name: 'Behavioral Health',
    thesis:
      'Payment turns on documented face-to-face minutes and a matching diagnosis. The clinical note is narrative prose; the payer wants a stopwatch.',
    setting: 'Outpatient clinic, telehealth',
    encountersPerYear: 210_000,
    avgAllowed: 138,
    baselineDenialRate: 0.132,
    primary: '#23303a',
    accent: '#0e7490',
    accentInk: '#155e75',
    tint: '#eff9fc',
    ring: '#c2e6f0',
    surface: '#f6fafb',
  },
]

export const DEFAULT_SPECIALTY = SPECIALTIES[0]

export function specialtyVars(s: Specialty): React.CSSProperties {
  return {
    '--brand': s.primary,
    '--accent': s.accent,
    '--accent-ink': s.accentInk,
    '--tint': s.tint,
    '--ring': s.ring,
    '--surface': s.surface,
    '--radius': '12px',
    '--heading-font': "'Inter Tight', system-ui, sans-serif",
  } as React.CSSProperties
}

export const bySpecialty = <T,>(map: Record<SpecialtyId, T>, id: SpecialtyId): T => map[id]
