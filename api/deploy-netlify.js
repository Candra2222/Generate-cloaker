module.exports = async (req, res) => {
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

    const token = process.env.NETLIFY_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'NETLIFY_TOKEN_MISSING' });
    }

    // Create site
    const siteRes = await fetch(
      'https://api.netlify.com/api/v1/sites',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const site = await siteRes.json();
    if (!site.id) return res.status(500).json(site);

    // Deploy files
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

    return res.json({
      url: site.ssl_url || site.url,
      state: deploy.state
    });

  } catch (err) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message
    });
  }
};
