const crypto = require('crypto');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    }

    const { files } = req.body || {};
    if (!files || !files['index.html']) {
      return res.status(400).json({
        error: 'FILES_REQUIRED',
        example: {
          files: {
            "index.html": "<h1>Hello Netlify</h1>"
          }
        }
      });
    }

    const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
    if (!NETLIFY_TOKEN) {
      return res.status(500).json({ error: 'NETLIFY_TOKEN_MISSING' });
    }

    // 1️⃣ CREATE SITE
    const siteRes = await fetch(
      'https://api.netlify.com/api/v1/sites',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`
        }
      }
    );

    const site = await siteRes.json();
    if (!site.id) return res.status(500).json(site);

    // 2️⃣ HASH FILES
    const hashes = {};
    for (const path in files) {
      const hash = crypto
        .createHash('sha1')
        .update(files[path])
        .digest('hex');
      hashes[path] = hash;
    }

    // 3️⃣ CREATE DEPLOY
    const deployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: hashes })
      }
    );

    const deploy = await deployRes.json();
    if (!deploy.id) return res.status(500).json(deploy);

    // 4️⃣ UPLOAD FILES
    for (const path in files) {
      await fetch(
        `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${path}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'text/html'
          },
          body: files[path]
        }
      );
    }

    return res.json({
      url: site.ssl_url || site.url,
      state: 'ready'
    });

  } catch (e) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: e.message
    });
  }
};
