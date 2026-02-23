const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.systemSettings.findFirst();
    console.log("=== ROOT SYSTEM SETTINGS ===");
    console.log(settings);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
