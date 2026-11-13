
const ALLOWED = ["https://oksuuu.github.io"];

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
      "Vary": "Origin",
      "Content-Type": "application/json",
    };
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const rec = url.searchParams.get("rec");

    const key = env.TMDB_KEY || "";
    const init = {};
    const auth = new URLSearchParams({ language: "ko-KR", include_adult: "false" });
    if (key.length > 60) init.headers = { Authorization: "Bearer " + key, accept: "application/json" };
    else auth.set("api_key", key);

    const tmdb = (path, extra = {}) => {
      const p = new URLSearchParams(auth);
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      return fetch("https://api.themoviedb.org/3" + path + "?" + p, init);
    };

    // 추천: ?rec=영화ID
    if (rec) {
      if (!/^\d+$/.test(rec)) return new Response('{"results":[]}', { status: 400, headers: cors });
      let r = await tmdb("/movie/" + rec + "/recommendations");
      if (!r.ok) return new Response(r.body, { status: r.status, headers: cors });
      let data = await r.json();
      if (!(data.results || []).some(m => m.poster_path)) {
        const r2 = await tmdb("/movie/" + rec + "/similar");
        if (r2.ok) data = await r2.json();
      }
      const results = (data.results || []).filter(m => m.poster_path).slice(0, 20);
      return new Response(JSON.stringify({ results }), {
        headers: { ...cors, "Cache-Control": "public, max-age=3600" },
      });
    }

    // 검색: ?q=제목
    if (!q) return new Response('{"results":[]}', { headers: cors });
    const r = await tmdb("/search/movie", { query: q });
    return new Response(r.body, { status: r.status, headers: cors });
  },
};
