import { NAV_GROUPS } from '../../data/constants.js'

export function Sidebar({ nav, setNav, sideOpen, setSideOpen, daysLeft, settings, latestMock, readiness }) {
  return (
    <div style={{
      width:sideOpen?224:54,flexShrink:0,background:'#1E1B4B',
      display:'flex',flexDirection:'column',transition:'width 0.2s ease',
      overflow:'hidden',position:'sticky',top:0,height:'100vh',zIndex:10,
    }}>
      {/* Logo */}
      <div style={{padding:'1rem 14px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid rgba(255,255,255,.08)',minHeight:56}}>
        <div style={{width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#7C3AED,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:13,flexShrink:0}}>G</div>
        {sideOpen&&<div style={{color:'#fff',fontWeight:700,fontSize:13,lineHeight:1.3,whiteSpace:'nowrap'}}>GMAT OS<br/><span style={{color:'#818CF8',fontSize:10,fontWeight:400}}>Study Command Center</span></div>}
        <button onClick={()=>setSideOpen(s=>!s)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,.4)',fontSize:12,flexShrink:0,padding:4}}>{sideOpen?'◀':'▶'}</button>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:'6px 0',overflowY:'auto',overflowX:'hidden'}}>
        {NAV_GROUPS.map((g,gi)=>(
          <div key={gi}>
            {sideOpen&&g.label&&<div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,.25)',padding:'10px 14px 2px',textTransform:'uppercase',letterSpacing:1.2}}>{g.label}</div>}
            {g.items.map(({k,icon,label})=>(
              <button key={k} onClick={()=>setNav(k)} style={{
                display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 14px',
                border:'none',borderLeft:nav===k?'3px solid #7C3AED':'3px solid transparent',
                background:nav===k?'rgba(124,58,237,.22)':'transparent',cursor:'pointer',
                color:nav===k?'#C4B5FD':'rgba(255,255,255,.55)',
                fontSize:12.5,fontWeight:nav===k?700:400,
                textAlign:'left',transition:'all .15s',boxSizing:'border-box',
                whiteSpace:'nowrap',fontFamily:'inherit',
              }}>
                <span style={{fontSize:15,flexShrink:0,width:20,textAlign:'center'}}>{icon}</span>
                {sideOpen&&label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {sideOpen&&(
        <div style={{padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,.08)',fontSize:11,color:'rgba(255,255,255,.35)',lineHeight:2}}>
          {daysLeft!==null&&<div>📅 {daysLeft}d to exam</div>}
          <div>🎯 Target: {settings.targetScore}</div>
          {latestMock&&<div>📋 Last mock: {latestMock.total}</div>}
          <div>💪 Readiness: {readiness}%</div>
        </div>
      )}
    </div>
  )
}
