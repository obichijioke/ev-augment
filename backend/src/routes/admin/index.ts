import express from "express";
import dashboard from "./dashboard";
import users from "./users";
import content from "./content";
import forum from "./forum";
import reports from "./reports";
import analytics from "./analytics";
import settings from "./settings";
import logs from "./logs";

const router = express.Router();

router.use(dashboard);
router.use(users);
router.use(content);
router.use(forum);
router.use(reports);
router.use(analytics);
router.use(settings);
router.use(logs);

export default router;

