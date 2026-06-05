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
    } else {
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

    // Sembrar plantas iniciales: opcion 1 a opcion 5
    for (let i = 1; i <= 5; i++) {
        const plantName = `opcion ${i}`;
        const existingPlant = await prisma.plant.findUnique({ where: { nombre: plantName } });
        if (!existingPlant) {
            await prisma.plant.create({ data: { nombre: plantName } });
            console.log(`Planta creada: ${plantName}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
