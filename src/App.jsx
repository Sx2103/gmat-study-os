import { useState, useMemo, useCallback } from 'react'
import { Sidebar }   from './components/layout/Sidebar.jsx'
import { TopBar }    from './components/layout/TopBar.jsx'

// Pages
import TodayPage        from './components/pages/TodayPage.jsx'
import { WeeklyPage }   from './components/pages/WeeklyPage.jsx'
import { DailyPage }    from './components/pages/WeeklyPage.jsx'   // DailyPage exported from same file
import { RebalancePage }from './components/pages/WeeklyPage.jsx'   // same

// Note: DailyPage and RebalancePage are exported from their own file per the structure.
// We import from the combined file we created. In the split structure they'd be separate imports.
import { ProgressPage } from './components/pages/ProgressPage.jsx'
import { TopicsPage }   from './components/pages/ProgressPage.jsx'
import { MocksPage, ErrorsPage, AnalyticsPage, SettingsPage } from './components/pages/MocksPage.jsx'

import { useLocalStorage }   from './hooks/useLocalStorage.js'
import { calcReadiness }     from './utils/scoring.js'
import { pct, clamp }        from './utils/helpers.js'
import { NAV_GROUPS }        from './data/constants.js'
import { mkSampleWeek, mkSampleMocks, mkSampleErrors, mkDefaultTopics, mkDefaultSettings } from './data/sampleData.js'

export default function App() {
  const [nav,      setNav]      = useState('today')
  const [sideOpen, setSideOpen] = useState(true)

  // ── Persistent state ──────────────────────────────────────────────────
  const [weeks,    setWeeks]    = useLocalStorage('gmat4_weeks',    () => [mkSampleWeek()])
  const [activeWk, setActiveWk] = useLocalStorage('gmat4_activeWk', 0)
  const [topics,   setTopics]   = useLocalStorage('gmat4_topics',   mkDefaultTopics)
  const [mocks,    setMocks]    = useLocalStorage('gmat4_mocks',    mkSampleMocks)
  const [errors,   setErrors]   = useLocalStorage('gmat4_errors',   mkSampleErrors)
  const [settings, setSettings] = useLocalStorage('gmat4_settings', mkDefaultSettings)

  // ── Derived current week ───────────────────────────────────────────────
  const week = weeks[clamp(activeWk, 0, weeks.length - 1)] || weeks[0]
  const updateWeek = useCallback(
    fn => setWeeks(ws => ws.map((w, i) => i === activeWk ? fn(w) : w)),
    [activeWk, setWeeks]
  )

  // ── Summary stats for top bar ──────────────────────────────────────────
  const allTasks  = useMemo(() => weeks.flatMap(w => w.days.flatMap(d => d.tasks)), [weeks])
  const totalHrs  = useMemo(() => weeks.reduce((a,w) => a + w.days.reduce((b,d) => b+(d.hoursLogged||0),0), 0), [weeks])
  const overallQ  = useMemo(() => topics.reduce((a,t) => a+t.attempted, 0), [topics])
  const overallC  = useMemo(() => topics.reduce((a,t) => a+t.correct,   0), [topics])
  const latestMock= useMemo(() => [...mocks].sort((a,b) => new Date(b.date)-new Date(a.date))[0], [mocks])
  const { score: readiness, overallAcc } = useMemo(
    () => calcReadiness({ topics, mocks, weeks, errors, settings }),
    [topics, mocks, weeks, errors, settings]
  )
  const daysLeft = settings.examDate
    ? Math.max(0, Math.ceil((new Date(settings.examDate) - new Date()) / 864e5))
    : null

  const topBarPills = [
    ['📊', `${pct(allTasks.filter(t=>t.status==='Completed').length, allTasks.length)}% done`, '#7C3AED'],
    ['⏱',  `${Math.round(totalHrs)}h logged`,  '#2563EB'],
    ['🎯',  latestMock ? `Mock: ${latestMock.total}` : 'No mocks yet', '#F59E0B'],
    ['📈',  `Acc: ${overallAcc}%`,  '#10B981'],
    ['🏁',  `${readiness}% ready`, '#6D28D9'],
  ]

  // ── Shared props passed to all pages ──────────────────────────────────
  const shared = {
    weeks, setWeeks, activeWk, setActiveWk,
    week, updateWeek,
    topics, setTopics,
    mocks,  setMocks,
    errors, setErrors,
    settings, setSettings,
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#F8FAFC',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Sidebar */}
      <Sidebar
        nav={nav} setNav={setNav}
        sideOpen={sideOpen} setSideOpen={setSideOpen}
        daysLeft={daysLeft}
        settings={settings}
        latestMock={latestMock}
        readiness={readiness}
      />

      {/* Main panel */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar nav={nav} pills={topBarPills} daysLeft={daysLeft} />

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {nav === 'today'     && <TodayPage     {...shared} />}
          {nav === 'weekly'    && <WeeklyPage    {...shared} />}
          {nav === 'daily'     && <DailyPage     {...shared} />}
          {nav === 'rebalance' && <RebalancePage {...shared} />}
          {nav === 'progress'  && <ProgressPage  {...shared} />}
          {nav === 'topics'    && <TopicsPage    {...shared} />}
          {nav === 'mocks'     && <MocksPage     {...shared} />}
          {nav === 'errors'    && <ErrorsPage    {...shared} />}
          {nav === 'analytics' && <AnalyticsPage {...shared} />}
          {nav === 'settings'  && <SettingsPage  {...shared} />}
        </div>
      </div>
    </div>
  )
}
