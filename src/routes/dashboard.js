const Router = require('express-promise-router');
const { WorkOS } = require('@workos-inc/node');
const db = require('../db');

const router = new Router();
const workos = new WorkOS(process.env.WORKOS_API_KEY);

// middleware to require a valid user session to view these routes
router.use(async (req, res, next) => {
	if (!req.session.user || !req.session.user.id) {
		res.redirect('/');
		return;
	}

	// roles may change at any time via webhook, so always check first
	const roles = await db.getUserRolesByEmail(req.session.user.email);
	req.session.user.roles = [...roles.values()];

	next();
});

router.get('/', async (req, res) => {
	res.render('dashboard/index', {
		user: req.session.user,
		posts: await db.getAllPosts(),
	});
});

router.get('/team', async (req, res) => {
	const users = await workos.directorySync.listUsers({
		directory: process.env.WORKOS_DIRECTORY_ID,
	});

	const teammates = users.list.data
		.filter((user) => {
			return !user.emails.some((e) => e.value === req.session.user.email);
		})
		.map(({ id, emails, firstName, lastName, groups }) => {
			console.log(groups);
			return {
				firstName,
				lastName,
				email: emails.at(0).value,
				groups: groups.map((g) => g.name).join(', '),
				inviteLink: `/api/invite/${id}`,
			};
		});

	res.render('dashboard/team', { teammates, user: req.session.user });
});

router.get('/new', (req, res) => {
	res.render('dashboard/new', { user: req.session.user });
});

router.post('/new', async (req, res) => {
	const { title, content } = req.body;
	const user_id = req.session.user.id;

	try {
		const result = await db.query(
			db.sql`
        INSERT INTO posts (user_id, title, content)
          VALUES ($1, $2, $3)
      `,
			[user_id, title, content],
		);

		console.log(result);
	} catch (err) {
		console.error(err);
	}

	res.redirect('/dashboard');
});

module.exports = router;
