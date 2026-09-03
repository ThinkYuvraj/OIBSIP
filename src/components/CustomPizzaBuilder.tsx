import React, { useState, useEffect } from 'react';
import type { InventoryItem, CartItem } from '../types.js';
import { api } from '../api/client.js';
import { Check, Flame, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';

interface CustomPizzaBuilderProps {
  onAddToCart: (item: CartItem) => void;
  onGoToCart: () => void;
}

export const CustomPizzaBuilder: React.FC<CustomPizzaBuilderProps> = ({ onAddToCart, onGoToCart }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Options loaded from backend inventory
  const [bases, setBases] = useState<InventoryItem[]>([]);
  const [sauces, setSauces] = useState<InventoryItem[]>([]);
  const [cheeses, setCheeses] = useState<InventoryItem[]>([]);
  const [vegetables, setVegetables] = useState<InventoryItem[]>([]);

  // Selections
  const [selectedBase, setSelectedBase] = useState<InventoryItem | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<InventoryItem | null>(null);
  const [selectedCheese, setSelectedCheese] = useState<InventoryItem | null>(null);
  const [selectedVeggies, setSelectedVeggies] = useState<InventoryItem[]>([]);

  const [notification, setNotification] = useState<string>('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const data = await api.getBuilderOptions();
      setBases(data.bases);
      setSauces(data.sauces);
      setCheeses(data.cheeses);
      setVegetables(data.vegetables);

      // Default selections (first available in stock)
      const firstBase = data.bases.find((b) => b.stock > 0) || data.bases[0];
      const firstSauce = data.sauces.find((s) => s.stock > 0) || data.sauces[0];
      const firstCheese = data.cheeses.find((c) => c.stock > 0) || data.cheeses[0];

      if (firstBase) setSelectedBase(firstBase);
      if (firstSauce) setSelectedSauce(firstSauce);
      if (firstCheese) setSelectedCheese(firstCheese);
    } catch (err) {
      console.error('Failed to load builder options:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVeggie = (veg: InventoryItem) => {
    if (veg.stock <= 0) return;
    const exists = selectedVeggies.some((v) => v.id === veg.id);
    if (exists) {
      setSelectedVeggies(selectedVeggies.filter((v) => v.id !== veg.id));
    } else {
      if (selectedVeggies.length >= 8) {
        setNotification('Maximum 8 vegetable toppings allowed per pie.');
        setTimeout(() => setNotification(''), 3000);
        return;
      }
      setSelectedVeggies([...selectedVeggies, veg]);
    }
  };

  // Price calculation
  const basePrice = selectedBase ? selectedBase.price : 12.0;
  const saucePrice = selectedSauce ? selectedSauce.price : 0;
  const cheesePrice = selectedCheese ? selectedCheese.price : 0;
  const veggiesPrice = selectedVeggies.reduce((sum, v) => sum + v.price, 0);
  const totalPrice = basePrice + saucePrice + cheesePrice + veggiesPrice;

  const handleAddCustomPizza = () => {
    if (!selectedBase || !selectedSauce || !selectedCheese) {
      setNotification('Please finish selecting your base, sauce, and cheese before adding to cart.');
      return;
    }

    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: `Custom Artisan Pie (${selectedBase.name})`,
      price: Number(totalPrice.toFixed(2)),
      quantity: 1,
      isCustom: true,
      color: '#a63b1d',
      description: `${selectedSauce.name}, ${selectedCheese.name}, with ${
        selectedVeggies.length > 0 ? selectedVeggies.map((v) => v.name).join(', ') : 'no extra veggies'
      }`,
      customDetails: {
        baseName: selectedBase.name,
        sauceName: selectedSauce.name,
        cheeseName: selectedCheese.name,
        vegetableNames: selectedVeggies.map((v) => v.name),
      },
    };

    onAddToCart(customItem);
    setNotification('🍕 Custom artisan pie added to your cart!');
    setTimeout(() => setNotification(''), 3500);
  };

  // Sauce visual color mapper
  const getSauceColor = () => {
    if (!selectedSauce) return '#991b1b';
    if (selectedSauce.name.includes('Marinara')) return '#b91c1c';
    if (selectedSauce.name.includes('Arrabiata')) return '#dc2626';
    if (selectedSauce.name.includes('Truffle Garlic')) return '#fef3c7';
    if (selectedSauce.name.includes('Pesto')) return '#4d7c0f';
    if (selectedSauce.name.includes('BBQ')) return '#78350f';
    return '#b91c1c';
  };

  // Cheese visual appearance
  const getCheeseOpacity = () => {
    if (!selectedCheese) return 0.7;
    if (selectedCheese.name.includes('Four Cheese')) return 0.9;
    if (selectedCheese.name.includes('Cheddar')) return 0.85;
    return 0.75;
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#736d68' }}>
        <Flame size={36} color="#c92722" style={{ margin: '0 auto 12px' }} />
        <p>Loading fresh artisan pantry ingredients...</p>
      </div>
    );
  }

  return (
    <section className="page builder" id="pizza-builder-section" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <span className="eyebrow">LEVEL 3 TASK &bull; CUSTOM PIZZA BUILDER</span>
          <h1 style={{ margin: '8px 0 4px', fontSize: 28 }}>Master Pizzaiolo Workbench</h1>
          <p style={{ margin: 0, color: '#736d68', fontSize: 13 }}>
            Construct your custom wood-fired pie in 4 artisan steps. Stock is monitored in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4].map((stepNum) => (
            <button
              key={stepNum}
              id={`builder-step-pill-${stepNum}`}
              onClick={() => setStep(stepNum)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                border: step === stepNum ? '1px solid #c92722' : '1px solid #e0d9d4',
                background: step === stepNum ? '#c92722' : '#fff',
                color: step === stepNum ? '#fff' : '#574f4b',
                cursor: 'pointer',
              }}
            >
              <span>{stepNum}</span>
              <span>
                {stepNum === 1 && 'Base'}
                {stepNum === 2 && 'Sauce'}
                {stepNum === 3 && 'Cheese'}
                {stepNum === 4 && 'Vegetables'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>{notification}</span>
          <button
            onClick={onGoToCart}
            style={{
              background: '#15803d',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            View Cart &rarr;
          </button>
        </div>
      )}

      {/* Main Builder Grid: Visual Simulator on Left + Selection Matrix on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* Left: Interactive Pizza Stage & Spec Breakdown */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5dfda',
            padding: 24,
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            position: 'sticky',
            top: 20,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Live Pie Simulator</h3>
            <span style={{ fontSize: 11, color: '#888' }}>Visual recipe preview (12-inch Wood-Fired)</span>
          </div>

          {/* Canvas-style SVG Interactive Visual Pizza Simulator */}
          <div
            id="pizza-visual-canvas"
            style={{
              position: 'relative',
              width: 260,
              height: 260,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: '#dfaf7d',
              boxShadow: 'inset 0 0 16px rgba(115, 62, 17, 0.6), 0 12px 24px rgba(0,0,0,0.12)',
              border: '8px solid #c8894d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'all 0.4s ease',
            }}
          >
            {/* Charred Cornicione Spots */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundImage:
                  'radial-gradient(circle at 20% 30%, #542c0c 3px, transparent 4px), radial-gradient(circle at 80% 25%, #421e06 4px, transparent 5px), radial-gradient(circle at 40% 85%, #542c0c 3px, transparent 4px), radial-gradient(circle at 85% 70%, #421e06 4px, transparent 5px)',
                pointerEvents: 'none',
              }}
            />

            {/* Sauce Layer */}
            <div
              id="pizza-sauce-layer"
              style={{
                width: 218,
                height: 218,
                borderRadius: '50%',
                background: getSauceColor(),
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.5s ease',
              }}
            >
              {/* Cheese Melt Layer */}
              <div
                id="pizza-cheese-layer"
                style={{
                  width: 198,
                  height: 198,
                  borderRadius: '50%',
                  background:
                    selectedCheese?.name.includes('Cheddar')
                      ? 'radial-gradient(circle, #fde047 30%, #facc15 80%)'
                      : 'radial-gradient(circle, #fef08a 25%, #fef9c3 70%, #fef3c7 95%)',
                  opacity: getCheeseOpacity(),
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s ease',
                }}
              >
                {/* Melted Cheese Blisters */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'radial-gradient(circle at 35% 40%, rgba(180,83,9,0.35) 4px, transparent 5px), radial-gradient(circle at 65% 30%, rgba(180,83,9,0.3) 5px, transparent 6px), radial-gradient(circle at 50% 70%, rgba(180,83,9,0.3) 4px, transparent 5px)',
                  }}
                />
              </div>

              {/* Placed Vegetables on top */}
              <div
                id="pizza-toppings-layer"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                }}
              >
                {selectedVeggies.map((veg, index) => {
                  // Coordinate scatter algorithm
                  const angles = [30, 85, 140, 195, 250, 310, 60, 160, 220, 290];
                  const angle = (angles[index % angles.length] * Math.PI) / 180;
                  const radius = 55 + ((index * 17) % 35);
                  const x = 109 + Math.cos(angle) * radius - 10;
                  const y = 109 + Math.sin(angle) * radius - 10;

                  let color = '#15803d';
                  let symbol = '🍃';
                  if (veg.name.includes('Olives')) {
                    color = '#171717';
                    symbol = '●';
                  } else if (veg.name.includes('Jalapeño')) {
                    color = '#16a34a';
                    symbol = '🌶';
                  } else if (veg.name.includes('Mushroom')) {
                    color = '#78350f';
                    symbol = '🍄';
                  } else if (veg.name.includes('Onion')) {
                    color = '#831843';
                    symbol = '🧅';
                  } else if (veg.name.includes('Corn')) {
                    color = '#eab308';
                    symbol = '🌽';
                  } else if (veg.name.includes('Tomato')) {
                    color = '#991b1b';
                    symbol = '🍅';
                  } else if (veg.name.includes('Garlic')) {
                    color = '#fef08a';
                    symbol = '🧄';
                  }

                  return (
                    <div
                      key={veg.id}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: color,
                        color: '#fff',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                      title={veg.name}
                    >
                      {symbol}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Recipe Specs */}
          <div style={{ background: '#faf8f6', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#736d68' }}>Base (Step 1):</span>
              <b style={{ color: '#2b2725' }}>{selectedBase?.name} (${selectedBase?.price.toFixed(2)})</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#736d68' }}>Sauce (Step 2):</span>
              <b style={{ color: '#2b2725' }}>
                {selectedSauce?.name} {selectedSauce && selectedSauce.price > 0 ? `(+$${selectedSauce.price.toFixed(2)})` : '(Incl)'}
              </b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#736d68' }}>Cheese (Step 3):</span>
              <b style={{ color: '#2b2725' }}>
                {selectedCheese?.name} {selectedCheese && selectedCheese.price > 0 ? `(+$${selectedCheese.price.toFixed(2)})` : '(Incl)'}
              </b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#736d68' }}>Veggies ({selectedVeggies.length}):</span>
              <b style={{ color: '#2b2725' }}>
                {selectedVeggies.length === 0 ? 'None' : `+$${veggiesPrice.toFixed(2)}`}
              </b>
            </div>
          </div>

          {/* Price & Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #eee' }}>
            <div>
              <span style={{ fontSize: 11, color: '#888' }}>Calculated Total</span>
              <h2 style={{ margin: '2px 0 0', fontSize: 24, color: '#c92722' }}>
                ${totalPrice.toFixed(2)}
              </h2>
            </div>

            <button
              id="builder-add-to-cart-btn"
              onClick={handleAddCustomPizza}
              className="primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontSize: 13,
              }}
            >
              <ShoppingBag size={15} /> Add Pie to Order
            </button>
          </div>
        </div>

        {/* Right: Step-by-Step Option Selectors */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5dfda',
            padding: 28,
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          }}
        >
          {/* STEP 1: PIZZA BASES (5 Options) */}
          {step === 1 && (
            <div id="builder-step-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c92722', textTransform: 'uppercase' }}>
                    Step 1 of 4
                  </span>
                  <h2 style={{ margin: '4px 0', fontSize: 22 }}>Choose a Pizza Base (5 Options)</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                    Every artisan crust is fermented for 48 hours for maximum digestibility.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bases.map((base) => {
                  const isSelected = selectedBase?.id === base.id;
                  const isOutOfStock = base.stock <= 0;
                  const isLowStock = base.stock > 0 && base.stock <= base.threshold;

                  return (
                    <div
                      key={base.id}
                      id={`base-option-${base.id}`}
                      onClick={() => !isOutOfStock && setSelectedBase(base)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #c92722' : '1px solid #e0d8d3',
                        background: isSelected ? '#fffdfd' : isOutOfStock ? '#f5f5f4' : '#fff',
                        opacity: isOutOfStock ? 0.6 : 1,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <b style={{ fontSize: 15, color: '#2b2725' }}>{base.name}</b>
                          {base.badge && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              {base.badge}
                            </span>
                          )}
                          {isLowStock && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <AlertCircle size={10} /> Low Stock ({base.stock} left)
                            </span>
                          )}
                          {isOutOfStock && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#f3f4f6',
                                color: '#6b7280',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              Out of Stock
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>{base.description}</p>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#2b2725' }}>
                          ${base.price.toFixed(2)}
                        </span>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #c92722' : '2px solid #ccc',
                            background: isSelected ? '#c92722' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  id="builder-next-to-sauces"
                  onClick={() => setStep(2)}
                  className="primary"
                  style={{ padding: '12px 24px' }}
                >
                  Continue to Sauces &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SAUCES (5 Options) */}
          {step === 2 && (
            <div id="builder-step-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c92722', textTransform: 'uppercase' }}>
                    Step 2 of 4
                  </span>
                  <h2 style={{ margin: '4px 0', fontSize: 22 }}>Choose a Handcrafted Sauce (5 Options)</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                    Slow-simmered daily in copper cauldrons.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sauces.map((sauce) => {
                  const isSelected = selectedSauce?.id === sauce.id;
                  const isOutOfStock = sauce.stock <= 0;
                  const isLowStock = sauce.stock > 0 && sauce.stock <= sauce.threshold;

                  return (
                    <div
                      key={sauce.id}
                      id={`sauce-option-${sauce.id}`}
                      onClick={() => !isOutOfStock && setSelectedSauce(sauce)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #c92722' : '1px solid #e0d8d3',
                        background: isSelected ? '#fffdfd' : isOutOfStock ? '#f5f5f4' : '#fff',
                        opacity: isOutOfStock ? 0.6 : 1,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <b style={{ fontSize: 15, color: '#2b2725' }}>{sauce.name}</b>
                          {sauce.badge && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              {sauce.badge}
                            </span>
                          )}
                          {isLowStock && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              Low Stock ({sauce.stock} ladles)
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>{sauce.description}</p>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#2b2725' }}>
                          {sauce.price > 0 ? `+$${sauce.price.toFixed(2)}` : 'Included'}
                        </span>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #c92722' : '2px solid #ccc',
                            background: isSelected ? '#c92722' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: '1px solid #ccc',
                    borderRadius: 999,
                    padding: '10px 20px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  &larr; Back to Base
                </button>
                <button
                  id="builder-next-to-cheeses"
                  onClick={() => setStep(3)}
                  className="primary"
                  style={{ padding: '12px 24px' }}
                >
                  Continue to Cheese &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CHEESES */}
          {step === 3 && (
            <div id="builder-step-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c92722', textTransform: 'uppercase' }}>
                    Step 3 of 4
                  </span>
                  <h2 style={{ margin: '4px 0', fontSize: 22 }}>Choose a Cheese Type</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                    Selected for delicate melt and authentic wood-char blistering.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cheeses.map((cheese) => {
                  const isSelected = selectedCheese?.id === cheese.id;
                  const isOutOfStock = cheese.stock <= 0;
                  const isLowStock = cheese.stock > 0 && cheese.stock <= cheese.threshold;

                  return (
                    <div
                      key={cheese.id}
                      id={`cheese-option-${cheese.id}`}
                      onClick={() => !isOutOfStock && setSelectedCheese(cheese)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #c92722' : '1px solid #e0d8d3',
                        background: isSelected ? '#fffdfd' : isOutOfStock ? '#f5f5f4' : '#fff',
                        opacity: isOutOfStock ? 0.6 : 1,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <b style={{ fontSize: 15, color: '#2b2725' }}>{cheese.name}</b>
                          {cheese.badge && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              {cheese.badge}
                            </span>
                          )}
                          {isLowStock && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              Low Stock ({cheese.stock} portions)
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>{cheese.description}</p>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#2b2725' }}>
                          {cheese.price > 0 ? `+$${cheese.price.toFixed(2)}` : 'Included'}
                        </span>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #c92722' : '2px solid #ccc',
                            background: isSelected ? '#c92722' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: 'none',
                    border: '1px solid #ccc',
                    borderRadius: 999,
                    padding: '10px 20px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  &larr; Back to Sauce
                </button>
                <button
                  id="builder-next-to-veggies"
                  onClick={() => setStep(4)}
                  className="primary"
                  style={{ padding: '12px 24px' }}
                >
                  Continue to Vegetables &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: VEGETABLES (Multiple Select) */}
          {step === 4 && (
            <div id="builder-step-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c92722', textTransform: 'uppercase' }}>
                    Step 4 of 4
                  </span>
                  <h2 style={{ margin: '4px 0', fontSize: 22 }}>Select Vegetables (Multiple Select)</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#736d68' }}>
                    Pick as many fresh, farm-direct toppings as you desire (up to 8 toppings).
                  </p>
                </div>

                <div
                  style={{
                    background: '#fef3c7',
                    color: '#854d0e',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {selectedVeggies.length} Selected
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {vegetables.map((veg) => {
                  const isSelected = selectedVeggies.some((v) => v.id === veg.id);
                  const isOutOfStock = veg.stock <= 0;
                  const isLowStock = veg.stock > 0 && veg.stock <= veg.threshold;

                  return (
                    <div
                      key={veg.id}
                      id={`veggie-option-${veg.id}`}
                      onClick={() => toggleVeggie(veg)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid #c92722' : '1px solid #e3deda',
                        background: isSelected ? '#fffdfd' : isOutOfStock ? '#f5f5f4' : '#fff',
                        opacity: isOutOfStock ? 0.55 : 1,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                        minHeight: 88,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <b style={{ fontSize: 13, color: '#2b2725' }}>{veg.name}</b>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: isSelected ? '2px solid #c92722' : '2px solid #ccc',
                            background: isSelected ? '#c92722' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#c92722' }}>
                          +${veg.price.toFixed(2)}
                        </span>
                        {isLowStock && (
                          <span style={{ fontSize: 9, color: '#b45309', fontWeight: 600 }}>
                            {veg.stock} left
                          </span>
                        )}
                        {isOutOfStock && (
                          <span style={{ fontSize: 9, color: '#78716c', fontWeight: 600 }}>
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    background: 'none',
                    border: '1px solid #ccc',
                    borderRadius: 999,
                    padding: '10px 20px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  &larr; Back to Cheese
                </button>
                <button
                  id="builder-finish-btn"
                  onClick={handleAddCustomPizza}
                  className="primary"
                  style={{ padding: '12px 26px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Sparkles size={15} /> Finish &amp; Add Custom Pie (${totalPrice.toFixed(2)})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
