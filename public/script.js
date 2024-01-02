const songRankingsKey = 'songRankings';
const userProgressKey = 'userProgress';
const dbUrl = 'db.json';

let overallLoops = 2;
let loopCounter = 1;
let innerLoopCounter = 1;
let totalRounds;
let songs; // Array to store songs fetched from the database


// Fetch songs from the database and sort them by score in descending order
async function fetchSongs() {
    try {
        const response = await fetch('/db.json');
        if (!response.ok) {
            throw new Error('Failed to fetch songs from the database');
        }
        let fetchedSongs = await response.json();

        // Sort the songs by score in descending order
        fetchedSongs.sort((a, b) => b.score - a.score);

        songs = fetchedSongs;
    } catch (error) {
        console.error(error.message);
        // Handle the error or provide a fallback array of songs
        songs = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Song ${i + 1}`, score: 0 }));
    }
}

// Initialize the song rankings
async function initializeSongRankings() {
    try {
        const songRankings = {};
        // Use the sorted songs to initialize rankings
        songs.forEach((song, index) => {
            songRankings[song.id] = { rank: 0, score: song.score, order: index + 1 };
        });
        localStorage.setItem(songRankingsKey, JSON.stringify(songRankings));
    } catch (error) {
        console.error(error.message);
    }
}

// Update the startRanking function to sort songs by score before starting
async function startRanking() {
    await fetchSongs();
    totalRounds = Math.ceil(songs.length / 8);
    console.log("Total songs:", songs.length);
    console.log("Total rounds:", totalRounds);

    // Sort the songs by score in descending order
    songs.sort((a, b) => b.score - a.score);

    // Initialize rankings based on the sorted order
    initializeSongRankings();

    // Hide the "Start Ranking" button
    const startRankingButton = document.querySelector('.button-container button');
    startRankingButton.style.display = 'none';

    displaySongSet();
}

function displaySongSet() {
    songs.sort((a, b) => {
        const songRankings = JSON.parse(localStorage.getItem(songRankingsKey));
        return songRankings[b.id].score - songRankings[a.id].score;
    });

    
    const songContainer = document.getElementById('songContainer');

    songContainer.innerHTML = `<h3>Rank Songs (Loop ${loopCounter}/${overallLoops}, Set ${innerLoopCounter}/${totalRounds})</h3>`;

    const songRankings = JSON.parse(localStorage.getItem(songRankingsKey));
    const startIndex = (innerLoopCounter - 1) * 8;
    const endIndex = Math.min(innerLoopCounter * 8, songs.length);
    let songsToDisplay = songs.slice(startIndex, endIndex);

    // Sort songsToDisplay based on scores in descending order
    //songsToDisplay.sort((a, b) => songRankings[b.id].score - songRankings[a.id].score);
    

    // Reset the rank to 0 for every song
    songsToDisplay.forEach((song) => {
        songRankings[song.id].rank = 0;
    });

    songsToDisplay.forEach((song, index) => {
        const songDiv = document.createElement('div');
        songDiv.classList.add('song');
        songDiv.dataset.songId = song.id;
    
        // Display album and song name (modify as needed based on your data structure)
        const albumName = song.album ? `<span class="album">${song.album}</span>` : '';
        songDiv.innerHTML = `<label>${song.name}</label>${albumName}
                             <span class="ranking">${songRankings[song.id].rank || ''}</span>`;
                             //<span class="score">Score: ${songRankings[song.id].score}</span>`;
    
        songContainer.appendChild(songDiv);
    });
    
    

    const songElements = document.querySelectorAll('.song');

    songElements.forEach(songElement => {
        songElement.addEventListener('click', function() {
            toggleSongRank(this, songRankings);
        });
    });

    const rankButton = document.createElement('button');
    rankButton.textContent = 'Submit Song Rankings';
    rankButton.onclick = function() {
        submitSongRankings();
    };

    songContainer.appendChild(rankButton);

    // Update counters for the next set of songs
    innerLoopCounter++;

    if (innerLoopCounter > totalRounds) {
        innerLoopCounter = 1;
        loopCounter++;
    }
}

