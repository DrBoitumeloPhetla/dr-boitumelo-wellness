-- Create blog_articles table
CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  category TEXT NOT NULL DEFAULT 'Wellness',
  author TEXT NOT NULL DEFAULT 'Dr. Boitumelo Phetla',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);

-- Create index on status for filtering published articles
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);

-- Create index on published_at for sorting
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_updated_at
BEFORE UPDATE ON blog_articles
FOR EACH ROW
EXECUTE FUNCTION update_blog_articles_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (only published articles)
CREATE POLICY "Public can view published articles"
ON blog_articles
FOR SELECT
USING (status = 'published');

-- Create policy for authenticated users (admin) to do everything
CREATE POLICY "Admins can do everything"
ON blog_articles
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON blog_articles TO anon;
GRANT ALL ON blog_articles TO authenticated;

-- Insert some sample articles (optional - remove if not needed)
INSERT INTO blog_articles (title, slug, excerpt, content, category, author, status, published_at, featured_image) VALUES
(
  '5 Natural Ways to Boost Your Immune System',
  '5-natural-ways-to-boost-your-immune-system',
  'Discover evidence-based natural approaches to strengthen your immune system and enhance your overall wellness.',
  '<p>Your immune system is your body''s natural defense mechanism against infections and diseases. While there''s no magic pill to instantly boost immunity, there are several evidence-based natural approaches that can help strengthen your body''s defenses.</p>

<h2>1. Prioritize Quality Sleep</h2>
<p>Sleep and immunity are closely connected. During sleep, your immune system releases proteins called cytokines, which help fight infection and inflammation. Aim for 7-9 hours of quality sleep each night.</p>

<h2>2. Eat a Rainbow of Fruits and Vegetables</h2>
<p>Different colored produce provides different antioxidants and nutrients. Include a variety of:</p>
<ul>
  <li>Dark leafy greens (spinach, kale)</li>
  <li>Citrus fruits (oranges, lemons)</li>
  <li>Berries (blueberries, strawberries)</li>
  <li>Cruciferous vegetables (broccoli, cauliflower)</li>
</ul>

<h2>3. Stay Hydrated</h2>
<p>Water helps your body produce lymph, which carries white blood cells and other immune system cells. Aim for at least 8 glasses of water daily.</p>

<h2>4. Manage Stress Levels</h2>
<p>Chronic stress can suppress your immune response. Practice stress-reduction techniques like meditation, deep breathing, or yoga.</p>

<h2>5. Regular Physical Activity</h2>
<p>Moderate exercise can give your immune system a boost by promoting good circulation, which allows immune cells to move through your body more effectively.</p>

<p><strong>Remember:</strong> These natural approaches work best as part of a holistic lifestyle. Always consult with a healthcare professional before making significant changes to your health routine.</p>',
  'Wellness',
  'Dr. Boitumelo Phetla',
  'published',
  NOW(),
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800'
),
(
  'Understanding Vitamin D: The Sunshine Vitamin',
  'understanding-vitamin-d-the-sunshine-vitamin',
  'Learn about the importance of Vitamin D, how to recognize deficiency symptoms, and natural ways to maintain optimal levels.',
  '<p>Vitamin D, often called the "sunshine vitamin," plays a crucial role in maintaining overall health. Despite its importance, vitamin D deficiency is surprisingly common, affecting millions of people worldwide.</p>

<h2>Why Vitamin D Matters</h2>
<p>Vitamin D is essential for:</p>
<ul>
  <li>Strong bones and teeth</li>
  <li>Immune system function</li>
  <li>Mood regulation</li>
  <li>Cardiovascular health</li>
  <li>Muscle function</li>
</ul>

<h2>Signs of Vitamin D Deficiency</h2>
<p>Common symptoms include:</p>
<ul>
  <li>Fatigue and tiredness</li>
  <li>Frequent infections</li>
  <li>Bone and back pain</li>
  <li>Depression or mood changes</li>
  <li>Impaired wound healing</li>
</ul>

<h2>Natural Sources of Vitamin D</h2>
<p><strong>Sunlight:</strong> 10-30 minutes of midday sun exposure several times per week can help maintain adequate levels. However, factors like skin tone, location, and season affect this.</p>

<p><strong>Food Sources:</strong></p>
<ul>
  <li>Fatty fish (salmon, mackerel, sardines)</li>
  <li>Egg yolks</li>
  <li>Fortified foods (milk, cereals)</li>
  <li>Mushrooms exposed to UV light</li>
</ul>

<h2>When to Consider Supplementation</h2>
<p>If you''re at risk of deficiency (limited sun exposure, darker skin tone, older age), consider getting your vitamin D levels tested and discuss supplementation with a healthcare provider.</p>

<p><em>At Dr. Boitumelo Wellness, we offer vitamin D testing and personalized supplementation guidance to help you achieve optimal health.</em></p>',
  'Nutrition',
  'Dr. Boitumelo Phetla',
  'published',
  NOW(),
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
);
