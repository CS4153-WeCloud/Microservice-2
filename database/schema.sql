-- Route & Group Service Database Schema for setup & testing
CREATE DATABASE IF NOT EXISTS route_service_db;
USE route_service_db;

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    status ENUM('proposed', 'active', 'completed', 'cancelled') DEFAULT 'proposed',
    schedule_days JSON NOT NULL,
    morning_time TIME NOT NULL,
    evening_time TIME NOT NULL,
    semester VARCHAR(50) NOT NULL,
    current_members INT DEFAULT 1,
    required_members INT DEFAULT 15,
    estimated_cost DECIMAL(10,2),
    description TEXT,
    created_by INT NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_from_location (from_location),
    INDEX idx_to_location (to_location),
    INDEX idx_status (status),
    INDEX idx_semester (semester),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- Route members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS route_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_route_user (route_id, user_id),
    INDEX idx_route_id (route_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Insert sample routes for testing
INSERT INTO routes (
    from_location, 
    to_location, 
    status, 
    schedule_days, 
    morning_time, 
    evening_time, 
    semester, 
    current_members, 
    required_members, 
    estimated_cost, 
    description, 
    created_by,
    version
) VALUES
(
    'Columbia University', 
    'Flushing, Queens', 
    'active', 
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]', 
    '08:00:00', 
    '18:30:00', 
    'Fall 2025', 
    16, 
    15, 
    120.00, 
    'Daily shuttle service between Columbia and Flushing. Convenient for students living in Queens.',
    1,
    1
),
(
    'Columbia University', 
    'Jersey City, NJ', 
    'active', 
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]', 
    '08:30:00', 
    '18:00:00', 
    'Fall 2025', 
    18, 
    15, 
    110.00, 
    'Express route to Jersey City for students commuting from New Jersey.',
    1,
    1
),
(
    'Columbia University', 
    'Brooklyn Heights, NY', 
    'proposed', 
    '["Monday", "Wednesday", "Friday"]', 
    '08:15:00', 
    '17:30:00', 
    'Spring 2026', 
    8, 
    15, 
    100.00, 
    'Tri-weekly shuttle to Brooklyn Heights. Need 7 more members to activate!',
    2,
    1
),
(
    'Columbia University', 
    'Astoria, Queens', 
    'proposed', 
    '["Tuesday", "Thursday"]', 
    '09:00:00', 
    '19:00:00', 
    'Spring 2026', 
    5, 
    15, 
    90.00, 
    'Twice-weekly shuttle to Astoria. Looking for more members.',
    2,
    1
),
(
    'Columbia University', 
    'Hoboken, NJ', 
    'cancelled', 
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]', 
    '07:30:00', 
    '17:00:00', 
    'Fall 2025', 
    4, 
    15, 
    115.00, 
    'This route was cancelled due to insufficient members.',
    3,
    1
);

-- Insert sample route members
-- Route 1 (Columbia -> Flushing) has 16 members
INSERT INTO route_members (route_id, user_id, status) VALUES
(1, 1, 'confirmed'),  -- John Doe (creator)
(1, 2, 'confirmed'),  -- Jane Smith
(1, 3, 'confirmed'),  -- Bob Wilson
(1, 4, 'confirmed'),
(1, 5, 'confirmed'),
(1, 6, 'confirmed'),
(1, 7, 'confirmed'),
(1, 8, 'confirmed'),
(1, 9, 'confirmed'),
(1, 10, 'confirmed'),
(1, 11, 'confirmed'),
(1, 12, 'confirmed'),
(1, 13, 'confirmed'),
(1, 14, 'confirmed'),
(1, 15, 'confirmed'),
(1, 16, 'confirmed');

-- Route 2 (Columbia -> Jersey City) has 18 members
INSERT INTO route_members (route_id, user_id, status) VALUES
(2, 1, 'confirmed'),  -- John Doe (creator)
(2, 2, 'confirmed'),
(2, 17, 'confirmed'),
(2, 18, 'confirmed'),
(2, 19, 'confirmed'),
(2, 20, 'confirmed'),
(2, 21, 'confirmed'),
(2, 22, 'confirmed'),
(2, 23, 'confirmed'),
(2, 24, 'confirmed'),
(2, 25, 'confirmed'),
(2, 26, 'confirmed'),
(2, 27, 'confirmed'),
(2, 28, 'confirmed'),
(2, 29, 'confirmed'),
(2, 30, 'confirmed'),
(2, 31, 'confirmed'),
(2, 32, 'confirmed');

-- Route 3 (Columbia -> Brooklyn Heights) has 8 members
INSERT INTO route_members (route_id, user_id, status) VALUES
(3, 2, 'confirmed'),  -- Jane Smith (creator)
(3, 3, 'confirmed'),
(3, 33, 'confirmed'),
(3, 34, 'confirmed'),
(3, 35, 'confirmed'),
(3, 36, 'confirmed'),
(3, 37, 'confirmed'),
(3, 38, 'confirmed');

-- Route 4 (Columbia -> Astoria) has 5 members
INSERT INTO route_members (route_id, user_id, status) VALUES
(4, 2, 'confirmed'),  -- Jane Smith (creator)
(4, 39, 'confirmed'),
(4, 40, 'confirmed'),
(4, 41, 'confirmed'),
(4, 42, 'confirmed');

-- Route 5 (Columbia -> Hoboken) has 4 members (cancelled)
INSERT INTO route_members (route_id, user_id, status) VALUES
(5, 3, 'confirmed'),  -- Bob Wilson (creator)
(5, 43, 'confirmed'),
(5, 44, 'confirmed'),
(5, 45, 'confirmed');

-- Show the created table structures
DESCRIBE routes;
DESCRIBE route_members;

-- Display sample data
SELECT 
    r.id,
    r.from_location,
    r.to_location,
    r.status,
    r.semester,
    r.current_members,
    r.required_members,
    r.morning_time,
    r.evening_time,
    r.created_at
FROM routes r
ORDER BY r.status, r.created_at DESC;

-- Display route member counts
SELECT 
    r.id,
    r.from_location,
    r.to_location,
    r.status,
    COUNT(rm.id) as actual_member_count,
    r.current_members as stored_member_count
FROM routes r
LEFT JOIN route_members rm ON r.id = rm.route_id
GROUP BY r.id
ORDER BY r.id;

-- Display detailed member information for active routes
SELECT 
    r.id as route_id,
    r.from_location,
    r.to_location,
    rm.user_id,
    rm.status as member_status,
    rm.joined_at
FROM routes r
INNER JOIN route_members rm ON r.id = rm.route_id
WHERE r.status = 'active'
ORDER BY r.id, rm.joined_at;