import { useState } from 'react'
import type { Specialty } from '../specialty'
import { HEADLINE_STATS } from '../data'
import { pct, usd } from '../format'
import { Callout, Card, CardHead, KV, Pill, SectionHead, Slider, Stat, Table } from '../components/ui'

/**
 * The published claims are 57% fewer denials, 3.3x ROI in month one, and +9.3%
 * net revenue per appointment. Rather than repeat them, this view models what
 * would have to be true for them to hold — and shows which of them is doing the
 * real work. (It is not the denial reduction.)
 */
export default function RoiModel({ specialty }: { specialty: Specialty }) {
  const [encounters, setEncounters] = useState(specialty.encountersPerYear)
  const [avgAllowed, setAvgAllowed] = useState(specialty.avgAllowed)
  const [denialRate, setDenialRate] = useState(specialty.baselineDenialRate)
  const [denialReduction, setDenialReduction] = useState(0.57)
  const [neverWorked, setNeverWorked] = useState(0.6)
  const [underpaymentRate, setUnderpaymentRate] = useState(0.021)
  const [undercodingLift, setUndercodingLift] = useState(0.018)
  const [priceBps, setPriceBps] = useState(0.025)

  const grossRevenue = encounters * avgAllowed
  const deniedClaims = encounters * denialRate
  const deniedDollars = deniedClaims * avgAllowed

  // Only the denials nobody was working are new money. Denials the biller would
  // have recovered anyway are a cost saving, not a revenue lift — conflating the
  // two is the most common way an RCM ROI model overstates itself.
  const abandonedDollars = deniedDollars * neverWorked
  const denialRecovery = abandonedDollars * denialReduction
  const underpaymentRecovery = grossRevenue * underpaymentRate
  const codingLift = grossRevenue * undercodingLift
  const totalLift = denialRecovery + underpaymentRecovery + codingLift

  const platformCost = grossRevenue * priceBps
  const netGain = totalLift - platformCost
  const roi = platformCost > 0 ? totalLift / platformCost : 0
  const perAppointmentLift = totalLift / encounters
  const perAppointmentPct = perAppointmentLift / avgAllowed

  const contributions = [
    { name: 'Denials recovered', value: denialRecovery, why: 'Abandoned denials that now get prevented or worked.' },
    { name: 'Underpayments recovered', value: underpaymentRecovery, why: 'Claims that paid below contract and were never checked.' },
    { name: 'Undercoding corrected', value: codingLift, why: 'Documented, payable services that were never billed.' },
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Economics"
        title="ROI model"
        lede="Three numbers are published: 57% fewer denials, 3.3x ROI in month one, +9.3% net revenue per appointment. They are not independent, and they are not equally load-bearing. This model is an attempt to find out which one is actually carrying the claim."
      />

      <div className="grid grid-3">
        {HEADLINE_STATS.slice(0, 3).map((s) => (
          <Stat key={s.label} value={s.value} label={s.label} note={s.note} />
        ))}
      </div>

      <div className="split">
        <div className="stack stack-6">
          <Card>
            <CardHead title="The practice" aside={<Pill plain>{specialty.name}</Pill>} />
            <div className="stack stack-6">
              <Slider
                label="Encounters per year"
                value={encounters}
                min={10_000}
                max={250_000}
                step={1_000}
                display={encounters.toLocaleString('en-US')}
                onChange={setEncounters}
              />
              <Slider
                label="Average allowed per encounter"
                value={avgAllowed}
                min={80}
                max={900}
                step={2}
                display={usd(avgAllowed)}
                onChange={setAvgAllowed}
              />
              <Slider
                label="Initial denial rate"
                value={denialRate}
                min={0.03}
                max={0.25}
                step={0.001}
                display={pct(denialRate)}
                onChange={setDenialRate}
              />
              <KV k="Gross annual revenue" v={usd(grossRevenue)} total />
            </div>
          </Card>

          <Card>
            <CardHead title="What the platform changes" />
            <div className="stack stack-6">
              <Slider
                label="Denial reduction"
                value={denialReduction}
                min={0}
                max={0.8}
                step={0.01}
                display={pct(denialReduction, 0)}
                onChange={setDenialReduction}
                hint="The published claim is 57%."
              />
              <Slider
                label="Share of denials never worked today"
                value={neverWorked}
                min={0}
                max={0.9}
                step={0.01}
                display={pct(neverWorked, 0)}
                onChange={setNeverWorked}
                hint="The critical input. Denials the biller already recovers are a cost saving, not new revenue — only the abandoned ones are lift."
              />
              <Slider
                label="Underpayment rate"
                value={underpaymentRate}
                min={0}
                max={0.06}
                step={0.001}
                display={pct(underpaymentRate, 1)}
                onChange={setUnderpaymentRate}
                hint="Share of gross revenue paid below contract."
              />
              <Slider
                label="Undercoding lift"
                value={undercodingLift}
                min={0}
                max={0.05}
                step={0.001}
                display={pct(undercodingLift, 1)}
                onChange={setUndercodingLift}
                hint="Documented services never billed. Constrained by compliance, not by ambition."
              />
              <Slider
                label="Platform price"
                value={priceBps}
                min={0.005}
                max={0.06}
                step={0.001}
                display={`${pct(priceBps, 1)} of collections`}
                onChange={setPriceBps}
              />
            </div>
          </Card>
        </div>

        <div className="stack stack-6">
          <Card tint>
            <CardHead title="Result" />
            <div className="stack stack-2">
              <KV k="Denied dollars per year" v={usd(deniedDollars)} hint={`${Math.round(deniedClaims).toLocaleString('en-US')} claims`} />
              <KV k="— of which abandoned today" v={usd(abandonedDollars)} />
              <KV k="Denial recovery" v={usd(denialRecovery)} />
              <KV k="Underpayment recovery" v={usd(underpaymentRecovery)} />
              <KV k="Undercoding corrected" v={usd(codingLift)} />
              <KV k="Total revenue lift" v={usd(totalLift)} total />
              <KV k="Platform cost" v={`−${usd(platformCost)}`} />
              <KV k="Net gain" v={usd(netGain)} total />
            </div>
          </Card>

          <div className="grid grid-2">
            <Stat
              value={`${roi.toFixed(1)}x`}
              label="Return on platform cost"
              note={roi >= 3.3 ? 'At or above the published 3.3x.' : 'Below the published 3.3x at these inputs.'}
            />
            <Stat
              value={`+${pct(perAppointmentPct, 1)}`}
              label="Net revenue per appointment"
              note={`${usd(perAppointmentLift, 2)} per encounter. Published claim is +9.3%.`}
            />
          </div>

          <Card>
            <CardHead title="Where the lift comes from" />
            <Table head={['Source', 'Value', 'Share', 'Why']}>
              {contributions.map((c) => (
                <tr key={c.name}>
                  <td className="small strong">{c.name}</td>
                  <td className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {usd(c.value)}
                  </td>
                  <td className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {totalLift > 0 ? pct(c.value / totalLift, 0) : '—'}
                  </td>
                  <td className="small muted">{c.why}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>

      <div className="split">
        <Card>
          <CardHead title="What the model exposes" />
          <div className="stack stack-3">
            <p className="small muted">
              Set <strong>share of denials never worked</strong> to zero and the headline collapses.
              That single input — not the 57% — is what determines whether denial reduction is worth
              anything, and it is the one number the marketing page never states.
            </p>
            <p className="small muted">
              Meanwhile underpayment recovery and undercoding correction are proportional to{' '}
              <em>gross revenue</em>, not to the denial rate. At{' '}
              {pct(underpaymentRate + undercodingLift, 1)} combined they contribute{' '}
              {pct(
                totalLift > 0 ? (underpaymentRecovery + codingLift) / totalLift : 0,
                0,
              )}{' '}
              of the lift at these settings — from the two capabilities that get the least airtime.
            </p>
            <Callout>
              This is the honest version of the pitch: the denial number sells the meeting, and the
              contract and coding work pays for the contract.
            </Callout>
          </div>
        </Card>

        <Card>
          <CardHead title="Where I would push in diligence" />
          <div className="stack stack-2">
            <KV k="Is 57% relative or absolute?" v="" hint="A drop from 11.4% to 4.9% is a 57% relative reduction. A drop from 11.4% to 11.4−57 points is impossible. Both get written the same way." />
            <KV k="Measured against what baseline?" v="" hint="The same practice before, or a matched cohort? Practices adopt this kind of tool during other changes, and pre/post is not causal." />
            <KV k="Does the 3.3x count cost savings?" v="" hint="FTE hours saved are real, but they only become cash if headcount actually changes. Most practices redeploy rather than reduce." />
            <KV k="What is the denominator on +9.3%?" v="" hint="Net revenue per appointment moves with payer mix and service mix independently of anything the platform does." />
            <KV
              k="What happens in year two?"
              v=""
              hint="The backlog of undercoded and underpaid claims is a one-time recovery. The recurring number is prevention, which is smaller — and a much better business."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
