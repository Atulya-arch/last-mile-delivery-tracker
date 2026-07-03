import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'OFFLINE'], { message: 'Status must be AVAILABLE or OFFLINE' })
});

export const updateZoneSchema = z.object({
  zoneId: z.string().uuid({ message: 'Valid Zone ID is required' })
});

export const agentOrderUpdateSchema = z.object({
  status: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'], {
    message: 'Invalid agent delivery status update'
  }),
  notes: z.string().optional(),
  failedReason: z.string().optional()
}).refine(data => {
  if (data.status === 'FAILED') {
    return !!data.failedReason && data.failedReason.trim().length > 0;
  }
  return true;
}, {
  message: 'Failed reason is required when transitioning order to FAILED status',
  path: ['failedReason']
});
