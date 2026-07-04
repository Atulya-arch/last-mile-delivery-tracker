import { z } from 'zod';

export const createOrderSchema = z.object({
  customerId: z.string().uuid({ message: 'Valid customer ID is required' }).optional(),
  pickupAreaId: z.string().uuid({ message: 'Valid pickup area ID is required' }),
  dropAreaId: z.string().uuid({ message: 'Valid drop area ID is required' }),
  pickupAddress: z.string().trim().min(2, { message: 'Pickup address must be at least 2 characters long' }),
  deliveryAddress: z.string().trim().min(2, { message: 'Delivery address must be at least 2 characters long' }),
  length: z.number().positive({ message: 'Length must be greater than zero' }),
  width: z.number().positive({ message: 'Width must be greater than zero' }),
  height: z.number().positive({ message: 'Height must be greater than zero' }),
  actualWeight: z.number().positive({ message: 'Weight must be greater than zero' }),
  orderType: z.enum(['B2B', 'B2C'], { message: 'Order type must be B2B or B2C' }),
  paymentType: z.enum(['PREPAID', 'COD'], { message: 'Payment type must be PREPAID or COD' }),
  notes: z.string().optional()
});

export const overrideOrderSchema = z.object({
  status: z.enum([
    'CREATED',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RESCHEDULED'
  ], { message: 'Invalid status type' }).optional(),
  agentId: z.string().uuid({ message: 'Valid agent ID is required' }).nullable().optional(),
  notes: z.string().trim().min(1, { message: 'Override notes are required' })
}).refine(data => data.status !== undefined || data.agentId !== undefined, {
  message: 'Must provide either status or agentId to override',
  path: ['notes']
});
