export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
  const SITE_ID = process.env.NETLIFY_SITE_ID;

  if (!NETLIFY_TOKEN || !SITE_ID) {
    return res.status(500).json({ error: 'ENV Netlify belum lengkap' });
  }

  const { files } = req.body;
  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'Tidak ada file' });
  }

  // Deploy ke site yang sama
  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys`,
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
    url: deploy.ssl_url || deploy.url,
    state: deploy.state
  });
}
