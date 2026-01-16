import { Router, Request, Response } from "express";
import { AggregatorService } from "../services/AggregatorService";
import { QuoteRequest, SwapRequest } from "../types";

const router = Router();
const aggregatorService = new AggregatorService();

router.get("/health", async (req: Request, res: Response) => {
  try {
    const isHealthy = await aggregatorService.checkHealth();

    if (isHealthy) {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "ZefyrSwap DEX Aggregator API",
      });
    } else {
      res.status(503).json({
        status: "error",
        message: "RPC provider not responding",
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Health check failed",
    });
  }
});

router.post("/quote", async (req: Request, res: Response) => {
  try {
    const { tokenIn, tokenOut, amountIn, slippage }: QuoteRequest = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        error: "Missing required fields: tokenIn, tokenOut, amountIn",
      });
    }

    const quote = await aggregatorService.getQuote(
      tokenIn,
      tokenOut,
      amountIn,
      slippage
    );

    res.json(quote);
  } catch (error: any) {
    console.error("Quote error:", error);
    res.status(400).json({
      error: error.message || "Failed to get quote",
    });
  }
});

router.post("/swap", async (req: Request, res: Response) => {
  try {
    const swapRequest: SwapRequest = req.body;

    if (
      !swapRequest.tokenIn ||
      !swapRequest.tokenOut ||
      !swapRequest.amountIn ||
      !swapRequest.userAddress
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: tokenIn, tokenOut, amountIn, userAddress",
      });
    }

    const swapData = await aggregatorService.prepareSwap(swapRequest);

    res.json(swapData);
  } catch (error: any) {
    console.error("Swap error:", error);
    res.status(400).json({
      error: error.message || "Failed to prepare swap",
    });
  }
});

router.get("/token/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const tokenInfo = await aggregatorService.getTokenInfo(address);
    res.json(tokenInfo);
  } catch (error: any) {
    console.error("Token info error:", error);
    res.status(400).json({
      error: error.message || "Failed to get token information",
    });
  }
});

export default router;
