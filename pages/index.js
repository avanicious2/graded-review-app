// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import {
  Box,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  Text,
  Container,
  Heading
} from '@chakra-ui/react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reviewCounter, setReviewCounter] = useState(0);
  const [sliderValue, setSliderValue] = useState(3);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const fetchImageUrl = async (product) => {
    try {
      const response = await fetch('/api/gen-s3-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alle_ingestion_id: product.alle_ingestion_id,
          alle_media_key: product.alle_media_key
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image URL');
      }

      setCurrentImageUrl(data.url);
    } catch (err) {
      setError('Failed to load image URL');
      console.error('Error fetching image URL:', err);
    }
  };

  const fetchProducts = async (userEmail) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/products?email=${encodeURIComponent(userEmail || email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(data || []);
      setCurrentIndex(0);
      
      // If we have products, fetch the S3 URL for the first product
      if (data && data.length > 0) {
        await fetchImageUrl(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const savedIndex = localStorage.getItem('currentProductIndex');
    const savedProducts = localStorage.getItem('products');
    
    if (savedEmail) {
      setEmail(savedEmail);
      setIsAuthenticated(true);

      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
        const index = savedIndex ? parseInt(savedIndex, 10) : 0;
        setCurrentIndex(index);
        if (parsedProducts[index]) {
          fetchImageUrl(parsedProducts[index]);
        }
      } else {
        fetchProducts(savedEmail);
      }
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('userEmail', email);
      setIsAuthenticated(true);
      fetchProducts(email);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const currentProduct = products[currentIndex];
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alle_ingestion_id: currentProduct.alle_ingestion_id,
          review_score: parseFloat(sliderValue.toFixed(2)),
          reviewer_email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewCounter((prev) => prev + 1);
      setSliderValue(3); // Reset slider to middle position

      if (currentIndex < products.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        localStorage.setItem('currentProductIndex', newIndex.toString());
        // Fetch URL for next product
        await fetchImageUrl(products[newIndex]);
      } else {
        setCurrentIndex(products.length);
        localStorage.removeItem('currentProductIndex');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      localStorage.setItem('currentProductIndex', currentIndex.toString());
    };
  }, [currentIndex]);

  return (
    <Box 
      minH="100dvh" 
      bg="gray.100" 
      position="relative"
      pb="env(safe-area-inset-bottom)"
    >
      <Head>
        <title>Product Review App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {error && (
        <Box maxW="md" mx="auto" mt={4} p={4} bg="red.100" color="red.700" borderRadius="md">
          {error}
        </Box>
      )}

      {!isAuthenticated ? (
        <Container maxW="md" py={10}>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="lg">
            <Text fontSize="2xl" fontWeight="bold" mb={4}>Login to Review Products</Text>
            <form onSubmit={handleAuth}>
              <Box mb={4}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
              </Box>
              <Box mb={4}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
              </Box>
              <Button 
                type="submit" 
                isLoading={loading}
                loadingText="Logging in..."
                w="full" 
                colorScheme="blue"
              >
                Login
              </Button>
            </form>
          </Box>
        </Container>
      ) : loading ? (
        <VStack justify="center" align="center" h="100dvh">
          <Text>Loading...</Text>
        </VStack>
      ) : !products.length || currentIndex >= products.length ? (
        <VStack justify="center" align="center" h="100dvh">
          <Text fontSize="xl" fontWeight="bold">Session Complete!</Text>
          <Text fontSize="md" mb={2}>You reviewed {reviewCounter} products</Text>
          <Text fontSize="sm">Start new session to review more products</Text>
          <Button 
            mt={4} 
            colorScheme="blue" 
            onClick={() => {
              localStorage.removeItem('currentProductIndex');
              window.location.reload();
            }}
          >
            Start New Session
          </Button>
        </VStack>
      ) : (
        <Box 
          maxW="sm" 
          mx="auto" 
          h="100dvh"
          display="flex"
          flexDirection="column"
          position="relative"
        >
          <Box 
            flex="1"
            overflow="auto"
            bg="white"
            borderRadius="lg"
            boxShadow="lg"
            m={4}
          >
            <Box position="relative" pt="100%">
              {currentImageUrl && (
                <Image
                  src={currentImageUrl}
                  alt={`Product ${products[currentIndex].alle_ingestion_id}`}
                  fill
                  style={{ objectFit: 'contain', pointerEvents: 'none' }}
                />
              )}
            </Box>

            <Box p={4}>
              <Text fontSize="sm" color="gray.500" mb={1}>Images reviewed: {reviewCounter}</Text>
              <Text fontSize="sm" color="gray.500" mb={2}>ID: {products[currentIndex].alle_ingestion_id}</Text>
            </Box>
          </Box>

          <Box
            position="sticky"
            bottom={0}
            left={0}
            right={0}
            bg="white"
            borderTopWidth={1}
            borderBottomWidth={1}
            borderColor="gray.200"
            p={6}
            pt={10}
            pb="env(safe-area-inset-bottom)"
          >
            <Heading size="md" mb={6} textAlign="center">
              How likely are you to save this result for &ldquo;{products[currentIndex]?.pinterest_query || 'this occasion'}&rdquo;?
            </Heading>
            
            <Box px={4} mb={6}>
              <Slider
                defaultValue={3}
                min={1}
                max={5}
                step={0.1}
                value={sliderValue}
                onChange={setSliderValue}
              >
                <SliderTrack bg="gray.200">
                  <SliderFilledTrack 
                    bg={sliderValue < 3 ? 'red.500' : sliderValue > 3 ? 'green.500' : 'gray.200'} 
                    opacity={Math.abs(sliderValue - 3) / 2}
                  />
                </SliderTrack>
                <SliderThumb boxSize={6} />
              </Slider>
              
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Text color="gray.600">Very Unlikely</Text>
                <Text color="gray.600">Very Likely</Text>
              </Box>
            </Box>

            <Button
              onClick={submitReview}
              isLoading={submitting}
              loadingText="Submitting..."
              colorScheme="blue"
              size="lg"
              w="full"
              borderRadius="full"
            >
              Submit Review
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}