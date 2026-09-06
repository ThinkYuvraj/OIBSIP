import { db } from './index.ts';
import { pizzas, inventory } from './schema.ts';

const initialInventory = [
  { id: 'base-1', name: 'Classic Thin Crust', category: 'base', stock: 45, unit: 'crusts', threshold: 20, price: '12.00' },
  { id: 'base-2', name: 'Neapolitan Hand-Tossed', category: 'base', stock: 18, unit: 'crusts', threshold: 20, price: '13.50' },
  { id: 'base-3', name: 'Cheese Burst Double Crust', category: 'base', stock: 30, unit: 'crusts', threshold: 15, price: '15.50' },
  { id: 'base-4', name: 'Pan Style Deep Crust', category: 'base', stock: 25, unit: 'crusts', threshold: 15, price: '14.00' },
  { id: 'base-5', name: 'Gluten-Free Cauliflower Herb Crust', category: 'base', stock: 16, unit: 'crusts', threshold: 20, price: '16.00' },

  { id: 'sauce-1', name: 'San Marzano Classic Marinara', category: 'sauce', stock: 60, unit: 'ladles', threshold: 20, price: '0.00' },
  { id: 'sauce-2', name: 'Spicy Calabrian Arrabiata', category: 'sauce', stock: 35, unit: 'ladles', threshold: 15, price: '0.50' },
  { id: 'sauce-3', name: 'Truffle Garlic Cream', category: 'sauce', stock: 14, unit: 'ladles', threshold: 20, price: '1.50' },
  { id: 'sauce-4', name: 'Basil Pistachio Pesto', category: 'sauce', stock: 28, unit: 'ladles', threshold: 15, price: '1.25' },
  { id: 'sauce-5', name: 'Smoky Bourbon Chipotle BBQ', category: 'sauce', stock: 32, unit: 'ladles', threshold: 15, price: '0.75' },

  { id: 'cheese-1', name: 'Fresh Fior di Latte Mozzarella', category: 'cheese', stock: 55, unit: 'portions', threshold: 20, price: '0.00' },
  { id: 'cheese-2', name: 'Buffalo Mozzarella DOC', category: 'cheese', stock: 22, unit: 'portions', threshold: 15, price: '2.00' },
  { id: 'cheese-3', name: 'Four Cheese Quattro Blend', category: 'cheese', stock: 26, unit: 'portions', threshold: 15, price: '2.50' },
  { id: 'cheese-4', name: 'Aged Sharp Smoked Cheddar', category: 'cheese', stock: 19, unit: 'portions', threshold: 20, price: '1.75' },
  { id: 'cheese-5', name: 'Plant-Based Almond Melt', category: 'cheese', stock: 24, unit: 'portions', threshold: 15, price: '2.25' },

  { id: 'veg-1', name: 'Crisp Bell Peppers', category: 'vegetable', stock: 50, unit: 'cups', threshold: 20, price: '1.00' },
  { id: 'veg-2', name: 'Kalamata Black Olives', category: 'vegetable', stock: 40, unit: 'cups', threshold: 15, price: '1.25' },
  { id: 'veg-3', name: 'Pickled Jalapeños', category: 'vegetable', stock: 35, unit: 'cups', threshold: 15, price: '1.00' },
  { id: 'veg-4', name: 'Wild Button Mushrooms', category: 'vegetable', stock: 17, unit: 'cups', threshold: 20, price: '1.50' },
  { id: 'veg-5', name: 'Caramelized Red Onions', category: 'vegetable', stock: 45, unit: 'cups', threshold: 15, price: '1.00' },
  { id: 'veg-6', name: 'Sweet Charred Corn', category: 'vegetable', stock: 38, unit: 'cups', threshold: 15, price: '1.00' },
  { id: 'veg-7', name: 'Sun-Dried Tomatoes', category: 'vegetable', stock: 29, unit: 'cups', threshold: 15, price: '1.50' },
  { id: 'veg-8', name: 'Fresh Genovese Basil Leaves', category: 'vegetable', stock: 65, unit: 'bunches', threshold: 25, price: '0.75' },
  { id: 'veg-9', name: 'Roasted Garlic Cloves', category: 'vegetable', stock: 33, unit: 'cups', threshold: 15, price: '1.00' },
  { id: 'veg-10', name: 'Baby Spinach Leaves', category: 'vegetable', stock: 28, unit: 'cups', threshold: 15, price: '1.00' },
];

