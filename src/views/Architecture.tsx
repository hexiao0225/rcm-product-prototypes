import { useState } from 'react'
import { Callout, Card, CardHead, Code, KV, Pill, SectionHead, Stat, Table } from '../components/ui'

/**
 * The engineering view. Everything above this file is what the product does;
 * this is an argument about what it has to be built out of, and where it breaks.
 */
type Stage = {
  id: string
  name: string
  summary: string
  detail: string
  deterministic: boolean
  failure: string
}

const PIPELINE: Stage[] = [
  {
    id: 'ingest',
    name: 'Ingest & normalise',
    summary: 'FHIR resources and claim files in, one canonical encounter out.',
    detail:
      'Encounter, DocumentReference, DiagnosticReport, Procedure and Claim resources arrive from several systems with no shared key. Entity resolution stitches them into one encounter, and every field keeps a provenance pointer back to the system it came from.',
    deterministic: true,
    failure:
      'Silent mis-joins. Attaching the wrong pathology report to an encounter produces a confident, well-cited, completely wrong finding — and the citation makes it more persuasive, not less.',
  },
  {
    id: 'corpus',
    name: 'Policy corpus, versioned',
    summary: 'Every rule that applied, as of any date, with its source document.',
    detail:
      'NCCI PTP and MUE tables, LCD/NCD by MAC jurisdiction, payer medical policy and precertification lists, CPT descriptors and parentheticals, contract terms. The corpus must be queryable as of a past date, because the rule that matters is the one in force on the date of service, not today.',
    deterministic: true,
    failure:
      'Policy drift. A payer changes a downcoding rule in January and the model keeps applying the old one until someone notices in April. This is the maintenance burden that makes the product a subscription rather than a tool.',
  },
  {
    id: 'retrieve',
    name: 'Retrieve candidate rules',
    summary: 'Narrow millions of rules to the dozen that could bear on this encounter.',
    detail:
      'Filter first on hard keys — payer, plan, jurisdiction, place of service, date of service, code family — then rank the survivors semantically. The filtering is what makes this tractable; the ranking is what makes it useful.',
    deterministic: false,
    failure:
      'Recall failure, and it is invisible. A rule that is never retrieved produces no finding, and a missing finding looks exactly like a clean claim. Precision failures get caught by coders; recall failures do not get caught by anyone.',
  },
  {
    id: 'propose',
    name: 'Propose findings',
    summary: 'Read the note against the retrieved rules and draft the finding.',
    detail:
      'The genuinely language-shaped step: does this narrative note satisfy "documented failure of conservative therapy"? Every proposal must quote the span it relied on, which is both the explanation and the constraint.',
    deterministic: false,
    failure:
      'Plausible fabrication. The failure mode is not gibberish — it is a fluent finding citing a real policy that does not say what the model claims. Requiring a verbatim span and a resolvable citation converts an unfalsifiable claim into a checkable one.',
  },
  {
    id: 'verify',
    name: 'Deterministic verification',
    summary: 'Re-check every proposal against the edit tables in code.',
    detail:
      'NCCI pairs, MUE limits, add-on relationships, modifier validity, laterality, units, global periods and date arithmetic are all lookups and comparisons. They should never be a model output. The model proposes; a rule engine confirms or discards.',
    deterministic: true,
    failure:
      'Skipping this because the model "usually gets it right". Arithmetic that is 99% correct is a liability when it runs on 100% of encounters — that is one wrong claim in a hundred, forever.',
  },
  {
    id: 'calibrate',
    name: 'Calibrate confidence',
    summary: 'Make the number on the screen mean something.',
    detail:
      'Confidence must be calibrated per finding type, not globally: a modifier-26 check is near-deterministic, a medical-necessity judgement is not, and one score cannot serve both. Reliability is measured by whether findings scored 0.90 are right 90% of the time.',
    deterministic: false,
    failure:
      'Overconfidence on the hard categories. It is exactly the subjective findings that most need a human, and exactly those a poorly calibrated model waves through above the auto-apply line.',
  },
  {
    id: 'route',
    name: 'Route',
    summary: 'Auto-apply, queue for a coder, or suppress.',
    detail:
      'Above the threshold the finding posts itself. Below it, a human decides. Below a second floor it is not shown at all, because a queue full of low-value findings is how a coder learns to click accept without reading.',
    deterministic: true,
    failure:
      'Alert fatigue, which is the way this class of product usually dies. The metric to watch is not findings surfaced but the acceptance rate of surfaced findings; if it drops below roughly 70% the queue has become noise.',
  },
  {
    id: 'writeback',
    name: 'Write back',
    summary: 'Corrected lines into the EHR or PM system before submission.',
    detail:
      'A finding that lands in a dashboard is a report. A finding that lands as a corrected claim line is a product. This step is unglamorous, vendor-specific, and the single largest determinant of whether the value is ever realised.',
    deterministic: true,
    failure:
      'Read-only deployments. They are fast to sell and easy to onboard, and they quietly push all the work back onto the staff the product was bought to relieve.',
  },
  {
    id: 'learn',
    name: 'Close the loop',
    summary: 'Coder decisions and payer adjudications become the training signal.',
    detail:
      'Accepted and rejected findings label the model. Adjudication outcomes 30–60 days later label it again, with the payer as the arbiter. Both signals are noisy, and neither is truth.',
    deterministic: false,
    failure:
      'Learning the practice’s existing habits. If coders reject a correct finding because it is unfamiliar, naive feedback training teaches the model to stop raising it — and the system converges on the behaviour it was bought to change.',
  },
]

