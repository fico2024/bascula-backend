const axios = require('axios');
const jwt = require('jsonwebtoken');

// Token firmado con el mismo secreto local (suponiendo que no lo haya cambiado en Render)
const token = jwt.sign({ id: 1, role: 'ADMIN' }, 'CAMBIAR_POR_CLAVE_SEGURA_EN_PRODUCCION', { expiresIn: '1d' });

async function testDownload() {
    console.log("Testeando Descarga remota...");
    try {
        const res = await axios.get('https://bascula-api.onrender.com/api/system-settings/download-agent', {
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'stream'
        });
        console.log("✅ STATUS", res.status);
        console.log("✅ HEADERS", res.headers);
    } catch (e) {
        if (e.response) {
            console.log("❌ ERROR STATUS:", e.response.status);
            e.response.data.on('data', chunk => console.log('❌ ERROR DATA:', chunk.toString()));
        } else {
            console.log("❌ ERROR GENERAL:", e.message);
        }
    }
}

testDownload();
