const { check, validationResult } = require('express-validator');

const path = require('path');
const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser');

const app = express();
const cors = require('cors');
app.use(cors());

const mongoose = require('mongoose');
const Models = require('./models.js');

app.use(bodyParser.json());

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

// const { check, validationResult } = require('express-validator');

const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/myFlixDB', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

// mongoose.connect('mongodb+srv://phil:phil@cluster0.gdhqw.mongodb.net/myFlixDB?retryWrites=true&w=majority',
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     });

// using heroku env variable. test completed successfully with postman - was able to post new user
mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(morgan('common'));

app.get('/', (req, res) => {
    res.send('Welcome to movies api');
});

//Get list of movies with authentication
// app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
//     Movies.find()
//         .then((movies) => {
//             res.status(201).json(movies);
//         })
//         .catch((error) => {
//             console.error(error);
//             res.status(500).send('Error: ' + error);
//         });
// });
//removed passport auth for testing 3.4
app.get("/movies", function(req, res) {
    Movies.find()
        .then(function(movies) {
            res.status(201).json(movies);
        })
        .catch(function(error) {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

//Get list of users using authentication
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
        .then(users => {
            res.status(201).json(users);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Get a user by Username using authentication
app.get(
    '/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOne({ Username: req.params.Username })
            .then(user => {
                res.json(user);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Get data about a movie using authentication
app.get(
    '/movies/:Title', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ Title: req.params.Title })
            .then(movie => {
                res.json(movie);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Get description of a genre with authentication
app.get(
    '/movies/genre/:Genre', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ 'Genre.Name': req.params.Genre })
            .then(movie => {
                res.json(movie.Genre);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Get a director's details using authentication
app.get(
    '/movies/director/:Director', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ 'Director.Name': req.params.Director })
            .then(movie => {
                res.json(movie.Director);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Create a new user with password hashing
app.post('/users',
    // Validation logic here for request
    //you can either use a chain of methods like .not().isEmpty()
    //which means "opposite of isEmpty" in plain english "is not empty"
    //or use .isLength({min: 5}) which means
    //minimum value of 5 characters are only allowed
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {

        // check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
            .then((user) => {
                if (user) {
                    //If the user is found, send a response that it already exists
                    return res.status(400).send(req.body.Username + ' already exists');
                } else {
                    Users
                        .create({
                            Username: req.body.Username,
                            Password: hashedPassword,
                            Email: req.body.Email,
                            Birthday: req.body.Birthday
                        })
                        .then((user) => { res.status(201).json(user) })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

//Update a user's details using authentication
app.put(
    '/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOneAndUpdate({ Username: req.params.Username }, {
                $set: {
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                }
            }, { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            }
        );
    }
);

//Add a movie as favorite using authentication
app.post(
    '/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndUpdate({ Username: req.params.Username }, {
                $push: { FavoriteMovies: req.params.MovieID }
            }, { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            }
        );
    }
);

//Remove a movie from favorites using authentication
app.delete(
    '/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndUpdate({ Username: req.params.Username }, { $pull: { FavoriteMovies: req.params.MovieID } }, { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            }
        );
    }
);

//Delete a user using authentication
app.delete(
    '/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndRemove({ Username: req.params.Username })
            .then(user => {
                if (!user) {
                    res.status(400).send(req.params.Username + ' was not found');
                } else {
                    res.status(200).send(req.params.Username + ' was deleted.');
                }
            })
            .catch(err => {
                console.error(err);
                res.status(400).send('Error: ' + err);
            });
    }
);

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port);
});
// app.listen(8080, () => console.log('Your app is listening on port 8080.'));

// app.use(express.static('public'));
// app.use('/client', express.static(path.join(__dirname, 'client', 'dist')));
// app.get('/client/*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).send('Something broke!');
// });