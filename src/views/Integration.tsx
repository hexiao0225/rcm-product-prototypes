import { EHRS, SECURITY } from '../data'
import { Callout, Card, CardHead, Code, KV, Numbered, Pill, SectionHead, Stat, Table } from '../components/ui'

const FHIR_RESOURCES = [
  { name: 'Encounter', use: 'The spine. Date of service, place of service, provider, patient.' },
  { name: 'DocumentReference', use: 'The clinical note itself — usually the payload that matters most and the one least consistently structured.' },
  { name: 'DiagnosticReport', use: 'Pathology and imaging results, including the addenda that arrive after the note is signed.' },
  { name: 'Procedure', use: 'What was performed, as the clinician recorded it rather than as it was coded.' },
  { name: 'Condition', use: 'Problem list and encounter diagnoses, for specificity checks.' },
  { name: 'Coverage', use: 'Payer and plan, which determines which policy corpus applies.' },
  { name: 'Claim / ClaimResponse', use: 'The coded claim and its adjudication. Often only available from the PM system, not the EHR.' },
  { name: 'ExplanationOfBenefit', use: 'The remittance view — where CARC/RARC codes and paid amounts live.' },
]

const ONBOARDING = [
  'Day 0 — Read-only credentials issued. FHIR bulk export kicked off for the trailing 12 months of encounters, claims and remittances.',
  'Day 1 — Backfill lands. Payer mix, contract terms and specialty are established from the data rather than from a questionnaire. Policy corpus scoped to the jurisdictions and plans that actually appear.',
  'Day 2 — Retrospective audit runs across the full backfill. This produces the first artefact the practice sees: a list of already-submitted claims with findings and dollar amounts attached.',
  'Day 3 — Findings reviewed with the practice. Recoverable underpayments and appealable denials are worked immediately; prospective pre-bill review begins on new encounters.',
  'Week 2+ — Write-back enabled once the acceptance rate on surfaced findings is established. Auto-apply threshold set with the practice, per finding type, and moved deliberately rather than by default.',
]

export default function Integration() {
  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Deployment"
        title="Integration"
        lede="The published claim is three days to first results. That is only credible because the first deployment is read-only and retrospective — it audits claims that have already been submitted, which requires no workflow change, no training, and no trust. The hard integration work starts afterwards, when findings have to travel back."
      />

      <div className="grid grid-4">
        <Stat value="3 days" label="To first results" note="Read-only backfill, retrospective audit, findings reviewed." />
        <Stat value="12 mo" label="Typical backfill" note="Enough history to establish payer behaviour and find recoverable claims." />
        <Stat value="Read-only" label="Day-one posture" note="No write access, no workflow change, nothing to undo if it disappoints." />
        <Stat value="Week 2+" label="Write-back" note="Earned after the acceptance rate is known, not granted on day one." />
      </div>

      <Callout>
        Note what the three-day claim is really saying. It is not that the model is trained in three
        days — it is that the first deployment does not need to touch anything. A retrospective
        audit on already-submitted claims is the cheapest possible way to prove value, and the
        recoverable dollars it surfaces pay for the pilot before anyone changes how they work.
      </Callout>

      <div className="split">
        <Card>
          <CardHead title="Onboarding" aside={<Pill plain>Read-only first</Pill>} />
          <Numbered items={ONBOARDING} />
        </Card>

        <Card>
          <CardHead title="EHR connectors" />
          <Table head={['System', 'Segment', 'Method']}>
            {EHRS.map((e) => (
              <tr key={e.name}>
                <td className="small strong">{e.name}</td>
                <td className="small">{e.kind}</td>
                <td className="small muted">
                  <Code>{e.method}</Code>
                  <span style={{ display: 'block', marginTop: 4 }}>{e.note}</span>
                </td>
              </tr>
            ))}
          </Table>
          <p className="note" style={{ marginTop: 12 }}>
            Specialty-native systems — ModMed, Nextech — are disproportionately valuable here. Their
            exam data is structured in ways general-purpose EHRs leave as free text, which means
            more findings are reachable without reading prose.
          </p>
        </Card>
      </div>

      <Card>
        <CardHead title="FHIR resources the product depends on" />
        <Table head={['Resource', 'What it is for']}>
          {FHIR_RESOURCES.map((r) => (
            <tr key={r.name}>
              <td>
                <Code>{r.name}</Code>
              </td>
              <td className="small muted">{r.use}</td>
            </tr>
          ))}
        </Table>
        <p className="note" style={{ marginTop: 12 }}>
          The last two rows are where integrations usually stall. Clinical data is increasingly
          available over FHIR because regulation forced it; claims and remittance data frequently
          are not, because they live in a practice management system with a different vendor, a
          different contract and no equivalent mandate. A product that needs the claim and the
          remittance has two integrations to negotiate, not one.
        </p>
      </Card>

      <div className="split">
        <Card>
          <CardHead title="Security posture" aside={<Pill plain>Table stakes</Pill>} />
          <div className="stack stack-2">
            {SECURITY.map((s) => (
              <KV key={s.name} k={s.name} v={s.detail} />
            ))}
          </div>
          <p className="note" style={{ marginTop: 12 }}>
            None of this differentiates — it gates. No specialty group signs without it, and no
            amount of it wins a deal on its own.
          </p>
        </Card>

        <Card>
          <CardHead title="What I would ask about integration" />
          <div className="stack stack-2">
            <KV k="How much is per-customer?" v="" hint="If each Epic instance needs bespoke mapping, the model is services-shaped and gross margin degrades with every logo. If it is one connector per vendor, it compounds." />
            <KV k="Where does write-back land?" v="" hint="A corrected claim line in the PM system, a task in the EHR in-basket, or a CSV someone re-keys? The answer determines whether the value survives contact with the workflow." />
            <KV k="What breaks on upgrade?" v="" hint="EHR vendors change APIs on their own schedule. Connector maintenance is a permanent engineering cost, not a one-off." />
            <KV k="How is the policy corpus maintained?" v="" hint="Payer policy changes constantly and is published as PDFs on hundreds of websites. Whether this is automated ingestion or a team of people is the most important unglamorous question about the business." />
            <KV k="What happens with a smaller PM system?" v="" hint="Specialty groups run long-tail practice management software. Coverage of the tail decides whether the addressable market is the whole specialty or the top of it." />
          </div>
        </Card>
      </div>
    </div>
  )
}
