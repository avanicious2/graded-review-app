// pages/api/products.js
import db from '../../lib/db';

export default async function handler(req, res) {
  console.log('Products API called');
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
    const batchQuery = 'SELECT batch_number FROM user_identities WHERE email = ?';
    console.log('Executing batch query:', batchQuery);
    console.log('With params:', [email]);
    
    const [userData] = await db.query(batchQuery, [email]);
    console.log('Batch query result:', userData);

    if (!userData) {
      console.log('No user found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get unreviewed products
    const productsQuery = `SELECT i.* 
       FROM input_products i
       LEFT JOIN reviews r ON r.scrape_id = i.scrape_id AND r.reviewer_email = ?
       WHERE i.assigned_batch = ?
       AND i.reviews_uploaded = 0
       AND (r.graded_review IS NULL)
       ORDER BY i.created_at desc
       LIMIT 300`;
    
    console.log('Executing products query:', productsQuery);
    console.log('With params:', [email, userData.batch_number]);
    
    const products = await db.query(productsQuery, [email, userData.batch_number]);
    console.log('Found products count:', products.length);
    console.log('First product sample:', products[0]);

    await db.end();
    console.log('Database connection closed');
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error stack:', error.stack);
    await db.end();
    console.log('Database connection closed after error');
    return res.status(500).json({ error: 'Failed to load products' });
  }
}
