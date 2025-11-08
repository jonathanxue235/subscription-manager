const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 5000;

    app.use(express.json());

    app.get('/home', (req, res) => {
        res.send('Welcome to Subscription Manager');
    });

    app.get('/login', (req, res) => {
        res.send('This is the login page');
    });

    app.post('/login', (req, res) => {
        console.log(`${req.body.userId} + ${req.body.password}`);
        res.status(200).send('Login successful')
    });

    app.all('*', (req, res) => {
        res.status(404).send('404 - Page Not Found');
    });