import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const store = path.join("/tmp", "shoreline-logo-votes.json");
const port = Number(process.env.PORT || 4175);

function readVotes() {
  try {
    const data = JSON.parse(fs.readFileSync(store, "utf8"));
    return {
      kingfisher: Number(data.kingfisher) || 0,
      h4: Number(data.h4) || 0,
    };
  } catch {
    return { kingfisher: 0, h4: 0 };
  }
}

function writeVotes(votes) {
  fs.writeFileSync(store, JSON.stringify(votes));
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".ico": "image/x-icon",
      ".xml": "application/xml",
    }[ext] || "application/octet-stream"
  );
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/api/logo-vote") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") {
      const votes = readVotes();
      res.end(JSON.stringify({ ...votes, total: votes.kingfisher + votes.h4 }));
      return;
    }
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch {}
      const choice = String(body.choice || "");
      if (choice !== "kingfisher" && choice !== "h4") {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "choice must be kingfisher or h4" }));
        return;
      }
      const votes = readVotes();
      votes[choice] += 1;
      writeVotes(votes);
      res.end(JSON.stringify({ ...votes, total: votes.kingfisher + votes.h4, voted: choice }));
      return;
    }
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method not allowed" }));
    return;
  }

  let filePath = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname === "/" || url.pathname === "") filePath = path.join(root, "index.html");
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  res.setHeader("Content-Type", contentType(filePath));
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Vote preview at http://127.0.0.1:${port}/#logo-vote`);
});
