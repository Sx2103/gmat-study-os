import { DAYS } from '../data/constants.js'

export const uid       = () => `${Date.now()}-${Math.floor(Math.random()*1e6)}`
export const todayStr  = () => new Date().toISOString().split('T')[0]
export const todayName = () => DAYS[new Date().getDay()===0 ? 6 : new Date().getDay()-1]
export const todayIdx  = () => DAYS.indexOf(todayName())
export const pct       = (a,b) => b>0 ? Math.min(100, Math.round(a/b*100)) : 0
export const clamp     = (v,lo,hi) => Math.max(lo, Math.min(hi,v))
export const fmtH      = h => `${Math.round(h*10)/10}h`

// Task weight: harder + higher-priority tasks count more toward completion %
export const taskWeight = t => {
  const d = {Easy:1,Medium:1.5,Hard:2}[t.difficulty]||1.2
  const p = {Critical:2,High:1.5,Medium:1,Low:0.8}[t.priority]||1
  return Math.max(1, Math.round((t.estTime/30)*d*p))
}

// Weighted completion % — partial tasks count as 50%
export const completionPct = tasks => {
  const total = tasks.reduce((a,t)=>a+taskWeight(t),0)
  const done  = tasks.reduce((a,t)=>{
    if(t.status==='Completed') return a+taskWeight(t)
    if(t.status==='Partial')   return a+Math.round(taskWeight(t)*0.5)
    return a
  },0)
  return pct(done,total)
}

// Derive mastery from accuracy, volume, concept completion, errors, staleness
export const deriveMastery = topic => {
  const {accuracy,attempted,conceptDone,errorCount,lastStudied}=topic
  if(attempted<5)   return 'Learning'
  if(!conceptDone)  return 'Practicing'
  const days = lastStudied ? Math.round((Date.now()-new Date(lastStudied))/864e5) : 999
  const stale= days>21?-10:days>14?-5:0
  const adj  = accuracy+stale-(errorCount||0)*2
  if(adj>=80&&attempted>=20) return 'Mastered'
  if(adj>=70&&attempted>=12) return 'Strong'
  if(adj>=60&&attempted>=8)  return 'Improving'
  if(adj>=45&&attempted>=5)  return 'Practicing'
  return 'Learning'
}
