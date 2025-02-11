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

  const { alle_ingestion_id, review_score, reviewer_email } = req.body;
  console.log('Extracted parameters:', { alle_ingestion_id, review_score, reviewer_email });

  if (!alle_ingestion_id || review_score === undefined || !reviewer_email) {
    console.log('Missing required fields:', {
      alle_ingestion_id: !!alle_ingestion_id,
      review_score: review_score !== undefined,
      reviewer_email: !!reviewer_email
    });
    return res.status(400).json({
      error: 'Missing required fields',
      received: { alle_ingestion_id, review_score, reviewer_email },
    });
  }

  try {
    // Check for existing review
    const checkExistingQuery = `SELECT 1 FROM search_image_reviews WHERE alle_ingestion_id = ? AND reviewer_email = ?`;
    console.log('Checking existing review query:', checkExistingQuery);
    console.log('Check existing params:', [alle_ingestion_id, reviewer_email]);
    
    const checkExistingReview = await db.query(checkExistingQuery, [alle_ingestion_id, reviewer_email]);
    console.log('Existing review check result:', checkExistingReview);

    if (checkExistingReview.length > 0) {
      console.log('Duplicate review attempted for alle_ingestion_id:', alle_ingestion_id);
      await db.end();
      return res.status(400).json({ error: 'You have already reviewed this image' });
    }

    // Insert new review
    const insertQuery = `INSERT INTO search_image_reviews 
       (alle_ingestion_id, review_score, reviewer_email) 
       VALUES (?, ?, ?)`;
    console.log('Insert review query:', insertQuery);
    console.log('Insert params:', [alle_ingestion_id, review_score, reviewer_email]);
    
    const result = await db.query(insertQuery, [alle_ingestion_id, review_score, reviewer_email]);
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