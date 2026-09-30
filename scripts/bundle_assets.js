// Paste into the browser console ON THE CLIENT'S SITE (same-origin fetch). Edit PATHS first.
// Downloads ONE file "<name>-assets-bundle.json" with every image as a data URL.
// Then run: python3 scripts/decode_bundle.py ~/Downloads/<name>-assets-bundle.json public/projects/<name>
(async () => {
  const NAME = 'client';
  const PATHS = [ /* '/images/logo.png', '/assets/work/w1.png', ... (same-origin paths or full URLs) */ ];
  const toData = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  const bundle = {}, fails = [];
  for (const p of PATHS) { try { const r = await fetch(p); if (!r.ok) { fails.push(p + ' ' + r.status); continue; } bundle[p.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '')] = await toData(await r.blob()); } catch (e) { fails.push(p + ' ' + e); } }
  const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = NAME + '-assets-bundle.json'; document.body.appendChild(a); a.click();
  return { count: Object.keys(bundle).length, bytes: blob.size, fails };
})();
