import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { logAction } from '../services/audit.service';

const router = Router();

// Todas las rutas de tickets requieren estar autenticado
router.use(authenticateToken);

// Lógica para crear un ticket de entrada (Captura inicial)
router.post('/in', async (req, res) => {
    try {
        const {
            vehicleId,
            companyId,
            productId,
            driverId,
            weightIn,
            userId,
            movementType,
            referenciaGuia,
            observations
        } = req.body;

        const ticket = await prisma.weighingTicket.create({
            data: {
                status: 'PENDING',
                movementType: movementType || 'INTERNAL',
                weightIn,
                vehicleId,
                companyId,
                productId,
                driverId,
                userId: userId || 1,
                referenciaGuia,
                observations,
                datetimeIn: new Date()
            }
        });

        // Auditoría
        await logAction(userId || 1, 'CREACION_TICKET_ENTRADA', { ticketId: ticket.id, vehicleId });

        res.json(ticket);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Lógica para cerrar un ticket de salida (Cerrar transacción)
router.post('/out/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { weightOut } = req.body;

        const ticket = await prisma.weighingTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) return res.status(400).json({ error: 'Ticket no encontrado' });

        // Neto = Valor absoluto de la diferencia
        const weightNet = Math.abs(Number(ticket.weightIn) - Number(weightOut));

        const updated = await prisma.weighingTicket.update({
            where: { id: ticketId },
            data: {
                weightOut,
                weightNet,
                datetimeOut: new Date(),
                status: 'COMPLETED'
            },
            include: {
                company: true, vehicle: true, product: true, driver: true
            }
        });

        // Auditoría
        await logAction((req as any).user?.id || 1, 'CIERRE_TICKET_SALIDA', { ticketId: updated.id, weightNet: updated.weightNet });

        res.json(updated);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Listar tickets en tránsito (Abiertos)
router.get('/pending', async (req, res) => {
    const data = await prisma.weighingTicket.findMany({
        where: { status: 'PENDING' },
        include: { vehicle: true, company: true, product: true, driver: true }
    });
    res.json(data);
});

// Historial de tickets completados con filtros
router.get('/history', async (req, res) => {
    try {
        const { from, to, search, companyId, productId } = req.query;

        const where: any = { status: 'COMPLETED' };

        // Filtro por fecha
        if (from || to) {
            where.datetimeOut = {};
            if (from) where.datetimeOut.gte = new Date(from as string);
            if (to) {
                const toDate = new Date(to as string);
                toDate.setHours(23, 59, 59, 999);
                where.datetimeOut.lte = toDate;
            }
        }

        // Filtro por empresa/producto
        if (companyId) where.companyId = parseInt(companyId as string);
        if (productId) where.productId = parseInt(productId as string);

        // Búsqueda textual (Patente o Razón Social)
        if (search) {
            where.OR = [
                { vehicle: { patenteChasis: { contains: search as string } } },
                { company: { razonSocial: { contains: search as string } } },
                { referenciaGuia: { contains: search as string } }
            ];
        }

        const data = await prisma.weighingTicket.findMany({
            where,
            include: { vehicle: true, company: true, product: true, driver: true },
            orderBy: { datetimeOut: 'desc' },
            take: 500
        });
        res.json(data);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Eliminar un ticket pendiente (pesaje accidental)
router.delete('/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);

        const ticket = await prisma.weighingTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
        if (ticket.status !== 'PENDING') return res.status(400).json({ error: 'Solo se pueden eliminar tickets pendientes (en planta).' });

        // Auditoría antes de borrar
        await logAction((req as any).user?.id || 1, 'ELIMINACION_TICKET_PENDIENTE', { ticketId: ticket.id, vehicleId: ticket.vehicleId });

        await prisma.weighingTicket.delete({ where: { id: ticketId } });

        res.json({ success: true, message: 'Ticket pendiente eliminado correctamente.' });
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

export default router;
