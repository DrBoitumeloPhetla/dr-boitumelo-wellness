// Script to update product details with composition, uses, and usage information
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffjqzvrgjwvcabkqidzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmanF6dnJnand2Y2Fia3FpZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDM5MTcsImV4cCI6MjA3NzU3OTkxN30.RzkvjQAlTeMFFvnK9lGjg3u_Nwngg2120DSwP96sNqU';

const supabase = createClient(supabaseUrl, supabaseKey);

const productDetails = {
  'Oxidation VitaMinerals': {
    composition: `Per capsule:
• 25mg Vitamin B2
• 25mg Vitamin B6
• 50mg Vitamin E
• 100mg Zinc Picolinate
• 5000 IU Vitamin D3
• 150mg Vitamin C
• 100mg Fulvic Acid
• 100mg Magnesium Malate

Packaging: White PET Bottle with Gold touch
60 Pearl White Gelatine Capsules, Size 0
Brownish powder`,

    uses: 'May assist with Cravings, Fertility, Skin & Hair Health, Libido, Wound healing, Hormonal Balance & Immune Regulation.',

    usage: 'Swallow one capsule daily.',

    description: 'A comprehensive multivitamin and mineral formula designed to support overall health and wellness. Contains essential vitamins and minerals in optimal doses to support fertility, skin health, immune function, and hormonal balance.'
  },

  'Oxidation Entero': {
    composition: `Per capsule:
• 500mg Brewers Yeast (Saccharomyces cerevisiae)

Packaging: Clear PET Bottle with Pink touch
60 Light Pink Gelatine Capsules (Halal), Size 0`,

    uses: 'May support gut health. May improve skin health and mood.',

    usage: 'Swallow one capsule on an empty stomach in the morning.',

    description: 'A probiotic supplement containing Brewers Yeast to support digestive health, skin wellness, and emotional balance. Best taken on an empty stomach for optimal absorption.'
  },

  'Oxidation Immuno': {
    composition: `Per capsule:
• Turmeric
• Cinnamon
• Ginger
• Cayenne Pepper
• Garlic

Packaging: Brown PET bottle with Blue touch
60 Clear Veggie Capsules, Size 00`,

    uses: 'Reduces systemic inflammation & supports immunity. Supports healthy blood circulation.',

    usage: 'Swallow one capsule once or twice a day.',

    description: 'A powerful blend of natural anti-inflammatory ingredients designed to support immune function and reduce inflammation throughout the body. Contains proven herbal ingredients known for their health benefits.'
  },

  'Oxidation Nutri': {
    composition: `Per capsule:
• Moringa
• Spirulina

Packaging: Brown PET bottle with Green touch
60 Clear Veggie Capsules, Size 00`,

    uses: 'May boost energy, support immunity, and promote overall well-being.',

    usage: 'Swallow one capsule once or twice a day.',

    description: 'A nutrient-dense superfood supplement combining Moringa and Spirulina to provide natural energy, immune support, and comprehensive nutritional benefits.'
  },

  'Cholecalciferol Vitamin D3': {
    composition: `Per Green capsule:
• 50,000 IU Vitamin D3

Packaging: Green PET bottle
15 Green Veggie Capsules, Size 0`,

    uses: 'For improving or maintaining adequate Vitamin D blood levels.',

    usage: 'Swallow two off-white capsules together with one green capsule once a week.',

    description: 'High-dose Vitamin D3 supplement designed to quickly restore and maintain optimal Vitamin D levels. Essential for bone health, immune function, and overall wellness.'
  },

  'Oxidation Iron Penta': {
    composition: `Per capsule:
• 250mg Ferrochel Bisglycinate
• 200mg Vitamin C
• 50mg Vitamin B6
• 25µg Vitamin B12
• 400µg Folic Acid

Packaging: Red PET bottle
60 White Gelatin Capsules, Size 0`,

    uses: 'Treatment of low levels of iron in the body.',

    usage: 'Swallow one capsule once or twice a day.',

    description: 'A comprehensive iron supplement with synergistic nutrients to support iron absorption and red blood cell production. Ideal for treating iron deficiency and supporting energy levels.'
  },

  'Oxidation Omega 3': {
    composition: `Per capsule:
• 1000mg Omega 3
• 193mg EPA
• 133mg DHA

Packaging: Brown Bottle with Yellow touch
60 Soft gel capsules`,

    uses: 'May support skin, hair, heart, brain and eye health. It may reduce overall inflammation in the body.',

    usage: 'Swallow one gel capsule at night.',

    description: 'Premium quality Omega-3 fish oil providing essential fatty acids EPA and DHA to support cardiovascular health, brain function, and reduce inflammation throughout the body.'
  },

  'Magnesium Glycinate': {
    composition: `Per capsule:
• 100mg Magnesium Glycinate (Elemental)

Packaging: Blue PET Bottle
60 Dark Blue Gelatine capsules, Size 0`,

    uses: 'May improve sleep quality & muscle relaxation. Magnesium is needed for normal nerve and muscle function and regulates the absorption of calcium. It may improve the absorption of Vitamin D.',

    usage: 'Swallow one or two capsules at night.',

    description: 'A highly absorbable form of magnesium that supports muscle relaxation, nervous system function, and sleep quality. Essential for calcium absorption and Vitamin D utilization.'
  },

  'Collagen Type I & III with Vitamin C': {
    composition: `Per capsule:
• 500mg Hydrolysed Bovine Collagen Type I & III (75%)
• Baobab Powder (25%)

Packaging: Brown PET bottle
60 Clear Veggie Capsules, Size 0
Off-white powder`,

    uses: 'May Promote Healthy Hair, Skin and Nails. May Support Joint, Bone & Cartilage Health.',

    usage: 'Swallow two capsules daily before breakfast.',

    description: 'Hydrolyzed collagen supplement enhanced with Vitamin C-rich Baobab powder to support skin elasticity, joint health, and the body\'s natural collagen production.'
  },

  'Alpha Lipoic Acid': {
    composition: `Per capsule:
• 500mg Alpha Lipoic Acid

Packaging: Brown PET bottle
30 Clear Veggie Capsules
Light Yellow Powder`,

    uses: 'It may increase the body\'s production of its master antioxidant, glutathione. It may also support healthy glucose uptake and helps to maintain healthy glucose utilization.',

    usage: 'Swallow one capsule daily.',

    description: 'A powerful antioxidant that supports the body\'s natural glutathione production and helps maintain healthy blood sugar levels. Provides comprehensive cellular protection.'
  }
};

async function updateProductDetails() {
  console.log('🔄 Starting product details update...\n');

  for (const [productName, details] of Object.entries(productDetails)) {
    console.log(`Updating: ${productName}`);

    // First, find the product by name
    const { data: products, error: searchError } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', `%${productName}%`)
      .limit(1);

    if (searchError) {
      console.error(`❌ Error finding ${productName}:`, searchError.message);
      continue;
    }

    if (!products || products.length === 0) {
      console.log(`⚠️  Product not found: ${productName}`);
      continue;
    }

    const product = products[0];

    // Update the product with detailed information
    const { error: updateError } = await supabase
      .from('products')
      .update({
        composition: details.composition,
        uses: details.uses,
        usage: details.usage,
        description: details.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Error updating ${productName}:`, updateError.message);
    } else {
      console.log(`✅ Successfully updated: ${productName}\n`);
    }
  }

  console.log('🎉 Product details update complete!');
}

updateProductDetails().catch(console.error);