export default function Architecture() {
  const [openId, setOpenId] = useState<string>('propose')

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Engineering"
        title="Under the hood"
        lede="How this has to be built for the numbers on the other views to be reachable — and, more usefully, where each stage fails. The interesting engineering here is not the language model. It is everything wrapped around it to make its output safe to act on without a human reading every one."
      />

      <div className="grid grid-4">
        <Stat value="100%" label="Encounters processed" note="Not a sample. This is a throughput requirement before it is a modelling one." />
        <Stat value="5 of 9" label="Stages that are deterministic" note="Most of this pipeline is lookups, joins and date arithmetic." />
        <Stat value="30–60d" label="Ground-truth lag" note="Payer adjudication is the closest thing to a label, and it arrives two months late." />
        <Stat value="~0.75" label="Inter-coder agreement" note="Two credentialed humans agree this often on complex charts. That bounds what 'accuracy' can mean." />
      </div>

      <Card>
        <CardHead title="Pipeline" aside={<Pill plain>Select a stage</Pill>} />
        <div className="pipe">
          {PIPELINE.map((s, i) => (
            <div key={s.id}>
              <button
                type="button"
                className="finding"
                aria-pressed={openId === s.id}
                onClick={() => setOpenId(openId === s.id ? '' : s.id)}
              >
                <span className="finding-head">
                  <span className="pipe-num">{i + 1}</span>
                  <span className="finding-title">{s.name}</span>
                  <Code tone={s.deterministic ? 'add' : 'change'}>
                    {s.deterministic ? 'deterministic' : 'model'}
                  </Code>
                </span>
                <span className="small muted">{s.summary}</span>
              </button>
              {openId === s.id && (
                <Card tint className="stack stack-3" >
                  <p className="small">{s.detail}</p>
                  <KV k="Failure mode" v="" hint={s.failure} />
                </Card>
              )}
              {i < PIPELINE.length - 1 && (
                <div className="pipe-arrow" aria-hidden="true">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="split">
        <Card>
          <CardHead title="The ground truth problem" aside={<Pill>Hardest question here</Pill>} />
          <div className="stack stack-3">
            <p className="small muted">
              &ldquo;98% coding accuracy&rdquo; presumes a correct answer exists. For a large share
              of real encounters it does not, in any clean sense:
            </p>
            <div className="stack stack-2">
              <KV k="Credentialed coders" v="" hint="Two certified coders agree roughly 75% of the time on complex charts. Which one is the label?" />
              <KV k="Payer adjudication" v="" hint="A paid claim is not a correct claim — it is a claim the payer did not catch. A denied claim is not an incorrect one; payers deny correct claims routinely." />
              <KV k="Post-payment audit" v="" hint="The most authoritative signal available, and it covers a vanishing fraction of claims, years later." />
              <KV k="Expert-adjudicated gold set" v="" hint="The only clean option: a few thousand charts adjudicated by a panel, per specialty. Expensive, slow, and it goes stale as codes and policies change annually." />
            </div>
            <Callout>
              This is the question I would most want to ask the CTO. Everything about how the
              product is evaluated, priced and defended in an audit follows from how it is answered.
            </Callout>
          </div>
        </Card>

        <Card>
          <CardHead title="Evaluation that would convince me" />
          <Table head={['Measure', 'Why it matters']}>
            <tr>
              <td className="small strong">Calibration curve</td>
              <td className="small muted">Findings at 0.90 confidence should be right 90% of the time. Plot it per finding type. This is the number the auto-apply line depends on.</td>
            </tr>
            <tr>
              <td className="small strong">Recall on a seeded set</td>
              <td className="small muted">Inject known errors into charts and measure what fraction surface. Silent misses are the failure nobody reports.</td>
            </tr>
            <tr>
              <td className="small strong">Coder acceptance rate</td>
              <td className="small muted">Available in days, not months, and it is the earliest signal of alert fatigue.</td>
            </tr>
            <tr>
              <td className="small strong">Overturn rate on appeals</td>
              <td className="small muted">Direct evidence that the argument the engine constructed was the right one.</td>
            </tr>
            <tr>
              <td className="small strong">Directional balance</td>
              <td className="small muted">Ratio of findings that reduce the claim to those that increase it. A tool that only ever adds codes is an upcoding engine, and the practice carries that liability.</td>
            </tr>
            <tr>
              <td className="small strong">Held-out control</td>
              <td className="small muted">The only way to attribute a denial-rate drop to the product. Commercially unpopular, scientifically necessary.</td>
            </tr>
          </Table>
        </Card>
      </div>

      <Card tint>
        <CardHead title="Design positions this teardown assumes" />
        <div className="grid grid-2">
          <KV k="Citations are mandatory, not decorative" v="" hint="A finding without a resolvable authority and a verbatim chart span cannot be shipped. It is what makes the output auditable, and auditability is the product." />
          <KV k="Deterministic wherever possible" v="" hint="Edit tables, date arithmetic and unit limits belong in code. Reserve the model for the parts that are genuinely linguistic judgement." />
          <KV k="Calibrated per finding type" v="" hint="One global confidence score cannot serve both a modifier check and a medical-necessity judgement." />
          <KV k="Bidirectional by default" v="" hint="Surfacing overcoding is what separates revenue integrity from revenue maximisation, and it is what makes the compliance officer an ally rather than an obstacle." />
          <KV k="Write-back or it does not count" v="" hint="Read-only is a faster sale and a worse product." />
          <KV k="Human in the loop is permanent" v="" hint="Not a transitional scaffold to be removed once accuracy improves. The threshold moves; it never reaches 1.0." />
        </div>
      </Card>
    </div>
  )
}
