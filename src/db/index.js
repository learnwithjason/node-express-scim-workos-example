const { Pool } = require('pg');

const pool = new Pool({ database: 'postgres' });

function query(text, params) {
	return pool.query(text, params);
}

function sql(strings) {
	// this is a no-op so syntax highlighting / formatting works
	return strings.join('');
}

async function createOrUpdateUser({
	email,
	firstName,
	lastName,
	roles = [],
	active = true,
}) {
	return await query(
		sql`
			INSERT INTO users (email, firstName, lastName, roles, active)
				VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (email)
				DO UPDATE SET
					firstName = $2, lastName = $3, roles = $4, active = $5
				RETURNING
					id, roles
		`,
		[email, firstName, lastName, roles, active],
	);
}

async function getUserByEmail(email) {
	const userResult = await query(
		sql`
			SELECT
				id, firstName, lastName, roles
			FROM
				users
			WHERE
				email = $1
		`,
		[email],
	);

	return userResult.rows.at(0);
}

async function getUserRolesByEmail(email) {
	const userResult = await query(
		sql`
			SELECT
				roles
			FROM
				users
			WHERE
				email = $1
		`,
		[email],
	);

	if (!userResult.rows.at(0)) {
		return new Set();
	}

	console.log(userResult.rows.at(0));

	return new Set(userResult.rows.at(0).roles);
}

async function deactivateUserByEmail(email) {
	await query(
		sql`
			UPDATE
				users
			SET
				active = FALSE
			WHERE
				email = $1
		`,
		[email],
	);

	await query(
		sql`
			DELETE FROM session
			WHERE sess -> 'user' ->> 'email' = $1
		`,
		[email],
	);
}

async function getAllPosts() {
	const result = await query(
		sql`
      SELECT
				p.id,
				p.user_id,
        p.title,
        p.content,
        concat_ws(' ', u.firstName, u.lastName) AS author
      FROM
        posts p
        LEFT OUTER JOIN users u ON p.user_id = u.id
    `,
		[],
	);

	return result.rows;
}

async function getPostsByUser(user_id) {
	const result = await query(
		sql`
      SELECT
				p.id,
				p.user_id,
        p.title,
        p.content,
        concat_ws(' ', u.firstName, u.lastName) AS author
      FROM
        posts p
        LEFT OUTER JOIN users u ON p.user_id = u.id
			WHERE user_id = $1
    `,
		[user_id],
	);

	return result.rows;
}

module.exports = {
	query,
	createOrUpdateUser,
	deactivateUserByEmail,
	getUserRolesByEmail,
	getUserByEmail,
	getAllPosts,
	getPostsByUser,
	sql,
};
