import pool from './connection.js';

const seedCategories = async () => {
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
      `INSERT INTO task_categories (name, slug, description, icon, color)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         icon = VALUES(icon),
         color = VALUES(color)`,
      [
        category.name,
        category.slug,
        category.description,
        category.icon,
        category.color,
      ]
    );
  }
  
  console.log('✅ Categories seeded');
};

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


