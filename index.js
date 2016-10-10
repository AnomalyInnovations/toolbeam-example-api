const app = require('express')();
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth');
const request = require('request');
const upload = require('multer')();

const movies = [
	{
		name: 'Casablanca',
		year: '1942',
		genre: 'Romance',
		poster: 'http://i.imgur.com/AOgA2cn.jpg'
	},
	{
		name: 'Gone with the Wind',
		year: '1939',
		genre: 'Romance',
		poster: 'http://i.imgur.com/5sG2K4D.jpg'
	},
	{
		name: 'Citizen Kane',
		year: '1941',
		genre: 'Mystery',
		poster: 'http://i.imgur.com/HqzBOO7.jpg'
	},
	{
		name: 'The Wizard of Oz',
		year: '1939',
		genre: 'Fantasy',
		poster: 'http://i.imgur.com/tWxYoJm.jpg'
	},
	{
		name: 'North by Northwest',
		year: '1959',
		genre: 'Thriller',
		poster: 'http://i.imgur.com/y0CONU5.jpg'
	},
	{
		name: "It's a Wonderful Life",
		year: '1946',
		genre: 'Fantasy',
		poster: 'http://i.imgur.com/7bh1eVk.jpg'
	},
	{
		name: 'Some Like It Hot',
		year: '1959',
		genre: 'Action',
		poster: 'http://i.imgur.com/oAx43iB.jpg'
	},
	{
		name: "Singin in the Rain",
		year: '1952',
		genre: 'Romance',
		poster: 'http://i.imgur.com/po7HRZS.jpg'
	},
	{
		name: 'Ben-Hur',
		year: '1959',
		genre: 'Action',
		poster: 'http://i.imgur.com/Qei8kaN.jpg'
	},
	{
		name: 'Psycho',
		year: '1960',
		genre: 'Thriller',
		poster: 'http://i.imgur.com/1mzFD2r.jpg'
	},
];

const getId = str => (parseInt(str, 10) - 1) % 10;
const unauthorized = res => {
	res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
	return res.sendStatus(401);
};

app.use(bodyParser.urlencoded({ extended: false }));

// Return list of top movies
// Demo:
// curl -i http://localhost:3030/top_movies
app.get('/top_movies', (req, res) => {
	res.send(movies);
});

// Return a movie
// Demo:
// curl -i http://localhost:3030/movies/1
app.get('/movies/:id', (req, res) => {
	res.send(movies[getId(req.params.id)]);
});

// Update a movie
// Demo:
// curl -i -X PUT -F "genre=Thriller" -F "poster=@/Users/jayair/Downloads/out.gif" http://localhost:3030/movies/1
app.put('/movies/:id', upload.single('poster'), (req, res) => {
	res.send(Object.assign({},
		movies[getId(req.params.id)],
		req.file && { poster: req.file.originalname },
		req.body));
});

// Delete a movie
// Demo:
// curl -i -X DELETE -u admin:password http://localhost:3030/movies/1
app.delete('/movies/:id', auth, (req, res) => {
	res.send({ deleted: movies[getId(req.params.id)].name });
});

// Subscribe for a movie that will be playing
// Demo:
// curl -i -X POST -H "TB-User-UUID: adqlymds" -H "TB-Tool-UUID: bcgrjtcu" -d location=%7B%22latitude%22%3A43.64%2C%22longitude%22%3A-79.37%7D http://localhost:3030/movies/1/subscribe
app.post('/movies/:id/subscribe', (req, res) => {
	const movie = movies[getId(req.params.id)];

	setTimeout(() => request({
			method: 'POST',
			uri: 'https://api.toolbeam.com/v1/app/send_notifications',
			headers: {
				'TB-API-KEY': 'Put in your API key here'
			},
			form: {
				message: `${movie.name} is now playing nearby!`,
				user_uuid: req.get('TB-User-UUID'),
				tool_uuid: req.get('TB-Tool-UUID')
			}
		}), 3000);

	res.send({ subscribed: true, movie: movie.name, location: JSON.parse(req.body.location) });
});

// Search for a movie
// Demo:
// curl -i http://localhost:3030/movies?keyword=test
app.get('/movies', (req, res) => {
	res.send(movies.map((movie, i) => Object.assign({}, movie, {
		'edit': `https://toolbeam.com/t/kldgocfm?id=${i + 1}&genre=${movie.genre}`,
		'delete': `https://toolbeam.com/t/moqulqnk/response?id=${i + 1}`,
		'subscribe': `https://toolbeam.com/t/bcgrjtcu?id=${i + 1}`
	})));
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
