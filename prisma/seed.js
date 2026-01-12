const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.medicineMaster.createMany({
    data: [
      {
        name: "Dolo 650",
        genericName: "Paracetamol",
        composition: "Paracetamol 650mg",
        dosageForm: "Tablet",
        packaging: "Strip of 15",
      },
      {
        name: "Crocin",
        genericName: "Paracetamol",
        composition: "Paracetamol 500mg",
        dosageForm: "Tablet",
        packaging: "Strip of 15",
      },
      {
        name: "Augmentin 625",
        genericName: "Amoxicillin + Clavulanic Acid",
        composition: "Amoxicillin 500mg + Clavulanic Acid 125mg",
        dosageForm: "Tablet",
        packaging: "Strip of 10",
      },
    ],
  });
}

main()
  .then(() => {
    console.log("✅ Seed data inserted");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
