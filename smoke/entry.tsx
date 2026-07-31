/**
 * Render-crash smoke test. Every view is rendered to a string, once per
 * specialty, so that a broken hook, a bad `.find(...)!`, or a null deref fails
 * the build instead of the deployed page.
 */
const g = globalThis as Record<string, unknown>
g.window = {
  location: { hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
}

import { renderToString } from 'react-dom/server'
import App from '../src/App'
import Overview from '../src/views/Overview'
import DataEngine from '../src/views/DataEngine'
import CodingEngine from '../src/views/CodingEngine'
import AppealEngine from '../src/views/AppealEngine'
import Underpayments from '../src/views/Underpayments'
import PriorAuth from '../src/views/PriorAuth'
import Intelligence from '../src/views/Intelligence'
import RoiModel from '../src/views/RoiModel'
import Architecture from '../src/views/Architecture'
import Integration from '../src/views/Integration'
import { SPECIALTIES } from '../src/specialty'

const cases: [string, () => JSX.Element][] = [
  ['App', () => <App />],
  ['Overview', () => <Overview onNavigate={() => {}} />],
  ['Architecture', () => <Architecture />],
  ['Integration', () => <Integration />],
]

for (const specialty of SPECIALTIES) {
  cases.push([`DataEngine/${specialty.id}`, () => <DataEngine specialty={specialty} />])
  cases.push([`CodingEngine/${specialty.id}`, () => <CodingEngine specialty={specialty} />])
  cases.push([`AppealEngine/${specialty.id}`, () => <AppealEngine specialty={specialty} />])
  cases.push([`Underpayments/${specialty.id}`, () => <Underpayments specialty={specialty} />])
  cases.push([`PriorAuth/${specialty.id}`, () => <PriorAuth specialty={specialty} />])
  cases.push([`Intelligence/${specialty.id}`, () => <Intelligence specialty={specialty} />])
  cases.push([`RoiModel/${specialty.id}`, () => <RoiModel specialty={specialty} />])
}

let failed = 0
for (const [name, render] of cases) {
  try {
    const html = renderToString(render())
    if (html.length < 200) throw new Error(`suspiciously short output (${html.length} chars)`)
    console.log(`  ok   ${name} (${html.length} chars)`)
  } catch (err) {
    failed++
    console.error(`  FAIL ${name}: ${(err as Error).message}`)
  }
}

console.log(failed === 0 ? `\nAll ${cases.length} views rendered.` : `\n${failed} view(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
