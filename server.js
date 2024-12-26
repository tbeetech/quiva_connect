require('dotenv').config();
const express = require('express');
const http = require('http');
const axios = require('axios');
const app = express();
const Translation = require('./db');
const path = require('path');
const fs = require('fs');

const server = http.createServer(app);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('toolbox'); // Render the toolbox panel
});

app.get('/translate', (req, res) => {
    res.render('language-selection'); // Render a form to collect language selection from users
});

app.post('/select-language', (req, res) => {
    const { user1Lang, user2Lang } = req.body;
    res.redirect(`/message?user1Lang=${user1Lang}&user2Lang=${user2Lang}`);
});

app.get('/message', (req, res) => {
    const { user1Lang, user2Lang } = req.query;
    res.render('message', { user1Lang, user2Lang, activeUser: 'user1', translatedMessage: '' });
});

app.post('/translate-message', async (req, res) => {
    const { message, activeUser, user1Lang, user2Lang } = req.body;

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
        let translatedMessage;
        if (activeUser === 'user1') {
            translatedMessage = await fetchResponse(message, user2Lang);
            res.render('message', { user1Lang, user2Lang, activeUser: 'user2', translatedMessage });
        } else {
            translatedMessage = await fetchResponse(message, user1Lang);
            res.render('message', { user1Lang, user2Lang, activeUser: 'user1', translatedMessage });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

// Route to render the vision upload form
app.get('/vision', (req, res) => {
    res.render('vision-upload'); // Render a form to input an image URL
});

app.post('/vision-upload', (req, res) => {
    const { imageUrl } = req.body;
    res.redirect(`/vision-select-language?imageUrl=${encodeURIComponent(imageUrl)}`);
});

app.get('/vision-select-language', (req, res) => {
    const { imageUrl } = req.query;
    res.render('vision-select-language', { imageUrl });
});

app.post('/vision-translate', async (req, res) => {
    const { imageUrl, selectedLanguage } = req.body;

    try {
        const response = await axios.post('https://ai.quivox.org/api/image-x/generate-response', {
            username: 'nueralmage',
            prompt: `Translate the text in this image to ${selectedLanguage}`,
            imageUrl: imageUrl
        }, {
            headers: {
                'Authorization': process.env.API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        console.log(data);

        let originalText = 'Translation not available';
        let translatedText = 'Translation not available';

        if (data.response.includes('This translates to: ')) {
            const parts = data.response.split('This translates to: ');
            originalText = parts[0].trim();
            translatedText = parts[1].trim();
        } else if (data.response.includes('Here\'s a translation of the')) {
            const parts = data.response.split('\n\n\n');
            originalText = parts[1].trim();
            translatedText = parts[0].split('\n')[0].trim();
        }
        
        res.render('vision-result', { originalText, translatedText });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
