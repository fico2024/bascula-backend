const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@bascula.com';
    const password = 'admin123';
    const name = 'Administrador Sistema';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('El usuario administrador ya existe.');
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name,
            role: 'ADMIN'
        }
    });

    console.log('Usuario administrador creado con éxito:');
    console.log('Email:', email);
    console.log('Password:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
