const db = require('../config/database');
const crypto = require('crypto');

// Helper function to convert snake_case to camelCase
function toCamelCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    from: row.from_location,
    to: row.to_location,
    status: row.status,
    schedule: {
      days: typeof row.schedule_days === 'string' 
        ? JSON.parse(row.schedule_days) 
        : row.schedule_days,
      morningTime: row.morning_time,
      eveningTime: row.evening_time
    },
    semester: row.semester,
    currentMembers: row.current_members,
    requiredMembers: row.required_members,
    estimatedCost: parseFloat(row.estimated_cost),
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links: {
      self: `/routes/${row.id}`,
      members: `/routes/${row.id}/members`,
      trips: `/routes/${row.id}/trips`,
      subscriptions: `/subscriptions?route_id=${row.id}`
    }
  };
}

// Helper function to normalize time format to HH:mm:ss
function normalizeTime(timeValue) {
  if (!timeValue) return null;
  
  // If already in HH:mm:ss format, return as is
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }
  
  // Extract time part using regex
  const timeMatch = timeValue.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    return timeMatch[0]; // Returns "HH:mm:ss"
  }
  
  // Try parsing as Date if regex fails
  try {
    const date = new Date(timeValue);
    if (!isNaN(date.getTime())) {
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return null;
}

// Generate eTag from route data
function generateETag(route) {
  const content = JSON.stringify({
    id: route.id,
    fromLocation: route.fromLocation,
    toLocation: route.toLocation,
    status: route.status,
    scheduleDays: route.scheduleDays,
    morningTime: route.morningTime,
    eveningTime: route.eveningTime,
    semester: route.semester,
    currentMembers: route.currentMembers,
    updatedAt: route.updatedAt,
    version: route.version
  });
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

class Route {
  /**
   * Find all routes with filtering, sorting, and pagination
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM routes WHERE 1=1';
    const params = [];
    
    // Apply filters
    if (filters.from) {
      query += ' AND from_location LIKE ?';
      params.push(`%${filters.from}%`);
    }
    if (filters.to) {
      query += ' AND to_location LIKE ?';
      params.push(`%${filters.to}%`);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.semester) {
      query += ' AND semester = ?';
      params.push(filters.semester);
    }
    if (filters.createdBy) {
      query += ' AND created_by = ?';
      params.push(filters.createdBy);
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const pageSize = parseInt(filters.page_size) || 20;
    const offset = (page - 1) * pageSize;
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await db.query(countQuery, params);
    const totalCount = countResult[0].total;
    
    // Add pagination to main query
    query += ' LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    const [rows] = await db.query(query, params);
    const routes = rows.map(toCamelCase);
    
    // Return paginated response
    return {
      data: routes,
      pagination: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: page < Math.ceil(totalCount / pageSize),
        hasPrev: page > 1,
        links: {
          self: `/routes?page=${page}&page_size=${pageSize}`,
          next: page < Math.ceil(totalCount / pageSize) 
            ? `/routes?page=${page + 1}&page_size=${pageSize}` 
            : null,
          prev: page > 1 
            ? `/routes?page=${page - 1}&page_size=${pageSize}` 
            : null
        }
      }
    };
  }

  /**
   * Find route by ID
   * Support eTag
   */
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM routes WHERE id = ?', [id]);
    const route = toCamelCase(rows[0]);
    
    if (route) {
      route.etag = generateETag(route);
    }
    
    return route;
  }

  /**
   * Find routes by user (joined routes)
   */
  static async findByUserId(userId) {
    const query = `
      SELECT r.* FROM routes r
      INNER JOIN route_members rm ON r.id = rm.route_id
      WHERE rm.user_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows.map(toCamelCase);
  }

  /**
   * Create a new route
   */
  static async create(routeData) {
    const { 
      fromLocation, 
      toLocation, 
      scheduleDays, 
      morningTime, 
      eveningTime, 
      semester, 
      requiredMembers, 
      estimatedCost, 
      description, 
      createdBy 
    } = routeData;
    
    const normalizedMorningTime = normalizeTime(morningTime);
    const normalizedEveningTime = normalizeTime(eveningTime);
    const scheduleDaysJson = JSON.stringify(scheduleDays);
    
    const [result] = await db.query(
      `INSERT INTO routes 
       (from_location, to_location, status, schedule_days, morning_time, evening_time, 
        semester, current_members, required_members, estimated_cost, description, created_by, version) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fromLocation, 
        toLocation, 
        'proposed', // New routes start as 'proposed'
        scheduleDaysJson, 
        normalizedMorningTime, 
        normalizedEveningTime, 
        semester, 
        1, // Creator is the first member
        requiredMembers || 15, 
        estimatedCost, 
        description, 
        createdBy,
        1 // Initial version for eTag
      ]
    );
    
    // Add creator as first member
    await db.query(
      'INSERT INTO route_members (route_id, user_id) VALUES (?, ?)',
      [result.insertId, createdBy]
    );
    
    return this.findById(result.insertId);
  }

  /**
   * Update a route
   * Sprint 2 Requirement: eTag validation with If-Match
   */
  static async update(id, routeData, ifMatchETag = null) {
    // If eTag provided, verify it matches
    if (ifMatchETag) {
      const currentRoute = await this.findById(id);
      if (!currentRoute) {
        throw new Error('Route not found');
      }
      
      if (currentRoute.etag !== ifMatchETag) {
        throw new Error('ETag mismatch - resource has been modified');
      }
    }
    
    const updateFields = [];
    const updateValues = [];
    
    if (routeData.fromLocation !== undefined) { 
      updateFields.push('from_location = ?'); 
      updateValues.push(routeData.fromLocation); 
    }
    if (routeData.toLocation !== undefined) { 
      updateFields.push('to_location = ?'); 
      updateValues.push(routeData.toLocation); 
    }
    if (routeData.status !== undefined) { 
      updateFields.push('status = ?'); 
      updateValues.push(routeData.status); 
    }
    if (routeData.scheduleDays !== undefined) { 
      updateFields.push('schedule_days = ?'); 
      updateValues.push(JSON.stringify(routeData.scheduleDays)); 
    }
    if (routeData.morningTime !== undefined) { 
      updateFields.push('morning_time = ?'); 
      updateValues.push(normalizeTime(routeData.morningTime)); 
    }
    if (routeData.eveningTime !== undefined) { 
      updateFields.push('evening_time = ?'); 
      updateValues.push(normalizeTime(routeData.eveningTime)); 
    }
    if (routeData.semester !== undefined) { 
      updateFields.push('semester = ?'); 
      updateValues.push(routeData.semester); 
    }
    if (routeData.estimatedCost !== undefined) { 
      updateFields.push('estimated_cost = ?'); 
      updateValues.push(routeData.estimatedCost); 
    }
    if (routeData.description !== undefined) { 
      updateFields.push('description = ?'); 
      updateValues.push(routeData.description); 
    }
    
    // Increment version for eTag
    updateFields.push('version = version + 1');
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    await db.query(
      `UPDATE routes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    return this.findById(id);
  }

  /**
   * Delete a route
   */
  static async delete(id) {
    // Delete members first (foreign key constraint)
    await db.query('DELETE FROM route_members WHERE route_id = ?', [id]);
    
    const [result] = await db.query('DELETE FROM routes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Update route status
   */
  static async updateStatus(id, status) {
    await db.query(
      'UPDATE routes SET status = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  /**
   * Increment member count when user joins
   */
  static async incrementMembers(id) {
    await db.query(
      'UPDATE routes SET current_members = current_members + 1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }

  /**
   * Decrement member count when user leaves
   */
  static async decrementMembers(id) {
    await db.query(
      'UPDATE routes SET current_members = current_members - 1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }

  /**
   * Check if user is a member of route
   */
  static async isMember(routeId, userId) {
    const [rows] = await db.query(
      'SELECT * FROM route_members WHERE route_id = ? AND user_id = ?',
      [routeId, userId]
    );
    return rows.length > 0;
  }

  /**
   * Get all members of a route
   * Sprint 2 Requirement: Query parameters for sub-collections
   */
  static async getMembers(routeId, filters = {}) {
    let query = `
      SELECT u.*, rm.joined_at, rm.status as member_status
      FROM users u
      INNER JOIN route_members rm ON u.id = rm.user_id
      WHERE rm.route_id = ?
    `;
    const params = [routeId];
    
    // Apply filters
    if (filters.status) {
      query += ' AND rm.status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY rm.joined_at ASC';
    
    const [rows] = await db.query(query, params);
    return rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      homeArea: row.home_area,
      joinedAt: row.joined_at,
      memberStatus: row.member_status
    }));
  }

  /**
   * Add a member to a route
   */
  static async addMember(routeId, userId) {
    await db.query(
      'INSERT INTO route_members (route_id, user_id, status) VALUES (?, ?, ?)',
      [routeId, userId, 'confirmed']
    );
    return this.incrementMembers(routeId);
  }

  /**
   * Remove a member from a route
   */
  static async removeMember(routeId, userId) {
    await db.query(
      'DELETE FROM route_members WHERE route_id = ? AND user_id = ?',
      [routeId, userId]
    );
    return this.decrementMembers(routeId);
  }
}

module.exports = Route;