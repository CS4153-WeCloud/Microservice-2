# Order Service Microservice

A RESTful microservice for order management with OpenAPI documentation and integration with User Service.

## Features

- ✅ Complete REST API (GET, POST, PUT, DELETE, PATCH)
- ✅ OpenAPI 3.0 documentation with Swagger UI
- ✅ In-memory data storage (easily replaceable with database)
- ✅ MVC architecture with models
- ✅ Microservice-to-microservice communication (with User Service)
- ✅ Health check endpoint
- ✅ Ready for GCP VM deployment

## Tech Stack

- Node.js + Express
- In-memory storage (can be migrated to database)
- Swagger/OpenAPI 3.0
- Axios for HTTP requests
- Docker support

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env if needed
```

3. Start the server:
```bash
npm run dev
```

4. Access the API:
   - API Base: http://localhost:3002
   - API Documentation: http://localhost:3002/api-docs
   - Health Check: http://localhost:3002/health

## API Endpoints

### Orders Resource

- `GET /api/orders` - Get all orders (optional ?userId filter)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `PATCH /api/orders/:id/status` - Update order status

### Example Requests

```bash
# Get all orders
curl http://localhost:3002/api/orders

# Get orders for specific user
curl http://localhost:3002/api/orders?userId=1

# Create an order
curl -X POST http://localhost:3002/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {
        "productId": "PROD-001",
        "productName": "Laptop",
        "quantity": 1,
        "price": 999.99
      }
    ],
    "totalAmount": 999.99,
    "status": "pending",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    }
  }'

# Update order status
curl -X PATCH http://localhost:3002/api/orders/<order-id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

## Microservice Integration

This service can communicate with the User Service to verify users:

```javascript
// In routes/orderRoutes.js
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Uncomment user verification in POST route to enable
```

## GCP Deployment

### 1. Create a VM Instance

```bash
gcloud compute instances create order-service-vm \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server
```

### 2. Configure Firewall

```bash
gcloud compute firewall-rules create allow-order-service \
  --allow=tcp:3002 \
  --target-tags=http-server
```

### 3. Deploy Application

```bash
# SSH into VM
gcloud compute ssh order-service-vm --zone=us-central1-a

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone <your-repo-url>
cd microservice-2-order

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with User Service VM internal IP if needed

# Start with PM2
sudo npm install -g pm2
pm2 start src/server.js --name order-service
pm2 save
pm2 startup
```

### 4. Connect to User Service

Update your `.env` file:

```
USER_SERVICE_URL=http://<user-service-vm-internal-ip>:3001
```

## Testing

```bash
# Get external IP
gcloud compute instances describe order-service-vm --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Test the API
curl http://<external-ip>:3002/health
curl http://<external-ip>:3002/api/orders
```

## Project Structure

```
microservice-2-order/
├── src/
│   ├── config/
│   │   └── swagger.js       # OpenAPI configuration
│   ├── models/
│   │   └── Order.js         # Order model (in-memory)
│   ├── routes/
│   │   └── orderRoutes.js   # Order API routes
│   └── server.js            # Express app entry point
├── env.example
├── package.json
├── Dockerfile
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3002 |
| USER_SERVICE_URL | User Service endpoint | http://localhost:3001 |
| NODE_ENV | Environment | development |

## Data Storage

Currently uses in-memory storage with sample data. To migrate to a database:

1. Add database dependency (e.g., `mysql2`)
2. Update `src/models/Order.js` to use database queries
3. Add database configuration in `src/config/database.js`

## Sample Data

The service initializes with 2 sample orders on startup for testing purposes.

## Development Team Notes

- Service can run independently without User Service (user verification is optional)
- In-memory storage means data resets on restart
- OpenAPI documentation auto-generated from JSDoc
- Ready for horizontal scaling when migrated to persistent storage
- CORS enabled for browser access

## Next Steps

1. Migrate to persistent database (MySQL/PostgreSQL)
2. Add authentication middleware
3. Implement order validation business logic
4. Add payment integration
5. Implement inventory checking
6. Add email notifications (integrate with Notification Service)
7. Add unit and integration tests

