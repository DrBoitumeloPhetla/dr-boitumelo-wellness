# Blog System Setup Instructions

## Overview
Your blog system now includes:
- ✅ Image upload functionality (no more URL input!)
- ✅ Clickable blog articles that open individual article pages
- ✅ Beautiful article detail pages
- ✅ Responsive design

## Step 1: Create the Database Table

1. Go to your **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **"New Query"**
5. Copy the contents from `database/blog_articles_table.sql`
6. Click **"Run"** (or press Ctrl+Enter)

This creates the blog_articles table with 2 sample articles.

## Step 2: Create the Storage Bucket

1. Still in the **SQL Editor**
2. Click **"New Query"** again
3. Copy the contents from `database/blog_storage_setup.sql`
4. Click **"Run"**

This creates a storage bucket for uploading blog images.

## Step 3: Test Locally

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/admin/login`

3. Log in with your admin credentials

4. Click **"Blog Articles"** in the sidebar

5. Try creating a new article:
   - Fill in the title (slug auto-generates)
   - Choose a category
   - Add an excerpt
   - Write your content (supports HTML)
   - **Click "Choose Image"** to upload an image from your computer
   - Set status to "Published"
   - Click "Create Article"

6. Visit `http://localhost:5173/blog` to see your articles

7. Click on an article to see the full article page

## How to Use After Website is Live

### Uploading a New Blog Article

1. Go to `yourwebsite.com/admin/login`
2. Log in with admin credentials
3. Click **"Blog Articles"** in the sidebar
4. Click **"New Article"** button
5. Fill in the form:
   - **Title**: Your article title (e.g., "5 Ways to Boost Immunity")
   - **Slug**: Auto-generated URL (e.g., "5-ways-to-boost-immunity")
   - **Category**: Choose from dropdown (Wellness, Nutrition, etc.)
   - **Author**: Pre-filled with "Dr. Boitumelo Phetla"
   - **Featured Image**: Click "Choose Image" and select from your computer
   - **Excerpt**: Short summary (2-3 sentences)
   - **Content**: Full article text (you can use HTML formatting)
   - **Status**: Choose "Draft" (private) or "Published" (public)
6. Click **"Create Article"**

### Image Upload Notes
- Maximum file size: **5MB**
- Recommended size: **800x600px or larger**
- Supported formats: JPG, PNG, WebP, GIF
- Images are automatically optimized and stored in Supabase

### HTML Formatting in Content

You can use these HTML tags in the content field:

```html
<h2>Section Heading</h2>
<h3>Subsection Heading</h3>

<p>Paragraph text here.</p>

<strong>Bold text</strong>
<em>Italic text</em>

<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>

<ol>
  <li>Numbered item 1</li>
  <li>Numbered item 2</li>
</ol>

<blockquote>
  Important quote or callout
</blockquote>
```

### Managing Existing Articles

- **Edit**: Click the "Edit" button on any article
- **Publish/Unpublish**: Toggle visibility without deleting
- **Delete**: Permanently remove an article
- **Search**: Find articles by title, excerpt, or category
- **Filter**: View only Published or Draft articles

## Features

### Admin Panel
- ✅ Create, edit, delete articles
- ✅ Upload images directly from computer
- ✅ Draft/Published status control
- ✅ Search and filter articles
- ✅ Real-time image preview
- ✅ Auto-generate URL slugs
- ✅ Category management

### Public Blog
- ✅ Beautiful article listings
- ✅ Clickable article cards
- ✅ Individual article pages
- ✅ Responsive design
- ✅ SEO-friendly URLs (e.g., /blog/article-slug)
- ✅ Author and date display
- ✅ Category badges
- ✅ Featured images
- ✅ Clean, readable typography

## Troubleshooting

### Images Not Uploading
1. Check that you ran the storage bucket SQL (`blog_storage_setup.sql`)
2. Verify the image is under 5MB
3. Check browser console for errors

### Articles Not Showing on Blog Page
1. Make sure the article status is set to "Published"
2. Check that you're logged in as admin when testing
3. Verify the database table was created correctly

### Individual Article Page Not Working
1. Check that the route `/blog/:slug` exists in App.jsx
2. Verify the slug matches the URL exactly
3. Look for console errors in browser

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all SQL scripts were run successfully
4. Ensure environment variables are set correctly

## Categories Available
- Wellness
- Nutrition
- Health Tips
- Lifestyle
- Natural Remedies

You can add more categories by editing the `AdminBlog.jsx` file.
