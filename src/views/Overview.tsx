import type { ViewId } from '../App'
import { CAPABILITIES, COMPANY, ENGINES, HEADLINE_STATS, LEAKAGE } from '../data'
import { SPECIALTIES } from '../specialty'
import { Bullets, Callout, Card, CardHead, KV, Pill, SectionHead, Stat, Table } from '../components/ui'

export default function Overview({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Product teardown"
        title="Revenue integrity for specialty practices"
        lede="A physician practice bills a payer, and somewhere between the note and the deposit a predictable share of the money disappears. Not through fraud or incompetence — through a documentation gap, a missing modifier, a policy that changed in January, or a payment that landed 11% under contract and was posted without anyone checking. This is a study of the product line built to close that gap."
      />

      <div className="grid grid-3">
        {HEADLINE_STATS.map((s) => (
          <Stat key={s.label} value={s.value} label={s.label} note={s.note} />
        ))}
      </div>

      <Callout>
        Every figure above is the company&apos;s own published claim. The prototypes in this
        teardown are an attempt to work out what has to be true underneath them — what the product
        must actually do, screen by screen, for those numbers to be reachable.
      </Callout>

      <div className="split">
        <Card>
          <CardHead title="The problem, stated precisely" />
          <div className="stack stack-4">
            <p className="small muted">
              Revenue cycle management is normally sold as a labour arbitrage: the same work, done
              cheaper. Revenue <em>integrity</em> is a different claim — that a large fraction of
              the loss is not a staffing problem at all, because nobody was ever in a position to
              catch it.
            </p>
            <p className="small muted">
              A coder cannot see the payer&apos;s policy version. The A/R team cannot see the
              contract rate. The physician cannot see either. Each of them does their job correctly
              and the claim still goes out wrong, because the check that would have caught it
              requires four systems in the same room at the same time.
            </p>
            <Callout>
              That is why the product is three engines and not one model. The audit is the visible
              part; the data join underneath it is the part that makes the audit possible.
            </Callout>
          </div>
        </Card>

        <Card>
          <CardHead title="Where a dollar leaks" aside={<Pill plain>Claim lifecycle</Pill>} />
          <Table head={['Stage', 'What is lost', 'Engine']}>
            {LEAKAGE.map((l) => (
              <tr key={l.stage}>
                <td className="strong small">{l.stage}</td>
                <td className="small muted">{l.loss}</td>
                <td className="small">{l.engine}</td>
              </tr>
            ))}
          </Table>
          <p className="note" style={{ marginTop: 12 }}>
            The last row is the one that never generates a task. A denial at least produces a work
            item somebody could pick up. An underpayment produces a payment.
          </p>
        </Card>
      </div>

      <div>
        <h2 style={{ marginBottom: 16 }}>Three engines</h2>
        <div className="grid grid-3">
          {ENGINES.map((e) => (
            <Card key={e.id}>
              <CardHead title={e.name} aside={<Pill>{e.role}</Pill>} />
              <div className="stack stack-3">
                <p className="small strong">{e.tagline}</p>
                <p className="small muted">{e.detail}</p>
                <div className="stack stack-2">
                  <span className="note strong">Reads from</span>
                  <Bullets items={e.inputs} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: 16 }}>The prototypes</h2>
        <Table head={['View', 'What it demonstrates']}>
          {(
            [
              ['data-engine', 'Data Engine', 'The four-way join under everything: note, codes, policy, contract — and what breaks without it.'],
              ['coding', 'Coding Engine', 'The headline prototype. A pre-bill audit with note-grounded findings and a movable auto-apply threshold. Start here.'],
              ['appeals', 'Appeal Engine', 'Denial worklist, root-cause resolution, drafted appeal with citations, and the economics that decide what gets filed.'],
              ['underpayments', 'Underpayments', 'Claims that paid — just not what the contract says. Variance detection against the rate sheet.'],
              ['prior-auth', 'Prior auth', 'Requirement detection and criteria gaps caught before the procedure, not after the denial.'],
              ['intelligence', 'Denial intelligence', 'The RCM leader’s view: root-cause mix, preventable share, payer and provider outliers.'],
              ['roi', 'ROI model', 'The published claims as an interactive model. Change the inputs and see which ones survive.'],
              ['architecture', 'Under the hood', 'How the coding engine would have to be built — retrieval, deterministic edits, calibration, evals, audit trail.'],
              ['integration', 'Integration', 'FHIR and EHR connectors, the three-day onboarding claim, and the security posture that gates it.'],
            ] as [ViewId, string, string][]
          ).map(([id, label, desc]) => (
            <tr key={id} style={{ cursor: 'pointer' }} onClick={() => onNavigate(id)}>
              <td className="strong small" style={{ whiteSpace: 'nowrap' }}>
                {label}
              </td>
              <td className="small muted">{desc}</td>
            </tr>
          ))}
        </Table>
      </div>

      <div className="split">
        <Card>
          <CardHead title="Why specialty, not horizontal" />
          <div className="stack stack-3">
            <p className="small muted">
              Seven of the ten views carry a specialty switcher. It is not a theme — it swaps the
              clinical scenario, the codes, the payer policies, the denial mix and the appeal
              arguments underneath the whole prototype.
            </p>
            <p className="small muted">
              That is the structural bet worth testing in conversation. A horizontal coding model
              scoring 98% on a mixed corpus can still be wrong on the eight codes that carry a
              retina practice&apos;s margin, because those eight codes are a rounding error in the
              corpus and the entire business at the practice.
            </p>
            <div className="stack stack-2">
              {SPECIALTIES.map((s) => (
                <KV key={s.id} k={s.name} v="" hint={s.thesis} />
              ))}
            </div>
          </div>
        </Card>

        <div className="stack stack-6">
          <Card>
            <CardHead title="Capabilities" />
            <div className="stack stack-2">
              {CAPABILITIES.map((c) => (
                <KV key={c.name} k={c.name} v="" hint={c.detail} />
              ))}
            </div>
          </Card>
          <Card tint>
            <CardHead title="The company" />
            <div className="stack stack-2">
              <KV k="Founded" v={String(COMPANY.founded)} />
              <KV k="Batch" v={COMPANY.batch} />
              <KV k="HQ" v={COMPANY.hq} />
              <KV k="Founders" v={COMPANY.founders.join(', ')} />
              <KV k="Seed" v={COMPANY.seed} />
              <KV k="Positioning" v="" hint={COMPANY.positioning} />
              <KV k="Background" v="" hint={COMPANY.origin} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
