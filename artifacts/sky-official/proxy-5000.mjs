import http from "http";

const TARGET = 24534;
const LISTEN = 5000;

http.createServer((req, res) => {
  const opts = {
    hostname: "127.0.0.1",
    port: TARGET,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET}` },
  };
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res, { end: true });
  });
  proxy.on("error", () => { try { res.writeHead(502); res.end(); } catch {} });
  req.pipe(proxy, { end: true });
}).listen(LISTEN, "0.0.0.0", () => {
  console.log(`[proxy] :${LISTEN} → :${TARGET}`);
});
