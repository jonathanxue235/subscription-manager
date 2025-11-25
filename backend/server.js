const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 5050;

    app.use(express.json());
    app.use(cors());

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

    app.get('/register', (req, res) => {
        res.send('This is the registration page.');
    });

    app.post('/register', (req, res) => {
        console.log(`This is the new userId ${req.body.userId}`);
        res.status(200).send('Account created!');
    });

    app.use((req, res) => {
        res.status(404).send('404 - Page Not Found');
    });

    app.listen(port, () => {
        console.log(`Server is running on ${port}`);
    });