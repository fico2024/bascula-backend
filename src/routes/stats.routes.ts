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

// Reporte Completo (Filtrable por rango de fechas)
router.get('/reports', async (req: any, res) => {
    try {
        const { from, to } = req.query;
        const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dateTo = to ? new Date(to as string) : new Date();
        dateTo.setHours(23, 59, 59, 999);

        const tickets = await prisma.weighingTicket.findMany({
            where: {
                status: 'COMPLETED',
                datetimeOut: { gte: dateFrom, lte: dateTo }
            },
            include: {
                company: { select: { razonSocial: true } },
                product: { select: { descripcion: true } },
            }
        });

        // 1. Kg por día
        const byDay: Record<string, number> = {};
        // 2. Kg por empresa (top 8)
        const byCompany: Record<string, number> = {};
        // 3. Kg por producto (top 8)
        const byProduct: Record<string, number> = {};
        // 4. Conteo por tipo de movimiento
        const byType: Record<string, number> = { PURCHASE: 0, SALE: 0, INTERNAL: 0 };
        // 5. Totales
        let totalKg = 0, totalTickets = 0;

        tickets.forEach(t => {
            const kg = Number(t.weightNet || 0);
            totalKg += kg;
            totalTickets++;

            // Por día
            if (t.datetimeOut) {
                const dayKey = new Date(t.datetimeOut).toISOString().split('T')[0];
                byDay[dayKey] = (byDay[dayKey] || 0) + kg;
            }

            // Por empresa
            const compName = t.company?.razonSocial || 'Sin empresa';
            byCompany[compName] = (byCompany[compName] || 0) + kg;

            // Por producto
            const prodName = (t.product?.descripcion || 'Sin producto').split(' ').slice(0, 2).join(' ');
            byProduct[prodName] = (byProduct[prodName] || 0) + kg;

            // Por tipo
            byType[t.movementType] = (byType[t.movementType] || 0) + kg;
        });

        // Serializar y ordenar resultados
        const dailyChart = Object.keys(byDay).sort().map(d => ({
            date: d.split('-').slice(1).join('/'),
            kg: Math.round(byDay[d])
        }));

        const companyChart = Object.entries(byCompany)
            .sort((a, b) => b[1] - a[1]).slice(0, 8)
            .map(([name, kg]) => ({ name, kg: Math.round(kg) }));

        const productChart = Object.entries(byProduct)
            .sort((a, b) => b[1] - a[1]).slice(0, 8)
            .map(([name, kg]) => ({ name, kg: Math.round(kg) }));

        const movTypeChart = [
            { name: 'Compras', kg: Math.round(byType.PURCHASE), fill: '#6366f1' },
            { name: 'Ventas', kg: Math.round(byType.SALE), fill: '#10b981' },
            { name: 'Interno', kg: Math.round(byType.INTERNAL), fill: '#f59e0b' },
        ];

        res.json({
            summary: { totalKg: Math.round(totalKg), totalTickets },
            dailyChart,
            companyChart,
            productChart,
            movTypeChart
        });

    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

export default router;
