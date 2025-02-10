// pages/api/submit-review.js
import db from '../../lib/db';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  console.log('Submit review API called with method:', req.method);
  console.log('Request body:', req.body);
  
  if (req.method !== 'POST') {
    console.log('Invalid method attempted:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scrape_id, graded_review, reviewer_email } = req.body;
  console.log('Extracted parameters:', { scrape_id, graded_review, reviewer_email });

  if (!scrape_id || graded_review === undefined || !reviewer_email) {
    console.log('Missing required fields:', {
      scrape_id: !!scrape_id,
      graded_review: graded_review !== undefined,
      reviewer_email: !!reviewer_email
    });
    return res.status(400).json({
      error: 'Missing required fields',
      received: { scrape_id, graded_review, reviewer_email },
    });
  }

  try {
    // Check for existing review
    const checkExistingQuery = `SELECT 1 FROM reviews WHERE scrape_id = ? AND reviewer_email = ?`;
    console.log('Checking existing review query:', checkExistingQuery);
    console.log('Check existing params:', [scrape_id, reviewer_email]);
    
    const checkExistingReview = await db.query(checkExistingQuery, [scrape_id, reviewer_email]);
    console.log('Existing review check result:', checkExistingReview);

    if (checkExistingReview.length > 0) {
      console.log('Duplicate review attempted for scrape_id:', scrape_id);
      await db.end();
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Insert new review
    const reviewId = randomUUID();
    console.log('Generated review ID:', reviewId);

    const insertQuery = `INSERT INTO reviews 
       (id, scrape_id, graded_review, reviewer_email, created_at) 
       VALUES (?, ?, ?, ?, NOW())`;
    console.log('Insert review query:', insertQuery);
    console.log('Insert params:', [reviewId, scrape_id, graded_review, reviewer_email]);
    
    const result = await db.query(insertQuery, [reviewId, scrape_id, graded_review, reviewer_email]);
    console.log('Insert result:', result);

    await db.end();
    console.log('Successfully submitted review');
    
    return res.status(200).json({
      message: 'Review submitted successfully',
      result,
    });
  } catch (error) {
    console.error('Database error:', error);
    console.error('Error stack:', error.stack);
    await db.end();
    return res.status(500).json({
      error: 'Failed to submit review',
      details: error.message,
    });
  }
}