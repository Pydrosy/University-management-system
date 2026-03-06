// // config/database.js
// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'mysql',
//     logging: process.env.NODE_ENV === 'development' ? console.log : false,
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//   }
// );

// module.exports = sequelize;
// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'educational_platform',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Lisa2021!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' 
      ? (msg) => console.log(`📝 ${msg}`)  // Better formatted logs
      : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,  // Increased from 5 to 10 for better performance
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    retry: {
      max: 3,  // Retry connection up to 3 times
      timeout: 3000  // Wait 3 seconds between retries
    },
    dialectOptions: {
      connectTimeout: 60000  // 60 seconds connection timeout
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'educational_platform'}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   Database: ${process.env.DB_NAME || 'educational_platform'}`);
    console.error(`   User: ${process.env.DB_USER || 'root'}`);
    
    // Don't exit in Docker - let the container retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Run connection test in development
if (process.env.NODE_ENV === 'development') {
  testConnection();
}

// Handle connection errors
sequelize.afterConnect(() => {
  console.log('🔄 Database reconnected');
});

sequelize.beforeConnect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Attempting to connect to database...');
  }
});

module.exports = sequelize;