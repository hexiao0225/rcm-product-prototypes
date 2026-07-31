import type { Specialty } from '../specialty'
import { AUTHS, type AuthItem } from '../clinical'
import { Callout, Card, CardHead, Code, Device, KV, Pill, SectionHead, Stat, Table } from '../components/ui'

const STATUS_LABEL: Record<AuthItem['status'], string> = {
  required: 'Required',
  'not-required': 'Not required',
  submitted: 'Submitted',
  approved: 'Approved',
  'at-risk': 'At risk',
}

const STATUS_TONE: Record<AuthItem['status'], 'plain' | 'add' | 'remove' | 'change'> = {
  required: 'change',
  'not-required': 'plain',
  submitted: 'plain',
  approved: 'add',
  'at-risk': 'remove',
}

export default function PriorAuth({ specialty }: { specialty: Specialty }) {
  const items = AUTHS[specialty.id]
  const atRisk = items.filter((i) => i.status === 'at-risk')
  const notRequired = items.filter((i) => i.status === 'not-required')

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Prevention"
        title="Prior authorization"
        lede="Authorization is the largest single denial category in procedural specialties, and it is the one where the denial arrives after the money has already been spent. The theatre is booked, the implant is opened, the patient is home — and then the claim comes back CO-197. Everything useful here happens before the procedure."
      />

      <div className="grid grid-4">
        <Stat value={String(atRisk.length)} label="At risk" note="Criteria gap identified before the scheduled date." />
        <Stat
          value={String(items.filter((i) => i.status === 'submitted' || i.status === 'approved').length)}
          label="In flight"
          note="Submitted or approved."
        />
        <Stat
          value={String(notRequired.length)}
          label="Correctly skipped"
          note="Confirmed not on the plan's list. Work avoided, not work done."
        />
        <Stat value="CO-197" label="The code this prevents" note="Precertification absent — unappealable once the service is rendered without it." />
      </div>

      <Device crumb="Prior authorization / Upcoming schedule" actor="Auth coordinator">
        <div className="stack stack-6">
          <Table head={['Patient', 'Procedure', 'Code', 'Payer', 'Scheduled', 'Status']}>
            {items.map((i) => (
              <tr key={`${i.patient}-${i.code}`}>
                <td className="small strong">{i.patient}</td>
                <td className="small">{i.procedure}</td>
                <td>
                  <Code>{i.code}</Code>
                </td>
                <td className="small">{i.payer}</td>
                <td className="small">{i.scheduled}</td>
                <td>
                  <Code tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Code>
                </td>
              </tr>
            ))}
          </Table>

          <div className="stack stack-4">
            <h3 style={{ margin: 0 }}>Criteria review</h3>
            {items.map((i) => (
              <Card key={`${i.patient}-${i.code}-detail`} tint={i.status === 'at-risk'}>
                <div className="finding-head">
                  <Code tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Code>
                  <span className="finding-title">
                    {i.procedure} — {i.patient}
                  </span>
                  <span className="note" style={{ marginLeft: 'auto' }}>{i.scheduled}</span>
                </div>
                <div className="stack stack-2" style={{ marginTop: 8 }}>
                  <KV k="Payer criteria" v="" hint={i.criteria} />
                  {i.gap && <KV k="Gap" v="" hint={i.gap} />}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Device>

      <div className="split">
        <Card>
          <CardHead title="The 'not required' column is the interesting one" aside={<Pill plain>Work avoided</Pill>} />
          <div className="stack stack-3">
            <p className="small muted">
              Auth teams routinely submit requests for services that do not need them, because
              checking is slower than submitting and the cost of being wrong is a denial. Each
              unnecessary request is roughly 40 minutes of staff time and several days of delay for
              a patient.
            </p>
            <p className="small muted">
              A system that can say, with a citation and an effective date, that this code is{' '}
              <em>not</em> on this plan&apos;s 2026 list removes work rather than automating it.
              That is a materially better version of the same product, and it is only possible if
              the policy corpus is versioned properly.
            </p>
            <Callout>
              {notRequired.length} of {items.length} items on this schedule need no authorization at
              all. In most practices all {items.length} would be worked.
            </Callout>
          </div>
        </Card>

        <Card>
          <CardHead title="Why this is harder than coding" />
          <div className="stack stack-2">
            <KV
              k="It is prospective"
              v=""
              hint="A coding audit reasons about a completed encounter. An auth decision reasons about a procedure that has not happened yet, from a note that has not been written."
            />
            <KV
              k="Criteria are prose"
              v=""
              hint="'Documented failure of conservative therapy' is a clinical judgement expressed in English, not a code comparison. Extracting whether six weeks of PT happened means reading outside records."
            />
            <KV
              k="The evidence is elsewhere"
              v=""
              hint="Outside PT notes, prior imaging from another system, a step-therapy drug trial recorded at a different practice. The chart in front of you is frequently not the chart that matters."
            />
            <KV
              k="Portals, not APIs"
              v=""
              hint="Most submission is still a web form. X12 278 exists and is patchily supported; the CMS interoperability rule improves this on a timeline measured in years."
            />
            <KV
              k="The clock is real"
              v=""
              hint="A finding surfaced the day before surgery is worth far less than the same finding surfaced at scheduling. Latency is a product requirement, not an engineering nicety."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
