import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  role: z.enum(['CUSTOMER', 'AGENT'], { message: 'Role must be CUSTOMER or AGENT' }),
  vehicleType: z.string().optional(),
  licenseNumber: z.string().optional()
}).refine((data) => {
  if (data.role === 'AGENT') {
    return !!data.vehicleType && data.vehicleType.trim().length > 0;
  }
  return true;
}, {
  message: 'Vehicle type is required for agents',
  path: ['vehicleType']
}).refine((data) => {
  if (data.role === 'AGENT') {
    return !!data.licenseNumber && data.licenseNumber.trim().length > 0;
  }
  return true;
}, {
  message: 'License number is required for agents',
  path: ['licenseNumber']
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});
