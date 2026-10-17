// import-products.js - Import 300 products to Supabase

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://akshyahfnxmilhpimzme.supabase.co';
// Secret key: never commit it. Put it in .env.secret (gitignored) and run:
//   node --env-file=.env.secret import-products.js
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SECRET_KEY: add it to .env.secret, then run node --env-file=.env.secret import-products.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const brands = [
  "CeraVe", "La Roche-Posay", "Paula's Choice", "The Ordinary", "Cosrx", "Purito",
  "Drunk Elephant", "Neutrogena", "Cetaphil", "Bioderma", "Mario Badescu", "Thayers",
  "Vanicream", "Aveeno", "Eucerin", "Differin", "Kiehl's", "Clinique", "Shiseido",
  "SK-II", "Sunday Riley", "Tatcha", "Augustinus Bader", "Benton", "Isntree"
];

const categories = [
  "Cleanser", "Toner", "Essence", "Serum", "Moisturizer", 
  "SPF", "Treatment", "Mask", "Oil", "Exfoliant"
];

const ingredients_pool = [
  "Hyaluronic Acid", "Ceramides", "Niacinamide", "Salicylic Acid", "Glycolic Acid",
  "Lactic Acid", "Retinol", "Azelaic Acid", "Benzoyl Peroxide", "Vitamin C",
  "Centella Asiatica", "Green Tea Extract", "Peptides", "Zinc Oxide", "Titanium Dioxide",
  "Squalane", "Glycerin", "Panthenol", "Fatty Acids", "Cholesterol", "Ferulic Acid",
  "Vitamin E", "Antioxidants", "Plant Oils", "Witch Hazel", "Thermal Water"
];

const ideal_for_pool = [
  "All skin types", "Oily", "Dry", "Combination", "Sensitive",
  "Acne-prone", "Dehydrated", "Damaged Barrier", "Aging", "Photo-aging",
  "Eczema", "Rosacea", "Congestion", "PIH", "Dull", "Fungal Acne"
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateIngredients(count = 3) {
  const selected = new Set();
  while (selected.size < count) {
    selected.add(randomElement(ingredients_pool));
  }
  return Array.from(selected);
}

function generatePrice() {
  return Math.round((Math.random() * 80 + 5) * 2) / 2;
}

function generateIdealFor() {
  const count = Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 2 : 3;
  const selected = new Set();
  while (selected.size < count) {
    selected.add(randomElement(ideal_for_pool));
  }
  return Array.from(selected);
}

const productNames = {
  "Cleanser": ["Foaming", "Hydrating", "Gentle", "Oil", "Micellar"],
  "Toner": ["Hydrating", "Clarifying", "Essence", "pH Balance"],
  "Essence": ["Hydrating", "Ampoule", "Boosting"],
  "Serum": ["Hyaluronic Acid", "Vitamin C", "Retinol", "Peptide"],
  "Moisturizer": ["Lightweight", "Rich", "Cream", "Gel"],
  "SPF": ["Mineral", "Chemical", "Tinted"],
  "Treatment": ["Spot", "Acne Control", "Retinoid", "AHA"],
  "Mask": ["Clay", "Sheet", "Hydrating"],
  "Oil": ["Facial", "Squalane", "Marula"],
  "Exfoliant": ["AHA", "BHA", "Physical"]
};

async function importProducts() {
  console.log('🚀 Starting product import...');
  
  const products = [];
  
  for (let i = 1; i <= 300; i++) {
    const category = randomElement(categories);
    const adjective = randomElement(productNames[category] || ["Premium"]);
    const name = `${adjective} ${category}`;
    
    products.push({
      name,
      brand: randomElement(brands),
      category,
      price: generatePrice(),
      key_ingredients: generateIngredients(3),
      ideal_for: generateIdealFor(),
      sephora_url: null,
      ulta_url: null,
      amazon_url: null
    });
  }

  console.log(`✅ Generated ${products.length} products`);
  console.log('📤 Uploading to Supabase...');

  const { data, error } = await supabase
    .from('products')
    .insert(products);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ SUCCESS! ${products.length} products imported to Supabase!`);
}

importProducts();
importProducts();