// Cloudflare Worker: TMDB 검색을 대신 호출해서 API 키를 숨깁니다.
// TMDB_KEY 는 Cloudflare 대시보드의 Secret 으로만 설정합니다 (GitHub에 적지 않음).
const ALLOWED = ["https://oksuuu.github.io"]; // 내 GitHub Pages 주소

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
      "Vary": "Origin",
      "Content-Type": "application/json",
    };
    const q = new URL(req.url).searchParams.get("q");
    if (!q) return new Response('{"results":[]}', { headers: cors });

    const key = env.TMDB_KEY || "";
    const params = new URLSearchParams({ query: q, language: "ko-KR", include_adult: "false" });
    const init = {};
    if (key.length > 60) init.headers = { Authorization: "Bearer " + key, accept: "application/json" };
    else params.set("api_key", key);

    const r = await fetch("https://api.themoviedb.org/3/search/movie?" + params, init);
    return new Response(r.body, { status: r.status, headers: cors });
  },
};
