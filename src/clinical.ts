/**
 * Per-specialty fixtures. These are the substance of the teardown: a coding
 * engine is only interesting if the cases it is reasoning about are real ones.
 *
 * Every code, edit and policy reference below is a real rule that real practices
 * lose money to. The encounters, patients, dollar amounts and contract sections
 * are invented; the clinical scenarios are composites, not records.
 */
import type { SpecialtyId } from './specialty'

export type Severity = 'blocker' | 'revenue' | 'compliance' | 'info'

export type CodeLine = {
  code: string
  kind: 'CPT' | 'ICD-10' | 'HCPCS'
  desc: string
  modifiers?: string[]
  units?: number
}

/** Which of the Data Engine's four inputs a finding cannot be made without. */
export type Source = 'note' | 'claim' | 'policy' | 'contract'

export type Finding = {
  id: string
  needs: Source[]
  severity: Severity
  /** Imperative, the way it appears in the coder's queue. */
  action: string
  detail: string
  /** The authority the model is citing. Non-negotiable — a finding without one is a guess. */
  citation: string
  /** Model confidence, 0–1. Drives whether this auto-applies or routes to a human. */
  confidence: number
  /** Dollar effect on this claim of accepting the finding. Negative = a line comes off. */
  delta: number
  /** Verbatim span from the note that grounds the finding. */
  evidence?: string
  /** What would have happened if the claim went out as coded. */
  ifIgnored: string
}

export type NoteSection = { label: string; body: string }

export type Encounter = {
  id: string
  patient: string
  age: number
  dos: string
  provider: string
  payer: string
  plan: string
  setting: string
  /** Contracted allowed amount for the claim exactly as the coder submitted it. */
  baseAllowed: number
  submitted: CodeLine[]
  note: NoteSection[]
  findings: Finding[]
}

export type Denial = {
  claim: string
  patient: string
  dos: string
  payer: string
  carc: string
  rarc?: string
  reason: string
  billed: number
  /** Model's assessed probability the appeal is overturned. */
  winRate: number
  rootCause: string
  argument: string
  citation: string
  age: number
  stage: 'queued' | 'drafted' | 'filed' | 'overturned' | 'upheld'
}

export type Underpayment = {
  claim: string
  code: string
  payer: string
  expected: number
  paid: number
  units: number
  cause: string
  contractRef: string
}

export type AuthItem = {
  patient: string
  procedure: string
  code: string
  payer: string
  scheduled: string
  status: 'required' | 'not-required' | 'submitted' | 'approved' | 'at-risk'
  criteria: string
  gap?: string
}

// ---------------------------------------------------------------------------
// Encounters — one worked pre-bill audit per specialty
// ---------------------------------------------------------------------------

