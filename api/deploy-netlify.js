export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.NETLIFY_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'NETLIFY_TOKEN_NOT_SET' });
  }

  const { files } = req.body;

  if (!files || !files['index.html']) {
    return res.status(400).json({
      error: 'FILES_INVALID',
      message: 'Minimal harus ada index.html'
    });
  }

  // 1️⃣ CREATE SITE
  const siteRes = await fetch(
    'https://api.netlify.com/api/v1/sites',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const site = await siteRes.json();
  if (!site.id) return res.status(500).json(site);

  // 2️⃣ CREATE DEPLOY
  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files })
    }
  );

  const deploy = await deployRes.json();

  res.json({
    url: site.ssl_url || site.url,
    deploy_state: deploy.state
  });
}
