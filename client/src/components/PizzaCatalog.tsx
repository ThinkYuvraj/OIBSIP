import React, { useState } from 'react';
import type { ArtisanPizza, CartItem } from '../types.js';
import { Star, Flame, ShoppingBag, AlertCircle } from 'lucide-react';

interface PizzaCatalogProps {
  pizzas: ArtisanPizza[];
  onAddToCart: (item: CartItem) => void;
  onOpenBuilder: () => void;
}

export const PizzaCatalog: React.FC<PizzaCatalogProps> = ({ pizzas, onAddToCart, onOpenBuilder }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Pies' },
    { id: 'Classic', label: 'Classic Margherita & Marinara' },
    { id: 'Spicy', label: 'Spicy & Savory' },
    { id: 'Truffle & White', label: 'White & Truffle' },
    { id: 'Pesto & Green', label: 'Pesto Herb' },
    { id: 'Barbecue', label: 'Smoky BBQ' },
  ];

  const filteredPizzas = pizzas.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <section className="page menu" id="artisan-menu-section" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">LEVEL 3 TASK &bull; ARTISAN PIZZA DASHBOARD</span>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28 }}>Handcrafted Wood-Fired Varieties</h1>
          <p style={{ margin: 0, color: '#736d68', fontSize: 13 }}>
            Prepared in our 900°F volcanic stone oven. Stock is dynamically validated before every bake.
          </p>
        </div>

        <button
          id="catalog-open-builder-btn"
          onClick={onOpenBuilder}
          className="primary"
          style={{ padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Flame size={15} /> Build Your Custom Pie &rarr;
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 24 }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`menu-cat-filter-${cat.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: selectedCategory === cat.id ? '1px solid #c92722' : '1px solid #e0d9d4',
              background: selectedCategory === cat.id ? '#c92722' : '#ffffff',
              color: selectedCategory === cat.id ? '#ffffff' : '#4a4441',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Pizza Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        {filteredPizzas.map((pizza) => {
          const isAvailable = pizza.isAvailable !== false;

          return (
            <div
              key={pizza.id}
              id={`pizza-card-${pizza.id}`}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e5dfda',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Pizza Visual Thumbnail Top */}
              <div
                style={{
                  height: 180,
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#1c1917',
                }}
              >
                {pizza.imageUrl ? (
                  <img
                    src={pizza.imageUrl}
                    alt={pizza.name}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, ${pizza.color}25 0%, ${pizza.color}65 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        background: pizza.color,
                        boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
                        border: '3px solid #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 34,
                      }}
                    >
                      🍕
                    </div>
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  }}
                >
                  <Star size={12} fill="#eab308" color="#eab308" />
                  <span>{pizza.rating}</span>
                </div>

                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 14,
                    fontSize: 10,
                    fontWeight: 800,
                    background: 'rgba(24, 20, 18, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    color: '#fed7aa',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {pizza.category}
                </span>
              </div>

              {/* Pizza Details */}
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 17, color: '#2b2725' }}>{pizza.name}</h3>
                  <b style={{ fontSize: 16, color: '#c92722' }}>${pizza.price.toFixed(2)}</b>
                </div>

                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#736d68', lineHeight: 1.4, flex: 1 }}>
                  {pizza.description}
                </p>

                {/* Stock Warning if Depleted */}
                {!isAvailable && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} />
                    <span>Out of stock &bull; Ingredients depleted</span>
                  </div>
                )}

                <button
                  id={`add-to-cart-${pizza.id}`}
                  disabled={!isAvailable}
                  onClick={() =>
                    onAddToCart({
                      id: pizza.id,
                      name: pizza.name,
                      price: pizza.price,
                      quantity: 1,
                      isCustom: false,
                      color: pizza.color,
                      imageUrl: pizza.imageUrl,
                      description: pizza.description,
                    })
                  }
                  className="primary"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: isAvailable ? 1 : 0.5,
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                  }}
                >
                  <ShoppingBag size={14} />
                  {isAvailable ? 'Add to Cart' : 'Sold Out for Today'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
