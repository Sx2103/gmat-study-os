import { pct, clamp } from './helpers.js'

// Readiness = mock proximity 30% + accuracy 25% + syllabus 20% + consistency 15% + error resolution 10%
export const calcReadiness = ({ topics, mocks, weeks, errors, settings }) => {
  const avgMock    = mocks.length ? Math.round(mocks.reduce((a,m)=>a+(parseInt(m.total)||0),0)/mocks.length) : 0
  const latestMock = [...mocks].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const totalQ     = topics.reduce((a,t)=>a+t.attempted,0)
  const totalCor   = topics.reduce((a,t)=>a+t.correct,0)
  const overallAcc = pct(totalCor,totalQ)
  const syllabus   = pct(topics.filter(t=>['Improving','Strong','Mastered'].includes(t.mastery)).length,topics.length)
  const active     = weeks.filter(w=>w.days.reduce((a,d)=>a+(d.hoursLogged||0),0)>=5).length
  const consistency= pct(active,Math.max(weeks.length,1))
  const errRate    = errors.length ? pct(errors.filter(e=>e.resolved).length,errors.length) : 100
  const mockProx   = mocks.length ? Math.min(100,pct(avgMock,settings.targetScore)) : 0
  const score      = clamp(Math.round(mockProx*.30+overallAcc*.25+syllabus*.20+consistency*.15+errRate*.10),0,100)
  return { score, breakdown:{mockProx,overallAcc,syllabus,consistency,errRate}, avgMock, latestMock, overallAcc }
}
