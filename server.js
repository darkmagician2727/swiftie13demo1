const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Resolve the absolute path to db.json in the public folder
const dbPath = path.join(__dirname, 'public', 'db.json');

// Mock database (replace this with your actual database integration)
const db = require(dbPath);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/update-score', (req, res) => {
    //console.log('Updated database:', db)
  try {
    const { id, score } = req.body;

    // Logging received data
    //console.log('Received update for song ID:', id, 'with score:', score);

    // Update score in the mock database
    const songToUpdate = db.find(song => song.id === parseInt(id));
    if (songToUpdate) {
      songToUpdate.score = score;

      // Logging updated database
      //console.log('Updated database:', db);

      // Send a success response
      res.status(200).json({ message: 'Score updated successfully' });
    } else {
      // If the song is not found, send a 404 response
      res.status(404).json({ error: 'Song not found' });
    }
  } catch (error) {
    console.error(error.message);
    // Handle the error as needed
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
