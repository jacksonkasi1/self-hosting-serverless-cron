import { Router } from "express";

const router = Router();

router.get("/test", (req, res) => {
  try {
    res.status(200).json({
      message: "Success",
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
});

export default router;
