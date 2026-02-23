const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app    = express();
const PORT   = 8080;
const ROOT   = __dirname;
const CONFIG = path.join(ROOT, 'config.json');
const DATA   = path.join(ROOT, 'works/data.json');

app.use(express.json());
app.use(express.static(ROOT));

// ===== Config helpers =====
function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  } catch {
    return { github: { token: '', owner: '', repo: '', branch: 'main', filePath: 'works/data.json' } };
  }
}

function writeConfig(data) {
  fs.writeFileSync(CONFIG, JSON.stringify(data, null, 2), 'utf8');
}

// ===== GitHub API push =====
async function pushToGitHub(gh, content) {
  const { token, owner, repo, branch = 'main', filePath = 'works/data.json' } = gh;

  const headers = {
    'Authorization':        `Bearer ${token}`,
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type':         'application/json',
    'User-Agent':           'face-portfolio-admin',
  };

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // 1. 現在のSHAを取得
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  let sha = null;
  if (getRes.ok) {
    const file = await getRes.json();
    sha = file.sha;
  } else if (getRes.status !== 404) {
    const err = await getRes.json();
    throw new Error(err.message || `GET failed: ${getRes.status}`);
  }

  // 2. ファイルをPUT（作成 or 更新）
  const body = {
    message:  'Update works data [admin]',
    content:  Buffer.from(content).toString('base64'),
    branch,
    committer: { name: 'Face Portfolio Admin', email: 'admin@face-portfolio' },
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method:  'PUT',
    headers,
    body:    JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || `PUT failed: ${putRes.status}`);
  }

  return await putRes.json();
}

// ===== Routes =====

// GET config
app.get('/api/config', (req, res) => {
  const cfg = readConfig();
  // tokenはマスクして返す
  const safe = { ...cfg };
  if (safe.github?.token) {
    safe.github = { ...safe.github, token: '••••' + safe.github.token.slice(-4) };
  }
  res.json(safe);
});

// POST config
app.post('/api/config', (req, res) => {
  try {
    const current = readConfig();
    const incoming = req.body;
    // tokenが '••••...' のままなら既存のtokenを維持
    if (incoming.github?.token?.startsWith('••••')) {
      incoming.github.token = current.github?.token || '';
    }
    writeConfig(incoming);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET works data
app.get('/api/works', (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(DATA, 'utf8')));
  } catch (e) {
    res.status(500).json({ error: 'Failed to read data.json' });
  }
});

// POST works data (save + optional GitHub push)
app.post('/api/works', async (req, res) => {
  try {
    const content = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(DATA, content, 'utf8');

    // GitHub push
    const cfg = readConfig();
    const gh  = cfg.github;
    if (gh?.token && gh?.owner && gh?.repo) {
      try {
        const result = await pushToGitHub(gh, content);
        const sha = result.content?.sha || result.commit?.sha || '';
        return res.json({ ok: true, github: { ok: true, sha: sha.slice(0, 7) } });
      } catch (ghErr) {
        return res.json({ ok: true, github: { error: ghErr.message } });
      }
    }

    res.json({ ok: true, github: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  Face Portfolio  →  http://127.0.0.1:${PORT}`);
  console.log(`  Works Admin     →  http://127.0.0.1:${PORT}/works/admin.html\n`);
});
