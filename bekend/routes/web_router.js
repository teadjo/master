const webpush = require('web-push');
const pool = require('../DBconnection/dbconnection');

// Podesi VAPID ključeve
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Endpoint za subscription
app.post('/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;
  
  try {
    // Sačuvaj subscription u bazu
    await pool.query(
      `INSERT INTO public."PushSubscriptions" (endpoint, p256dh, auth, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = $2, auth = $3, user_id = $4`,
      [subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userId]
    );
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// Proveri da li korisnik već ima pretplatu
app.get('/subscription/check/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT id FROM public."PushSubscriptions" WHERE user_id = $1`,
    [userId]
  );
  res.json({ hasSubscription: result.rows.length > 0 });
});