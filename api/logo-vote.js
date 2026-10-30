const fs = require("fs");
const path = require("path");

const STORE = path.join("/tmp", "shoreline-logo-votes.json");
const KEYS = ["kingfisher", "h4"];

function readVotes() {
  try {
    const raw = fs.readFileSync(STORE, "utf8");
    const data = JSON.parse(raw);
    return {
      kingfisher: Number(data.kingfisher) || 0,
      h4: Number(data.h4) || 0,
    };
  } catch {
    return { kingfisher: 0, h4: 0 };
  }
}

function writeVotes(votes) {
  fs.writeFileSync(STORE, JSON.stringify(votes));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === "GET") {
    const votes = readVotes();
    const total = votes.kingfisher + votes.h4;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ...votes, total }));
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch {
        body = {};
      }
    }
    if (!body || typeof body !== "object") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch {
        body = {};
      }
    }

    const choice = String(body.choice || "");
    if (!KEYS.includes(choice)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "choice must be kingfisher or h4" }));
    }

    const votes = readVotes();
    votes[choice] += 1;
    writeVotes(votes);
    const total = votes.kingfisher + votes.h4;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ...votes, total, voted: choice }));
  }

  res.statusCode = 405;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "method not allowed" }));
};
