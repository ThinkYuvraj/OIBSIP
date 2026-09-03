import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

// Get all artisan pizzas with stock availability
router.get('/', (_req: Request, res: Response) => {
  const pizzas = db.getPizzas();
  const inventory = db.getInventory();

  // Check if each recipe item has > 0 stock
  const enrichedPizzas = pizzas.map((pizza) => {
    let isAvailable = true;
    const missingIngredients: string[] = [];

    const base = inventory.find((i) => i.id === pizza.recipe.baseId);
    if (!base || base.stock <= 0) {
      isAvailable = false;
      missingIngredients.push(base?.name || 'Base');
    }

    const sauce = inventory.find((i) => i.id === pizza.recipe.sauceId);
    if (!sauce || sauce.stock <= 0) {
      isAvailable = false;
      missingIngredients.push(sauce?.name || 'Sauce');
    }

    const cheese = inventory.find((i) => i.id === pizza.recipe.cheeseId);
    if (!cheese || cheese.stock <= 0) {
      isAvailable = false;
      missingIngredients.push(cheese?.name || 'Cheese');
    }

    for (const vegId of pizza.recipe.vegetableIds) {
      const veg = inventory.find((i) => i.id === vegId);
      if (!veg || veg.stock <= 0) {
        isAvailable = false;
        missingIngredients.push(veg?.name || 'Vegetable');
      }
    }

    return {
      ...pizza,
      isAvailable,
      missingIngredients,
    };
  });

  res.json({ pizzas: enrichedPizzas });
});

// Get options for custom pizza builder (5 bases, 5 sauces, cheeses, vegetables)
router.get('/builder-options', (_req: Request, res: Response) => {
  const inventory = db.getInventory();

  const bases = inventory.filter((item) => item.category === 'base');
  const sauces = inventory.filter((item) => item.category === 'sauce');
  const cheeses = inventory.filter((item) => item.category === 'cheese');
  const vegetables = inventory.filter((item) => item.category === 'vegetable');

  res.json({
    bases,
    sauces,
    cheeses,
    vegetables,
    rules: {
      minVeggies: 0,
      maxVeggies: 8,
      defaultBasePrice: 12.0,
      taxRate: 0.08,
      deliveryFee: 3.5,
      freeDeliveryThreshold: 45.0,
    },
  });
});

export default router;
