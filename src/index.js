/**
 * Serve static landing assets; force HTTPS + apex host at the edge.
 * Zone "Always Use HTTPS" requires dashboard permission we don't have via API.
 */
function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let redirected = false;

    if (!isLocalHost(url.hostname) && url.protocol === 'http:') {
      url.protocol = 'https:';
      redirected = true;
    }
    if (url.hostname === 'www.tradali.com') {
      url.hostname = 'tradali.com';
      redirected = true;
    }
    if (redirected) {
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const headers = new Headers(response.headers);

    if (/\.(?:jpg|jpeg|png|svg|webp|woff2|css|js|ico)$/i.test(path)) {
      headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    } else if (path === '/robots.txt' || path === '/sitemap.xml') {
      headers.set('Cache-Control', 'public, max-age=3600');
    } else if (path === '/' || path.endsWith('.html')) {
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
