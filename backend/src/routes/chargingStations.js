const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');
const { validate, chargingStationSchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, notFoundError, forbiddenError, validationError, createError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireModerator } = require('../middleware/auth');
const { buildPagination, isValidUUID } = require('../services/supabaseClient');

const router = express.Router();

// @route   GET /api/charging-stations
// @desc    Get all charging stations
// @access  Public
router.get('/', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { 
    page, 
    limit, 
    network, 
    connector_type, 
    power_level, 
    status, 
    amenities,
    lat, 
    lng, 
    radius, 
    city, 
    state, 
    country,
    sort, 
    sortBy, 
    q 
  } = req.query;
  const { from, to } = buildPagination(page, limit);

  let query = supabaseAdmin
    .from('charging_stations')
    .select(`
      *,
      charging_station_reviews(rating, count)
    `, { count: 'exact' })
    .eq('is_active', true)
    .range(from, to);

  // Apply filters
  if (network) {
    query = query.eq('network', network);
  }
  if (connector_type) {
    query = query.contains('connector_types', [connector_type]);
  }
  if (power_level) {
    query = query.eq('power_level', power_level);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    query = query.overlaps('amenities', amenitiesArray);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  if (state) {
    query = query.ilike('state', `%${state}%`);
  }
  if (country) {
    query = query.ilike('country', `%${country}%`);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%,network.ilike.%${q}%`);
  }

  // Geographic filtering (within radius)
  if (lat && lng && radius) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radiusKm)) {
      // Using PostGIS distance calculation (assuming PostGIS is enabled)
      // This is a simplified version - in production, you'd use proper geographic queries
      query = query.gte('latitude', latitude - (radiusKm / 111.32))
                   .lte('latitude', latitude + (radiusKm / 111.32))
                   .gte('longitude', longitude - (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))))
                   .lte('longitude', longitude + (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))));
    }
  }

  // Apply sorting
  const validSortFields = ['created_at', 'updated_at', 'name', 'power_kw', 'rating'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
  const sortOrder = sort === 'desc' ? { ascending: false } : { ascending: true };
  
  query = query.order(sortField, sortOrder);

  const { data: stations, error, count } = await query;

  if (error) {
    throw createError('Failed to fetch charging stations', 500);
  }

  // Calculate average rating for each station
  const stationsWithRating = stations.map(station => {
    const reviews = station.charging_station_reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    
    return {
      ...station,
      average_rating: averageRating,
      review_count: reviews.length,
      charging_station_reviews: undefined // Remove the raw reviews data
    };
  });

  res.json({
    success: true,
    data: {
      stations: stationsWithRating,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/charging-stations
// @desc    Create a new charging station
// @access  Private (Moderator only)
router.post('/', authenticateToken, requireModerator, validate(chargingStationSchemas.create), asyncHandler(async (req, res) => {
  const stationData = {
    ...req.body,
    created_by: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: station, error } = await supabaseAdmin
    .from('charging_stations')
    .insert(stationData)
    .select('*')
    .single();

  if (error) {
    throw createError('Failed to create charging station', 500);
  }

  res.status(201).json({
    success: true,
    message: 'Charging station created successfully',
    data: {
      station
    }
  });
}));

// @route   GET /api/charging-stations/:id
// @desc    Get charging station by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid charging station ID format');
  }

  const { data: station, error } = await supabaseAdmin
    .from('charging_stations')
    .select(`
      *,
      users!charging_stations_created_by_fkey(username, full_name)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    throw notFoundError('Charging station');
  }

  // Get reviews for this station
  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('charging_station_reviews')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .eq('station_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reviewsError) {
    throw createError('Failed to fetch station reviews', 500);
  }

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  // Get nearby stations (within 10km)
  const { data: nearbyStations } = await supabaseAdmin
    .from('charging_stations')
    .select('id, name, address, latitude, longitude, network, power_kw')
    .eq('is_active', true)
    .neq('id', id)
    .gte('latitude', station.latitude - 0.09) // Rough 10km radius
    .lte('latitude', station.latitude + 0.09)
    .gte('longitude', station.longitude - 0.09)
    .lte('longitude', station.longitude + 0.09)
    .limit(5);

  res.json({
    success: true,
    data: {
      station: {
        ...station,
        average_rating: averageRating,
        review_count: reviews.length,
        reviews: reviews.slice(0, 5), // Only return first 5 reviews
        nearby_stations: nearbyStations || []
      }
    }
  });
}));

