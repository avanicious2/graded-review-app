// pages/api/products.js
import db from '../../lib/db';

export default async function handler(req, res) {
  console.log('Images API called');
  console.log('Request query params:', req.query);
  
  if (req.method !== 'GET') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email) {
    console.log('Missing email in request');
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Get user's batch number
    const batchQuery = 'SELECT search_review_batch FROM user_identities WHERE email = ?';
    console.log('Executing batch query:', batchQuery);
    console.log('With params:', [email]);
    
    const [userData] = await db.query(batchQuery, [email]);
    console.log('Batch query result:', userData);

    if (!userData) {
      console.log('No user found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get unreviewed images
    const imagesQuery = `SELECT i.* 
       FROM search_images i
       LEFT JOIN search_image_reviews r ON r.alle_ingestion_id = i.alle_ingestion_id AND r.reviewer_email = ?
       WHERE i.assigned_batch = ?
       AND (r.review_score IS NULL)
       ORDER BY id desc 
       LIMIT 300`;
    
    console.log('Executing images query:', imagesQuery);
    console.log('With params:', [email, userData.search_review_batch]);
    
    const images = await db.query(imagesQuery, [email, userData.search_review_batch]);
    console.log('Found images count:', images.length);
    console.log('First image sample:', images[0]);

    await db.end();
    console.log('Database connection closed');
    return res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    console.error('Error stack:', error.stack);
    await db.end();
    console.log('Database connection closed after error');
    return res.status(500).json({ error: 'Failed to load images' });
  }
}
