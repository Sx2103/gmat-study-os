import { NAV_GROUPS } from '../../data/constants.js'

export function TopBar({ nav, pills, daysLeft }) {
  const current = NAV_GROUPS.flatMap(g=>g.items).find(i=>i.k===nav)
  return (
    <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 1.5rem',display:'flex',alignItems:'center',gap:12,height:52,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,.04)'}}>
      <div style={{fontSize:13,fontWeight:700,color:'#1E293B',marginRight:4}}>{current?.label}</div>
      <div style={{flex:1,display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
        {pills.map(([ic,lb,cl])=>(
          <div key={lb} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 10px',background:'#F8FAFC',borderRadius:20,border:'1px solid #E2E8F0',fontSize:11.5,color:cl,fontWeight:600}}>
            {ic} {lb}
          </div>
        ))}
      </div>
      {daysLeft!==null&&<div style={{fontSize:12,color:daysLeft<14?'#EF4444':'#64748B',fontWeight:700}}>⏳ {daysLeft}d</div>}
    </div>
  )
}
