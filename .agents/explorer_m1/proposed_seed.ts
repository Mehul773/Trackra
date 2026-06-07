import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const JobStatus = {
  NOT_APPLIED: 'NOT_APPLIED',
  APPLIED: 'APPLIED',
  INTERVIEW: 'INTERVIEW',
  OFFER: 'OFFER',
  REJECTED: 'REJECTED'
} as const;

const FitRating = {
  STRONG: 'STRONG',
  STRETCH: 'STRETCH',
  WEAK: 'WEAK'
} as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in the environment.');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Connecting to database and finding/creating test user...');

  // 1. Ensure the test user exists
  const testUser = await prisma.user.upsert({
    where: { email: 'test-user@example.com' },
    update: {},
    create: {
      email: 'test-user@example.com',
      name: 'Mock Test User',
      googleId: 'mock-test-id',
      avatar: 'https://lh3.googleusercontent.com/a/mock-avatar',
    },
  });

  console.log(`Test User resolved: ${testUser.name} (${testUser.id})`);

  // Define pools of mock data to pick from
  const titles = [
    'Software Engineer', 'Backend Developer', 'Frontend Developer',
    'Fullstack Engineer', 'Data Scientist', 'DevOps Engineer',
    'Product Manager', 'QA Engineer', 'UI/UX Designer', 'Mobile Developer',
    'Security Engineer', 'Cloud Architect', 'Site Reliability Engineer'
  ];

  const companies = [
    'Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft', 'Stripe',
    'Vercel', 'Supabase', 'Canva', 'Slack', 'Zoom', 'Salesforce', 'HubSpot'
  ];

  const locations = [
    'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
    'Remote, US', 'London, UK', 'Berlin, Germany', 'Hybrid', 'Toronto, ON'
  ];

  const salaries = [
    '$90k - $110k', '$120k - $140k', '$150k - $180k', '$200k+', 'GBP 85,000'
  ];

  const skillsPool = [
    'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Next.js',
    'Docker', 'AWS', 'Python', 'Go', 'Kubernetes', 'GraphQL', 'TailwindCSS'
  ];

  const contactNames = [
    'Alice Smith', 'Bob Jones', 'Charlie Vance', 'Dana Scully', 'Fox Mulder',
    'Bruce Wayne', 'Clark Kent', 'Diana Prince', 'Peter Parker', 'Tony Stark'
  ];

  const contactRoles = [
    'Recruiter', 'Hiring Manager', 'Technical Lead', 'HR Specialist', 'Referral'
  ];

  const statuses = Object.values(JobStatus);
  const fits = Object.values(FitRating);

  // Generate 1000 jobs
  console.log('Generating 1,000 mock jobs and contacts...');
  
  const jobsToCreate: any[] = [];
  for (let i = 1; i <= 1000; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)]!;
    const company = companies[Math.floor(Math.random() * companies.length)]!;
    const location = locations[Math.floor(Math.random() * locations.length)]!;
    const salary = salaries[Math.floor(Math.random() * salaries.length)]!;
    
    // Shuffle skills and pick 2 to 5 random skills
    const skills = [...skillsPool]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 2);

    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const fit = fits[Math.floor(Math.random() * fits.length)]!;

    // appliedOn and interviewOn logic based on status
    let appliedOn: Date | null = null;
    let interviewOn: Date | null = null;
    if (status !== 'NOT_APPLIED') {
      appliedOn = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    }
    if (status === 'INTERVIEW' || status === 'OFFER') {
      interviewOn = new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000);
    }

    // contacts
    const contactsCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 contacts
    const contactData = Array.from({ length: contactsCount }).map(() => {
      const name = contactNames[Math.floor(Math.random() * contactNames.length)]!;
      const role = contactRoles[Math.floor(Math.random() * contactRoles.length)]!;
      const email = `${name.toLowerCase().replace(' ', '.')}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`;
      const phone = `+1 (555) 01${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`;
      return { name, email, phone, role };
    });

    jobsToCreate.push({
      title,
      company,
      location,
      salary,
      url: `https://example.com/job/${i}`,
      sourceUrl: `https://example.com/job/${i}`,
      skills,
      fit,
      status,
      notes: `Mock notes for job index ${i} at ${company}.`,
      rawJD: `This is a raw job description for job index ${i}.`,
      briefJD: `Short summary of ${title} at ${company} located in ${location}.`,
      appliedOn,
      interviewOn,
      contacts: {
        create: contactData
      }
    });
  }

  // Insert in chunks of 100 to avoid transaction timeouts or memory limits
  const chunkSize = 100;
  console.log(`Starting database seeding in ${jobsToCreate.length / chunkSize} batches of ${chunkSize}...`);
  for (let i = 0; i < jobsToCreate.length; i += chunkSize) {
    const chunk = jobsToCreate.slice(i, i + chunkSize);
    
    await prisma.$transaction(
      chunk.map((job) =>
        prisma.job.create({
          data: {
            ...job,
            userId: testUser.id,
          },
        })
      )
    );
    console.log(`Seeded chunk ${i / chunkSize + 1} (${i + chunk.length}/1000)`);
  }

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error('Error during seeding:', e);
  process.exit(1);
});
