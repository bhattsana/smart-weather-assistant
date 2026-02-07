const apiKey = "5e39a0281919912acd995d32ce03f272";

const btn = document.getElementById("btn");
const result = document.getElementById("result");
const aiGuide = document.getElementById("aiGuide");
const modeSelect = document.getElementById("modeSelect");
const modeOutput = document.getElementById("modeOutput");
const voiceBtn = document.getElementById("voiceBtn");
const modeToggle = document.getElementById("modeToggle");

let chart = null;
let lastSpeech = "";
let activeCity = "";

// 🌍 Language
const userLang = navigator.language || "en";

// 🌙 Dark mode
modeToggle.onclick = () => document.body.classList.toggle("dark");

// 🤖 AI Weather Explanation
function generateAIGuide(data, city) {
    const temp = data.main.temp;
    const cond = data.weather[0].main;
    let msg = `🤖 ${city} ka weather update: `;

    if (temp > 30) msg += "aaj garmi zyada rahegi. ";
    else if (temp < 15) msg += "thand zyada hai. ";
    else msg += "temperature comfortable hai. ";

    if (cond.includes("Rain")) msg += "Barish ke chances hain ☔.";
    else if (cond.includes("Cloud")) msg += "Badal chhaye rahenge ☁.";
    else msg += "Aasman saaf rahega ☀.";

    return msg;
}

/* ===== MODES ===== */
function travelMode(d) {
    return d.weather[0].main.includes("Rain") || d.wind.speed > 8
        ? "✈ Travel Mode: ⚠ Travel risky ho sakta hai."
        : "✈ Travel Mode: ✅ Travel safe hai.";
}

function fitnessMode(d) {
    return d.main.temp > 32 || d.weather[0].main.includes("Rain")
        ? "🏃 Fitness Mode: ❌ Outdoor running avoid karein."
        : "🏃 Fitness Mode: ✅ Workout ke liye best weather.";
}

function studentMode(d) {
    let msg = "🧑‍🎓 Student Mode:<br>";
    if (d.weather[0].main.includes("Rain")) msg += "☔ Umbrella le jao.<br>";
    if (d.main.temp > 30) msg += "💧 Water bottle rakho.<br>";
    msg += "📚 College day manageable.";
    return msg;
}

function officeMode(d) {
    let msg = "🧑‍💼 Office Mode:<br>";
    if (d.weather[0].main.includes("Rain")) msg += "🚗 Traffic slow ho sakta hai.<br>";
    if (d.main.temp > 30) msg += "😓 Commute tiring ho sakta hai.<br>";
    msg += "🕘 Thoda early niklo.";
    return msg;
}

function gameMode(d) {
    let score = 100;
    if (d.main.temp > 35) score -= 30;
    if (d.weather[0].main.includes("Rain")) score -= 20;
    if (d.wind.speed > 10) score -= 20;
    return `🎮 Weather Score: <b>${score}/100</b>`;
}

// 🌦 Get Weather
btn.onclick = () => {
    const city = document.getElementById("city").value.trim();
    if (!city) return;

    activeCity = city.toLowerCase();
    result.innerHTML = "⏳ Loading...";
    aiGuide.innerHTML = "";
    modeOutput.innerHTML = "";
    lastSpeech = "";

    if (chart) chart.destroy();

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            if (city.toLowerCase() !== activeCity || data.cod !== 200) return;

            result.innerHTML = `
                🌡 ${data.main.temp}°C<br>
                ☁ ${data.weather[0].description}<br>
                💧 ${data.main.humidity}%<br>
                🌬 ${data.wind.speed} m/s
            `;

            const aiText = generateAIGuide(data, city);
            aiGuide.innerHTML = aiText;
            lastSpeech = aiText;

            document.body.classList.remove("clear","rain","clouds");
            if (data.weather[0].main.includes("Rain")) document.body.classList.add("rain");
            else if (data.weather[0].main.includes("Cloud")) document.body.classList.add("clouds");
            else document.body.classList.add("clear");

            const mode = modeSelect.value;
            modeOutput.innerHTML =
                mode === "travel" ? travelMode(data) :
                mode === "fitness" ? fitnessMode(data) :
                mode === "student" ? studentMode(data) :
                mode === "office" ? officeMode(data) :
                gameMode(data);
        });

    // Forecast Chart
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            if (city.toLowerCase() !== activeCity) return;

            const daily = {};
            data.list.forEach(i => {
                const d = i.dt_txt.split(" ")[0];
                if (!daily[d]) daily[d] = {sum:0,count:0};
                daily[d].sum += i.main.temp;
                daily[d].count++;
            });

            const labels=[], temps=[];
            Object.keys(daily).slice(0,5).forEach(d=>{
                labels.push(new Date(d).toLocaleDateString("en-US",{weekday:"short"}));
                temps.push((daily[d].sum/daily[d].count).toFixed(1));
            });

            chart = new Chart(document.getElementById("forecastChart"),{
                type:"line",
                data:{labels,datasets:[{
                    label:"Avg Temp (°C)",
                    data:temps,
                    borderColor:"#4b7bec",
                    backgroundColor:"rgba(75,123,236,0.2)",
                    fill:true,
                    tension:0.35
                }]},
                options:{maintainAspectRatio:false}
            });
        });
};

// 🔊 Voice
voiceBtn.onclick = () => {
    if (!lastSpeech) return;
    const speech = new SpeechSynthesisUtterance(lastSpeech);
    speech.lang = userLang;
    speechSynthesis.speak(speech);
};