export const ENCOUNTERS: Record<SpecialtyId, Encounter> = {
  cardiology: {
    id: 'C-90324',
    patient: 'R. Alvarez',
    age: 67,
    dos: '2026-07-14',
    provider: 'K. Mehta, MD',
    payer: 'Aetna',
    plan: 'Choice POS II',
    setting: 'Hospital cath lab (place of service 22)',
    baseAllowed: 928.6,
    submitted: [
      { code: '93458', kind: 'CPT', desc: 'Left heart cath with coronary angiography and LV angiography, S&I included' },
      { code: '93571', kind: 'CPT', desc: 'Intravascular Doppler / FFR, initial vessel (add-on)' },
      { code: 'I25.10', kind: 'ICD-10', desc: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
    ],
    note: [
      {
        label: 'Indication',
        body: 'Patient with escalating chest pain at rest over 72 hours, unrelieved by nitroglycerin. Troponin mildly elevated. Presentation consistent with unstable angina. Proceeding to diagnostic catheterization.',
      },
      {
        label: 'Procedure',
        body: 'Right femoral access obtained. Selective coronary angiography of left and right systems performed. Left ventriculography performed via pigtail catheter. Intermediate 60% stenosis noted in the mid-LAD; pressure wire advanced across the lesion and fractional flow reserve measured at 0.71, consistent with hemodynamically significant disease.',
      },
      {
        label: 'Findings',
        body: 'Mid-LAD 60% stenosis, FFR 0.71. Left circumflex without significant disease. RCA with 30% non-obstructive proximal disease. LV ejection fraction 52%. No intervention performed this session; patient referred for staged PCI.',
      },
      {
        label: 'Setting',
        body: 'Procedure performed in the hospital cardiac catheterization laboratory. Equipment and staff supplied by the facility; physician provided professional interpretation and supervision only.',
      },
    ],
    findings: [
      {
        id: 'card-1',
        needs: ['note','claim','policy'],
        severity: 'blocker',
        action: 'Append modifier 26 to 93458 and 93571',
        detail:
          'The service was rendered in a hospital cath lab. The facility bills the technical component; the physician may only bill the professional component. Submitted globally, this claim either denies or is recouped on post-payment audit.',
        citation: 'CMS NCCI Policy Manual, Ch. 11; MPFS PC/TC indicator 1',
        confidence: 0.96,
        delta: 0,
        evidence: 'Equipment and staff supplied by the facility; physician provided professional interpretation and supervision only.',
        ifIgnored: 'CO-4 denial, or paid globally and recouped 14 months later with the technical portion clawed back.',
      },
      {
        id: 'card-2',
        needs: ['note','claim','policy'],
        severity: 'revenue',
        action: 'Change I25.10 to I25.110',
        detail:
          'The note documents unstable angina. I25.10 explicitly excludes angina, which contradicts the indication for the study and undercuts medical necessity for the FFR measurement.',
        citation: 'ICD-10-CM Official Guidelines, Section I.A.19; Aetna CPB 0169 (cardiac catheterization)',
        confidence: 0.94,
        delta: 0,
        evidence: 'Presentation consistent with unstable angina.',
        ifIgnored: 'CO-11 — diagnosis inconsistent with procedure. The FFR add-on is the line that fails first.',
      },
      {
        id: 'card-3',
        needs: ['note','claim','policy'],
        severity: 'info',
        action: 'FFR value documented — 93571 is supported',
        detail:
          'Add-on 93571 requires a recorded ratio, not merely a statement that a pressure wire was used. The note records FFR 0.71, so the line stands as billed once modifier 26 is applied.',
        citation: 'CPT Assistant, Jan 2014; Aetna CPB 0169 §III',
        confidence: 0.91,
        delta: 0,
        evidence: 'fractional flow reserve measured at 0.71',
        ifIgnored: 'Nothing — this is the engine confirming a line rather than flagging it. Silence is not the same as review.',
      },
      {
        id: 'card-4',
        needs: ['claim','policy'],
        severity: 'info',
        action: 'No prior authorization required — do not open an auth task',
        detail:
          'Diagnostic left heart catheterization is not on this plan’s 2026 precertification list for this place of service. The staged PCI that follows will be.',
        citation: 'Aetna 2026 Participating Provider Precertification List, effective 2026-01-01',
        confidence: 0.89,
        delta: 0,
        ifIgnored: 'Nothing lost, but roughly 40 minutes of staff time spent obtaining an authorization nobody asked for.',
      },
      {
        id: 'card-5',
        needs: ['claim','contract'],
        severity: 'revenue',
        action: 'Expected allowed is $1,043.18, not the default $928.60',
        detail:
          'Cath lab professional services sit under a carve-out paying 118% of the Medicare fee schedule rather than the contract default of 105%. The posted payment should be checked against the carve-out, not the header rate.',
        citation: 'Payer agreement §4.2, Exhibit B — cardiovascular carve-out',
        confidence: 0.87,
        delta: 114.58,
        ifIgnored: 'Paid, posted, and closed at the wrong rate. This is the leak that never generates a denial to work.',
      },
    ],
  },

  dermatology: {
    id: 'D-41877',
    patient: 'S. Whitfield',
    age: 74,
    dos: '2026-07-09',
    provider: 'A. Rowe, MD',
    payer: 'UnitedHealthcare',
    plan: 'Choice Plus',
    setting: 'Office / Mohs suite (place of service 11)',
    baseAllowed: 1486.3,
    submitted: [
      { code: '17000', kind: 'CPT', desc: 'Destruction, premalignant lesion, first lesion', units: 1 },
      { code: '17003', kind: 'CPT', desc: 'Destruction, premalignant lesion, 2nd through 14th', units: 11 },
      { code: '17311', kind: 'CPT', desc: 'Mohs micrographic surgery, head/neck, first stage', units: 1 },
      { code: '11102', kind: 'CPT', desc: 'Tangential biopsy of skin, single lesion', units: 1 },
      { code: 'D48.5', kind: 'ICD-10', desc: 'Neoplasm of uncertain behavior of skin' },
    ],
    note: [
      {
        label: 'Procedure — actinic keratoses',
        body: 'Cryotherapy with liquid nitrogen applied to 17 discrete actinic keratoses distributed across the scalp, forehead and dorsal forearms. Each lesion treated with a double freeze-thaw cycle.',
      },
      {
        label: 'Procedure — Mohs',
        body: 'Biopsy-proven lesion of the left nasal ala. Mohs micrographic surgery performed. Stage I taken; margins clear on frozen section review. No additional stages required. Defect measured 1.8 cm.',
      },
      {
        label: 'Repair',
        body: 'The 1.8 cm nasal ala defect was closed with a layered intermediate repair, including deep dermal sutures to reapproximate the subcutaneous layer, followed by cutaneous closure.',
      },
      {
        label: 'Pathology addendum (received 2026-07-11)',
        body: 'Left nasal ala, Mohs stage I: basal cell carcinoma, nodular type, margins free of tumor. Final diagnosis basal cell carcinoma of skin of nose.',
      },
    ],
    findings: [
      {
        id: 'derm-1',
        needs: ['note','claim'],
        severity: 'revenue',
        action: 'Replace 17000 + 17003 ×11 with 17004',
        detail:
          'The note documents 17 lesions. 17004 is reported when 15 or more premalignant lesions are destroyed, and it replaces the 17000/17003 pair outright rather than supplementing it. The coder billed 12 lesions against a note that supports 17.',
        citation: 'CPT 2026, 17004 code descriptor and parenthetical',
        confidence: 0.97,
        delta: 88.4,
        evidence: '17 discrete actinic keratoses',
        ifIgnored: 'Underpaid on every high-count AK session — a per-visit leak, repeated across the whole panel.',
      },
      {
        id: 'derm-2',
        needs: ['note','claim','policy'],
        severity: 'blocker',
        action: 'Change D48.5 to C44.311',
        detail:
          'The pathology addendum returned two days after the note and confirms basal cell carcinoma. Mohs is not covered for a lesion of uncertain behavior; the payer’s policy requires a confirmed malignancy on the claim.',
        citation: 'UHC Medical Policy — Mohs Micrographic Surgery, §Coverage Rationale',
        confidence: 0.95,
        delta: 0,
        evidence: 'Final diagnosis basal cell carcinoma of skin of nose.',
        ifIgnored: 'CO-50 on the entire Mohs line. This is the single most common derm denial and it is caused by a two-day timing gap between two systems.',
      },
      {
        id: 'derm-3',
        needs: ['note','claim','policy'],
        severity: 'compliance',
        action: 'Remove 11102 — biopsy is not separately reportable',
        detail:
          'The biopsy establishing the diagnosis was performed at a prior encounter; the note describes the lesion as already biopsy-proven. Reporting a biopsy on the Mohs date for the same lesion is an NCCI column-2 conflict with no supporting documentation for a modifier.',
        citation: 'CMS NCCI PTP edits, 17311/11102, modifier indicator 1',
        confidence: 0.92,
        delta: -64.2,
        evidence: 'Biopsy-proven lesion of the left nasal ala.',
        ifIgnored: 'Paid, then recouped, and it contributes to an overcoding pattern that draws a payer audit of the whole Mohs panel.',
      },
      {
        id: 'derm-4',
        needs: ['note','claim','policy'],
        severity: 'revenue',
        action: 'Add 12051 — intermediate repair is separately payable with Mohs',
        detail:
          'Mohs includes simple closure but not intermediate or complex repair. The note documents a layered closure with deep dermal sutures on a 1.8 cm facial defect, which meets the intermediate definition and was never coded.',
        citation: 'CPT 2026, Mohs guidelines; CMS NCCI Ch. 3 §E',
        confidence: 0.9,
        delta: 231.75,
        evidence: 'closed with a layered intermediate repair, including deep dermal sutures',
        ifIgnored: 'A fully documented, fully payable service is simply never billed. Nothing denies, because nothing was submitted.',
      },
    ],
  },

  ophthalmology: {
    id: 'O-77219',
    patient: 'M. Okafor',
    age: 81,
    dos: '2026-07-16',
    provider: 'J. Lin, MD',
    payer: 'Medicare Part B',
    plan: 'Traditional FFS',
    setting: 'Retina injection suite (place of service 11)',
    baseAllowed: 1168.4,
    submitted: [
      { code: '67028', kind: 'CPT', desc: 'Intravitreal injection of pharmacologic agent', units: 1 },
      { code: 'J0178', kind: 'HCPCS', desc: 'Aflibercept injection, 1 mg', units: 1 },
      { code: 'H35.3211', kind: 'ICD-10', desc: 'Exudative AMD, right eye, with active choroidal neovascularization' },
    ],
    note: [
      {
        label: 'Assessment',
        body: 'Neovascular age-related macular degeneration, right eye, with persistent subretinal fluid on OCT. Left eye stable, no treatment indicated today.',
      },
      {
        label: 'Prior therapy',
        body: 'Patient completed three monthly injections of bevacizumab between February and April 2026 with inadequate anatomic response; subretinal fluid persisted at each visit. Switched to aflibercept in May 2026 per treat-and-extend protocol.',
      },
      {
        label: 'Procedure',
        body: 'After topical anesthesia and betadine prep, aflibercept 2 mg in 0.05 mL was injected into the vitreous cavity of the right eye through the pars plana. Single-dose prefilled syringe used in its entirety; no drug discarded.',
      },
    ],
    findings: [
      {
        id: 'oph-1',
        needs: ['note','claim'],
        severity: 'revenue',
        action: 'Change J0178 units from 1 to 2',
        detail:
          'J0178 is defined per 1 mg. The note documents a 2 mg dose, which is 2 billable units. A single-unit claim pays half the drug cost and the practice absorbs the difference silently.',
        citation: 'HCPCS Level II J0178 descriptor; CMS Part B Drug ASP file, Q3 2026',
        confidence: 0.98,
        delta: 1042.6,
        evidence: 'aflibercept 2 mg in 0.05 mL was injected',
        ifIgnored: 'The single largest per-claim leak in retina. It never denies — it simply pays less than the drug cost the practice already paid for.',
      },
      {
        id: 'oph-2',
        needs: ['note','claim','policy'],
        severity: 'blocker',
        action: 'Append modifier RT to 67028 and JZ to J0178',
        detail:
          'Laterality is required on 67028. Separately, CMS requires JZ on single-dose containers when no drug is discarded — an unmodified single-dose drug line is rejected at the front end without ever reaching adjudication.',
        citation: 'CMS Change Request 13270 (JW/JZ modifier policy), effective 2023-07-01',
        confidence: 0.97,
        delta: 0,
        evidence: 'Single-dose prefilled syringe used in its entirety; no drug discarded.',
        ifIgnored: 'Front-end rejection. It never becomes a denial you can appeal, so it never appears in denial reporting at all.',
      },
      {
        id: 'oph-3',
        needs: ['note','claim','policy'],
        severity: 'info',
        action: 'Step therapy satisfied — attach prior therapy documentation',
        detail:
          'Coverage for aflibercept is conditioned on a documented trial of bevacizumab. The note establishes three prior injections with inadequate response. Attaching this proactively pre-empts the medical necessity review rather than answering it eight weeks later.',
        citation: 'LCD L34426 — Ophthalmology: posterior segment injections',
        confidence: 0.93,
        delta: 0,
        evidence: 'three monthly injections of bevacizumab between February and April 2026 with inadequate anatomic response',
        ifIgnored: 'CO-50 with a records request, 45 days of float, and a nurse spending an hour assembling a chart that was already complete.',
      },
      {
        id: 'oph-4',
        needs: ['note','claim'],
        severity: 'compliance',
        action: 'Confirm 67028 is not billed bilaterally',
        detail:
          'The note explicitly states the left eye was not treated. Bilateral billing of intravitreal injections is a known audit target, and the unilateral documentation here is the defence — flagged so the pattern is recorded, not corrected.',
        citation: 'OIG Work Plan, ophthalmology injection services',
        confidence: 0.88,
        delta: 0,
        evidence: 'Left eye stable, no treatment indicated today.',
        ifIgnored: 'Nothing on this claim. It matters as a population statistic when the payer runs its bilateral-billing outlier report.',
      },
    ],
  },

  orthopedics: {
    id: 'R-58402',
    patient: 'D. Petrov',
    age: 54,
    dos: '2026-07-11',
    provider: 'H. Sandoval, MD',
    payer: 'BCBS (state plan)',
    plan: 'PPO',
    setting: 'Ambulatory surgery center (place of service 24)',
    baseAllowed: 1642.8,
    submitted: [
      { code: '29881', kind: 'CPT', desc: 'Knee arthroscopy with meniscectomy, medial OR lateral', units: 2 },
      { code: '99213', kind: 'CPT', desc: 'Office visit, established patient, low complexity', units: 1 },
      { code: 'M23.221', kind: 'ICD-10', desc: 'Derangement of posterior horn of medial meniscus, right knee' },
    ],
    note: [
      {
        label: 'Operative note',
        body: 'Diagnostic arthroscopy of the right knee. Complex tear of the posterior horn of the medial meniscus identified and debrided to a stable rim. Attention turned to the lateral compartment, where a separate radial tear of the lateral meniscus was also identified and partially resected. Both medial and lateral meniscectomies performed in the same operative session.',
      },
      {
        label: 'Global period',
        body: 'Right knee arthroscopy 29881 carries a 90-day global period beginning 2026-07-11.',
      },
      {
        label: 'Office visit — 2026-07-29',
        body: 'Patient returns 18 days post-operatively for evaluation of new-onset left shoulder pain following a fall at home. Examination of the left shoulder performed. This visit is unrelated to the right knee procedure and addresses a distinct anatomic site.',
      },
    ],
    findings: [
      {
        id: 'ortho-1',
        needs: ['note','claim','policy'],
        severity: 'compliance',
        action: 'Replace 29881 ×2 with a single 29880',
        detail:
          'When both the medial and lateral menisci are resected in one session, 29880 is the single correct code. Reporting 29881 twice is a unit error the payer reads as duplicate billing, and it exceeds the MUE of 1 for that code.',
        citation: 'CPT 2026, 29880 descriptor; CMS MUE table, 29881 = 1',
        confidence: 0.96,
        delta: -318.4,
        evidence: 'Both medial and lateral meniscectomies performed in the same operative session.',
        ifIgnored: 'The second unit denies on MUE, and the practice keeps less than 29880 alone would have paid. Wrong in both directions at once.',
      },
      {
        id: 'ortho-2',
        needs: ['note','claim','policy'],
        severity: 'blocker',
        action: 'Append modifier 24 to 99213',
        detail:
          'The visit falls on day 18 of a 90-day global period. It is documented as an unrelated problem at a distinct anatomic site, which is exactly what modifier 24 exists to declare. Without it, the payer bundles the visit into the surgical global by default.',
        citation: 'CMS Global Surgery Booklet; CPT Appendix A, modifier 24',
        confidence: 0.95,
        delta: 118.9,
        evidence: 'This visit is unrelated to the right knee procedure and addresses a distinct anatomic site.',
        ifIgnored: 'CO-97, bundled. The most-appealed and most-winnable denial in orthopedics, and the cheapest one to have prevented.',
      },
      {
        id: 'ortho-3',
        needs: ['note','claim'],
        severity: 'revenue',
        action: 'Add M23.241 as a secondary diagnosis',
        detail:
          'Only the medial meniscus diagnosis was coded. The lateral tear that justifies the bilateral-compartment code has no diagnosis on the claim, so the corrected 29880 would be submitted without support.',
        citation: 'ICD-10-CM Official Guidelines, Section I.B.4',
        confidence: 0.93,
        delta: 0,
        evidence: 'a separate radial tear of the lateral meniscus was also identified and partially resected',
        ifIgnored: 'Fixing the CPT alone creates a new CO-11. Corrections that ignore the diagnosis just move the denial.',
      },
      {
        id: 'ortho-4',
        needs: ['claim','contract'],
        severity: 'info',
        action: 'ASC facility claim not yet reconciled',
        detail:
          'The professional claim is ready but the matching ASC facility claim has not posted. Contract §6.1 pays the facility component on a grouper rate that depends on the final CPT — so correcting 29881 to 29880 changes the facility payment too.',
        citation: 'Payer agreement §6.1 — ASC grouper schedule',
        confidence: 0.85,
        delta: 0,
        ifIgnored: 'Two claims for one surgery drift out of agreement, and the facility side is corrected by nobody because nobody can see both.',
      },
    ],
  },

  gastroenterology: {
    id: 'G-33150',
    patient: 'L. Ferreira',
    age: 58,
    dos: '2026-07-08',
    provider: 'P. Nakamura, MD',
    payer: 'Cigna',
    plan: 'Open Access Plus',
    setting: 'Endoscopy suite (place of service 24)',
    baseAllowed: 692.8,
    submitted: [
      { code: '45385', kind: 'CPT', desc: 'Colonoscopy with lesion removal by snare technique', units: 1 },
      { code: '45380', kind: 'CPT', desc: 'Colonoscopy with biopsy, single or multiple', units: 1 },
      { code: 'D12.2', kind: 'ICD-10', desc: 'Benign neoplasm of ascending colon' },
      { code: 'Z12.11', kind: 'ICD-10', desc: 'Encounter for screening for malignant neoplasm of colon' },
    ],
    note: [
      {
        label: 'Indication',
        body: 'Average-risk screening colonoscopy. Patient is 58 years old, asymptomatic, no personal or family history of colorectal neoplasia. Scheduled as a routine preventive screening examination.',
      },
      {
        label: 'Procedure',
        body: 'Colonoscope advanced to the cecum. A single 8 mm sessile polyp was identified in the ascending colon and removed in its entirety by hot snare polypectomy. No other lesions identified. No separate biopsy was taken; the snare specimen was sent for pathology.',
      },
      {
        label: 'Assessment',
        body: 'Screening examination converted to therapeutic by the removal of a single polyp. Repeat surveillance in 5 years pending pathology.',
      },
    ],
    findings: [
      {
        id: 'gi-1',
        needs: ['note','claim','policy'],
        severity: 'blocker',
        action: 'Append modifier 33 to 45385',
        detail:
          'A screening exam that becomes therapeutic retains its preventive status. Modifier 33 tells a commercial payer to waive patient cost-sharing. Without it the patient receives a bill for a screening the ACA requires be free, and the practice absorbs the complaint and the write-off.',
        citation: 'ACA §2713 preventive services; CPT Appendix A, modifier 33',
        confidence: 0.96,
        delta: 0,
        evidence: 'Screening examination converted to therapeutic by the removal of a single polyp.',
        ifIgnored: 'Patient is balance-billed roughly $340 for a free screening. The revenue arrives and then leaves again as a courtesy adjustment.',
      },
      {
        id: 'gi-2',
        needs: ['note','claim','policy'],
        severity: 'compliance',
        action: 'Remove 45380 — no biopsy was performed',
        detail:
          'The note states explicitly that no separate biopsy was taken and the snare specimen itself went to pathology. 45380 and 45385 are an NCCI pair on the same lesion regardless, but here the underlying service did not happen.',
        citation: 'CMS NCCI PTP edits, 45385/45380; CPT endoscopy guidelines',
        confidence: 0.97,
        delta: -206.5,
        evidence: 'No separate biopsy was taken; the snare specimen was sent for pathology.',
        ifIgnored: 'Billing for a service the note affirmatively denies performing. This is the finding that stops being a coding issue and starts being a compliance one.',
      },
      {
        id: 'gi-3',
        needs: ['note','claim','policy'],
        severity: 'revenue',
        action: 'Sequence Z12.11 as primary, D12.2 as secondary',
        detail:
          'Diagnosis order determines benefit application. Screening intent must lead so the preventive benefit attaches; the polyp finding is secondary. The coder led with the finding, which reclassifies the entire encounter as diagnostic.',
        citation: 'ICD-10-CM Official Guidelines, Section IV.A.1; Cigna preventive care policy',
        confidence: 0.94,
        delta: 0,
        evidence: 'Average-risk screening colonoscopy.',
        ifIgnored: 'Deductible applies to the whole encounter. Technically paid, commercially wrong, and the patient calls the practice, not the payer.',
      },
      {
        id: 'gi-4',
        needs: ['claim','policy'],
        severity: 'info',
        action: 'Anesthesia claim must move to 00812',
        detail:
          'The anesthesia line on the linked claim is coded 00811 (diagnostic). Once this encounter is established as screening-converted-to-therapeutic, the anesthesia code and its own modifier 33 have to follow, or the two claims contradict each other.',
        citation: 'CPT 00812 descriptor; CMS screening colonoscopy anesthesia policy',
        confidence: 0.86,
        delta: 0,
        ifIgnored: 'Two claims for one procedure tell the payer two different stories. The cheaper one gets believed.',
      },
    ],
  },

  behavioral: {
    id: 'B-20988',
    patient: 'T. Brennan',
    age: 34,
    dos: '2026-07-21',
    provider: 'C. Adeyemi, LCSW',
    payer: 'Medicare Advantage',
    plan: 'HMO',
    setting: 'Telehealth, patient at home',
    baseAllowed: 152.6,
    submitted: [
      { code: '90837', kind: 'CPT', desc: 'Psychotherapy, 60 minutes with patient', units: 1 },
      { code: 'F33.1', kind: 'ICD-10', desc: 'Major depressive disorder, recurrent, moderate' },
    ],
    note: [
      {
        label: 'Session',
        body: 'Individual psychotherapy conducted via secure video with the patient in their home. Total face-to-face time 50 minutes, from 14:05 to 14:55.',
      },
      {
        label: 'History',
        body: 'Patient presents with a first lifetime episode of major depressive symptoms, moderate severity, onset approximately four months ago. No prior depressive episodes documented by history or in the record.',
      },
      {
        label: 'Content',
        body: 'Cognitive behavioural techniques applied to rumination and avoidance. The patient’s partner joined for the final 12 minutes at the patient’s request to support behavioural activation planning at home, which required managing conflicting accounts of the week and adapting the session structure.',
      },
      {
        label: 'Claim header',
        body: 'Place of service submitted as 02 (telehealth provided other than in patient home). Modifier 95 appended.',
      },
    ],
    findings: [
      {
        id: 'bh-1',
        needs: ['note','claim'],
        severity: 'compliance',
        action: 'Downcode 90837 to 90834',
        detail:
          'Documented face-to-face time is 50 minutes. 90837 requires 53 minutes or more; 90834 covers 38 to 52. This is the highest-frequency behavioural health audit target in the country, and the note does not support the code billed.',
        citation: 'CPT 2026 psychotherapy time rules; CMS time-based service guidance',
        confidence: 0.97,
        delta: -37.2,
        evidence: 'Total face-to-face time 50 minutes, from 14:05 to 14:55.',
        ifIgnored: 'Paid now, extrapolated later. A 90837 outlier rate is what triggers the audit that reviews 200 charts, not this one.',
      },
      {
        id: 'bh-2',
        needs: ['note','claim','contract'],
        severity: 'revenue',
        action: 'Change place of service from 02 to 10',
        detail:
          'The patient was at home. POS 10 pays the non-facility rate; POS 02 pays the facility rate, roughly $28 less per session. Nothing denies — the claim simply pays less, every session, for every telehealth patient on the panel.',
        citation: 'CMS POS 10 (telehealth in patient home), effective 2022; MPFS site-of-service differential',
        confidence: 0.95,
        delta: 28.4,
        evidence: 'via secure video with the patient in their home',
        ifIgnored: 'A silent per-session haircut. At this practice’s telehealth volume it is the largest single line item in the leakage report.',
      },
      {
        id: 'bh-3',
        needs: ['note','claim'],
        severity: 'revenue',
        action: 'Add +90785 interactive complexity',
        detail:
          'The add-on applies when a third party participates and complicates delivery. The note documents the partner joining and conflicting accounts requiring the session to be restructured — both stated criteria, neither coded.',
        citation: 'CPT 90785 descriptor and inclusion criteria',
        confidence: 0.88,
        delta: 21.6,
        evidence: 'which required managing conflicting accounts of the week and adapting the session structure',
        ifIgnored: 'A documented, payable add-on that is left on the table because nobody reads a narrative note looking for it.',
      },
      {
        id: 'bh-4',
        needs: ['note','claim'],
        severity: 'blocker',
        action: 'Change F33.1 to F32.1',
        detail:
          'F33 is the recurrent-episode family. The history documents a first lifetime episode with no prior episodes, which is F32. The distinction affects both medical necessity review and the risk-adjustment data this plan receives.',
        citation: 'ICD-10-CM Official Guidelines, Chapter 5 (F01–F99)',
        confidence: 0.93,
        delta: 0,
        evidence: 'first lifetime episode of major depressive symptoms',
        ifIgnored: 'CO-11 exposure now, and an unsupported chronic condition flowing into a Medicare Advantage risk score — a materially worse problem than the denial.',
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Denials — the Appeal Engine worklist
// ---------------------------------------------------------------------------

export const DENIALS: Record<SpecialtyId, Denial[]> = {
  cardiology: [
    { claim: 'CL-88214', patient: 'R. Alvarez', dos: '2026-05-02', payer: 'Aetna', carc: 'CO-197', rarc: 'N54', reason: 'Precertification absent for device implant', billed: 14_820, winRate: 0.78, rootCause: 'Auth obtained for 33208 but the implant was upgraded intra-operatively to a CRT device (33249). The auth on file does not name the device actually placed.', argument: 'Retroactive authorization is permitted under the plan when the change is clinically indicated intra-operatively and documented in the operative note. The note records the conduction abnormality that necessitated the upgrade.', citation: 'Aetna Provider Manual §7.3 — retro-authorization for intra-operative changes', age: 34, stage: 'drafted' },
    { claim: 'CL-88031', patient: 'W. Osei', dos: '2026-04-28', payer: 'UnitedHealthcare', carc: 'CO-50', reason: 'Cardiac CT not medically necessary', billed: 1_240, winRate: 0.71, rootCause: 'Appropriate-use criteria documentation not attached at submission; the indication supporting the study lives in the referring cardiologist note, not the imaging order.', argument: 'Documented intermediate pre-test probability with equivocal stress testing satisfies the coverage criteria; the supporting consult note is attached.', citation: 'LCD L33559 — cardiac computed tomography', age: 41, stage: 'filed' },
    { claim: 'CL-87766', patient: 'F. Delgado', dos: '2026-04-19', payer: 'Cigna', carc: 'CO-97', reason: 'Bundled into primary procedure', billed: 892, winRate: 0.64, rootCause: 'FFR add-on 93571 bundled into the base cath. The vessel interrogated was distinct from the vessel angiographically assessed.', argument: 'Modifier XS is supported; the FFR was performed on a separate structure, which the NCCI edit permits.', citation: 'CMS NCCI PTP modifier indicator 1; CPT Assistant Jan 2014', age: 55, stage: 'overturned' },
    { claim: 'CL-87502', patient: 'N. Haddad', dos: '2026-03-30', payer: 'Medicare Part B', carc: 'CO-16', rarc: 'M76', reason: 'Missing or invalid diagnosis', billed: 468, winRate: 0.89, rootCause: 'Diagnosis pointer on line 2 references a diagnosis that was removed during a pre-submission edit, leaving the line unlinked.', argument: 'Corrected claim with the diagnosis restored and pointers rebuilt. No clinical dispute exists.', citation: 'X12 837P diagnosis pointer requirements', age: 62, stage: 'queued' },
  ],
  dermatology: [
    { claim: 'CL-91043', patient: 'S. Whitfield', dos: '2026-05-14', payer: 'UnitedHealthcare', carc: 'CO-50', reason: 'Mohs not medically necessary', billed: 3_180, winRate: 0.83, rootCause: 'Claim carried D48.5 (uncertain behavior) because it was submitted before the pathology addendum returned. The lesion was a confirmed BCC on the nose.', argument: 'Pathology confirms basal cell carcinoma at a high-risk anatomic site (nasal ala), which meets the policy criteria for Mohs on its face.', citation: 'UHC Medical Policy — Mohs Micrographic Surgery, §Coverage Rationale', age: 22, stage: 'drafted' },
    { claim: 'CL-90887', patient: 'E. Vasquez', dos: '2026-05-09', payer: 'Aetna', carc: 'CO-151', reason: 'Frequency exceeds payer limit', billed: 640, winRate: 0.58, rootCause: 'Fourth AK destruction session within twelve months exceeded the plan frequency cap.', argument: 'Field cancerization with documented new lesion counts at each session; the cap contemplates repeat treatment of the same lesions, not new ones.', citation: 'Aetna CPB 0567 §II', age: 47, stage: 'filed' },
    { claim: 'CL-90551', patient: 'K. Brandt', dos: '2026-04-22', payer: 'BCBS (state plan)', carc: 'CO-11', reason: 'Diagnosis inconsistent with procedure', billed: 412, winRate: 0.86, rootCause: 'Excision coded to the malignant family with a benign diagnosis on the claim; the path report supports the benign code and the lower-valued CPT.', argument: 'Corrected claim submitted with the matching benign excision code. The practice is voluntarily reducing the charge.', citation: 'CPT excision guidelines; ICD-10-CM Section I.A.19', age: 66, stage: 'overturned' },
  ],
  ophthalmology: [
    { claim: 'CL-77410', patient: 'M. Okafor', dos: '2026-05-21', payer: 'Medicare Part B', carc: 'CO-50', reason: 'Anti-VEGF agent not medically necessary', billed: 2_090, winRate: 0.81, rootCause: 'Step therapy documentation for the prior bevacizumab trial was in the chart but never attached to the claim.', argument: 'Three documented bevacizumab injections with persistent subretinal fluid on OCT satisfy the step requirement; OCT images attached.', citation: 'LCD L34426 — posterior segment injections', age: 29, stage: 'drafted' },
    { claim: 'CL-77188', patient: 'G. Ionescu', dos: '2026-05-06', payer: 'Medicare Advantage', carc: 'CO-4', reason: 'Modifier inconsistent with procedure', billed: 186, winRate: 0.92, rootCause: 'JZ modifier omitted on a single-dose drug line. A pure front-end formatting failure with no clinical content.', argument: 'Corrected claim with JZ appended. No discarded drug; the vial was used in its entirety.', citation: 'CMS CR 13270 — JW/JZ modifier policy', age: 38, stage: 'queued' },
    { claim: 'CL-76954', patient: 'A. Duval', dos: '2026-04-30', payer: 'Cigna', carc: 'CO-97', reason: 'Imaging bundled with injection', billed: 74, winRate: 0.49, rootCause: 'OCT performed the same day as the injection. Payer applies a same-day bundling edit that CPT does not require.', argument: 'The OCT was diagnostic and informed the decision to inject; it is separately identifiable and modifier 59 is supported.', citation: 'CPT 92134 guidelines; NCCI modifier indicator 1', age: 71, stage: 'upheld' },
  ],
  orthopedics: [
    { claim: 'CL-58899', patient: 'D. Petrov', dos: '2026-05-18', payer: 'BCBS (state plan)', carc: 'CO-97', reason: 'E/M bundled into global period', billed: 142, winRate: 0.88, rootCause: 'Modifier 24 omitted on an unrelated visit during a 90-day global. The note documents a different anatomic site entirely.', argument: 'The encounter addressed a new left shoulder injury unrelated to the right knee surgery; modifier 24 applies on the documentation as written.', citation: 'CMS Global Surgery Booklet; CPT Appendix A', age: 26, stage: 'drafted' },
    { claim: 'CL-58604', patient: 'J. Whitaker', dos: '2026-05-03', payer: 'UnitedHealthcare', carc: 'CO-197', reason: 'Authorization not on file for arthroscopy', billed: 4_760, winRate: 0.73, rootCause: 'Auth issued for the left knee; surgery performed on the right after imaging was re-read. Laterality mismatch between auth and claim.', argument: 'Corrected authorization request with the updated MRI read attached; the clinical indication is unchanged and the payer approved the identical procedure.', citation: 'UHC Prior Authorization Requirements, 2026 §Musculoskeletal', age: 44, stage: 'filed' },
    { claim: 'CL-58217', patient: 'R. Nkemelu', dos: '2026-04-11', payer: 'Aetna', carc: 'CO-B15', reason: 'Required prior service not paid', billed: 2_310, winRate: 0.67, rootCause: 'Conservative-therapy prerequisite not evidenced. Six weeks of physical therapy were completed at an outside facility whose records were never obtained.', argument: 'Outside PT records obtained and attached, documenting twelve sessions across seven weeks without functional improvement.', citation: 'Aetna CPB 0673 §III — knee arthroscopy', age: 58, stage: 'queued' },
  ],
  gastroenterology: [
    { claim: 'CL-33701', patient: 'L. Ferreira', dos: '2026-05-12', payer: 'Cigna', carc: 'CO-16', rarc: 'N657', reason: 'Missing modifier — preventive status', billed: 1_140, winRate: 0.91, rootCause: 'Modifier 33 omitted on a screening colonoscopy converted to therapeutic. Cost-share was applied to a service the ACA requires be free.', argument: 'The encounter was scheduled and documented as average-risk screening; preventive status survives polyp removal by statute.', citation: 'ACA §2713; CMS screening colonoscopy policy', age: 31, stage: 'drafted' },
    { claim: 'CL-33488', patient: 'B. Achebe', dos: '2026-04-25', payer: 'Medicare Part B', carc: 'CO-151', reason: 'Frequency limit — screening interval', billed: 890, winRate: 0.76, rootCause: 'Ten-year screening interval applied, but the patient is high-risk with a first-degree family history, which shortens the covered interval to two years.', argument: 'Family history of colorectal carcinoma in a first-degree relative is documented in the intake record; the high-risk interval applies.', citation: 'CMS NCD 210.3 — colorectal cancer screening', age: 52, stage: 'filed' },
    { claim: 'CL-33102', patient: 'H. Lindqvist', dos: '2026-04-02', payer: 'UnitedHealthcare', carc: 'CO-97', reason: 'Biopsy bundled with polypectomy', billed: 207, winRate: 0.34, rootCause: 'Biopsy and snare removal billed on the same lesion. The edit is correct — this claim should not have been submitted.', argument: 'No appeal recommended. Routing to the coding queue as a prevention finding rather than a recovery opportunity.', citation: 'CMS NCCI PTP 45385/45380', age: 78, stage: 'upheld' },
  ],
  behavioral: [
    { claim: 'CL-21455', patient: 'T. Brennan', dos: '2026-05-19', payer: 'Medicare Advantage', carc: 'CO-45', reason: 'Paid below expected rate', billed: 178, winRate: 0.84, rootCause: 'Place of service 02 submitted for a patient at home. The facility-rate differential applied to a non-facility service.', argument: 'POS 10 is correct on the documentation. Requesting reprocessing at the non-facility rate under the parity provision of the contract.', citation: 'Contract §3.4 — telehealth parity; CMS POS 10 policy', age: 27, stage: 'drafted' },
    { claim: 'CL-21290', patient: 'V. Sorensen', dos: '2026-05-07', payer: 'Medicaid MCO', carc: 'CO-197', reason: 'Authorization units exhausted', billed: 552, winRate: 0.69, rootCause: 'Authorization covered 12 sessions; session 13 delivered before the renewal request was processed.', argument: 'Continued-care criteria met with documented PHQ-9 improvement trajectory; renewal was submitted before the exhaustion date and the delay is administrative.', citation: 'State Medicaid behavioral health manual §4.2', age: 39, stage: 'filed' },
    { claim: 'CL-21044', patient: 'O. Mbeki', dos: '2026-04-16', payer: 'Aetna', carc: 'CO-11', reason: 'Diagnosis inconsistent with service', billed: 143, winRate: 0.87, rootCause: 'Recurrent-episode code billed on a first-episode presentation. The diagnosis does not match the documented history.', argument: 'Corrected claim submitted with F32.1. The practice identified this itself through pre-bill review.', citation: 'ICD-10-CM Chapter 5 guidelines', age: 61, stage: 'overturned' },
  ],
}

// ---------------------------------------------------------------------------
// Underpayments — paid claims that quietly paid wrong
// ---------------------------------------------------------------------------

export const UNDERPAYMENTS: Record<SpecialtyId, Underpayment[]> = {
  cardiology: [
    { claim: 'CL-88420', code: '93458-26', payer: 'Aetna', expected: 1_043.18, paid: 928.6, units: 148, cause: 'Cardiovascular carve-out rate not applied; paid at the contract default of 105% of Medicare instead of 118%.', contractRef: '§4.2, Exhibit B' },
    { claim: 'CL-88377', code: '93306', payer: 'UnitedHealthcare', expected: 214.5, paid: 187.2, units: 96, cause: 'Fee schedule not updated after the 2026 annual escalator took effect on 2026-01-01.', contractRef: '§2.7 — annual adjustment' },
    { claim: 'CL-88190', code: '33249', payer: 'Cigna', expected: 8_940.0, paid: 8_120.0, units: 6, cause: 'Device implant paid at the outpatient rate; the case-rate carve-out for implantable cardiac devices was not triggered.', contractRef: '§5.1 — device case rates' },
  ],
  dermatology: [
    { claim: 'CL-91120', code: '17311', payer: 'UnitedHealthcare', expected: 612.4, paid: 551.2, units: 84, cause: 'Multiple-procedure reduction applied to the Mohs primary stage, which is exempt under the contract.', contractRef: '§3.9 — MPPR exemptions' },
    { claim: 'CL-90998', code: '17004', payer: 'Medicare Part B', expected: 178.3, paid: 161.7, units: 212, cause: 'Locality adjustment applied for the wrong MAC region after the practice added a second site.', contractRef: 'MPFS locality 18' },
    { claim: 'CL-90740', code: '11602', payer: 'Aetna', expected: 246.9, paid: 198.4, units: 41, cause: 'Excision paid on lesion size before repair rather than excised diameter including margins.', contractRef: '§3.2 — surgical schedule' },
  ],
  ophthalmology: [
    { claim: 'CL-77502', code: 'J0178', payer: 'Medicare Part B', expected: 2_085.2, paid: 1_042.6, units: 318, cause: 'Billed as 1 unit for a 2 mg dose. Half the drug cost absorbed by the practice on every affected claim.', contractRef: 'ASP + 6%, Q3 2026 file' },
    { claim: 'CL-77361', code: '67028', payer: 'Medicare Advantage', expected: 118.4, paid: 96.8, units: 156, cause: 'Delegated plan paying its own schedule rather than the contractually required Medicare-equivalent floor.', contractRef: '§4.8 — MA floor' },
    { claim: 'CL-77045', code: '92134', payer: 'Cigna', expected: 46.2, paid: 41.1, units: 402, cause: 'Bilateral OCT paid at 100%/50% though the contract specifies 100%/100% for this code.', contractRef: '§3.6 — bilateral schedule' },
  ],
  orthopedics: [
    { claim: 'CL-58940', code: '29880', payer: 'BCBS (state plan)', expected: 1_204.0, paid: 1_090.5, units: 62, cause: 'ASC grouper assigned one level below the code’s assignment in the current schedule.', contractRef: '§6.1 — ASC grouper' },
    { claim: 'CL-58712', code: '27447', payer: 'UnitedHealthcare', expected: 14_820.0, paid: 13_100.0, units: 11, cause: 'Implant carve-out not paid separately; bundled into the case rate contrary to the agreement.', contractRef: '§6.4 — implant pass-through' },
    { claim: 'CL-58388', code: '99213-24', payer: 'Aetna', expected: 118.9, paid: 0, units: 74, cause: 'Bundled into the global period. Recoverable as a denial rather than an underpayment, but it surfaces in the same variance report.', contractRef: '§3.1 — E/M schedule' },
  ],
  gastroenterology: [
    { claim: 'CL-33820', code: '45385', payer: 'Cigna', expected: 486.3, paid: 421.0, units: 128, cause: 'Facility differential applied to a service rendered at the practice-owned ASC, which the contract rates separately.', contractRef: '§6.2 — site of service' },
    { claim: 'CL-33655', code: '43239', payer: 'UnitedHealthcare', expected: 392.7, paid: 351.4, units: 88, cause: 'Multiple-endoscopy rule applied to an unrelated same-day procedure in a different family.', contractRef: '§3.7 — multiple endoscopy' },
    { claim: 'CL-33290', code: '00812', payer: 'Medicare Part B', expected: 128.4, paid: 104.2, units: 174, cause: 'Anesthesia base units calculated on the diagnostic code after the encounter was corrected to screening.', contractRef: 'ASA base unit file 2026' },
  ],
  behavioral: [
    { claim: 'CL-21580', code: '90834', payer: 'Medicare Advantage', expected: 106.8, paid: 78.4, units: 1_240, cause: 'Place of service 02 instead of 10 on telehealth sessions with the patient at home.', contractRef: '§3.4 — telehealth parity' },
    { claim: 'CL-21402', code: '90791', payer: 'Medicaid MCO', expected: 184.2, paid: 152.0, units: 96, cause: 'Diagnostic evaluation paid at the follow-up rate; the initial-evaluation differential was never loaded.', contractRef: '§3.2 — evaluation rates' },
    { claim: 'CL-21188', code: '90785', payer: 'Aetna', expected: 21.6, paid: 0, units: 310, cause: 'Add-on denied as not separately payable, contrary to the fee schedule which lists it as payable with 90834.', contractRef: '§3.3 — add-on schedule' },
  ],
}

// ---------------------------------------------------------------------------
// Prior authorization
// ---------------------------------------------------------------------------

export const AUTHS: Record<SpecialtyId, AuthItem[]> = {
  cardiology: [
    { patient: 'R. Alvarez', procedure: 'Staged PCI with drug-eluting stent', code: '92928', payer: 'Aetna', scheduled: 'in 6 days', status: 'at-risk', criteria: 'FFR ≤ 0.80 or angiographic stenosis ≥ 70% required.', gap: 'FFR of 0.71 is documented in the cath note but has not been attached to the authorization request.' },
    { patient: 'W. Osei', procedure: 'Cardiac CT angiography', code: '75574', payer: 'UnitedHealthcare', scheduled: 'in 11 days', status: 'submitted', criteria: 'Intermediate pre-test probability with equivocal or non-diagnostic stress test.' },
    { patient: 'N. Haddad', procedure: 'Diagnostic left heart catheterization', code: '93458', payer: 'Aetna', scheduled: 'in 3 days', status: 'not-required', criteria: 'Not on the 2026 precertification list for place of service 22.' },
    { patient: 'F. Delgado', procedure: 'ICD implant', code: '33249', payer: 'Cigna', scheduled: 'in 18 days', status: 'approved', criteria: 'EF ≤ 35% with documented NYHA class II–III on optimal medical therapy for 90 days.' },
  ],
  dermatology: [
    { patient: 'S. Whitfield', procedure: 'Mohs micrographic surgery', code: '17311', payer: 'UnitedHealthcare', scheduled: 'in 4 days', status: 'at-risk', criteria: 'Biopsy-confirmed malignancy at a high-risk anatomic site.', gap: 'Pathology addendum confirming BCC has returned but is not attached; the request still cites the pre-biopsy impression.' },
    { patient: 'E. Vasquez', procedure: 'Photodynamic therapy', code: '96567', payer: 'Aetna', scheduled: 'in 9 days', status: 'submitted', criteria: 'Documented failure of topical therapy across at least two prior courses.' },
    { patient: 'K. Brandt', procedure: 'Excision, benign lesion 2.1 cm', code: '11404', payer: 'BCBS (state plan)', scheduled: 'in 14 days', status: 'not-required', criteria: 'Benign excision below the plan threshold for precertification.' },
  ],
  ophthalmology: [
    { patient: 'M. Okafor', procedure: 'Aflibercept intravitreal injection', code: 'J0178', payer: 'Medicare Part B', scheduled: 'in 2 days', status: 'approved', criteria: 'Documented bevacizumab trial with inadequate anatomic response.' },
    { patient: 'G. Ionescu', procedure: 'Cataract extraction with IOL', code: '66984', payer: 'Medicare Advantage', scheduled: 'in 7 days', status: 'at-risk', criteria: 'Visual acuity 20/50 or worse, or documented functional impairment.', gap: 'Acuity recorded as 20/40 with a functional-impairment narrative that the plan’s criteria do not accept on its own.' },
    { patient: 'A. Duval', procedure: 'YAG capsulotomy', code: '66821', payer: 'Cigna', scheduled: 'in 12 days', status: 'not-required', criteria: 'Below the plan threshold for precertification.' },
  ],
  orthopedics: [
    { patient: 'J. Whitaker', procedure: 'Knee arthroscopy, right', code: '29881', payer: 'UnitedHealthcare', scheduled: 'in 5 days', status: 'at-risk', criteria: 'Six weeks of documented conservative therapy.', gap: 'Authorization on file names the left knee. Laterality mismatch will deny the claim after the surgery is performed.' },
    { patient: 'R. Nkemelu', procedure: 'Total knee arthroplasty', code: '27447', payer: 'Aetna', scheduled: 'in 21 days', status: 'submitted', criteria: 'Radiographic joint space narrowing with failed conservative management.' },
    { patient: 'D. Petrov', procedure: 'Post-operative office visit', code: '99213', payer: 'BCBS (state plan)', scheduled: 'in 1 day', status: 'not-required', criteria: 'E/M services do not require precertification under this plan.' },
  ],
  gastroenterology: [
    { patient: 'B. Achebe', procedure: 'Screening colonoscopy, high risk', code: '45378', payer: 'Medicare Part B', scheduled: 'in 8 days', status: 'not-required', criteria: 'Screening colonoscopy is a covered benefit without precertification.' },
    { patient: 'H. Lindqvist', procedure: 'Upper endoscopy with biopsy', code: '43239', payer: 'UnitedHealthcare', scheduled: 'in 6 days', status: 'at-risk', criteria: 'Documented failure of an 8-week PPI trial.', gap: 'PPI trial documented as 5 weeks in the chart, short of the policy threshold. Flagged before scheduling rather than after denial.' },
    { patient: 'L. Ferreira', procedure: 'Capsule endoscopy', code: '91110', payer: 'Cigna', scheduled: 'in 15 days', status: 'submitted', criteria: 'Prior negative EGD and colonoscopy with ongoing obscure GI bleeding.' },
  ],
  behavioral: [
    { patient: 'V. Sorensen', procedure: 'Psychotherapy, continued care', code: '90834', payer: 'Medicaid MCO', scheduled: 'in 2 days', status: 'at-risk', criteria: 'Continued-care review required every 12 sessions.', gap: 'Session 13 is scheduled and the renewal request has not been submitted. Authorization units are exhausted.' },
    { patient: 'T. Brennan', procedure: 'Psychotherapy, telehealth', code: '90834', payer: 'Medicare Advantage', scheduled: 'in 4 days', status: 'not-required', criteria: 'Outpatient psychotherapy is not subject to precertification under this plan.' },
    { patient: 'O. Mbeki', procedure: 'Intensive outpatient program', code: 'S9480', payer: 'Aetna', scheduled: 'in 10 days', status: 'submitted', criteria: 'Documented failure of standard outpatient care at a lower level of intensity.' },
  ],
}

/** Denial mix by root cause — what the Denial Intelligence view reports on. */
export const DENIAL_MIX: Record<SpecialtyId, { cause: string; share: number; preventable: number }[]> = {
  cardiology: [
    { cause: 'Prior authorization', share: 0.31, preventable: 0.86 },
    { cause: 'Medical necessity', share: 0.24, preventable: 0.72 },
    { cause: 'Bundling / NCCI', share: 0.19, preventable: 0.94 },
    { cause: 'Missing modifier', share: 0.14, preventable: 0.98 },
    { cause: 'Eligibility / demographic', share: 0.08, preventable: 0.91 },
    { cause: 'Timely filing', share: 0.04, preventable: 1.0 },
  ],
  dermatology: [
    { cause: 'Medical necessity', share: 0.34, preventable: 0.79 },
    { cause: 'Diagnosis specificity', share: 0.22, preventable: 0.95 },
    { cause: 'Frequency limits', share: 0.16, preventable: 0.61 },
    { cause: 'Bundling / NCCI', share: 0.15, preventable: 0.93 },
    { cause: 'Missing modifier', share: 0.09, preventable: 0.97 },
    { cause: 'Timely filing', share: 0.04, preventable: 1.0 },
  ],
  ophthalmology: [
    { cause: 'Drug units / J-code', share: 0.28, preventable: 0.99 },
    { cause: 'Medical necessity / step therapy', share: 0.25, preventable: 0.83 },
    { cause: 'Missing modifier', share: 0.21, preventable: 0.98 },
    { cause: 'Bundling / NCCI', share: 0.13, preventable: 0.88 },
    { cause: 'Frequency limits', share: 0.09, preventable: 0.66 },
    { cause: 'Timely filing', share: 0.04, preventable: 1.0 },
  ],
  orthopedics: [
    { cause: 'Global period / modifier 24-25-79', share: 0.29, preventable: 0.96 },
    { cause: 'Prior authorization', share: 0.26, preventable: 0.84 },
    { cause: 'Conservative therapy not evidenced', share: 0.18, preventable: 0.74 },
    { cause: 'Bundling / NCCI', share: 0.15, preventable: 0.92 },
    { cause: 'Implant / device documentation', share: 0.08, preventable: 0.87 },
    { cause: 'Timely filing', share: 0.04, preventable: 1.0 },
  ],
  gastroenterology: [
    { cause: 'Screening vs diagnostic', share: 0.33, preventable: 0.97 },
    { cause: 'Frequency / interval limits', share: 0.21, preventable: 0.7 },
    { cause: 'Bundling / NCCI', share: 0.19, preventable: 0.93 },
    { cause: 'Medical necessity', share: 0.15, preventable: 0.76 },
    { cause: 'Anesthesia claim mismatch', share: 0.08, preventable: 0.95 },
    { cause: 'Timely filing', share: 0.04, preventable: 1.0 },
  ],
  behavioral: [
    { cause: 'Authorization units exhausted', share: 0.3, preventable: 0.89 },
    { cause: 'Time threshold not documented', share: 0.24, preventable: 0.96 },
    { cause: 'Place of service / telehealth', share: 0.2, preventable: 0.99 },
    { cause: 'Diagnosis specificity', share: 0.14, preventable: 0.94 },
    { cause: 'Credentialing / roster', share: 0.08, preventable: 0.68 },
    { cause: 'Timely filing', share: 0.04, preventable: 1.0 },
  ],
}
