const { v4: uuidv4 } = require('uuid');

// In-memory storage for orders (replace with database in production)
let orders = [];

class Order {
  static findAll() {
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static findById(id) {
    return orders.find(order => order.id === id);
  }

  static findByUserId(userId) {
    return orders.filter(order => order.userId === parseInt(userId));
  }

  static create(orderData) {
    const newOrder = {
      id: uuidv4(),
      userId: orderData.userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: orderData.status || 'pending',
      shippingAddress: orderData.shippingAddress || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(newOrder);
    return newOrder;
  }

  static update(id, orderData) {
    const index = orders.findIndex(order => order.id === id);
    if (index === -1) return null;
    
    orders[index] = {
      ...orders[index],
      ...orderData,
      updatedAt: new Date().toISOString()
    };
    return orders[index];
  }

  static delete(id) {
    const index = orders.findIndex(order => order.id === id);
    if (index === -1) return false;
    
    orders.splice(index, 1);
    return true;
  }

  static updateStatus(id, status) {
    const index = orders.findIndex(order => order.id === id);
    if (index === -1) return null;
    
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    return orders[index];
  }

  // Initialize with some sample data
  static initSampleData() {
    if (orders.length === 0) {
      const sampleOrders = [
        {
          userId: 1,
          items: [
            { productId: 'PROD-001', productName: 'Laptop', quantity: 1, price: 999.99 }
          ],
          totalAmount: 999.99,
          status: 'delivered',
          shippingAddress: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA'
          }
        },
        {
          userId: 1,
          items: [
            { productId: 'PROD-002', productName: 'Mouse', quantity: 2, price: 29.99 },
            { productId: 'PROD-003', productName: 'Keyboard', quantity: 1, price: 79.99 }
          ],
          totalAmount: 139.97,
          status: 'processing',
          shippingAddress: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA'
          }
        }
      ];

      sampleOrders.forEach(order => this.create(order));
      console.log('✅ Sample order data initialized');
    }
  }
}

// Initialize sample data on module load
Order.initSampleData();

module.exports = Order;

