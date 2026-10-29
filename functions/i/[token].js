// Invite page: https://ryvalapp.com/i/<token>
// Server-rendered so link previews (iMessage, WhatsApp) show "Lee invited you to compete on Ryval".
// Data comes from the public, read-only Cloud Function `invitePreviewPublic` (first name + state only).

const PREVIEW_URL = 'https://us-central1-fitly-cae88.cloudfunctions.net/invitePreviewPublic';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.hackneymanlee2.ryval';
const APP_STORE_URL = null; // set to the App Store link once the iOS app is live
const TOKEN_RE = /^[A-HJ-NP-Z2-9]{12}$/;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadInvite(token, ctx) {
  if (!TOKEN_RE.test(token)) return { state: 'not_found', fromName: null, fromCode: null };
  try {
    const res = await fetch(`${PREVIEW_URL}?t=${token}`, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (res.status === 404) return { state: 'not_found', fromName: null, fromCode: null };
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return { state: 'error', fromName: null, fromCode: null };
  }
}

function page({ token, invite, origin }) {
  const name = typeof invite.fromName === 'string' ? invite.fromName : null;
  const ok = invite.state === 'ok';
  const title = ok
    ? (name ? `${name} invited you to compete on Ryval` : "You're invited to compete on Ryval")
    : 'Ryval — your biggest competition is you';
  const desc = 'Ryval tracks your workouts and heart rate, then scores them. Take on a friend\'s workouts and see who scores more.';
  const heading = ok
    ? (name ? `${esc(name)} invited you to compete` : "You're invited to compete")
    : invite.state === 'expired' ? 'This invite has expired'
    : invite.state === 'error' ? 'Ryval' : 'This invite link isn\'t valid';
  const sub = ok
    ? esc(desc)
    : invite.state === 'expired'
      ? `Ask ${name ? esc(name) : 'your friend'} for a new link. Invites last 7 days.`
      : 'Ryval tracks your workouts and heart rate, then scores them.';
  const code = typeof invite.fromCode === 'string' && invite.fromCode ? `${invite.fromCode.slice(0, 4)} ${invite.fromCode.slice(4)}` : null;
  const appLink = `ryval://invite/${token}`;
  const ios = APP_STORE_URL
    ? `<a class="store" href="${APP_STORE_URL}"><small>Download on the</small>App Store</a>`
    : `<span class="store soon"><small>Coming soon on</small>iPhone</span>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${origin}/images/og-invite.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${origin}/i/${esc(token)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="/images/favicon.jpg">
<style>
*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:440px;margin:0 auto;padding:28px 20px 48px}
.brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:17px}
.hero{margin-top:22px;border-radius:16px;overflow:hidden;background:#141414;border:1px solid rgba(255,255,255,.06)}
.hero img{display:block;width:100%;height:auto}
h1{font-size:28px;line-height:33px;margin:22px 0 0;font-weight:800;letter-spacing:-.3px}
p{color:#999;font-size:15px;line-height:22px;margin:10px 0 0}
.open{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:26px;background:#fff;color:#000;font-weight:700;font-size:16px;text-decoration:none;margin-top:24px}
.stores{display:flex;gap:10px;margin-top:12px}
.store{flex:1;height:52px;border-radius:12px;background:#1f1f1f;color:#fff;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:15px;line-height:17px}
.store small{font-size:10px;font-weight:600;color:#aaa}
.store.soon{color:#777}
.code{margin-top:16px;background:#141414;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}
.code b{display:block;font-size:20px;font-weight:500;letter-spacing:3px;margin-top:3px}
.lbl{font-size:10px;font-weight:700;color:#777;letter-spacing:1.5px;text-transform:uppercase}
.copy{background:#1f1f1f;color:#fff;border:0;border-radius:17px;height:34px;padding:0 14px;font-weight:700;font-size:13px}
.note{font-size:12px;color:#777;line-height:17px;margin-top:12px}
footer{margin-top:32px;font-size:12px;color:#555}footer a{color:#888}
</style></head>
<body><main>
<div class="brand"><img src="/images/ryval-logo.png" alt="" height="26">Ryval</div>
<div class="hero"><img src="/images/og-invite.png" width="1200" height="630" alt="Two points lines: you against a friend, you win by 12 points"></div>
<h1>${heading}</h1>
<p>${sub}</p>
${ok ? `<a class="open" href="${appLink}">Open in Ryval</a>` : ''}
<div class="stores"><a class="store" href="${PLAY_URL}"><small>Get it on</small>Google Play</a>${ios}</div>
${ok && code ? `<div class="code"><div><div class="lbl">Invite code</div><b>${esc(code)}</b></div><button class="copy" data-code="${esc(invite.fromCode)}">Copy</button></div>
<div class="note">After installing, open this link again to add ${name ? esc(name) : 'your friend'} straight away, or enter the code in Friends › Enter a code.</div>` : ''}
<footer><a href="/">ryvalapp.com</a> · <a href="/privacy.html">Privacy</a></footer>
</main>
<script>
document.querySelectorAll('.copy').forEach(function(b){b.addEventListener('click',function(){
  navigator.clipboard && navigator.clipboard.writeText(b.dataset.code).then(function(){b.textContent='Copied';});
});});
</script>
</body></html>`;
}

export async function onRequestGet(ctx) {
  const token = String(ctx.params.token || '').toUpperCase();
  const invite = await loadInvite(token, ctx);
  const origin = new URL(ctx.request.url).origin;
  return new Response(page({ token, invite, origin }), {
    status: invite.state === 'not_found' ? 404 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    },
  });
}
