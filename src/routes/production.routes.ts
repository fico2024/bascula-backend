import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Requerir autenticación
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'OPERATOR', 'AUDITOR'));

// Obtener todos los registros de producción
router.get('/', async (req, res) => {
    try {
        const data = await prisma.productionRecord.findMany({
            include: {
                product: true,
                plant: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Crear un nuevo registro de producción
router.post('/', async (req, res) => {
    try {
        const { turno, productId, plantId } = req.body;
        if (!turno || !productId || !plantId) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const item = await prisma.productionRecord.create({
            data: {
                turno,
                productId: parseInt(productId),
                plantId: parseInt(plantId)
            },
            include: {
                product: true,
                plant: true
            }
        });
        res.json(item);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Eliminar un registro de producción
router.delete('/:id', async (req, res) => {
    try {
        await prisma.productionRecord.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
