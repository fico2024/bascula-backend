import { prisma } from '../prisma';

export async function logAction(userId: number, action: string, contextData?: any) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                contextData: contextData ? JSON.stringify(contextData) : null,
                timestamp: new Date()
            }
        });
    } catch (e) {
        console.error('Error al registrar logs de auditoría:', e);
    }
}