// @route   PUT /api/charging-stations/:id
// @desc    Update charging station
// @access  Private (Moderator only)
router.put('/:id', authenticateToken, requireModerator, validate(chargingStationSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid charging station ID format');
  }

  // Check if station exists
  const { data: existingStation, error: checkError } = await supabaseAdmin
    .from('charging_stations')
    .select('id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Charging station');
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: station, error } = await supabaseAdmin
    .from('charging_stations')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw createError('Failed to update charging station', 500);
  }

  res.json({
    success: true,
    message: 'Charging station updated successfully',
    data: {
      station
    }
  });
}));

// @route   DELETE /api/charging-stations/:id
// @desc    Delete charging station
// @access  Private (Moderator only)
router.delete('/:id', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid charging station ID format');
  }

  // Check if station exists
  const { data: existingStation, error: checkError } = await supabaseAdmin
    .from('charging_stations')
    .select('id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Charging station');
  }

  // Soft delete by setting is_active to false
  const { error } = await supabaseAdmin
    .from('charging_stations')
    .update({ 
      is_active: false, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw createError('Failed to delete charging station', 500);
  }

  res.json({
    success: true,
    message: 'Charging station deleted successfully'
  });
}));

// @route   GET /api/charging-stations/:id/reviews
// @desc    Get reviews for a charging station
// @access  Public
router.get('/:id/reviews', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(id)) {
    throw validationError('Invalid charging station ID format');
  }

  // Check if station exists
  const { data: station, error: stationError } = await supabaseAdmin
    .from('charging_stations')
    .select('id, name')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (stationError) {
    throw notFoundError('Charging station');
  }

  const { data: reviews, error, count } = await supabaseAdmin
    .from('charging_station_reviews')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('station_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw createError('Failed to fetch station reviews', 500);
  }

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/charging-stations/:id/reviews
// @desc    Create a review for a charging station
// @access  Private
router.post('/:id/reviews', authenticateToken, validate(chargingStationSchemas.createReview), asyncHandler(async (req, res) => {
  const { id: stationId } = req.params;

  if (!isValidUUID(stationId)) {
    throw validationError('Invalid charging station ID format');
  }

  // Check if station exists
  const { data: station, error: stationError } = await supabaseAdmin
    .from('charging_stations')
    .select('id')
    .eq('id', stationId)
    .eq('is_active', true)
    .single();

  if (stationError) {
    throw notFoundError('Charging station');
  }

  // Check if user has already reviewed this station
  const { data: existingReview } = await supabaseAdmin
    .from('charging_station_reviews')
    .select('id')
    .eq('station_id', stationId)
    .eq('reviewer_id', req.user.id)
    .single();

  if (existingReview) {
    throw validationError('You have already reviewed this charging station');
  }

  const reviewData = {
    ...req.body,
    station_id: stationId,
    reviewer_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: review, error } = await supabaseAdmin
    .from('charging_station_reviews')
    .insert(reviewData)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw createError('Failed to create review', 500);
  }

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: {
      review
    }
  });
}));

// @route   GET /api/charging-stations/networks
// @desc    Get all charging networks
// @access  Public
router.get('/meta/networks', asyncHandler(async (req, res) => {
  const { data: networks, error } = await supabaseAdmin
    .from('charging_stations')
    .select('network')
    .eq('is_active', true);

  if (error) {
    throw createError('Failed to fetch networks', 500);
  }

  // Get unique networks with station counts
  const networkMap = {};
  networks.forEach(item => {
    if (item.network) {
      networkMap[item.network] = (networkMap[item.network] || 0) + 1;
    }
  });

  const networksArray = Object.keys(networkMap)
    .map(network => ({
      name: network,
      station_count: networkMap[network]
    }))
    .sort((a, b) => b.station_count - a.station_count);

  res.json({
    success: true,
    data: {
      networks: networksArray
    }
  });
}));