const initialPizzas = [
  {
    id: 'pizza-1',
    name: 'Margherita DOC',
    description: 'San Marzano tomatoes, fresh fior di latte mozzarella, aromatic basil & EVOO.',
    price: '14.50',
    color: '#a5261e',
    rating: '4.9 (142)',
    category: 'Classics',
    imageUrl: '/images/pizza-margherita.jpg',
    recipe: { baseId: 'base-2', sauceId: 'sauce-1', cheeseId: 'cheese-1', vegetableIds: ['veg-8'] },
  },
  {
    id: 'pizza-2',
    name: 'Diavola Fire',
    description: 'Calabrian chili arrabiata, spicy artisanal pepperoni, mozzarella & fire-pickled jalapeños.',
    price: '17.00',
    color: '#a63b1d',
    rating: '4.8 (198)',
    category: 'Spicy',
    imageUrl: '/images/pizza-diavola.jpg',
    recipe: { baseId: 'base-1', sauceId: 'sauce-2', cheeseId: 'cheese-1', vegetableIds: ['veg-1', 'veg-3'] },
  },
  {
    id: 'pizza-3',
    name: 'White Truffle Crema',
    description: 'Truffle mascarpone cream, wild crimini mushrooms, caramelized red onions & smoked sea salt.',
    price: '18.50',
    color: '#473b22',
    rating: '4.9 (116)',
    category: 'Specialty',
    imageUrl: '/images/pizza-truffle.jpg',
    recipe: { baseId: 'base-1', sauceId: 'sauce-3', cheeseId: 'cheese-1', vegetableIds: ['veg-4', 'veg-5'] },
  },
  {
    id: 'pizza-4',
    name: 'Pistachio Pesto Verde',
    description: 'Genovese basil pistachio pesto, buffalo mozzarella, sun-dried tomatoes & baby spinach.',
    price: '16.50',
    color: '#51684c',
    rating: '4.7 (89)',
    category: 'Vegetarian',
    imageUrl: '/images/pizza-pesto.jpg',
    recipe: { baseId: 'base-2', sauceId: 'sauce-4', cheeseId: 'cheese-2', vegetableIds: ['veg-7', 'veg-10'] },
  },
  {
    id: 'pizza-5',
    name: 'Quattro Formaggi Grand',
    description: 'Stuffed cheese burst crust with Mozzarella, Gorgonzola, aged Parmesan & smoked Provolone.',
    price: '18.00',
    color: '#ab762b',
    rating: '4.8 (134)',
    category: 'Cheesy',
    imageUrl: '/images/pizza-quattro.jpg',
    recipe: { baseId: 'base-3', sauceId: 'sauce-1', cheeseId: 'cheese-3', vegetableIds: ['veg-8'] },
  },
  {
    id: 'pizza-6',
    name: 'Garden Primavera',
    description: 'Gluten-free herb crust, crisp bell peppers, black olives, roasted garlic & almond melt.',
    price: '16.00',
    color: '#34523e',
    rating: '4.9 (92)',
    category: 'Vegetarian',
    imageUrl: '/images/pizza-primavera.jpg',
    recipe: { baseId: 'base-5', sauceId: 'sauce-1', cheeseId: 'cheese-5', vegetableIds: ['veg-1', 'veg-2', 'veg-4', 'veg-9'] },
  },
];

export async function seedDatabase() {
  console.log('Seeding Cloud SQL inventory & pizza catalog...');
  for (const inv of initialInventory) {
    await db.insert(inventory).values(inv).onConflictDoNothing();
  }
  for (const p of initialPizzas) {
    await db.insert(pizzas).values(p).onConflictDoNothing();
  }
  console.log('Database seeding complete!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
