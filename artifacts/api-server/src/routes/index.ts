import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import ordersRouter from "./orders";
import walletRouter from "./wallet";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/orders", ordersRouter);
router.use("/wallet", walletRouter);
router.use("/profile", profileRouter);

export default router;
