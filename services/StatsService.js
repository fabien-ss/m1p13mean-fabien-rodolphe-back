const Order = require('../models/Order');
const User = require('../models/User');

class StatsService {
    static async countClients() {
    const clientRole = await Role.findOne({ name: 'client' });
    if (!clientRole) return 0;
    return await User.countDocuments({ role: clientRole._id });
  }
  
  static async countOrders(){
    const orders = await Order.countDocuments();
    return orders;
    }
    
}