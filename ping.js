const axios = require('axios');

async function check() {
    try {
        const res = await axios.get('https://bascula-api.onrender.com/api/ping-agent');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("No disponible aún", e.message);
    }
}

setInterval(check, 5000);
check();
