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
            observations,
            origen,
            destino,
            isManual
        } = req.body;

        const ticket = await prisma.weighingTicket.create({
            data: {
                status: 'PENDING',
                movementType: movementType || 'INTERNAL',
                isManual: isManual || false,
                weightIn,
                vehicleId,
                companyId,
                productId,
                driverId,
                userId: userId || 1,
                referenciaGuia,
                observations,
                origen,
                destino,
                datetimeIn: new Date()
            }
        });

        // Auditoría
        await logAction(userId || 1, isManual ? 'CREACION_TICKET_ENTRADA_MANUAL' : 'CREACION_TICKET_ENTRADA', { ticketId: ticket.id, vehicleId });

        res.json(ticket);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Lógica para pesaje de 1 sola pasada (Requiere que el vehículo tenga Tara configurada)
router.post('/single-pass', async (req, res) => {
    try {
        const {
            vehicleId,
            companyId,
            productId,
            driverId,
            weightCurrent, // Puede ser Bruto (peso cargado) o Tara (peso vacío, pero usamos la de la BD por defecto)
            userId,
            movementType,
            referenciaGuia,
            observations,
            origen,
            destino,
            isManual
        } = req.body;

        const vehicle = await prisma.vehicle.findUnique({ where: { id: parseInt(vehicleId) } });
        if (!vehicle) return res.status(400).json({ error: 'Vehículo no encontrado' });

        const tara = Number(vehicle.taraRegistrada || 0);
        if (tara <= 0) return res.status(400).json({ error: 'Este vehículo no tiene Tara registrada en el sistema.' });

        // Si el peso actual es mayor a la tara, entendemos que está trayendo carga y weightIn es Bruto, weightOut es Tara
        // Si el peso actual es menor a la tara (ej, viene a buscar carga), entendemos que weightIn es Tara, weightOut es Bruto
        // Para simplificar: el ticket siempre registra Entrada(Tara) Salida(Bruto) o viceversa, pero calcularemos el neto igual
        const currentW = Number(weightCurrent);

        let weightIn = 0;
        let weightOut = 0;

        if (currentW > tara) {
            // Vehículo cargado
            weightIn = tara;
            weightOut = currentW;
        } else {
            // Error, no puede ser que el vehículo pese menos que su tara, o en su defecto está descargado.
            // Lo tomamos como que viene a retirar carga, pero la balanza dice X.
            // Para estandarizar, siempre:
            weightIn = tara;
            weightOut = currentW;
        }

        const weightNet = Math.abs(weightIn - weightOut);

        const ticket = await prisma.weighingTicket.create({
            data: {
                status: 'COMPLETED', // Sale completado de una
                movementType: movementType || 'INTERNAL',
                isManual: isManual || false,
                weightIn,
                weightOut,
                weightNet,
                vehicleId: parseInt(vehicleId),
                companyId: parseInt(companyId),
                productId: parseInt(productId),
                driverId: parseInt(driverId),
                userId: userId || 1,
                referenciaGuia,
                observations,
                origen,
                destino,
                datetimeIn: new Date(),
                datetimeOut: new Date()
            },
            include: {
                company: true, vehicle: true, product: true, driver: true
            }
        });

        // Auditoría
        await logAction(userId || 1, isManual ? 'CREACION_TICKET_UNICA_MANUAL' : 'CREACION_TICKET_UNICA_PASADA', { ticketId: ticket.id, vehicleId, weightNet });

        res.json(ticket);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Lógica para cerrar un ticket de salida (Cerrar transacción)
router.post('/out/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { weightOut, isManual } = req.body;

        const ticket = await prisma.weighingTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) return res.status(400).json({ error: 'Ticket no encontrado' });

        // Neto = Valor absoluto de la diferencia
        const weightNet = Math.abs(Number(ticket.weightIn) - Number(weightOut));

        // Si el ticket ya era manual (de la entrada) o ahora la salida es manual, será marcado como manual.
        const totalManual = ticket.isManual || isManual;

        const updated = await prisma.weighingTicket.update({
            where: { id: ticketId },
            data: {
                weightOut,
                weightNet,
                isManual: totalManual,
                datetimeOut: new Date(),
                status: 'COMPLETED'
            },
            include: {
                company: true, vehicle: true, product: true, driver: true
            }
        });

        // Auditoría
        await logAction((req as any).user?.id || 1, isManual ? 'CIERRE_TICKET_SALIDA_MANUAL' : 'CIERRE_TICKET_SALIDA', { ticketId: updated.id, weightNet: updated.weightNet });

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
