import express from 'express';
import { login } from '../controllers/authController.js';

const app = express();
app.use(express.json());
app.post('/login', async (req, res) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ error: error.message });
  }
});

describe('POST /login', () => {
});
