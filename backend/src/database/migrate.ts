import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database connection without specifying database (to create it if needed)
const getAdminConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
};

// Get database connection with database specified
const getDbConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'daily_task_manager',
    multipleStatements: true,
    flags: ['-FOUND_ROWS'],
  });
};

// Create database if it doesn't exist
const createDatabase = async (connection: mysql.Connection) => {
  const dbName = process.env.DB_NAME || 'daily_task_manager';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);
  console.log(`✅ Database '${dbName}' ready`);
};

// Drop all tables (fresh start)
const dropAllTables = async (connection: mysql.Connection) => {
  console.log('🗑️  Dropping all tables...');
  
  // Get all table names
  const [tables] = await connection.query<any[]>(
    `SELECT TABLE_NAME 
     FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = ? 
     AND TABLE_TYPE = 'BASE TABLE'`,
    [process.env.DB_NAME || 'daily_task_manager']
  );

  if (tables.length > 0) {
    // Disable foreign key checks temporarily
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop all tables
    for (const table of tables) {
      await connection.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
      console.log(`   Dropped table: ${table.TABLE_NAME}`);
    }
    
    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables dropped');
  } else {
    console.log('ℹ️  No tables to drop');
  }
};

// Run schema.sql
const runSchema = async (connection: mysql.Connection) => {
  console.log('📋 Running schema.sql...');
  const schemaPath = join(__dirname, 'schema.sql');
  let schema = readFileSync(schemaPath, 'utf-8');
  
  // Remove comments and clean up the schema
  schema = schema
    .split('\n')
    .map(line => {
      // Remove single-line comments (but preserve -- in strings)
      const commentIndex = line.indexOf('--');
      if (commentIndex >= 0 && !line.substring(0, commentIndex).includes("'")) {
        return line.substring(0, commentIndex);
      }
      return line;
    })
    .join('\n')
    .trim();

  // Split by semicolon, but preserve multi-line statements
  // This regex matches semicolons that are not inside quotes
  const statements: string[] = [];
  let currentStatement = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < schema.length; i++) {
    const char = schema[i];
    const nextChar = schema[i + 1];
    
    if (!inQuotes && (char === '"' || char === "'" || char === '`')) {
      inQuotes = true;
      quoteChar = char;
      currentStatement += char;
    } else if (inQuotes && char === quoteChar && schema[i - 1] !== '\\') {
      inQuotes = false;
      quoteChar = '';
      currentStatement += char;
    } else if (!inQuotes && char === ';') {
      currentStatement = currentStatement.trim();
      if (currentStatement.length > 0) {
        statements.push(currentStatement);
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (statement.length === 0 || statement.startsWith('--')) {
      continue;
    }

    try {
      await connection.query(statement);
      successCount++;
    } catch (error: any) {
      // Ignore "table already exists" errors
      if (error.message.includes('already exists') || error.code === 'ER_TABLE_EXISTS_ERROR') {
        successCount++;
        continue;
      }
      
      errorCount++;
      console.error(`❌ Error executing statement ${i + 1}:`, error.message.substring(0, 150));
      console.error(`   Statement: ${statement.substring(0, 100)}...`);
      
      // For critical errors, throw to stop migration
      if (!error.message.includes('Duplicate') && !error.message.includes('already exists')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ Executed ${successCount} statements${errorCount > 0 ? ` (${errorCount} warnings)` : ''}`);
  
  // Verify tables were created
  const [tables] = await connection.query<any[]>(
    `SELECT TABLE_NAME 
     FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = ? 
     AND TABLE_TYPE = 'BASE TABLE'`,
    [process.env.DB_NAME || 'daily_task_manager']
  );
  
  if (tables.length === 0) {
    throw new Error('No tables were created! Schema execution may have failed.');
  }
  
  console.log(`✅ Schema applied (${tables.length} tables created)`);
  tables.forEach((table: any) => {
    console.log(`   ✓ ${table.TABLE_NAME}`);
  });
};

// Get migration files in order
const getMigrationFiles = (): string[] => {
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically to ensure order
  
  return files.map(file => join(migrationsDir, file));
};

// Run a single migration file
const runMigration = async (connection: mysql.Connection, filePath: string) => {
  const fileName = filePath.split(/[/\\]/).pop();
  console.log(`🔄 Running migration: ${fileName}...`);
  
  try {
    const migration = readFileSync(filePath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (stmtError: any) {
          // Check if error is because column/constraint already exists or table doesn't exist
          const errorMsg = stmtError.message.toLowerCase();
          const errorCode = stmtError.code || '';
          
          // Skip errors that indicate the migration has already been applied or structure already exists
          const isDuplicateError = 
            errorMsg.includes('duplicate column name') ||
            errorMsg.includes('duplicate key name') ||
            errorMsg.includes('duplicate entry') ||
            errorMsg.includes('already exists') ||
            errorCode === 'ER_DUP_FIELDNAME' ||
            errorCode === 'ER_DUP_KEYNAME' ||
            errorCode === 'ER_DUP_ENTRY';
          
          const isDropError = 
            errorCode === 'ER_CANT_DROP_FIELD_OR_KEY' && 
            statement.toUpperCase().includes('DROP');
          
          const isDeleteOnMissingTable = 
            errorCode === 'ER_NO_SUCH_TABLE' && 
            statement.toUpperCase().includes('DELETE FROM');
          
          if (isDuplicateError || isDropError || isDeleteOnMissingTable) {
            // These are expected in some scenarios (migration already applied, or structure already matches)
            // Continue with next statement
            continue;
          } else {
            // For other errors, log and re-throw
            console.warn(`⚠️  Migration statement failed: ${statement.substring(0, 80)}...`);
            console.warn(`   Error: ${stmtError.message}`);
            throw stmtError;
          }
        }
      }
    }
    
    console.log(`✅ Migration ${fileName} completed`);
  } catch (error: any) {
    console.error(`❌ Error running migration ${fileName}:`, error.message);
    throw error;
  }
};

// Run all migrations
const runMigrations = async (connection: mysql.Connection) => {
  const migrationFiles = getMigrationFiles();
  
  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migration files found');
    return;
  }
  
  console.log(`📦 Found ${migrationFiles.length} migration(s)`);
  
  for (const filePath of migrationFiles) {
    await runMigration(connection, filePath);
  }
  
  console.log('✅ All migrations completed');
};

// Main migration function
const migrate = async (fresh: boolean = false) => {
  let adminConnection: mysql.Connection | null = null;
  let dbConnection: mysql.Connection | null = null;

  try {
    console.log('🚀 Starting database migration...\n');

    // Step 1: Create database if it doesn't exist
    adminConnection = await getAdminConnection();
    await createDatabase(adminConnection);
    await adminConnection.end();

    // Step 2: Connect to the database
    dbConnection = await getDbConnection();

    // Step 3: Drop all tables if fresh start
    if (fresh) {
      await dropAllTables(dbConnection);
      console.log('');
    }

    // Step 4: Run schema (only if fresh, or if tables don't exist)
    if (fresh) {
      await runSchema(dbConnection);
      console.log('');
    }

    // Step 5: Run migrations
    await runMigrations(dbConnection);

    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (adminConnection) await adminConnection.end().catch(() => {});
    if (dbConnection) await dbConnection.end().catch(() => {});
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const fresh = args.includes('--fresh') || args.includes('-f');

if (fresh) {
  console.log('⚠️  FRESH MODE: All existing data will be deleted!\n');
}

migrate(fresh);

