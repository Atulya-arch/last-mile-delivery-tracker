import { z } from 'zod';

export const quoteSchema = z.object({
  pickupAreaId: z.string().uuid({ message: 'Valid pickup area ID is required' }),
  dropAreaId: z.string().uuid({ message: 'Valid drop area ID is required' }),
  length: z.number().positive({ message: 'Length must be greater than zero' }),
  width: z.number().positive({ message: 'Width must be greater than zero' }),
  height: z.number().positive({ message: 'Height must be greater than zero' }),
  actualWeight: z.number().positive({ message: 'Weight must be greater than zero' }),
  orderType: z.enum(['B2B', 'B2C'], { message: 'Order type must be B2B or B2C' }),
  paymentType: z.enum(['PREPAID', 'COD'], { message: 'Payment type must be PREPAID or COD' })
});
