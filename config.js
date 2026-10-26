window.SUPABASE_URL = 'https://qpohdnsncqdoxdlremao.supabase.co';
window.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_jbehxkxbFYT5p2KHP8cPXQ_CanBoIH7';
window.SITE_URL = 'https://murgabadri.github.io/abpromoters/';

(function(){
  const path=location.pathname||'/';
  const isAdmin=/\/admin\.html$/i.test(path);
  function start(){
    if(!window.supabase)return setTimeout(start,300);
    const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
    if(!isAdmin){
      try{
        const keyName='abp_viewer_key';
        let key=localStorage.getItem(keyName);
        if(!key){key=crypto.randomUUID();localStorage.setItem(keyName,key)}
        client.from('site_page_views').insert({page_path:path,viewer_key:key}).then(()=>{}).catch(()=>{});
      }catch(e){}
      return;
    }
    const boot=()=>{
      const panel=document.querySelector('#panel');
      if(!panel)return setTimeout(boot,300);
      if(panel.hidden)return setTimeout(boot,700);
      if(document.querySelector('#siteAnalytics'))return;
      const wrap=document.createElement('section');
      wrap.id='siteAnalytics';
      wrap.style.cssText='margin:0 0 28px;padding:18px;border:1px solid #ddd;border-radius:14px;background:#fff';
      wrap.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><p class="eyebrow" style="margin-bottom:4px">WEBSITE ANALYTICS</p><h2 style="margin:0">Daily Visitors & Page Views</h2><p id="analyticsStatus" class="muted" style="margin:6px 0 0">Loading analytics…</p></div><button class="btn small" id="refreshAnalytics" type="button">↻ Refresh</button></div><div id="analyticsCards" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px"></div><div id="analyticsTable" style="margin-top:16px;overflow:auto"></div>';
      panel.insertBefore(wrap,panel.firstChild);
      const cards=document.querySelector('#analyticsCards'),table=document.querySelector('#analyticsTable'),status=document.querySelector('#analyticsStatus');
      const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
      const dayKey=d=>d.toISOString().slice(0,10);
      const label=d=>d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      const load=async()=>{
        status.textContent='Loading analytics…';
        const {data,error}=await client.from('site_page_views').select('page_path,viewed_on,viewer_key,created_at').order('created_at',{ascending:false}).limit(10000);
        if(error){status.textContent='Unable to load analytics: '+error.message;return}
        const rows=data||[],today=dayKey(new Date()),todayRows=rows.filter(r=>r.viewed_on===today),unique=r=>new Set(r.map(x=>x.viewer_key).filter(Boolean)).size;
        const since7=new Date();since7.setDate(since7.getDate()-6);const since7Key=dayKey(since7),weekRows=rows.filter(r=>r.viewed_on>=since7Key);
        const since30=new Date();since30.setDate(since30.getDate()-29);const monthKey=dayKey(since30),monthRows=rows.filter(r=>r.viewed_on>=monthKey);
        const pageCounts={};todayRows.forEach(r=>{pageCounts[r.page_path]=(pageCounts[r.page_path]||0)+1});
        const top=Object.entries(pageCounts).sort((a,b)=>b[1]-a[1])[0];
        cards.innerHTML=[['Today Visitors',unique(todayRows)],['Today Page Views',todayRows.length],['7-Day Page Views',weekRows.length],['30-Day Page Views',monthRows.length]].map(x=>'<div style="padding:14px;border:1px solid #e4e4e4;border-radius:10px;background:#fafafa"><small style="display:block;color:#777">'+esc(x[0])+'</small><strong style="font-size:25px;display:block;margin-top:4px">'+x[1]+'</strong></div>').join('');
        const daily=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=dayKey(d),r=rows.filter(x=>x.viewed_on===k);daily.push({k,label:label(d),views:r.length,visitors:unique(r)})}
        const topText=top?esc(top[0])+' ('+top[1]+' views today)':'No page views today';
        table.innerHTML='<p class="muted"><strong>Top page today:</strong> '+topText+'</p><table class="bulk-table"><thead><tr><th>Date</th><th>Unique Visitors</th><th>Page Views</th></tr></thead><tbody>'+daily.map(x=>'<tr><td>'+x.label+'</td><td>'+x.visitors+'</td><td>'+x.views+'</td></tr>').join('')+'</tbody></table>';
        status.textContent='Updated '+new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
      };
      document.querySelector('#refreshAnalytics').onclick=load;
      load();
    };
    boot();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
