// config/dbHelper.js
const sequelize = require('./database');
const { Sequelize } = require('sequelize');

// Function to wait for database to be ready
const waitForDatabase = async (retries = 10, delay = 3000) => {
  console.log('⏳ Waiting for database to be ready...');
  
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database is ready!');
      return true;
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${retries}: Database not ready yet, waiting ${delay/1000}s...`);
      console.log(`   Error: ${error.message}`);
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ Could not connect to database after multiple retries');
  return false;
};

// Function to sync database with retry logic
const syncDatabase = async (options = { force: false }) => {
  try {
    const isReady = await waitForDatabase();
    if (!isReady) {
      throw new Error('Database not ready');
    }
    
    console.log('🔄 Syncing database...');
    await sequelize.sync(options);
    console.log('✅ Database synced successfully');
    return true;
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    return false;
  }
};

// Function to check if a table exists
const tableExists = async (tableName) => {
  try {
    const [results] = await sequelize.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = '${process.env.DB_NAME || 'educational_platform'}' 
       AND table_name = '${tableName}'`
    );
    return results[0].count > 0;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
};

module.exports = {
  waitForDatabase,
  syncDatabase,
  tableExists
};