const path = require('path');
const pgPath = path.resolve(__dirname, '../../backend/node_modules/pg');
const dotenvPath = path.resolve(__dirname, '../../backend/node_modules/dotenv');

const { Client } = require(pgPath);
require(dotenvPath).config({ path: path.resolve(__dirname, '../../backend/.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  const res = await client.query('SELECT id, email, name FROM users LIMIT 10;');
  console.log('USERS IN DB:');
  console.log(res.rows);
  const resJobs = await client.query('SELECT COUNT(*) FROM jobs;');
  console.log('TOTAL JOBS IN DB:', resJobs.rows[0].count);
  await client.end();
}

main().catch(console.error);