function toggleSongRank(songElement, songRankings) {
    const songId = songElement.dataset.songId;
    const rankingSpan = songElement.querySelector('.ranking');

    // If the song is already selected, remove its rank
    if (songElement.classList.contains('selected')) {
        const currentRank = songRankings[songId].rank;

        // Remove the rank from the current song
        songRankings[songId].rank = 0;
        rankingSpan.textContent = '';

        // Adjust ranks of other selected songs
        const selectedSongs = document.querySelectorAll('.song.selected');
        selectedSongs.forEach((selectedSong) => {
            const selectedSongId = selectedSong.dataset.songId;
            const selectedSongRank = songRankings[selectedSongId].rank;

            if (selectedSongRank > currentRank) {
                // Move up the ranking for songs that had a lower ranking
                songRankings[selectedSongId].rank = selectedSongRank - 1;
                selectedSong.querySelector('.ranking').textContent = selectedSongRank - 1;
            }
        });

        // Remove the selected class and reset color
        songElement.classList.remove('selected');
        songElement.classList.remove('green');  // Remove green color class
    } else {
        // Select the song and assign a new rank
        const selectedCount = document.querySelectorAll('.song.selected').length + 1;
        songElement.classList.add('selected');
        songRankings[songId].rank = selectedCount;
        rankingSpan.textContent = selectedCount;
        

        // Add or update color based on rank
        if (selectedCount === 1) {
            songElement.classList.add('green');  // Add green color class
        } else {
            songElement.classList.remove('green');  // Remove green color class
        }
    }
    
}

function submitSongRankings() {
    const selectedSongs = document.querySelectorAll('.song.selected');

    const songsInCurrentSet = Math.min(innerLoopCounter * 8, songs.length);
    const displayedSongs = document.querySelectorAll('.song');

    if (selectedSongs.length !== displayedSongs.length) {
        alert(`Please rank all ${displayedSongs.length} songs before submitting.`);
        return;
    }

    const songRankings = JSON.parse(localStorage.getItem(songRankingsKey));

    selectedSongs.forEach((songElement, index) => {
        const songId = songElement.dataset.songId;
        const songRank = songElement.querySelector('.ranking').textContent;
        // console.log("Song ID:", songId);
        // console.log("Song Rank:", songRank);
        songRankings[songId].rank = songRank;

        // Update the score based on the rank (using the provided scoring function)
        songRankings[songId].score += calculateScore(songRank);
    });

    localStorage.setItem(songRankingsKey, JSON.stringify(songRankings));

    // Check if all sets in the inner loop have been completed
    if (selectedSongs[selectedSongs.length - 1].dataset.songId == songs[songsInCurrentSet - 1].id) {
        // Update counters for the next set of songs
        innerLoopCounter++;

        if (innerLoopCounter > totalRounds) {
            innerLoopCounter = 1;
            loopCounter++;
        }
        console.log("Loop Counter:", loopCounter, "Inner Loop Counter:", innerLoopCounter);  // Add this line for debugging
    }

    if (loopCounter > overallLoops) {
        // End of the tournament, display final rankings
        displayFinalRankings();
    } else {
        // Continue to the next set of songs
        displaySongSet();
    }
    
}

// Add a sample scoring function (you can adjust this based on your scoring criteria)
function calculateScore(rank) {
    // Cap the score at a maximum of 8
    return 9 - rank
}

function saveProgress() {
    const songRankings = JSON.parse(localStorage.getItem(songRankingsKey));

    const userProgress = {
        songRankings,
        loopCounter,
        innerLoopCounter
    };

    localStorage.setItem(userProgressKey, JSON.stringify(userProgress));
    alert('Progress saved. You can resume later.');
}

async function displayFinalRankings() {
    const songRankings = JSON.parse(localStorage.getItem(songRankingsKey));

    // Sort songs based on their scores in descending order
    const sortedSongs = Object.keys(songRankings).sort((a, b) => {
        return songRankings[b].score - songRankings[a].score;
    });

    const songContainer = document.getElementById('songContainer');
    songContainer.innerHTML = '<h3>Final Rankings</h3>';

    // Display each song and its score
    for (let index = 0; index < sortedSongs.length; index++) {
        const songId = sortedSongs[index];
        const song = songs.find((s) => s.id === parseInt(songId));
        const rankingHTML = `<div class="song">
                                <label>${song.name}</label>
                                <span class="ranking">${index + 1}</span>
                                <span class="score">Score: ${songRankings[songId].score}</span>
                             </div>`;
        songContainer.innerHTML += rankingHTML;

        // Update the database with the final scores
        try {
            const response = await fetch('/update-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: songId, score: songRankings[songId].score }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update score for song ${songId}`);
            }
        } catch (error) {
            console.error(error.message);
        }
    }
}

