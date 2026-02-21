import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { logAction } from '../services/audit.service';

const router = Router();

// Todas las rutas requieren ser ADMIN
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Listar usuarios
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Crear usuario
router.post('/', async (req: any, res) => {
    try {
        const { email, password, name, role } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, passwordHash, name, role }
        });

        await logAction(req.user.id, 'CREACION_USUARIO', { newUserId: user.id, email });
        res.json(user);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Editar usuario
router.put('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const { email, name, role, password } = req.body;

        const data: any = { email, name, role };
        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data
        });

        await logAction(req.user.id, 'EDICION_USUARIO', { targetUserId: id });
        res.json(user);
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

// Eliminar usuario
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id: parseInt(id) } });

        await logAction(req.user.id, 'ELIMINACION_USUARIO', { targetUserId: id });
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }) }
});

export default router;
