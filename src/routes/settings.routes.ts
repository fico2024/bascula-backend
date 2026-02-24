import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Sólo autenticación es requerida para LEER configuración (necesario para PDFs de Operadores)
router.use(authenticateToken);

// Obtener configuración actual
router.get('/', async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { companyName: 'BASCULA CASILDA' }
            });
        }
        res.json(settings);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Actualizar configuración
router.post('/', authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const { companyName, companyAddress, companyPhone, companyEmail, companyLogo } = req.body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: { companyName, companyAddress, companyPhone, companyEmail, companyLogo },
            create: { id: 1, companyName, companyAddress, companyPhone, companyEmail, companyLogo }
        });

        res.json(settings);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Exportar Backup JSON
router.get('/backup', authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const [users, companies, products, vehicles, drivers, tickets, settings, logs] = await Promise.all([
            prisma.user.findMany(),
            prisma.company.findMany(),
            prisma.product.findMany(),
            prisma.vehicle.findMany(),
            prisma.driver.findMany(),
            prisma.weighingTicket.findMany(),
            prisma.systemSettings.findMany(),
            prisma.auditLog.findMany()
        ]);

        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: { users, companies, products, vehicles, drivers, tickets, settings, logs }
        };

        res.json(backup);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Descargar Agente Ejecutable
router.get('/download-agent', (req, res) => {
    const path = require('path');
    const agentPath = path.join(process.cwd(), 'assets', 'bascula.exe');
    console.log("[SETTINGS] Descargando agente desde:", agentPath);
    res.download(agentPath, 'bascula.exe', (err: any) => {
        if (err) {
            res.status(404).json({ error: "Archivo del agente no encontrado en el servidor." });
        }
    });
});

export default router;
