import { SessionManager } from '../shared/session.js';
import { db } from "../../firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

class StatisticsManager {
    constructor() {
        this.session = new SessionManager();
        this.selectedSessions = [];
    }

    initialize() {
        this.setupEventListeners();
        this.updateStatisticsDisplay();
        // Update stats every 5 seconds
        setInterval(() => this.updateStatisticsDisplay(), 5000);
    }

    setupEventListeners() {
        // Session selection checkboxes
        document.querySelectorAll(".session-checkboxes input").forEach(input => {
            input.addEventListener("change", () => this.updateSessionSelection());
        });

        // Tab switching
        document.querySelectorAll(".tab-button").forEach(button => {
            button.addEventListener("click", () => this.switchTab(button.dataset.tab));
        });
    }

    async updateStatisticsDisplay() {
        const courseCode = document.getElementById("course-code")?.value.trim();
        if (!courseCode) return;

        const statsQuery = await getDocs(collection(db, "MFIgameStats"));
        let totalFirstResponses = 0;
        let totalSecondResponses = 0;

        statsQuery.forEach((docSnap) => {
            if (docSnap.id.startsWith(courseCode)) {
                const data = docSnap.data();
                totalFirstResponses += data.firstQuestionResponses?.length || 0;
                totalSecondResponses += data.secondQuestionResponses?.length || 0;
            }
        });

        // Update display
        const firstQuestionElement = document.getElementById("stats-first-question");
        const secondQuestionElement = document.getElementById("stats-second-question");

        if (firstQuestionElement) firstQuestionElement.textContent = totalFirstResponses;
        if (secondQuestionElement) secondQuestionElement.textContent = totalSecondResponses;
    }

    updateSessionSelection() {
        this.selectedSessions = [...document.querySelectorAll(".session-checkboxes input:checked")]
            .map(input => parseInt(input.value, 10));
        
        this.loadStatistics(this.selectedSessions);
    }

    switchTab(tabName) {
        document.querySelectorAll(".stats-panel").forEach(panel => 
            panel.classList.remove("active"));
        document.querySelectorAll(".tab-button").forEach(button => 
            button.classList.remove("active"));

        document.getElementById(tabName).classList.add("active");
        document.querySelector(`[data-tab='${tabName}']`).classList.add("active");

        switch(tabName) {
            case 'raw-scores':
                this.loadRawScoresChart();
                break;
            case 'question2':
                this.loadQuestion2Chart();
                break;
            case 'word-cloud':
                this.loadWordCloud();
                break;
        }
    }

    async loadRawScoresChart() {
        const ctx = document.getElementById('rawScoresChart').getContext('2d');
        const statsRef = collection(db, "MFIgameStats");
        
        const data = await this.fetchScoreData(statsRef);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: Math.max(...data) + 1}, (_, i) => i.toString()),
                datasets: [{
                    label: 'Score Distribution',
                    data: Array.from({length: Math.max(...data) + 1}, (_, i) => 
                        data.filter(score => score === i).length
                    ),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Students'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    }
                }
            }
        });
    }

    async loadWordCloud() {
        const width = 500;
        const height = 400;
        
        // Clear previous word cloud
        d3.select("#wordCloudCanvas").html("");
        
        const wordFreq = await this.fetchWordCloudData();
        
        const words = Object.entries(wordFreq).map(([text, size]) => ({
            text,
            size: 10 + (size * 10)
        }));

        d3.layout.cloud()
            .size([width, height])
            .words(words)
            .padding(5)
            .rotate(() => 0)
            .fontSize(d => d.size)
            .on("end", words => this.drawWordCloud(words, width, height))
            .start();
    }

    drawWordCloud(words, width, height) {
        d3.select("#wordCloudCanvas")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width/2},${height/2})`)
            .selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .style("font-size", d => `${d.size}px`)
            .style("fill", () => `hsl(${Math.random() * 360}, 70%, 50%)`)
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .text(d => d.text);
    }

    async fetchScoreData(statsRef) {
        const querySnapshot = await getDocs(statsRef);
        const data = [];
        
        querySnapshot.forEach(doc => {
            const sessionMatch = doc.id.match(/Session(\d+)/);
            if (sessionMatch && this.selectedSessions.includes(parseInt(sessionMatch[1]))) {
                const scores = doc.data().rawScores || [];
                data.push(...scores);
            }
        });
        
        return data;
    }

    async fetchWordCloudData() {
        const statsRef = collection(db, "MFIgameStats");
        const querySnapshot = await getDocs(statsRef);
        const wordFreq = {};
        
        querySnapshot.forEach(doc => {
            const sessionMatch = doc.id.match(/Session(\d+)/);
            if (sessionMatch && this.selectedSessions.includes(parseInt(sessionMatch[1]))) {
                const incorrectGuesses = doc.data().incorrectGuesses || [];
                incorrectGuesses.forEach(word => {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                });
            }
        });
        
        return wordFreq;
    }
}

// Initialize statistics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const stats = new StatisticsManager();
    stats.initialize();
});
