// Paste into the browser console on the client's homepage (or run via a browser tool).
// Returns: page copy, brand colours by frequency, fonts, h1 style, every image URL, gradients, favicon.
(async () => {
  window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 2500)); window.scrollTo(0, 0);
  const cv = document.createElement('canvas').getContext('2d');
  const hex = c => { cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(x => x.toString(16).padStart(2, '0')).join(''); };
  const cnt = {};
  [...document.querySelectorAll('*')].slice(0, 5000).forEach(e => { const s = getComputedStyle(e); [s.color, s.backgroundColor, s.borderTopColor].forEach(c => { if (c && !c.includes('rgba(0, 0, 0, 0)')) { const h = hex(c); cnt[h] = (cnt[h] || 0) + 1; } }); });
  const h1 = document.querySelector('h1'); const hs = h1 && getComputedStyle(h1);
  return {
    title: document.title,
    colors: Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 20),
    bodyFont: getComputedStyle(document.body).fontFamily,
    h1: hs && { font: hs.fontFamily, size: hs.fontSize, weight: hs.fontWeight, color: hex(hs.color) },
    gradients: [...new Set([...document.querySelectorAll('*')].slice(0, 5000).map(e => getComputedStyle(e).backgroundImage).filter(b => b.includes('gradient')))].slice(0, 8),
    images: [...new Set([...document.querySelectorAll('img')].map(i => (i.currentSrc || i.src).split('?')[0]))],
    favicon: [...document.querySelectorAll('link[rel*=icon]')].map(l => l.href),
    text: (document.querySelector('main') || document.body).innerText.slice(0, 20000),
  };
})();
