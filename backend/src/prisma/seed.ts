import { prisma } from '../config/database';
import { JobStatus, FitRating } from '@prisma/client';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Find or create the mock test user
  const user = await prisma.user.upsert({
    where: { googleId: 'mock-test-id' },
    update: {},
    create: {
      googleId: 'mock-test-id',
      email: 'test-user@example.com',
      name: 'Mock Test User',
      avatar: 'https://lh3.googleusercontent.com/a/mock-avatar',
    },
  });

  console.log(`👤 Seed user ready: ${user.name} (${user.id})`);

  // 2. Clean up existing jobs for this user
  const deleteContactsCount = await prisma.contact.deleteMany({
    where: { job: { userId: user.id } }
  });
  const deleteJobsCount = await prisma.job.deleteMany({
    where: { userId: user.id }
  });
  console.log(`🧹 Deleted ${deleteJobsCount.count} existing jobs and ${deleteContactsCount.count} contacts.`);

  // 3. Prepare 1,000 mock jobs
  const jobsData: any[] = [];
  const contactsData: any[] = [];

  const roles = [
    'Software Engineer', 'Backend Developer', 'Frontend Developer', 'Fullstack Engineer',
    'Node.js Developer', 'React Developer', 'DevOps Engineer', 'Technical Lead',
    'Solutions Architect', 'Engineering Manager', 'QA Engineer', 'Product Manager',
    'Database Administrator', 'Data Engineer'
  ];

  const companies = [
    'Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft', 'Uber', 'Airbnb',
    'Stripe', 'Vercel', 'Supabase', 'Clerk', 'Linear', 'GitHub', 'OpenAI',
    'Tesla', 'Coinbase', 'Zoom', 'Shopify', 'Salesforce', 'Figma', 'Datadog'
  ];

  const locations = [
    'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
    'Remote', 'Remote (USA)', 'London, UK', 'Berlin, Germany', 'Bangalore, India',
    'Tokyo, Japan', 'Hybrid (San Francisco)', 'Hybrid (New York)', 'Toronto, Canada'
  ];

  const salaryRanges = [
    '$120,000 - $150,000', '$140,000 - $180,000', '$160,000 - $210,000',
    '$90,000 - $120,000', '$200,000 - $250,000', '12-15 LPA', '18-24 LPA',
    '30-40 LPA', 'Not Disclosed', '$80/hour', '$100/hour'
  ];

  const skillPool = [
    'Node.js', 'React', 'TypeScript', 'JavaScript', 'PostgreSQL', 'MongoDB',
    'Redis', 'AWS', 'Docker', 'Kubernetes', 'Python', 'Go', 'Express',
    'Next.js', 'GraphQL', 'TailwindCSS', 'Git', 'CI/CD', 'NestJS', 'Prisma'
  ];

  const statuses = [
    JobStatus.NOT_APPLIED,
    JobStatus.APPLIED,
    JobStatus.INTERVIEW,
    JobStatus.OFFER,
    JobStatus.REJECTED
  ];

  const fits = [FitRating.STRONG, FitRating.STRETCH, FitRating.WEAK];

  const contactNames = [
    'Sarah Jenkins', 'Michael Chang', 'Emily Rodriguez', 'David Kim', 'Jessica Taylor',
    'Alex Mercer', 'Daniel O\'Connor', 'Sophia Martinez', 'Ryan Gallagher', 'Amanda Chen'
  ];

  const contactRoles = ['Technical Recruiter', 'Hiring Manager', 'Talent Acquisition', 'HR Manager', 'Referral Lead'];

  for (let i = 1; i <= 1000; i++) {
    const jobId = `mock-job-${i}`;
    const title = roles[i % roles.length]! + (i % 7 === 0 ? ' (Senior)' : '');
    const company = companies[i % companies.length]!;
    const location = locations[i % locations.length]!;
    const salary = salaryRanges[i % salaryRanges.length]!;
    const fit = fits[i % fits.length]!;
    const status = statuses[i % statuses.length]!;
    const briefJD = `This is a mock job description for the ${title} position at ${company}. Looking for candidates skilled in ${skillPool[i % skillPool.length]!} and ${skillPool[(i + 1) % skillPool.length]!}.`;
    const rawJD = `Full Job Description Details:\nWelcome to ${company}! We are looking for an experienced ${title} to join our team in ${location}.\nCore requirements include: ${skillPool[i % skillPool.length]!}, ${skillPool[(i + 1) % skillPool.length]!}, and ${skillPool[(i + 2) % skillPool.length]!}.`;
    
    // Choose skills (3-6 skills)
    const skills: string[] = [];
    const skillsCount = 3 + (i % 4);
    for (let s = 0; s < skillsCount; s++) {
      const skill = skillPool[(i + s) % skillPool.length]!;
      if (!skills.includes(skill)) {
        skills.push(skill);
      }
    }

    let appliedOn = null;
    let interviewOn = null;
    if (status !== JobStatus.NOT_APPLIED) {
      appliedOn = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000);
    }
    if (status === JobStatus.INTERVIEW || status === JobStatus.OFFER) {
      interviewOn = new Date(Date.now() + (i % 7) * 24 * 60 * 60 * 1000);
    }

    jobsData.push({
      id: jobId,
      title,
      company,
      location,
      salary,
      url: `https://example.com/jobs/${jobId}`,
      sourceUrl: `https://example.com/jobs/${jobId}`,
      skills,
      fit,
      status,
      notes: i % 5 === 0 ? `Spoke to referrer, interview scheduled soon.` : null,
      rawJD,
      briefJD,
      appliedOn,
      interviewOn,
      userId: user.id,
      createdAt: new Date(Date.now() - (i % 60) * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });

    // Create 1-2 contacts for most jobs
    if (i % 10 !== 0) {
      const contactId1 = `mock-contact-${i}-1`;
      const name1 = contactNames[i % contactNames.length]!;
      const role1 = contactRoles[i % contactRoles.length]!;
      contactsData.push({
        id: contactId1,
        name: name1,
        email: `${name1.toLowerCase().replace(/[^a-z]/g, '')}@${company.toLowerCase()}.com`,
        phone: `+1-555-0100-${String(i).padStart(4, '0')}`,
        role: role1,
        jobId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 30% chance of having a second contact
      if (i % 3 === 0) {
        const contactId2 = `mock-contact-${i}-2`;
        const name2 = contactNames[(i + 3) % contactNames.length]!;
        const role2 = contactRoles[(i + 1) % contactRoles.length]!;
        contactsData.push({
          id: contactId2,
          name: name2,
          email: `${name2.toLowerCase().replace(/[^a-z]/g, '')}@${company.toLowerCase()}.com`,
          phone: `+1-555-0200-${String(i).padStart(4, '0')}`,
          role: role2,
          jobId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  console.log(`📦 Seeding 1,000 jobs...`);
  await prisma.job.createMany({
    data: jobsData,
  });

  console.log(`👥 Seeding ${contactsData.length} contacts...`);
  await prisma.contact.createMany({
    data: contactsData,
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
