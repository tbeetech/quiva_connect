require('dotenv').config();
const express = require('express');
const http = require('http');
const axios = require('axios');
const app = express();
const multer = require('multer');
const Translation = require('./db');
const path = require('path');

const server = http.createServer(app);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index'); // Render a form to collect input from users
});

app.post('/translate', async (req, res) => {
    const { user1Message, user1Lang, user2Message, user2Lang } = req.body;

    const fetchResponse = async (prompt, targetLang) => {
        const response = await fetch('https://ai.quivox.org/api/quiva-x-advanced/generate-response', {
            method: 'POST',
            headers: {
                'Authorization': process.env.API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: `Translate this to ${targetLang}; ${prompt}`, username: 'nueralmage' }),
        });
        const data = await response.text();
        return data;
    };

    try {
        const user1ToUser2 = await fetchResponse(user1Message, user2Lang);
        const user2ToUser1 = await fetchResponse(user2Message, user1Lang);

        console.log("User 1 to User 2:", user1ToUser2);
        console.log("User 2 to User 1:", user2ToUser1);

        res.send(`
            <p>User 1 to User 2: ${user1ToUser2}</p>
            <p>User 2 to User 1: ${user2ToUser1}</p>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

// User one speaks














// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});
const upload = multer({ storage: storage });

// Route to render the vision upload form
app.get('/vision', (req, res) => {
    res.render('vision');
});

// Endpoint to handle image uploads and translation
app.post('/vision', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const imagePath = req.file.path;

        // Integrate with Quiva Vision API
        const response = await axios.post('https://ai.quivox.org/api/quiva-vision/generate-image', {
            username: 'your_username',
            prompt: 'Translate this handwritten text',
            image: imagePath
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY',
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        console.log(data);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
