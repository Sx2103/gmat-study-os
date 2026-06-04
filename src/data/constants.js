export const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export const TASK_TYPES = [
  'Concept Learning','Practice Questions','Timed Set','Mock Test',
  'Review','Error Log','Flashcards','Revision','Video Lesson','Formula Review','Custom'
]

export const STATUS_OPTS   = ['Not Started','In Progress','Completed','Partial','Deferred']
export const DIFFICULTY    = ['Easy','Medium','Hard']
export const PRIORITY      = ['Low','Medium','High','Critical']
export const MASTERY_LEVELS= ['Not Started','Learning','Practicing','Improving','Strong','Mastered']
export const INTENSITY     = ['Light','Medium','Heavy']
export const ERROR_TYPES   = [
  'Concept Gap','Misread Question','Calculation Mistake',
  'Timing Issue','Trap Answer','Guess','Careless Mistake','Strategy Issue'
]

export const TOPICS = {
  Quant: [
    'Arithmetic','Algebra','Word Problems','Number Properties','Geometry',
    'Coordinate Geometry','Statistics','Probability','Combinatorics',
    'Rates and Work','Ratios and Proportions','Inequalities','Functions','Sequences'
  ],
  Verbal: [
    'Reading Comprehension','Critical Reasoning','Sentence Correction',
    'Assumption Questions','Strengthen/Weaken','Inference','Main Idea',
    'Boldface','Evaluate the Argument','Logical Structure'
  ],
  'Data Insights': [
    'Data Sufficiency','Multi-Source Reasoning','Table Analysis',
    'Graphics Interpretation','Two-Part Analysis','Integrated Reasoning',
    'Charts and Graphs','Quant-Verbal Hybrid'
  ],
}
export const SECTIONS = Object.keys(TOPICS)

export const C = {
  quant:   { bg:'#EFF6FF', border:'#BFDBFE', text:'#1D4ED8', solid:'#3B82F6' },
  verbal:  { bg:'#F5F3FF', border:'#DDD6FE', text:'#6D28D9', solid:'#7C3AED' },
  di:      { bg:'#ECFDF5', border:'#A7F3D0', text:'#065F46', solid:'#10B981' },
  mock:    { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E', solid:'#F59E0B' },
  error:   { bg:'#FEF2F2', border:'#FECACA', text:'#991B1B', solid:'#EF4444' },
  green:   { bg:'#F0FDF4', border:'#BBF7D0', text:'#14532D', solid:'#22C55E' },
  neutral: { bg:'#F8FAFC', border:'#E2E8F0', text:'#475569', solid:'#64748B' },
  amber:   { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E', solid:'#F59E0B' },
  red:     { bg:'#FEF2F2', border:'#FECACA', text:'#991B1B', solid:'#EF4444' },
}

export const sectionC = s => s==='Quant' ? C.quant : s==='Verbal' ? C.verbal : C.di
export const statusC  = s => ({
  Completed:C.green,'In Progress':C.quant,'Not Started':C.neutral,Partial:C.amber,Deferred:C.red
}[s]||C.neutral)
export const masteryC = m => ({
  Mastered:C.green,Strong:C.di,Improving:C.quant,Practicing:C.verbal,Learning:C.amber,'Not Started':C.neutral
}[m]||C.neutral)
export const diffC = d => ({Easy:C.green,Medium:C.amber,Hard:C.red}[d]||C.neutral)
export const prioC = p => ({Critical:C.red,High:C.amber,Medium:C.quant,Low:C.neutral}[p]||C.neutral)

export const NAV_GROUPS = [
  { items:[
    {k:'today',   icon:'📅',label:'Today'},
    {k:'weekly',  icon:'📋',label:'Weekly Planner'},
    {k:'daily',   icon:'✏️',label:'Daily Progress'},
    {k:'rebalance',icon:'⚖️',label:'Rebalancing'},
  ]},
  { label:'Progress', items:[
    {k:'progress',icon:'📊',label:'GMAT Progress'},
    {k:'topics',  icon:'🗂️',label:'Topic Tracker'},
    {k:'mocks',   icon:'🎯',label:'Mock Tests'},
    {k:'errors',  icon:'🔴',label:'Error Log'},
  ]},
  { label:'Insights', items:[
    {k:'analytics',icon:'💡',label:'Analytics'},
    {k:'settings', icon:'⚙️',label:'Settings'},
  ]},
]
