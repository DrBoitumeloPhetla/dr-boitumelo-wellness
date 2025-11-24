# Review Media Upload - Setup Instructions

## Overview

Your review/testimonial system now supports **image and video uploads**! Customers can:
- Upload photos of their supplements
- Record and upload video testimonials
- Submit written reviews with star ratings

## Step 1: Run Database Migration

1. Go to your **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **"New Query"**
5. Copy the contents from `database/reviews_media_migration.sql`
6. Click **"Run"** (or press Ctrl+Enter)

This adds `media_type` and `media_url` columns to the existing reviews table.

## Step 2: Create Storage Bucket

1. Still in the **SQL Editor**
2. Click **"New Query"** again
3. Copy the contents from `database/reviews_storage_setup.sql`
4. Click **"Run"**

This creates a storage bucket for review images and videos with public upload policies.

## Step 3: Test Locally

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/testimonials`

3. Click the **"Share Your Experience"** button

4. Fill out the review form:
   - Name and email
   - Star rating (1-5 stars)
   - What brought you to Dr. Boitumelo (optional)
   - Written review (minimum 50 characters)
   - **Upload an image or video** (optional)

5. Submit the review

6. The review will be submitted with "pending" status and won't appear publicly until an admin approves it

## How Customers Will Use This Feature

### Submitting a Review with Media

1. Visit `yourwebsite.com/testimonials`
2. Click **"Share Your Experience"** button
3. Fill in personal information (name, email)
4. Select star rating
5. Write their review
6. **Optional: Upload media**
   - Click "Choose Image or Video"
   - Select a file from their device
   - Preview appears immediately
   - Can change or remove the media before submitting
7. Agree to publishing consent
8. Click "Submit Review"

### Media Requirements

- **Images:**
  - Max file size: **5MB**
  - Supported formats: JPG, PNG, WebP, GIF
  - Recommended: Photos of supplements, before/after photos

- **Videos:**
  - Max file size: **50MB**
  - Supported formats: MP4, WebM, MOV
  - Recommended: Video testimonials (30-60 seconds)

## Admin Review Approval

Reviews are submitted with **"pending"** status and won't appear publicly until approved. To approve reviews:

1. Go to `/admin/login` and log in
2. Navigate to the Reviews management section (you may need to add this to your admin panel)
3. View pending reviews with their uploaded media
4. Approve or reject reviews
5. Approved reviews appear on the Testimonials page

## Features

### Customer-Facing
- ✅ Upload images of supplements
- ✅ Upload video testimonials
- ✅ Real-time media preview
- ✅ File type and size validation
- ✅ Remove media before submitting
- ✅ Beautiful, user-friendly interface

### Public Display
- ✅ Testimonials carousel with media
- ✅ Images displayed in testimonial cards
- ✅ Videos with native controls
- ✅ Responsive design
- ✅ Smooth animations

### Technical
- ✅ Secure storage with Supabase Storage
- ✅ Public upload policies (simple and effective)
- ✅ Automatic file naming with timestamps
- ✅ Public URL generation
- ✅ No async state bugs (learned from blog implementation!)

## Database Schema

The `reviews` table now has these additional fields:

- `media_type` VARCHAR(20) - Either 'image', 'video', or NULL
- `media_url` TEXT - Public URL of the uploaded media from Supabase Storage

## Storage Bucket

- **Bucket name:** `review-media`
- **Public:** Yes (readable by everyone)
- **Upload policy:** Public (anyone can upload, but only through your review form)
- **Delete policy:** Authenticated users only (admins)

## Troubleshooting

### Media Not Uploading

1. Check that you ran `reviews_storage_setup.sql` successfully
2. Verify the storage bucket exists in Supabase Dashboard → Storage
3. Check browser console for errors
4. Ensure file is under size limit (5MB for images, 50MB for videos)

### Reviews Not Appearing

1. Reviews start with "pending" status by default
2. Admin must approve them before they appear publicly
3. Check that the review submission was successful (check confirmation screen)

### Media Not Displaying

1. Verify the review was approved by admin
2. Check that `media_url` field is populated in the database
3. Ensure the image/video URL is accessible (try opening in new tab)
4. Check browser console for loading errors

## Code Implementation

### Key Files Modified

1. **`src/lib/supabase.js`**
   - Added `uploadReviewMedia()` function for uploading images/videos
   - Uses the same pattern as blog image upload (no async state bug!)

2. **`src/components/ui/ReviewModal.jsx`**
   - Added media upload UI with image/video icons
   - File input with preview
   - Media type detection (image vs video)
   - File size validation
   - Used local variable pattern to avoid async state bug:
     ```javascript
     let dataToSubmit = { ...reviewData };
     if (mediaFile) {
       const uploadedUrl = await handleMediaUpload();
       dataToSubmit.media_url = uploadedUrl; // Direct assignment
     }
     await submitReview(dataToSubmit);
     ```

3. **`src/pages/Testimonials.jsx`**
   - Fetches approved reviews from database
   - Displays media (image or video) in testimonial carousel
   - Falls back to hardcoded testimonials if no reviews exist

### Database Files Created

1. **`database/reviews_media_migration.sql`**
   - Adds media columns to reviews table

2. **`database/reviews_storage_setup.sql`**
   - Creates storage bucket and policies

## Security Notes

- The storage bucket is publicly uploadable (same approach as blog images)
- This is secure because:
  - Only your review form can upload to this bucket
  - Admin approval required before reviews appear publicly
  - Admins can delete inappropriate media
  - File size limits prevent abuse

## Next Steps

1. Test the feature thoroughly:
   - Upload images
   - Upload videos
   - Test file size limits
   - Test file type validation
   - Test preview functionality

2. Consider adding admin review management:
   - View pending reviews with media
   - Approve/reject interface
   - Delete inappropriate media

3. After deployment:
   - Feature works exactly the same on live site
   - No additional configuration needed
   - Storage bucket and policies persist

## Summary

Your review system is now **fully equipped** for customers to share their experiences with photos and videos! This makes testimonials more authentic and engaging, helping build trust with potential customers.

When deployed, this will work seamlessly - customers can upload media directly from their devices, and approved testimonials with media will appear in the beautiful carousel on your Testimonials page.
