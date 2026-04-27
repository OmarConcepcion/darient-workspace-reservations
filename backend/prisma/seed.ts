import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const officeDays = [1, 2, 3, 4, 5];

const seed = async (): Promise<void> => {
  const place = await prisma.place.upsert({
    where: { iotSiteId: "SITE_A" },
    update: {
      name: "Darient HQ",
      latitude: 8.9824,
      longitude: -79.5199,
      timezone: "America/Panama"
    },
    create: {
      iotSiteId: "SITE_A",
      name: "Darient HQ",
      latitude: 8.9824,
      longitude: -79.5199,
      timezone: "America/Panama"
    }
  });

  const spaces = [
    {
      iotOfficeId: "OFFICE_1",
      name: "Focus Office 1",
      locationReference: "Floor 1",
      capacity: 4,
      description: "Small office for focused work."
    },
    {
      iotOfficeId: "OFFICE_2",
      name: "Collaboration Office 2",
      locationReference: "Floor 1",
      capacity: 8,
      description: "Collaborative space for small teams."
    }
  ];

  for (const spaceInput of spaces) {
    const space = await prisma.space.upsert({
      where: {
        placeId_iotOfficeId: {
          placeId: place.id,
          iotOfficeId: spaceInput.iotOfficeId
        }
      },
      update: spaceInput,
      create: {
        ...spaceInput,
        placeId: place.id
      }
    });

    for (const dayOfWeek of officeDays) {
      await prisma.officeHour.upsert({
        where: {
          spaceId_dayOfWeek: {
            spaceId: space.id,
            dayOfWeek
          }
        },
        update: {
          opensAt: "08:00",
          closesAt: "18:00",
          isEnabled: true
        },
        create: {
          spaceId: space.id,
          dayOfWeek,
          opensAt: "08:00",
          closesAt: "18:00",
          isEnabled: true
        }
      });
    }

    await prisma.deviceDesired.upsert({
      where: { spaceId: space.id },
      update: {
        samplingIntervalSec: 10,
        co2AlertThreshold: 1000,
        publishStatus: "PENDING",
        publishError: null
      },
      create: {
        spaceId: space.id,
        samplingIntervalSec: 10,
        co2AlertThreshold: 1000,
        publishStatus: "PENDING"
      }
    });
  }
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
