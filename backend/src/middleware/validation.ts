import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

export const ticketSchemas = {
  create: z.object({
    brand_name: z.string().min(1).max(255),
    description: z.string().optional(),
    issue_type: z.enum([
      'Product Not Live After Return',
      'GRN Discrepancy',
      'Physical Product vs SKU Mismatch',
      'Other'
    ]).optional(),
    expected_output: z.string().optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']),
  }),
  
  update: z.object({
    brand_name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    issue_type: z.enum([
      'Product Not Live After Return',
      'GRN Discrepancy',
      'Physical Product vs SKU Mismatch',
      'Other'
    ]).optional(),
    expected_output: z.string().optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
    current_assignee: z.string().uuid().optional(),
  }),
  
  resolve: z.object({
    remarks: z.string().min(1),
    attachments: z.array(z.string()).optional(),
  }),
  
  reopen: z.object({
    reason: z.string().min(1),
  }),
};

export const authSchemas = {
  login: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
};
