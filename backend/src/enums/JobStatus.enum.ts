/**
 * Application status tracking for a job.
 * Mirrors the Prisma enum exactly — we define it here in code
 * so we can use it in controllers, services, and validations
 * without importing from @prisma/client everywhere.
 */
export enum JobStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
}
