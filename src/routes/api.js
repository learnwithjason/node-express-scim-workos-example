const Router = require('express-promise-router');
const { WorkOS } = require('@workos-inc/node');
const db = require('../db');

const router = new Router();
const workos = new WorkOS(process.env.WORKOS_API_KEY);

router.post('/directory-sync', async (req, res) => {
	const payload = req.body;
	const sigHeader = req.headers['workos-signature'];

	// validate the event and get the data
	const webhook = workos.webhooks.constructEvent({
		payload,
		sigHeader,
		secret: process.env.WORKOS_WEBHOOK_SECRET,
	});

	switch (webhook.event) {
		case 'dsync.group.user_added':
		case 'dsync.group.user_removed':
			const { user, group } = webhook.data;
			const roles = await db.getUserRolesByEmail(user.username);

			if (webhook.event === 'dsync.group.user_added') {
				roles.add(group.name.toUpperCase());
			} else {
				roles.delete(group.name.toUpperCase());
			}

			await db.createOrUpdateUser({
				email: user.username,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: [...roles.values()],
				active: user.state === 'active',
			});
			break;

		case 'dsync.user.created':
			await db.createOrUpdateUser({
				email: webhook.data.username,
				firstName: webhook.data.firstName,
				lastName: webhook.data.lastName,
				roles: [],
				active: webhook.data.state === 'active',
			});
			break;

		case 'dsync.user.updated':
			if (
				webhook.data.state === 'inactive' ||
				webhook.data.state === 'suspended'
			) {
				await db.deactivateUserByEmail(webhook.data.username);
			}
			break;

		case 'dsync.user.deleted':
			await db.deactivateUserByEmail(webhook.data.username);
			break;

		default:
			console.log(`TODO: handle ${webhook.event} events`);
	}

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
