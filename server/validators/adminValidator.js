import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().trim().min(1, { message: 'Zone name is required' })
});

export const createAreaSchema = z.object({
  name: z.string().trim().min(1, { message: 'Area name is required' }),
  zoneId: z.string().uuid({ message: 'A valid Zone ID is required' })
});

export const createRateCardSchema = z.object({
  pickupZoneId: z.string().uuid({ message: 'A valid Pickup Zone ID is required' }),
  dropZoneId: z.string().uuid({ message: 'A valid Drop Zone ID is required' }),
  orderType: z.enum(['B2B', 'B2C'], { message: 'Order type must be B2B or B2C' }),
  baseWeightLimit: z.number().positive({ message: 'Base weight limit must be greater than zero' }),
  basePrice: z.number().nonnegative({ message: 'Base price must be greater than or equal to zero' }),
  pricePerKg: z.number().nonnegative({ message: 'Price per KG must be greater than or equal to zero' }),
  codSurcharge: z.number().nonnegative({ message: 'COD surcharge must be greater than or equal to zero' })
});
