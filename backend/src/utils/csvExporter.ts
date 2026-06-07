import { Parser } from 'json2csv';
import { Job } from '@prisma/client';

/**
 * Fields to include in the CSV export, in order.
 * We exclude rawJD (it's huge) and userId (it's internal).
 */
const CSV_FIELDS: { label: string; value: string }[] = [
  { label: 'Title', value: 'title' },
  { label: 'Company', value: 'company' },
  { label: 'Location', value: 'location' },
  { label: 'Salary', value: 'salary' },
  { label: 'Status', value: 'status' },
  { label: 'Fit Rating', value: 'fit' },
  { label: 'Skills', value: 'skillsFormatted' },
  { label: 'URL', value: 'url' },
  { label: 'Notes', value: 'notes' },
  { label: 'Applied On', value: 'appliedOn' },
  { label: 'Interview On', value: 'interviewOn' },
  { label: 'Added On', value: 'createdAt' },
];

/**
 * Converts an array of Job records into a CSV string.
 * Skills array is joined into a comma-separated string for CSV readability.
 */
export const jobsToCsv = (jobs: Job[]): string => {
  // Transform jobs: convert skills array to a readable string
  const formattedJobs = jobs.map((job) => ({
    ...job,
    skillsFormatted: job.skills.join(', '),
    appliedOn: job.appliedOn?.toISOString() ?? '',
    interviewOn: job.interviewOn?.toISOString() ?? '',
    createdAt: job.createdAt.toISOString(),
  }));

  const parser = new Parser({ fields: CSV_FIELDS });
  return parser.parse(formattedJobs as Record<string, unknown>[]);
};
