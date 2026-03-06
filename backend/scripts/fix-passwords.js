const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

async function fixPasswords() {
  try {
    console.log('🔧 Fixing passwords...\n');
    
    // Generate correct hashes for the passwords
    const saltRounds = 10;
    
    const passwords = {
      admin: 'admin123',
      teacher: 'teacher123',
      student: 'student123'
    };
    
    console.log('Generating password hashes...');
    const adminHash = await bcrypt.hash(passwords.admin, saltRounds);
    const teacherHash = await bcrypt.hash(passwords.teacher, saltRounds);
    const studentHash = await bcrypt.hash(passwords.student, saltRounds);
    
    console.log('✅ Hashes generated successfully\n');
    console.log('Admin hash:', adminHash);
    console.log('Teacher hash:', teacherHash);
    console.log('Student hash:', studentHash);
    console.log('');
    
    // Update admin password
    await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      { replacements: [adminHash, 'admin@school.com'] }
    );
    console.log('✅ Updated admin password');
    
    // Update teacher password
    await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      { replacements: [teacherHash, 'teacher@school.com'] }
    );
    console.log('✅ Updated teacher password');
    
    // Update student password
    await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      { replacements: [studentHash, 'student@school.com'] }
    );
    console.log('✅ Updated student password');
    
    // Verify the updates
    const [users] = await sequelize.query(
      'SELECT email, password FROM users ORDER BY role'
    );
    
    console.log('\n📊 Verifying updated users:');
    for (const user of users) {
      // Test each password
      let isValid = false;
      let testPassword = '';
      
      if (user.email === 'admin@school.com') {
        testPassword = passwords.admin;
        isValid = await bcrypt.compare(testPassword, user.password);
      } else if (user.email === 'teacher@school.com') {
        testPassword = passwords.teacher;
        isValid = await bcrypt.compare(testPassword, user.password);
      } else if (user.email === 'student@school.com') {
        testPassword = passwords.student;
        isValid = await bcrypt.compare(testPassword, user.password);
      }
      
      const status = isValid ? '✅ OK' : '❌ FAILED';
      console.log(   : );
      
      if (!isValid) {
        console.log(      Stored: );
        console.log(      Expected format for '': new hash);
      }
    }
    
    console.log('\n🎉 Password update complete!');
    console.log('You can now try logging in with:');
    console.log('   admin@school.com / admin123');
    console.log('   teacher@school.com / teacher123');
    console.log('   student@school.com / student123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

fixPasswords();
