import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Seed System Configs
  const configs = [
    {
      key: 'VOLUMETRIC_DIVISOR',
      value: '5000',
      description: 'The divisor used in calculating volumetric weight: (L * W * H) / DIVISOR.'
    },
    {
      key: 'AUTO_ASSIGN_ENABLE',
      value: 'true',
      description: 'Enable or disable automatic agent assignment upon order creation.'
    },
    {
      key: 'MAX_DRIVER_LOAD',
      value: '3',
      description: 'Maximum number of active delivery orders an agent can handle at any one time.'
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config
    });
    console.log(`✅ Seeded configuration key: ${config.key}`);
  }

  // 2. Seed Zones
  const zonesData = [
    { name: 'North Zone' },
    { name: 'South Zone' },
    { name: 'East Zone' }
  ];

  const zones = {};
  for (const zone of zonesData) {
    const record = await prisma.zone.upsert({
      where: { name: zone.name },
      update: {},
      create: zone
    });
    zones[zone.name] = record.id;
    console.log(`✅ Seeded Zone: ${zone.name} (${record.id})`);
  }

  // 3. Seed Areas
  const areasData = [
    { name: 'Downtown', zoneName: 'North Zone' },
    { name: 'Airport', zoneName: 'North Zone' },
    { name: 'Suburbia', zoneName: 'South Zone' },
    { name: 'Industrial Area', zoneName: 'East Zone' }
  ];

  const areas = {};
  for (const area of areasData) {
    const zoneId = zones[area.zoneName];
    const record = await prisma.area.upsert({
      where: { name: area.name },
      update: { zoneId },
      create: { name: area.name, zoneId }
    });
    areas[area.name] = record.id;
    console.log(`✅ Seeded Area: ${area.name} in ${area.zoneName} (${record.id})`);
  }

  // 4. Seed Rate Cards
  const rateCardsData = [
    {
      pickupZoneName: 'North Zone',
      dropZoneName: 'North Zone',
      orderType: 'B2C',
      baseWeightLimit: 2.0,
      basePrice: 10.0,
      pricePerKg: 2.0,
      codSurcharge: 5.0
    },
    {
      pickupZoneName: 'North Zone',
      dropZoneName: 'North Zone',
      orderType: 'B2B',
      baseWeightLimit: 5.0,
      basePrice: 20.0,
      pricePerKg: 1.5,
      codSurcharge: 3.0
    },
    {
      pickupZoneName: 'North Zone',
      dropZoneName: 'South Zone',
      orderType: 'B2C',
      baseWeightLimit: 2.0,
      basePrice: 15.0,
      pricePerKg: 3.0,
      codSurcharge: 5.0
    },
    {
      pickupZoneName: 'North Zone',
      dropZoneName: 'South Zone',
      orderType: 'B2B',
      baseWeightLimit: 5.0,
      basePrice: 30.0,
      pricePerKg: 2.5,
      codSurcharge: 3.0
    },
    {
      pickupZoneName: 'South Zone',
      dropZoneName: 'South Zone',
      orderType: 'B2C',
      baseWeightLimit: 2.0,
      basePrice: 10.0,
      pricePerKg: 2.0,
      codSurcharge: 5.0
    },
    {
      pickupZoneName: 'East Zone',
      dropZoneName: 'North Zone',
      orderType: 'B2C',
      baseWeightLimit: 2.0,
      basePrice: 25.0,
      pricePerKg: 4.0,
      codSurcharge: 5.0
    },
    {
      pickupZoneName: 'East Zone',
      dropZoneName: 'North Zone',
      orderType: 'B2B',
      baseWeightLimit: 5.0,
      basePrice: 45.0,
      pricePerKg: 3.0,
      codSurcharge: 3.0
    }
  ];

  for (const rc of rateCardsData) {
    const pickupZoneId = zones[rc.pickupZoneName];
    const dropZoneId = zones[rc.dropZoneName];

    await prisma.rateCard.upsert({
      where: {
        pickupZoneId_dropZoneId_orderType: {
          pickupZoneId,
          dropZoneId,
          orderType: rc.orderType
        }
      },
      update: {
        baseWeightLimit: rc.baseWeightLimit,
        basePrice: rc.basePrice,
        pricePerKg: rc.pricePerKg,
        codSurcharge: rc.codSurcharge
      },
      create: {
        pickupZoneId,
        dropZoneId,
        orderType: rc.orderType,
        baseWeightLimit: rc.baseWeightLimit,
        basePrice: rc.basePrice,
        pricePerKg: rc.pricePerKg,
        codSurcharge: rc.codSurcharge
      }
    });
    console.log(`✅ Seeded RateCard: ${rc.pickupZoneName} ➔ ${rc.dropZoneName} [${rc.orderType}]`);
  }

  // 5. Seed Test Users (Idempotently)
  console.log('🌱 Seeding user accounts...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Alice (Customer)
  await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash,
      role: 'CUSTOMER',
      name: 'Alice Customer',
      phone: '1234567890'
    }
  });
  console.log('✅ Seeded Customer: alice@example.com');

  // Seed Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
      name: 'System Admin',
      phone: '5555555555'
    }
  });
  console.log('✅ Seeded Admin: admin@example.com');

  // Seed Bob (Agent with linked AgentProfile)
  const bobUser = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  if (!bobUser) {
    const bob = await prisma.user.create({
      data: {
        email: 'bob@example.com',
        passwordHash,
        role: 'AGENT',
        name: 'Bob Agent',
        phone: '9876543210',
        agentProfile: {
          create: {
            licenseNumber: 'LIC-BOB-9988',
            vehicleType: 'Motorcycle',
            zoneId: zones['North Zone'],
            status: 'AVAILABLE'
          }
        }
      }
    });
    console.log(`✅ Seeded Agent Bob: ${bob.email}`);
  } else {
    console.log('ℹ️ Bob Agent already exists. Skipping profile creation.');
  }

  console.log('🌱 Comprehensive seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
