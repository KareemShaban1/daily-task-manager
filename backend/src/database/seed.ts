import pool from './connection.js';

// Note: Categories are now user-specific, so this seed function is deprecated.
// Categories should be created by users through the application.
// If you want to create default categories for a specific user, use:
// seedCategoriesForUser(userId)

const seedCategoriesForUser = async (userId: number) => {
  const categories = [
    {
      name: 'Spiritual',
      slug: 'spiritual',
      description: 'Spiritual practices and religious observances',
      icon: 'prayer',
      color: '#8B5CF6',
    },
    {
      name: 'Health',
      slug: 'health',
      description: 'Health and wellness activities',
      icon: 'heart',
      color: '#EF4444',
    },
    {
      name: 'Personal',
      slug: 'personal',
      description: 'Personal development and self-care',
      icon: 'user',
      color: '#3B82F6',
    },
    {
      name: 'Habits',
      slug: 'habits',
      description: 'Daily habits and routines',
      icon: 'repeat',
      color: '#10B981',
    },
  ];
  
  for (const category of categories) {
    await pool.execute(
      `INSERT INTO task_categories (user_id, name, slug, description, icon, color)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         icon = VALUES(icon),
         color = VALUES(color)`,
      [
        userId,
        category.name,
        category.slug,
        category.description,
        category.icon,
        category.color,
      ]
    );
  }
  
  console.log(`✅ Categories seeded for user ${userId}`);
};

const seed = async () => {
  try {
    console.log('⚠️  Category seeding is now user-specific.');
    console.log('⚠️  Use seedCategoriesForUser(userId) to create categories for a specific user.');
    console.log('✅ Database seeding completed (no action taken)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();

const seed = async () => {
  try {
    await seedCategories();
    console.log('✅ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();


