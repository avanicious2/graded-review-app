// pages/dashboard.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';

export default function Dashboard() {
  const [todayStats, setTodayStats] = useState({ reviews: 0, likes: 0 });
  const [historicalData, setHistoricalData] = useState([]);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/');
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        throw new Error('User email not found');
      }

      const response = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard data');
      }

      setTodayStats(data.today);
      setHistoricalData(data.historical);
      setPendingReviews(data.pending);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100dvh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box minH="100dvh" bg="gray.100" py={6}>
      <Head>
        <title>Dashboard - Product Review App</title>
      </Head>

      {error && (
        <Box maxW="md" mx="auto" mt={4} p={4} bg="red.100" color="red.700" borderRadius="md">
          {error}
        </Box>
      )}

      <Container maxW="container.md">
        {/* Pending Reviews Box */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md" textAlign="center" mb={6}>
          <Stat>
            <StatLabel fontSize="lg">Pending Reviews</StatLabel>
            <StatNumber fontSize="4xl">{pendingReviews}</StatNumber>
          </Stat>
        </Box>
        {/* Responsive Grid for Stats */}
        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={6} mb={8}>
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md" textAlign="center">
              <Stat>
                <StatLabel fontSize="lg">Reviews today</StatLabel>
                <StatNumber fontSize="4xl">{todayStats.reviews}</StatNumber>
              </Stat>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md" textAlign="center">
              <Stat>
                <StatLabel fontSize="lg">Avg Likes today</StatLabel>
                <StatNumber fontSize="4xl">{todayStats.likes}</StatNumber>
              </Stat>
            </Box>
          </GridItem>
        </Grid>

        {/* Scrollable Table for Historical Data */}
        <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
          <Table size="sm" variant="striped">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th isNumeric>Reviews</Th>
                <Th isNumeric>Avg Likes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {historicalData.map((row) => (
                <Tr key={row.date}>
                  <Td>{new Date(row.date).toLocaleDateString()}</Td>
                  <Td isNumeric>{row.reviews}</Td>
                  <Td isNumeric>{row.likes}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Container>
    </Box>
  );
}
