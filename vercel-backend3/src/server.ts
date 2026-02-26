import express from 'express';
import router from './routes/router.js'
import awsRouter from './routes/aws.router.js';
import 'dotenv/config'
import cors from 'cors';
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000', 
    methods: ["GET", "POST"]
}

))

app.use('/aws', awsRouter);

app.use('/', router);



app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})