const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 5000;

    app.use(cors());
    app.use(express.json()); // For parsing application/json

    // Example API endpoint
    app.get('/api/data', (req, res) => {
        res.json({ message: 'Data from Node.js backend!' });
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });