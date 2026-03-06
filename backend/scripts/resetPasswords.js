// backend/scripts/resetPasswords.js
const sequelize = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const saltRounds = 10;
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const teacherPassword = await bcrypt.hash('teacher123', saltRounds);
    const studentPassword = await bcrypt.hash('student123', saltRounds);

    // Update admin user
    await User.update(
      { password: adminPassword },
      { where: { email: 'admin@school.com' } }
    );
    console.log('✅ Admin password reset');

    // Update teacher user
    await User.update(
      { password: teacherPassword },
      { where: { email: 'teacher@school.com' } }
    );
    console.log('✅ Teacher password reset');

    // Update student user
    await User.update(
      { password: studentPassword },
      { where: { email: 'student@school.com' } }
    );
    console.log('✅ Student password reset');

    console.log('\n🎉 Passwords reset successfully!');
    console.log('\n📝 You can now login with:');
    console.log('   Admin:  admin@school.com / admin123');
    console.log('   Teacher: teacher@school.com / teacher123');
    console.log('   Student: student@school.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
    process.exit(1);
  }
}

resetPasswords();