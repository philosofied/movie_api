const express = require('express'),
    morgan = require('morgan');
const bodyParser = require('body-parser'),
    methodOverride = require('method-override');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());


app.use(morgan('common'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


let topMovies = [{
        title: 'GATTACA',
        year: '1997'
    },
    {
        title: 'Maze Runner',
        year: '2014'
    },
    {
        title: 'Pandorum',
        year: '2009'
    }
];

let myLogger = (req, res, next) => {
    console.log(req.url);
    next();
};

app.use(myLogger);

// GET requests
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});


// listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});