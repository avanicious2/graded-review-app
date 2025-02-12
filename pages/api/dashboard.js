// pages/api/dashboard.js
import db from '../../lib/db';

export default async function handler(req, res) {
  console.log('Dashboard API called with method:', req.method);
  console.log('Query parameters:', req.query);
  
  if (req.method !== 'GET') {
    console.log('Invalid method attempted:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.query;
  console.log('Requested email:', email);

  if (!email) {
    console.log('Missing email parameter');
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Get today's stats
    const todayStatsQuery = `
      SELECT 
        COALESCE(COUNT(r.id), 0) AS reviews, 
        COALESCE(AVG(r.review_score), 0) AS likes
      FROM 
        user_identities ui
      LEFT JOIN 
        search_image_reviews r ON r.reviewer_email = ui.email 
      WHERE 
        ui.email = ?
        AND DATE(CONVERT_TZ(r.created_at, 'UTC', 'Asia/Kolkata')) = 
            DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Kolkata'))
    `;
    console.log('Today stats query:', todayStatsQuery);
    console.log('Today stats params:', [email]);
    
    const [todayStats] = await db.query(todayStatsQuery, [email]);
    console.log('Today stats result:', todayStats);

    // Get historical data
    const historicalQuery = `
      SELECT 
        DATE(CONVERT_TZ(r.created_at, 'UTC', 'Asia/Kolkata')) AS date,
        COALESCE(COUNT(r.id), 0) AS reviews, 
        COALESCE(AVG(r.review_score), 0) AS likes
      FROM 
        user_identities ui
      LEFT JOIN 
        search_image_reviews r ON r.reviewer_email = ui.email 
      WHERE 
        ui.email = ?
        AND r.created_at >= DATE_SUB(NOW(), INTERVAL 10 DAY)
      GROUP BY 
        date
      ORDER BY 
        date DESC
    `;
    console.log('Historical data query:', historicalQuery);
    console.log('Historical data params:', [email]);

    const historicalData = await db.query(historicalQuery, [email]);
    console.log('Historical data result:', historicalData);

    await db.end();
    console.log('Successfully fetched dashboard data');
    
    const response = {
      today: todayStats,
      historical: historicalData
    };
    console.log('Sending response:', response);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    console.error('Error stack:', error.stack);
    await db.end();
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
}