import { DAYS, SECTIONS, TOPICS } from './constants.js'
import { uid, todayStr } from '../utils/helpers.js'

export const mkDefaultSettings = () => ({
  targetScore:705, examDate:'2025-07-15', startDate:'2025-03-01',
  weeklyHours:20, maxDailyHours:6, autoRebalance:true, showCompleted:true,
})

export const mkDefaultTopics = () =>
  SECTIONS.flatMap(s=>TOPICS[s].map(topic=>{
    const base={
      Quant:{Arithmetic:72,Algebra:64,'Word Problems':57,'Number Properties':46,Geometry:68,
        'Coordinate Geometry':60,Statistics:73,Probability:40,Combinatorics:36,
        'Rates and Work':53,'Ratios and Proportions':66,Inequalities:58,Functions:51,Sequences:48},
      Verbal:{'Reading Comprehension':64,'Critical Reasoning':59,'Sentence Correction':71,
        'Assumption Questions':54,'Strengthen/Weaken':61,Inference:47,'Main Idea':69,
        Boldface:36,'Evaluate the Argument':54,'Logical Structure':59},
      'Data Insights':{'Data Sufficiency':50,'Multi-Source Reasoning':59,'Table Analysis':67,
        'Graphics Interpretation':71,'Two-Part Analysis':54,'Integrated Reasoning':59,
        'Charts and Graphs':64,'Quant-Verbal Hybrid':49},
    }
    const acc=(base[s]||{})[topic]||55
    const att=Math.round(15+Math.random()*25)
    const cor=Math.round(att*acc/100)
    const mastery=acc>=75?'Strong':acc>=65?'Improving':acc>=50?'Practicing':acc>=35?'Learning':'Not Started'
    return {
      id:uid(),section:s,topic,mastery,accuracy:acc,attempted:att,correct:cor,
      timeSpent:Math.round(1+Math.random()*4),
      lastStudied:acc>60?'2025-04-10':'2025-03-28',
      confidence:'Medium',priority:'Medium',notes:'',
      conceptDone:acc>65,errorCount:Math.round(Math.random()*3),
    }
  }))

export const mkSampleWeek = () => {
  const defs=[
    {di:0,title:'Arithmetic — Number Theory',section:'Quant',topic:'Arithmetic',type:'Concept Learning',estTime:45,difficulty:'Medium',priority:'High',status:'Completed'},
    {di:0,title:'Algebra — 20 practice questions',section:'Quant',topic:'Algebra',type:'Practice Questions',estTime:40,difficulty:'Medium',priority:'High',status:'Completed'},
    {di:0,title:'CR — Assumption question drill',section:'Verbal',topic:'Assumption Questions',type:'Practice Questions',estTime:35,difficulty:'Hard',priority:'High',status:'Completed'},
    {di:1,title:'Data Sufficiency — Core strategies',section:'Data Insights',topic:'Data Sufficiency',type:'Concept Learning',estTime:50,difficulty:'Hard',priority:'Critical',status:'Completed'},
    {di:1,title:'Word Problems — Rates & Work',section:'Quant',topic:'Rates and Work',type:'Practice Questions',estTime:40,difficulty:'Medium',priority:'Medium',status:'In Progress'},
    {di:1,title:'RC — Main Idea & Inference drill',section:'Verbal',topic:'Reading Comprehension',type:'Timed Set',estTime:45,difficulty:'Medium',priority:'High',status:'Not Started'},
    {di:2,title:'Error Log Review — Quant',section:'Quant',topic:'Algebra',type:'Error Log',estTime:30,difficulty:'Medium',priority:'High',status:'Not Started'},
    {di:2,title:'Number Properties — Flashcards',section:'Quant',topic:'Number Properties',type:'Flashcards',estTime:20,difficulty:'Easy',priority:'Medium',status:'Not Started'},
    {di:2,title:'Strengthen/Weaken questions',section:'Verbal',topic:'Strengthen/Weaken',type:'Practice Questions',estTime:40,difficulty:'Hard',priority:'High',status:'Not Started'},
    {di:3,title:'Full Mock Test #3',section:'Quant',topic:'Arithmetic',type:'Mock Test',estTime:180,difficulty:'Hard',priority:'Critical',status:'Not Started',locked:true},
    {di:4,title:'Mock Review — Quant errors',section:'Quant',topic:'Number Properties',type:'Review',estTime:60,difficulty:'Hard',priority:'Critical',status:'Not Started'},
    {di:4,title:'Mock Review — Verbal errors',section:'Verbal',topic:'Critical Reasoning',type:'Review',estTime:45,difficulty:'Hard',priority:'Critical',status:'Not Started'},
    {di:5,title:'Probability & Combinatorics',section:'Quant',topic:'Probability',type:'Concept Learning',estTime:50,difficulty:'Hard',priority:'Medium',status:'Not Started'},
    {di:5,title:'Coordinate Geometry practice',section:'Quant',topic:'Coordinate Geometry',type:'Practice Questions',estTime:35,difficulty:'Medium',priority:'Medium',status:'Not Started'},
    {di:6,title:'Weekly revision — all sections',section:'Quant',topic:'Arithmetic',type:'Revision',estTime:90,difficulty:'Medium',priority:'High',status:'Not Started'},
  ]
  const days=DAYS.map((name,i)=>({
    name,available:i<6,hours:i===5?4:i===6?2:3,intensity:i===3?'Heavy':'Medium',
    allowMock:i===3,preferRevision:i===6,tasks:[],hoursLogged:i<2?3:0,notes:'',
    attempted:i<2?18:0,correct:i<2?12:0,energy:'Medium',confidence:'Medium',wellNotes:'',hardNotes:'',
  }))
  defs.forEach(({di,...rest})=>days[di].tasks.push({...rest,id:uid(),date:todayStr(),locked:rest.locked||false,notes:''}))
  return {
    id:uid(),label:'Week 3 — Mock Focus',
    start:new Date(Date.now()-14*864e5).toISOString().split('T')[0],end:'',
    goals:{hours:20,quant:8,verbal:6,di:4,mocks:1,questions:80,revision:2,errorLog:2},
    days,locked:false,
  }
}

