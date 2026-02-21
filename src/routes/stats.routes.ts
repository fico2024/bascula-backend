import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Estadísticas para el Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Total Kg Hoy
        const ticketsToday = await prisma.weighingTicket.aggregate({
            where: {
                datetimeOut: { gte: startOfDay },
                status: 'COMPLETED'
            },
            _sum: { weightNet: true },
            _count: { _all: true }
        });

        // 2. Kg por Producto (Top 5)
        const kgByProduct = await prisma.weighingTicket.groupBy({
            by: ['productId'],
            where: { status: 'COMPLETED' },
            _sum: { weightNet: true },
            orderBy: { _sum: { weightNet: 'desc' } },
            take: 5
        });

        // Resolver nombres de productos
        const resolvedProducts = await Promise.all(kgByProduct.map(async (item) => {
            if (!item.productId) return { name: 'S/D', value: 0 };
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            return {
                name: (product?.descripcion || 'Desconocido').split(' ')[0], // Nombre corto para gráfico
                value: Number(item._sum?.weightNet || 0)
            };
        }));

        // 3. Pesajes por día (Últimos 7 días)
        const lastTickets = await prisma.weighingTicket.findMany({
            where: {
                datetimeOut: { gte: last7Days },
                status: 'COMPLETED'
            },
            select: { datetimeOut: true, weightNet: true }
        });

        // Agrupar por fecha
        const weeklyDataMap: any = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            weeklyDataMap[dateStr] = 0;
        }

        lastTickets.forEach(t => {
            if (t.datetimeOut) {
                const dateStr = new Date(t.datetimeOut).toISOString().split('T')[0];
                if (weeklyDataMap[dateStr] !== undefined) {
                    weeklyDataMap[dateStr] += Number(t.weightNet || 0);
                }
            }
        });

        const weeklyData = Object.keys(weeklyDataMap).sort().map(date => ({
            date: date.split('-').slice(1).reverse().join('/'), // DD/MM
            kg: weeklyDataMap[date]
        }));

        res.json({
            today: {
                totalKg: Number(ticketsToday._sum?.weightNet || 0),
                totalTickets: ticketsToday._count?._all || 0
            },
            byProduct: resolvedProducts.filter(p => p.value > 0),
            weekly: weeklyData
        });

    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

export default router;
