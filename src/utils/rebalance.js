import { todayIdx } from './helpers.js'

// Greedy bin-pack: collect pending tasks → sort by priority+weak-topic → fill capacity buckets
export const buildRebalanceProposal = ({ week, settings, weakTopicNames=[] }) => {
  const today  = todayIdx()
  const maxH   = settings.maxDailyHours || 6

  // 1. Collect non-locked incomplete tasks from today and earlier
  const pending = []
  week.days.forEach((d,i) => {
    if(i>today) return
    d.tasks.filter(t=>!t.locked&&!['Completed','Deferred'].includes(t.status))
            .forEach(t=>pending.push({...t,_fromDay:d.name,_fromIdx:i}))
  })

  // 2. Sort: priority score + +50 boost for weak topics
  const pScore = {Critical:400,High:300,Medium:200,Low:100}
  pending.sort((a,b)=>{
    const wa=weakTopicNames.includes(a.topic)?50:0
    const wb=weakTopicNames.includes(b.topic)?50:0
    return (pScore[b.priority]+wb)-(pScore[a.priority]+wa)
  })

  // 3. Build capacity buckets for remaining available days
  const buckets = week.days
    .map((d,i)=>({...d,idx:i}))
    .filter((_,i)=>i>today)
    .filter(d=>d.available)
    .map(d=>({
      name:d.name, idx:d.idx, allowMock:d.allowMock,
      capacityMin: Math.min(d.hours,maxH)*60,
      usedMin: d.tasks.filter(t=>t.locked||['Completed','Deferred'].includes(t.status)).reduce((a,t)=>a+t.estTime,0),
      tasks:[],
    }))

  if(!buckets.length) return { error:'No available days remain after today.', pending, buckets:[], overflow:[] }

  // 4. Greedy assign each task to the first bucket with headroom
  const overflow=[]
  pending.forEach(task=>{
    const isMock=task.type==='Mock Test'
    const bucket=buckets.find(b=>(!isMock||b.allowMock)&&b.usedMin+task.estTime<=b.capacityMin+15)
      ||(!isMock?buckets.reduce((best,b)=>(!best||b.usedMin<best.usedMin)?b:best,null):null)
    if(bucket){bucket.tasks.push(task);bucket.usedMin+=task.estTime}
    else overflow.push(task)
  })

  // 5. Warnings
  const warnings=[]
  if(overflow.length) warnings.push(`${overflow.length} task(s) could not fit — listed as overflow.`)
  buckets.forEach(b=>{const l=b.usedMin/(b.capacityMin||1);if(l>.95)warnings.push(`${b.name} is at ${Math.round(l*100)}% capacity.`)})
  if(pending.length===0) warnings.push('Nothing to rebalance — you are on schedule! 🎉')

  return { pending, buckets, overflow, warnings, error:null }
}
