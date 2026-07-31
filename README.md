# AI revenue integrity — product teardown

Interactive React prototypes of an **AI revenue integrity** product line for specialty physician
practices — the model where clinical documentation, coding, payer policy and contract terms are
joined in one system so that claims are audited *before* submission, denials are appealed with
citations, and payments are checked against the rate they were supposed to pay.

**Live:** https://hexiao0225.github.io/rcm-product-prototypes/

> A personal study project, built to understand [Ember](https://www.embercopilot.ai/)'s product
> line ahead of a conversation. Not affiliated with or endorsed by Ember. Patients, claims, dollar
> amounts and contract sections are invented; the clinical scenarios are composites, not records.
> The coding rules cited are real, but this is a teardown, not a coding reference — do not bill
> from it.

## The idea being studied

Revenue cycle management is normally sold as labour arbitrage: the same work, done cheaper.
Revenue *integrity* is a different claim — that most of the loss is not a staffing problem, because
nobody was ever in a position to catch it.

Four documents decide whether a claim is right: the clinical note, the coded claim, the payer's
policy as of the date of service, and the contract. They live in four systems, owned by four teams,
and one of them is owned by nobody. A coder cannot see the policy version. The A/R team cannot see
the contract rate. Everyone does their job correctly and the claim still goes out wrong.

That is why the product is three engines rather than one model. The audit is the visible part; the
data join underneath it is what makes the audit possible.

## The prototypes

| View | What it demonstrates |
| --- | --- |
| **Overview** | The revenue-integrity thesis, the three engines, and where a dollar leaks along the claim lifecycle |
| **Data Engine** | The four-way join. Disconnect an input and watch findings become unreachable — the best place to start |
| **Coding Engine** | The headline prototype: a pre-bill audit with note-grounded findings and a movable auto-apply threshold |
| **Appeal Engine** | Denial worklist, root-cause resolution, a drafted appeal with citations, and the economics deciding what gets filed |
| **Underpayments** | Claims that paid — just not what the contract says. Variance detection against the rate sheet |
| **Prior auth** | Requirement detection and criteria gaps caught before the procedure rather than after the denial |
| **Denial intelligence** | The RCM leader's view: root-cause mix, preventable share, provider and payer outliers |
| **ROI model** | The published claims as an interactive model — which input is actually carrying them |
| **Under the hood** | How the coding engine would have to be built: retrieval, deterministic verification, calibration, evals, audit trail |
| **Integration** | FHIR resources, EHR connectors, the three-day onboarding claim, and the security posture that gates it |

### Start with the Coding Engine

Every finding carries two things a coding suggestion is worthless without: a **citation** to the
authority it rests on, and the **verbatim span from the chart** that produced it. Select a finding
and the sentence lights up in the note beside it. If a coder disagrees, they are arguing with a
sentence in the record rather than with a model — which is the only version of this workflow that
survives an audit.

The **auto-apply threshold** is the one control that matters. Drag it left and the queue empties,
but the practice inherits the model's mistakes. Drag it right and you have rebuilt the coding
department you were replacing. This is why calibration, not raw accuracy, is the number worth
asking about: a model that is 98% accurate is not 98% useful unless it knows *which* 2% it is
wrong about.

Note also that the net correction moves in **both directions**. Several findings take money *off*
the claim. A tool that only ever adds codes is not an audit — it is an upcoding engine with a
compliance problem attached, and the practice carries that liability, not the vendor.

### The specialty switcher

Seven of the ten views carry a specialty switcher across cardiology, dermatology, ophthalmology,
orthopedics, gastroenterology and behavioral health. It is deliberately **not** a theme: switching
swaps the clinical scenario, the CPT and ICD-10 sets, the payer policies, the denial mix, the
underpayment patterns and the appeal arguments underneath the entire prototype.

That is the structural bet worth testing. A horizontal coding model scoring 98% on a mixed corpus
can still be wrong on the eight codes that carry a retina practice's margin — because those eight
codes are a rounding error in the corpus and the entire business at the practice.

## Modelling notes

- **Coding Engine** — findings are typed as blocker, revenue, compliance or confirmed, and each
  declares which of the four data sources it cannot be made without. The Data Engine view uses
  those declarations to show what a documentation-only or claims-only product is structurally blind
  to.
- **Appeal Engine** — the drafted letter is the easy part. The model is the four inputs above it:
  which policy version applied on the date of service, what the contract says, what the chart
  supports, and whether the denial is winnable at all. Automating drafting does not raise the win
  rate; it lowers the cost of filing, which changes *which* denials are worth filing.
- **ROI model** — the published claims are 57% fewer denials, 3.3x ROI in month one, and +9.3% net
  revenue per appointment. The model exposes that the load-bearing input is none of those: it is
  the **share of denials never worked today**. Set it to zero and the headline collapses. Meanwhile
  underpayment recovery and undercoding correction scale with gross revenue rather than the denial
  rate, and contribute most of the lift at realistic settings.
- **Under the hood** — five of the nine pipeline stages are deterministic. Edit tables, date
  arithmetic and unit limits belong in code, not in a model output. The open question this view
  builds toward is ground truth: two credentialed coders agree roughly 75% of the time, a paid
  claim is not a correct claim, and a denied claim is not an incorrect one.

## Running it

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # tsc, strict
npm run lint       # eslint
npm run build      # production build
npm run smoke      # SSR-renders every view x specialty to catch render crashes
```

`npm run smoke` renders all 46 view/specialty combinations to a string and fails on any crash —
cheap insurance for a static site with no other test surface.

## Stack

React 18 + TypeScript (strict) + Vite. No UI framework; the design system is hand-written CSS
custom properties, which is what makes the specialty switcher a one-line variable swap.

Deployed from `main` by GitHub Actions.

## Sources

Reconstructed from public material, July 2026 — [embercopilot.ai](https://www.embercopilot.ai/),
its [cardiology page](https://www.embercopilot.ai/specialties/cardiology) and
[knowledge base](https://www.embercopilot.ai/knowledge),
[Y Combinator](https://www.ycombinator.com/companies/ember), and the seed announcement. Coding
rules are drawn from the CMS NCCI policy manual, the CPT 2026 descriptors, and published payer
medical policy.
