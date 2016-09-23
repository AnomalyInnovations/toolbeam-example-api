const app = require('express')();
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth');
const request = require('request');
const upload = require('multer')();

const movies = [
	{
		name: 'Casablanca',
		year: "1942",
		genre: 'Drama',
		poster: 'http://i.imgur.com/yuYyCnF.jpg'
	},
];
const getId = str => parseInt(str, 1) - 1;
const unauthorized = res => {
	res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
	return res.sendStatus(401);
};

app.use(bodyParser.urlencoded({ extended: false }));

// curl http://localhost:3030/movies/1
app.get('/movies/:id', (req, res) => {
	res.send(movies[getId(req.params.id)]);
});

// Browser to http://localhost:3030/update_form
app.post('/movies/:id', upload.single('poster'), (req, res) => {
	res.send(Object.assign({},
		movies[getId(req.params.id)],
		req.file && { poster: req.file.originalname },
		req.body));
});

// curl -X DELETE -u admin:password http://localhost:3030/movies/1
app.delete('/movies/:id', auth, (req, res) => {
	res.send({ deleted: movies[getId(req.params.id)].name });
});

// curl -X POST -H "TB-User-UUID: hunyjhgi" -H "TB-Tool-UUID: tferqvrd" -d location=%7B%22latitude%22%3A43.64%2C%22longitude%22%3A-79.37%7D http://localhost:3030/movies/1/subscribe
app.post('/movies/:id/subscribe', (req, res) => {
	const movie = movies[getId(req.params.id)];

	setTimeout(() => request
		.post('https://api.toolbeam.com/v1/app/send_notifications')
		.form({
			message: `${movie.name} is now playing nearby!`,
			user_uuid: req.get('TB-User-UUID'),
			tool_uuid: req.get('TB-Tool-UUID')
		}), 10000);

	res.send({ subscribed: true, movie: movie.name, location: JSON.parse(req.body.location) });
});

// curl http://localhost:3030/top_movies
app.get('/top_movies', (req, res) => {
	res.send(movies.map((movie, i) => Object.assign({}, movie, {
		'update': `https://toolbeam.com/t/update-movie?id=${i + 1}`,
		'delete': `https://toolbeam.com/t/delete-movie?id=${i + 1}`,
		'subscribe': `https://toolbeam.com/t/subscribe-movie?id=${i + 1}`
	})));
});

// Form to test updating a movie object
app.get('/update_form', (req, res) => {
	res.send(
		`<form action="/movies/1" enctype="multipart/form-data" method="post">
			<input type="text" name="name" />
			<input type="file" name="poster" multiple="multiple" />
			<input type="submit" value="Upload" />
		</form>`
	);
});

app.listen(3030);

///////////////////////
// Private Functions //
///////////////////////

function auth(req, res, next) {
	const user = basicAuth(req);

	if ( ! user || ! user.name || ! user.pass) {
		return unauthorized(res);
	}

	if (user.name === 'admin' && user.pass === 'password') {
		return next();
	}
	else {
		return unauthorized(res);
	}
};
