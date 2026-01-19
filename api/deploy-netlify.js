export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
  if (!NETLIFY_TOKEN) {
    return res.status(500).json({ error: 'NETLIFY_TOKEN belum diset' });
  }

  const { files } = req.body;
  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'Tidak ada file' });
  }

  // 1. Buat site baru
  const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const site = await siteRes.json();
  if (!site.id) return res.status(500).json(site);

  // 2. Deploy file
  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files })
    }
  );

  const deploy = await deployRes.json();

  res.json({
    url: site.ssl_url || site.url,
    state: deploy.state
  });
}
