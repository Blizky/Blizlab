// --- Supabase Configuration ---
const SUPABASE_URL = 'https://mbkjmhfzjvuqvgtiuukc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_--wZx6i0RuWnka0tMk5Q9w_HiNB18_i';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let player, recordingInterval;
let dataPoints = new Array(60).fill(0);
const labelMap = {
    "-3": "Very Bored", "-2": "Bored", "-1": "Slightly Bored",
    "0": "Neutral",
    "1": "Slightly Engaged", "2": "Engaged", "3": "Very Engaged"
};

// Check for Results Mode on Page Load
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('results') === 'true') {
        prepareResultsView(params.get('vid'));
    }
};

function onYouTubeIframeAPIReady() {}

document.getElementById('loadBtn').onclick = () => {
    const url = document.getElementById('videoUrl').value;
    const vid = extractVideoID(url);
    if (!vid) return alert("Invalid Link");
    
    initPlayer(vid);
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
};

function initPlayer(vid) {
    player = new YT.Player('player', {
        height: '100%', width: '100%', videoId: vid,
        playerVars: { 'playsinline': 1 },
        events: { 'onStateChange': onPlayerStateChange }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) startTimer();
    else stopTimer();
}

function startTimer() {
    if (recordingInterval) return;
    recordingInterval = setInterval(() => {
        const currentSec = Math.floor(player.getCurrentTime());
        const val = document.getElementById('interestSlider').value;
        if (currentSec < 60) {
            dataPoints[currentSec] = parseInt(val);
            document.getElementById('timerDisplay').innerText = `00:${currentSec.toString().padStart(2, '0')} / 01:00`;
        } else {
            endExperiment();
        }
    }, 1000);
}

function endExperiment() {
    stopTimer();
    player.pauseVideo();
    document.getElementById('controls').style.display = 'none';
    document.getElementById('submitBtn').style.display = 'block';
}

document.getElementById('submitBtn').onclick = async () => {
    const vid = player.getVideoData().video_id;
    const { error } = await supabaseClient
        .from('video_stats')
        .insert([{ video_id: vid, scores: dataPoints }]);

    if (error) {
        console.error("Error saving data:", error);
        alert("Submission failed. Check console.");
    } else {
        window.location.href = `?results=true&vid=${vid}`;
    }
};

async function prepareResultsView(videoId) {
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('resultsArea').style.display = 'block';
    document.getElementById('mainTitle').innerText = "Community Analysis";
    
    // Load player in result mode
    setTimeout(() => { initPlayer(videoId); }, 1000);

    const { data, error } = await supabaseClient
        .from('video_stats')
        .select('scores')
        .eq('video_id', videoId);

    if (data && data.length > 0) {
        const averages = Array.from({length: 60}, (_, i) => {
            const sum = data.reduce((acc, row) => acc + (row.scores[i] || 0), 0);
            return (sum / data.length).toFixed(2);
        });
        renderAvgChart(averages);
    }
}

function renderAvgChart(avgData) {
    const ctx = document.getElementById('avgChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 60}, (_, i) => i + 's'),
            datasets: [{ 
                label: 'Avg Engagement', 
                data: avgData, 
                borderColor: '#0099CC', 
                backgroundColor: 'rgba(0, 153, 204, 0.1)', 
                fill: true, 
                tension: 0.4, // Smoothed/Rounded logic
                pointRadius: 0 
            }]
        },
        options: { 
            responsive: true,
            scales: { y: { min: -3, max: 3 } } 
        }
    });
}

function stopTimer() { clearInterval(recordingInterval); recordingInterval = null; }

function extractVideoID(url) {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

document.getElementById('interestSlider').oninput = function() {
    document.getElementById('statusLabel').innerText = labelMap[this.value];
};