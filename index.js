import express from 'express';
import {connectDB} from './db/MongoConnect.js';
import { configDotenv } from 'dotenv';
import productRoute from './routes/productRoute.js';
import userRoute from './routes/userRoute.js';
import orderRoute from './routes/orderRoute.js';
import cartRoute from './routes/cartRoute.js';
import cors from 'cors';


configDotenv();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
connectDB();

app.use(cors( {origin: '*'})); 

app.use('/api/product', productRoute);
app.use('/api/auth', userRoute);
app.use('/api/order', orderRoute);
app.use('/api/cart', cartRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    });

