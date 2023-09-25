const db = require('./');

async function init() {
	try {
		await db.query(db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        email text UNIQUE,
        firstName text,
        lastName text,
        roles text[],
        active boolean)
    `);

		await db.query(db.sql`
      CREATE TABLE IF NOT EXISTS posts (
        id serial PRIMARY KEY,
        user_id int NOT NULL,
        title text NOT NULL,
        content text)
    `);
	} catch (err) {
		console.error(err);
	} finally {
		process.exit(0);
	}
}

init();