// @route   GET /api/charging-stations/connector-types
// @desc    Get all connector types
// @access  Public
router.get('/meta/connector-types', asyncHandler(async (req, res) => {
  const { data: stations, error } = await supabaseAdmin
    .from('charging_stations')
    .select('connector_types')
    .eq('is_active', true)
    .not('connector_types', 'is', null);

  if (error) {
    throw createError('Failed to fetch connector types', 500);
  }

  // Flatten and count connector types
  const connectorMap = {};
  stations.forEach(station => {
    if (station.connector_types && Array.isArray(station.connector_types)) {
      station.connector_types.forEach(connector => {
        connectorMap[connector] = (connectorMap[connector] || 0) + 1;
      });
    }
  });

  const connectorsArray = Object.keys(connectorMap)
    .map(connector => ({
      name: connector,
      station_count: connectorMap[connector]
    }))
    .sort((a, b) => b.station_count - a.station_count);

  res.json({
    success: true,
    data: {
      connector_types: connectorsArray
    }
  });
}));

// @route   GET /api/charging-stations/search
// @desc    Search charging stations
// @access  Public
router.get('/search', validate(commonSchemas.search, 'query'), asyncHandler(async (req, res) => {
  const { q, lat, lng, radius = 50, page = 1, limit = 20 } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!q || q.trim().length < 2) {
    throw validationError('Search query must be at least 2 characters long');
  }

  let query = supabaseAdmin
    .from('charging_stations')
    .select(`
      *,
      charging_station_reviews(rating, count)
    `, { count: 'exact' })
    .eq('is_active', true)
    .or(`name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%,network.ilike.%${q}%`)
    .order('name', { ascending: true })
    .range(from, to);

  // Geographic filtering if coordinates provided
  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radiusKm)) {
      query = query.gte('latitude', latitude - (radiusKm / 111.32))
                   .lte('latitude', latitude + (radiusKm / 111.32))
                   .gte('longitude', longitude - (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))))
                   .lte('longitude', longitude + (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))));
    }
  }

  const { data: stations, error, count } = await query;

  if (error) {
    throw createError('Failed to search charging stations', 500);
  }

  // Calculate average rating for each station
  const stationsWithRating = stations.map(station => {
    const reviews = station.charging_station_reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    
    return {
      ...station,
      average_rating: averageRating,
      review_count: reviews.length,
      charging_station_reviews: undefined
    };
  });

  res.json({
    success: true,
    data: {
      stations: stationsWithRating,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      query: q
    }
  });
}));

// @route   POST /api/charging-stations/:id/report
// @desc    Report an issue with a charging station
// @access  Private
router.post('/:id/report', authenticateToken, asyncHandler(async (req, res) => {
  const { id: stationId } = req.params;
  const { issue_type, description } = req.body;

  if (!isValidUUID(stationId)) {
    throw validationError('Invalid charging station ID format');
  }

  if (!issue_type || !description) {
    throw validationError('Issue type and description are required');
  }

  // Check if station exists
  const { data: station, error: stationError } = await supabaseAdmin
    .from('charging_stations')
    .select('id, name')
    .eq('id', stationId)
    .eq('is_active', true)
    .single();

  if (stationError) {
    throw notFoundError('Charging station');
  }

  const reportData = {
    station_id: stationId,
    reporter_id: req.user.id,
    issue_type,
    description,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const { data: report, error } = await supabaseAdmin
    .from('charging_station_reports')
    .insert(reportData)
    .select('*')
    .single();

  if (error) {
    throw createError('Failed to submit report', 500);
  }

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: {
      report
    }
  });
}));

module.exports = router;