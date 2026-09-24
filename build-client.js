/* Check the release, never clear unrelated browser data or install a worker. */
(() => {
  const build = window.FORJA_BUILD;
  if (!build) return;
  const draftKey = 'forja-unsent-draft';
  const input = document.querySelector('#visitor-idea');
  try {const draft=sessionStorage.getItem(draftKey);if(draft&&input&&!input.value)input.value=draft;sessionStorage.removeItem(draftKey);} catch {}
  let checking = false, last = 0;
  async function check() {
    if (checking || document.hidden || Date.now()-last<60000) return;
    checking=true;last=Date.now();
    const abort = new AbortController(), timer=setTimeout(()=>abort.abort(),5000);
    try {
      const response=await fetch(`build.json?check=${Date.now()}`,{cache:'no-store',signal:abort.signal});
      if(!response.ok)return;
      const next=await response.json();
      if(!/^[a-f0-9]{12}$/.test(next.id)||next.id===build)return;
      // An unsent message is functional session data, never sent to a server.
      try{if(input?.value)sessionStorage.setItem(draftKey,input.value);}catch{if(input?.value)return;}
      const url=new URL(location.href);url.searchParams.set('build',next.id);url.searchParams.delete('lang');
      location.replace(url.href);
    } catch {} finally {clearTimeout(timer);checking=false;}
  }
  window.addEventListener('pageshow',check);
  document.addEventListener('visibilitychange',check);
  setInterval(check,300000);
  check();
})();
