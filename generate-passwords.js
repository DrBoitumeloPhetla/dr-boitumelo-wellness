// Script to generate bcrypt password hashes for Lerato and Potlako
import bcrypt from 'bcrypt';

async function generateHashes() {
  console.log('\n🔐 Generating bcrypt password hashes...\n');

  // You can change these passwords to whatever you want
  const leratoPassword = 'Lerato2024!';  // Change this
  const potlakoPassword = 'Potlako2024!';  // Change this

  try {
    console.log('Hashing passwords (this may take a few seconds)...\n');

    const leratoHash = await bcrypt.hash(leratoPassword, 10);
    const potlakoHash = await bcrypt.hash(potlakoPassword, 10);

    console.log('✅ Password hashes generated successfully!\n');
    console.log('─────────────────────────────────────────────────────────');
    console.log('LERATO:');
    console.log('  Password:', leratoPassword);
    console.log('  Hash:', leratoHash);
    console.log('─────────────────────────────────────────────────────────');
    console.log('POTLAKO:');
    console.log('  Password:', potlakoPassword);
    console.log('  Hash:', potlakoHash);
    console.log('─────────────────────────────────────────────────────────\n');

    console.log('📝 Next steps:');
    console.log('1. Copy the hashes above');
    console.log('2. Go to your Supabase dashboard → SQL Editor');
    console.log('3. Run this SQL query:\n');
    console.log('UPDATE admin_users');
    console.log(`SET password_hash = '${leratoHash}'`);
    console.log("WHERE username = 'Lerato';\n");
    console.log('UPDATE admin_users');
    console.log(`SET password_hash = '${potlakoHash}'`);
    console.log("WHERE username = 'Potlako';\n");
    console.log('4. Now you can log in with:');
    console.log(`   - Lerato: ${leratoPassword}`);
    console.log(`   - Potlako: ${potlakoPassword}\n`);

  } catch (error) {
    console.error('❌ Error generating hashes:', error);
  }
}

generateHashes();
