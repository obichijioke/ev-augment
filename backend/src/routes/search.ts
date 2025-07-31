import express, { Router, Request, Response } from 'express';
import { supabaseAdmin, buildPagination, buildPaginationMetadata, isValidUUID } from '../services/supabaseClient';
import { optionalAuth } from '../middleware/auth';
import { validate, commonSchemas } from '../middleware/validation';
import { asyncHandler, notFoundError, validationError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { toString, toNumber } from '../utils/typeUtils';
import { ApiResponse, PaginatedResponse } from '../types/database';
import Joi from 'joi';

const router: Router = express.Router();

// Validation schemas
const searchSchema = Joi.object({
  q: Joi.string().required().min(2).max(100),
  type: Joi.string().valid('all', 'marketplace', 'forums', 'blog', 'directory', 'charging', 'users', 'vehicles').default('all'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid('relevance', 'date', 'popularity').default('relevance'),
  category: Joi.string().max(50),
  location: Joi.string().max(100),
  price_min: Joi.number().min(0),
  price_max: Joi.number().min(0),
  date_from: Joi.date().iso(),
  date_to: Joi.date().iso()
});

const suggestionsSchema = Joi.object({
  q: Joi.string().required().min(1).max(50),
  type: Joi.string().valid('all', 'marketplace', 'forums', 'blog', 'directory', 'users').default('all'),
  limit: Joi.number().integer().min(1).max(10).default(5)
});

// @route   GET /api/search
// @desc    Global search across all content types
// @access  Public
router.get('/', optionalAuth, validate(searchSchema, 'query'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      q: query,
      type,
      page,
      limit,
      sort,
      category,
      location,
      price_min,
      price_max,
      date_from,
      date_to
    } = req.query;

    const offset = (page - 1) * limit;
    const results = {
      query,
      type,
      total: 0,
      results: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: page > 1
      },
      facets: {
        types: [],
        categories: [],
        locations: [],
        dateRanges: []
      }
    };

    // Search marketplace listings
    if (type === 'all' || type === 'marketplace') {
      let marketplaceQuery = supabaseAdmin
        .from('marketplace_listings')
        .select(`
          id, title, description, price, location, category, condition,
          created_at, updated_at, view_count, like_count,
          seller:users!marketplace_listings_seller_id_fkey(id, username, avatar_url),
          images:marketplace_images(id, image_url, is_primary)
        `, { count: 'exact' })
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);

      if (category) marketplaceQuery = marketplaceQuery.eq('category', category);
      if (location) marketplaceQuery = marketplaceQuery.ilike('location', `%${location}%`);
      if (price_min) marketplaceQuery = marketplaceQuery.gte('price', price_min);
      if (price_max) marketplaceQuery = marketplaceQuery.lte('price', price_max);
      if (date_from) marketplaceQuery = marketplaceQuery.gte('created_at', date_from);
      if (date_to) marketplaceQuery = marketplaceQuery.lte('created_at', date_to);

      if (sort === 'date') {
        marketplaceQuery = marketplaceQuery.order('created_at', { ascending: false });
      } else if (sort === 'popularity') {
        marketplaceQuery = marketplaceQuery.order('view_count', { ascending: false });
      }

      if (type === 'marketplace') {
        marketplaceQuery = marketplaceQuery.range(offset, offset + limit - 1);
      } else {
        marketplaceQuery = marketplaceQuery.limit(Math.ceil(limit / 4));
      }

      const { data: marketplaceResults, count: marketplaceCount } = await marketplaceQuery;

      if (marketplaceResults) {
        results.results.push(...marketplaceResults.map(item => ({
          ...item,
          type: 'marketplace',
          url: `/marketplace/${item.id}`
        })));
        if (type === 'marketplace') {
          results.total = marketplaceCount;
        }
      }
    }

    // Search forum posts
    if (type === 'all' || type === 'forums') {
      let forumQuery = supabaseAdmin
        .from('forum_posts')
        .select(`
          id, title, content, created_at, updated_at, view_count, like_count, comment_count,
          author:users!forum_posts_author_id_fkey(id, username, avatar_url),
          category:forum_categories!forum_posts_category_id_fkey(id, name, slug)
        `, { count: 'exact' })
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

      if (date_from) forumQuery = forumQuery.gte('created_at', date_from);
      if (date_to) forumQuery = forumQuery.lte('created_at', date_to);

      if (sort === 'date') {
        forumQuery = forumQuery.order('created_at', { ascending: false });
      } else if (sort === 'popularity') {
        forumQuery = forumQuery.order('view_count', { ascending: false });
      }

      if (type === 'forums') {
        forumQuery = forumQuery.range(offset, offset + limit - 1);
      } else {
        forumQuery = forumQuery.limit(Math.ceil(limit / 4));
      }

      const { data: forumResults, count: forumCount } = await forumQuery;

      if (forumResults) {
        results.results.push(...forumResults.map(item => ({
          ...item,
          type: 'forum',
          url: `/forums/posts/${item.id}`
        })));
        if (type === 'forums') {
          results.total = forumCount;
        }
      }
    }

    // Search blog posts
    if (type === 'all' || type === 'blog') {
      let blogQuery = supabaseAdmin
        .from('blog_posts')
        .select(`
          id, title, excerpt, content, created_at, updated_at, view_count, like_count,
          author:users!blog_posts_author_id_fkey(id, username, avatar_url),
          featured_image, tags
        `, { count: 'exact' })
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{"${query}"}`);

      if (date_from) blogQuery = blogQuery.gte('created_at', date_from);
      if (date_to) blogQuery = blogQuery.lte('created_at', date_to);

      if (sort === 'date') {
        blogQuery = blogQuery.order('created_at', { ascending: false });
      } else if (sort === 'popularity') {
        blogQuery = blogQuery.order('view_count', { ascending: false });
      }

      if (type === 'blog') {
        blogQuery = blogQuery.range(offset, offset + limit - 1);
      } else {
        blogQuery = blogQuery.limit(Math.ceil(limit / 4));
      }

      const { data: blogResults, count: blogCount } = await blogQuery;

      if (blogResults) {
        results.results.push(...blogResults.map(item => ({
          ...item,
          type: 'blog',
          url: `/blog/${item.id}`
        })));
        if (type === 'blog') {
          results.total = blogCount;
        }
      }
    }

    // Search directory businesses
    if (type === 'all' || type === 'directory') {
      let directoryQuery = supabaseAdmin
        .from('directory_businesses')
        .select(`
          id, name, description, category, location, phone, email, website,
          created_at, updated_at, view_count, rating, review_count,
          owner:users!directory_businesses_owner_id_fkey(id, username, avatar_url)
        `, { count: 'exact' })
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);

      if (category) directoryQuery = directoryQuery.eq('category', category);
      if (location) directoryQuery = directoryQuery.ilike('location', `%${location}%`);
      if (date_from) directoryQuery = directoryQuery.gte('created_at', date_from);
      if (date_to) directoryQuery = directoryQuery.lte('created_at', date_to);

      if (sort === 'date') {
        directoryQuery = directoryQuery.order('created_at', { ascending: false });
      } else if (sort === 'popularity') {
        directoryQuery = directoryQuery.order('rating', { ascending: false });
      }

      if (type === 'directory') {
        directoryQuery = directoryQuery.range(offset, offset + limit - 1);
      } else {
        directoryQuery = directoryQuery.limit(Math.ceil(limit / 4));
      }

      const { data: directoryResults, count: directoryCount } = await directoryQuery;

      if (directoryResults) {
        results.results.push(...directoryResults.map(item => ({
          ...item,
          type: 'directory',
          url: `/directory/${item.id}`
        })));
        if (type === 'directory') {
          results.total = directoryCount;
        }
      }
    }

    // Search charging stations
    if (type === 'all' || type === 'charging') {
      let chargingQuery = supabaseAdmin
        .from('charging_stations')
        .select(`
          id, name, description, location, address, latitude, longitude,
          connector_types, power_output, pricing, amenities,
          created_at, updated_at, rating, review_count
        `, { count: 'exact' })
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,address.ilike.%${query}%`);

      if (location) chargingQuery = chargingQuery.ilike('address', `%${location}%`);
      if (date_from) chargingQuery = chargingQuery.gte('created_at', date_from);
      if (date_to) chargingQuery = chargingQuery.lte('created_at', date_to);

      if (sort === 'date') {
        chargingQuery = chargingQuery.order('created_at', { ascending: false });
      } else if (sort === 'popularity') {
        chargingQuery = chargingQuery.order('rating', { ascending: false });
      }

      if (type === 'charging') {
        chargingQuery = chargingQuery.range(offset, offset + limit - 1);
      } else {
        chargingQuery = chargingQuery.limit(Math.ceil(limit / 4));
      }

      const { data: chargingResults, count: chargingCount } = await chargingQuery;

      if (chargingResults) {
        results.results.push(...chargingResults.map(item => ({
          ...item,
          type: 'charging',
          url: `/charging-stations/${item.id}`
        })));
        if (type === 'charging') {
          results.total = chargingCount;
        }
      }
    }

    // Search users (if authenticated)
    if ((type === 'all' || type === 'users') && req.user) {
      let userQuery = supabaseAdmin
        .from('users')
        .select(`
          id, username, email, avatar_url, bio, location,
          created_at, last_login_at
        `, { count: 'exact' })
        .or(`username.ilike.%${query}%,bio.ilike.%${query}%,location.ilike.%${query}%`);

      if (location) userQuery = userQuery.ilike('location', `%${location}%`);
      if (date_from) userQuery = userQuery.gte('created_at', date_from);
      if (date_to) userQuery = userQuery.lte('created_at', date_to);

      if (sort === 'date') {
        userQuery = userQuery.order('created_at', { ascending: false });
      } else {
        userQuery = userQuery.order('last_login_at', { ascending: false });
      }

      if (type === 'users') {
        userQuery = userQuery.range(offset, offset + limit - 1);
      } else {
        userQuery = userQuery.limit(Math.ceil(limit / 4));
      }

      const { data: userResults, count: userCount } = await userQuery;

      if (userResults) {
        results.results.push(...userResults.map(item => ({
          ...item,
          type: 'user',
          url: `/users/${item.username}`
        })));
        if (type === 'users') {
          results.total = userCount;
        }
      }
    }

    // Search vehicles
    if (type === 'all' || type === 'vehicles') {
      let vehicleQuery = supabaseAdmin
        .from('vehicles')
        .select(`
          id, make, model, year, trim, color, vin,
          created_at, updated_at,
          owner:users!vehicles_owner_id_fkey(id, username, avatar_url)
        `, { count: 'exact' })
        .or(`make.ilike.%${query}%,model.ilike.%${query}%,trim.ilike.%${query}%,color.ilike.%${query}%`);

      if (date_from) vehicleQuery = vehicleQuery.gte('created_at', date_from);
      if (date_to) vehicleQuery = vehicleQuery.lte('created_at', date_to);

      if (sort === 'date') {
        vehicleQuery = vehicleQuery.order('created_at', { ascending: false });
      } else {
        vehicleQuery = vehicleQuery.order('year', { ascending: false });
      }

      if (type === 'vehicles') {
        vehicleQuery = vehicleQuery.range(offset, offset + limit - 1);
      } else {
        vehicleQuery = vehicleQuery.limit(Math.ceil(limit / 4));
      }

      const { data: vehicleResults, count: vehicleCount } = await vehicleQuery;

      if (vehicleResults) {
        results.results.push(...vehicleResults.map(item => ({
          ...item,
          type: 'vehicle',
          url: `/vehicles/${item.id}`
        })));
        if (type === 'vehicles') {
          results.total = vehicleCount;
        }
      }
    }

    // Sort results by relevance if needed
    if (sort === 'relevance' && type === 'all') {
      results.results.sort((a, b) => {
        // Simple relevance scoring based on title/name match
        const aScore = (a.title || a.name || '').toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
        const bScore = (b.title || b.name || '').toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
        return bScore - aScore;
      });
    }

    // Calculate pagination for mixed results
    if (type === 'all') {
      results.total = results.results.length;
      results.results = results.results.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil(results.total / limit);
    results.pagination = {
      page,
      limit,
      total: results.total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions/autocomplete
// @access  Public
router.get('/suggestions', validate(suggestionsSchema, 'query'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q: query, type, limit } = req.query;
    const suggestions = [];

    // Get marketplace suggestions
    if (type === 'all' || type === 'marketplace') {
      const { data: marketplaceSuggestions } = await supabaseAdmin
        .from('marketplace_listings')
        .select('title, category')
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit)
        .order('view_count', { ascending: false });

      if (marketplaceSuggestions) {
        suggestions.push(...marketplaceSuggestions.map(item => ({
          text: item.title,
          type: 'marketplace',
          category: item.category
        })));
      }
    }

    // Get forum suggestions
    if (type === 'all' || type === 'forums') {
      const { data: forumSuggestions } = await supabaseAdmin
        .from('forum_posts')
        .select('title')
        .ilike('title', `%${query}%`)
        .limit(limit)
        .order('view_count', { ascending: false });

      if (forumSuggestions) {
        suggestions.push(...forumSuggestions.map(item => ({
          text: item.title,
          type: 'forum'
        })));
      }
    }

    // Get blog suggestions
    if (type === 'all' || type === 'blog') {
      const { data: blogSuggestions } = await supabaseAdmin
        .from('blog_posts')
        .select('title, tags')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,tags.cs.{"${query}"}}`)
        .limit(limit)
        .order('view_count', { ascending: false });

      if (blogSuggestions) {
        suggestions.push(...blogSuggestions.map(item => ({
          text: item.title,
          type: 'blog',
          tags: item.tags
        })));
      }
    }

    // Get directory suggestions
    if (type === 'all' || type === 'directory') {
      const { data: directorySuggestions } = await supabaseAdmin
        .from('directory_businesses')
        .select('name, category')
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit)
        .order('rating', { ascending: false });

      if (directorySuggestions) {
        suggestions.push(...directorySuggestions.map(item => ({
          text: item.name,
          type: 'directory',
          category: item.category
        })));
      }
    }

    // Get user suggestions (if authenticated)
    if ((type === 'all' || type === 'users') && req.user) {
      const { data: userSuggestions } = await supabaseAdmin
        .from('users')
        .select('username')
        .ilike('username', `%${query}%`)
        .limit(limit)
        .order('last_login_at', { ascending: false });

      if (userSuggestions) {
        suggestions.push(...userSuggestions.map(item => ({
          text: item.username,
          type: 'user'
        })));
      }
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        index === self.findIndex(t => t.text === item.text && t.type === item.type)
      )
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        query,
        suggestions: uniqueSuggestions
      }
    });
  } catch (error) {
    console.error('Error in search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions'
    });
  }
});

// @route   GET /api/search/trending
// @desc    Get trending search terms
// @access  Public
router.get('/trending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would typically come from a search analytics table
    // For now, we'll return some static trending terms
    const trendingTerms = [
      { term: 'Tesla Model 3', count: 150, category: 'vehicles' },
      { term: 'EV charging', count: 120, category: 'charging' },
      { term: 'Battery replacement', count: 95, category: 'forums' },
      { term: 'Used EV', count: 80, category: 'marketplace' },
      { term: 'Home charging', count: 75, category: 'directory' },
      { term: 'Range anxiety', count: 60, category: 'blog' },
      { term: 'EV maintenance', count: 55, category: 'forums' },
      { term: 'Electric SUV', count: 50, category: 'vehicles' }
    ];

    res.json({
      success: true,
      data: {
        trending: trendingTerms,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in trending search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches'
    });
  }
});

// @route   GET /api/search/filters
// @desc    Get available search filters
// @access  Public
router.get('/filters', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.query;
    const filters: any = {};

    // Get marketplace categories
    if (!type || type === 'marketplace') {
      const { data: marketplaceCategories } = await supabaseAdmin
        .from('marketplace_listings')
        .select('category')
        .eq('status', 'active')
        .not('category', 'is', null);

      if (marketplaceCategories) {
        const uniqueCategories = [...new Set(marketplaceCategories.map(item => item.category))];
        filters.marketplace_categories = uniqueCategories.sort();
      }
    }

    // Get forum categories
    if (!type || type === 'forums') {
      const { data: forumCategories } = await supabaseAdmin
        .from('forum_categories')
        .select('name, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (forumCategories) {
        filters.forum_categories = forumCategories;
      }
    }

    // Get directory categories
    if (!type || type === 'directory') {
      const { data: directoryCategories } = await supabaseAdmin
        .from('directory_businesses')
        .select('category')
        .eq('status', 'active')
        .not('category', 'is', null);

      if (directoryCategories) {
        const uniqueCategories = [...new Set(directoryCategories.map(item => item.category))];
        filters.directory_categories = uniqueCategories.sort();
      }
    }

    // Get common locations
    const { data: locations } = await supabaseAdmin
      .from('marketplace_listings')
      .select('location')
      .eq('status', 'active')
      .not('location', 'is', null)
      .limit(100);

    if (locations) {
      const uniqueLocations = [...new Set(locations.map(item => item.location))]
        .filter(location => location && (location as string).trim())
        .sort()
        .slice(0, 20);
      filters.locations = uniqueLocations;
    }

    // Get price ranges for marketplace
    if (!type || type === 'marketplace') {
      const { data: priceData } = await supabaseAdmin
        .from('marketplace_listings')
        .select('price')
        .eq('status', 'active')
        .not('price', 'is', null)
        .order('price');

      if (priceData && priceData.length > 0) {
        const prices = priceData.map(item => item.price).filter(price => price > 0);
        if (prices.length > 0) {
          filters.price_ranges = [
            { label: 'Under $10,000', min: 0, max: 10000 },
            { label: '$10,000 - $25,000', min: 10000, max: 25000 },
            { label: '$25,000 - $50,000', min: 25000, max: 50000 },
            { label: '$50,000 - $100,000', min: 50000, max: 100000 },
            { label: 'Over $100,000', min: 100000, max: null }
          ];
        }
      }
    }

    res.json({
      success: true,
      data: filters
    });
  } catch (error) {
    console.error('Error in search filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search filters'
    });
  }
});

export default router;