export const mkSampleMocks = () => [
  {id:uid(),name:'GMAT Official Practice 1',date:'2025-03-10',total:615,quant:42,verbal:36,di:74,percentile:'42',timingNotes:'Ran out of time on Verbal',guessed:8,sillyMistakes:5,conceptErrors:12,timingErrors:6,weakAreas:'Number Properties, CR Inference',reviewed:true,actionItems:'Drill Number Properties, review CR inference'},
  {id:uid(),name:'GMAT Official Practice 2',date:'2025-03-24',total:645,quant:46,verbal:39,di:78,percentile:'55',timingNotes:'Better pacing, still rushed last 5',guessed:5,sillyMistakes:3,conceptErrors:8,timingErrors:4,weakAreas:'Probability, RC Main Idea',reviewed:true,actionItems:'Study probability, RC passage mapping'},
  {id:uid(),name:'GMAT Official Practice 3',date:'2025-04-07',total:665,quant:48,verbal:40,di:80,percentile:'63',timingNotes:'Good on Quant, Verbal inconsistent',guessed:4,sillyMistakes:2,conceptErrors:6,timingErrors:3,weakAreas:'Boldface, Data Sufficiency',reviewed:false,actionItems:'Boldface framework, DS elimination method'},
]

export const mkSampleErrors = () => [
  {id:uid(),date:'2025-03-11',section:'Quant',topic:'Number Properties',source:'OG 2024',qid:'Q147',errorType:'Concept Gap',difficulty:'Hard',correctAnswer:'B',myAnswer:'D',explanation:'Missed even/odd divisibility rule',lesson:'Review divisibility rules for all integers',reattemptDate:'2025-03-18',resolved:true},
  {id:uid(),date:'2025-03-25',section:'Quant',topic:'Probability',source:'Manhattan Prep',qid:'Q212',errorType:'Concept Gap',difficulty:'Hard',correctAnswer:'E',myAnswer:'B',explanation:'Forgot complement rule',lesson:'P(A)=1−P(not A)',reattemptDate:'2025-04-01',resolved:false},
  {id:uid(),date:'2025-03-26',section:'Verbal',topic:'Boldface',source:'OG 2024',qid:'V134',errorType:'Strategy Issue',difficulty:'Hard',correctAnswer:'A',myAnswer:'C',explanation:'Confused argument structure roles',lesson:'Map boldface roles before reading choices',reattemptDate:'2025-04-02',resolved:false},
  {id:uid(),date:'2025-04-08',section:'Data Insights',topic:'Data Sufficiency',source:'GMAT Official',qid:'D067',errorType:'Trap Answer',difficulty:'Hard',correctAnswer:'B',myAnswer:'D',explanation:'Chose both when only one was needed',lesson:'Test DS statements in isolation first',reattemptDate:'2025-04-15',resolved:false},
]
