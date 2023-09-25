const { join } = require('node:path');
const express = require('express');
const session = require('express-session');
const pgSimple = require('connect-pg-simple');

const app = express();
const sessionStore = pgSimple(session);

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: new sessionStore({
			createTableIfMissing: true,
			conObject: {
				database: 'postgres',
			},
		}),
	}),
);
app.use(express.static(join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', require('./routes/public'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/api'));

const port = 3000;
app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`);
});
