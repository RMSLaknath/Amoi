import express from 'express';
import { placeOrder, allOrders, userOrders, updateStatus } from '../controllers/orderController.js';
import { placeOrderPayHere, payhereNotify } from '../controllers/payhereController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.post('/userorders', authUser, userOrders);

// PayHere routes
orderRouter.post('/payhere/checkout', authUser, placeOrderPayHere);
orderRouter.post('/payhere/notify', payhereNotify);

export default orderRouter;