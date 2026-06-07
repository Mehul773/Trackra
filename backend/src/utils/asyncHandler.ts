import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to Express's error-handling middleware.
 *
 * Without this, you'd need try/catch in EVERY controller:
 *
 *   // ❌ Without asyncHandler — repetitive and easy to forget
 *   const getJobs = async (req, res, next) => {
 *     try {
 *       const jobs = await prisma.job.findMany();
 *       res.json(jobs);
 *     } catch (err) {
 *       next(err); // Easy to forget this line!
 *     }
 *   };
 *
 *   // ✅ With asyncHandler — clean and safe
 *   const getJobs = asyncHandler(async (req, res) => {
 *     const jobs = await prisma.job.findMany();
 *     res.json(jobs);
 *   });
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
