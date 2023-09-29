const Router = require('express-promise-router');
const db = require('../db');

const router = new Router();

router.post('/directory-sync', async (req, res) => {
	console.log(req.body);

	// TODO implement directory sync
	res.send('ok');
});

router.get('/invite/:id', async (req, res) => {
	// NOTE: the invite system is left out of this tutorial to reduce complexity
	console.log(`Invited user: ${req.params.id}`);

	res.redirect('/dashboard/team');
});

router.get('/delete-post/:post_id', async (req, res) => {
	await db.query(
		db.sql`
      DELETE FROM posts
      WHERE id = $1
    `,
		[req.params.post_id],
	);

	res.redirect('/dashboard');
});

module.exports = router;
