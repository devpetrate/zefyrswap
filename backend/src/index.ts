import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import routes from "./routes";

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "ZefyrSwap DEX Aggregator API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      quote: "POST /api/quote",
      swap: "POST /api/swap",
      tokenInfo: "GET /api/token/:address",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
  });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
);

// Start server
app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     DEX Aggregator Backend - Base Network    ║
╚══════════════════════════════════════════════╝

🚀 Server running on port ${config.port}
🌐 Environment: ${config.nodeEnv}
🔗 RPC URL: ${config.rpcUrl}
⛓️  Chain ID: ${config.chainId}

Available endpoints:
  - GET  /api/health
  - POST /api/quote
  - POST /api/swap
  - GET  /api/token/:address

Ready to aggregate! 🦄
  `);
});

export default app;
