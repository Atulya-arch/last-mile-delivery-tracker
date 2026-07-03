import { z } from 'zod';

export const rescheduleSchema = z.object({
  notes: z.string().trim().optional()
});
