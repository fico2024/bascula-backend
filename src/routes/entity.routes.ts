import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de entidades requieren autenticación
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'OPERATOR', 'AUDITOR'));

// --- COMPANIES (Clientes y Proveedores) ---
router.get('/companies', async (req, res) => {
    try {
        const data = await prisma.company.findMany();
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }) }
});

router.post('/companies', async (req, res) => {
    try {
        const item = await prisma.company.create({ data: req.body });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.delete('/companies/:id', async (req, res) => {
    try {
        await prisma.company.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// --- PRODUCTS ---
router.get('/products', async (req, res) => {
    try {
        const data = await prisma.product.findMany();
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }) }
});

router.post('/products', async (req, res) => {
    try {
        const item = await prisma.product.create({ data: req.body });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// --- VEHICLES ---
router.get('/vehicles', async (req, res) => {
    try {
        const data = await prisma.vehicle.findMany({ include: { company: true } });
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }) }
});

router.post('/vehicles', async (req, res) => {
    try {
        const item = await prisma.vehicle.create({ data: req.body });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.delete('/vehicles/:id', async (req, res) => {
    try {
        await prisma.vehicle.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// --- DRIVERS ---
router.get('/drivers', async (req, res) => {
    try {
        const data = await prisma.driver.findMany();
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }) }
});

router.post('/drivers', async (req, res) => {
    try {
        const item = await prisma.driver.create({ data: req.body });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.delete('/drivers/:id', async (req, res) => {
    try {
        await prisma.driver.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.put('/companies/:id', async (req, res) => {
    try {
        const item = await prisma.company.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.put('/products/:id', async (req, res) => {
    try {
        const { precioUnitario, ...rest } = req.body;
        const item = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: { ...rest, ...(precioUnitario !== undefined ? { precioUnitario: parseFloat(precioUnitario) } : {}) }
        });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.put('/vehicles/:id', async (req, res) => {
    try {
        // Extraer y convertir campos numéricos, excluir relaciones anidadas
        const { taraRegistrada, companyId, company, id, createdAt, updatedAt, ...rest } = req.body;
        const item = await prisma.vehicle.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...rest,
                ...(taraRegistrada !== undefined && taraRegistrada !== '' ? { taraRegistrada: parseFloat(taraRegistrada) } : { taraRegistrada: null }),
                ...(companyId !== undefined && companyId !== '' ? { companyId: parseInt(companyId) } : {})
            }
        });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

router.put('/drivers/:id', async (req, res) => {
    try {
        const { id, createdAt, updatedAt, tickets, ...rest } = req.body;
        const item = await prisma.driver.update({ where: { id: parseInt(req.params.id) }, data: rest });
        res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

export default router;
