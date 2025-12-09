// Script to add Vitamin D3 as a prescription-only product
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffjqzvrgjwvcabkqidzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmanF6dnJnand2Y2Fia3FpZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDM5MTcsImV4cCI6MjA3NzU3OTkxN30.RzkvjQAlTeMFFvnK9lGjg3u_Nwngg2120DSwP96sNqU';

const supabase = createClient(supabaseUrl, supabaseKey);

const vitaminD3Product = {
  name: 'Cholecalciferol Vitamin D3',
  price: 150,
  description: 'High-potency Vitamin D3 supplement for improving or maintaining adequate Vitamin D blood levels. Available by prescription request only.',
  image_url: '/Vitamin D Bottle.jpg',
  category: 'Supplements',
  featured: true,
  status: 'active',
  stock_quantity: 15,
  low_stock_threshold: 5,
  requires_prescription: true,
  composition: `Per Green capsule:
• 50,000 IU Vitamin D3

Packaging: Green PET Bottle
Green Veggie Capsules, Size 0`,
  uses: 'For improving or maintaining adequate Vitamin D blood levels.',
  usage: 'Swallow two off-white capsules together with one green capsule once a week.'
};

async function addVitaminD3Product() {
  console.log('Adding Cholecalciferol Vitamin D3 product...');

  // Check if product already exists
  const { data: existingProduct, error: checkError } = await supabase
    .from('products')
    .select('*')
    .eq('name', 'Cholecalciferol Vitamin D3')
    .single();

  if (existingProduct) {
    console.log('Product already exists! Updating...');
    const { data, error } = await supabase
      .from('products')
      .update(vitaminD3Product)
      .eq('name', 'Cholecalciferol Vitamin D3')
      .select();

    if (error) {
      console.error('Error updating product:', error);
    } else {
      console.log('Product updated successfully:', data);
    }
  } else {
    // Insert new product
    const { data, error } = await supabase
      .from('products')
      .insert([vitaminD3Product])
      .select();

    if (error) {
      console.error('Error adding product:', error);
    } else {
      console.log('Product added successfully:', data);
    }
  }
}

addVitaminD3Product();
