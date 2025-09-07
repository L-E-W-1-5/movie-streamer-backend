import express, {} from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 8000;
app.get('/', (req, res) => {
    res.send('Welcome to Express & TypeScript Server');
});
app.listen(port, () => {
    console.log(`Server is Fire at https://localhost:${port}`);
});
//# sourceMappingURL=index.js.map