const automationRouter = require('express').Router();
const { automationController } = require('../controller/automation.controller');
const cron = require('node-cron');

cron.schedule('*/10 * * * *', automationController);
automationRouter.get("/", automationController);
automationRouter.get("/:id", automationController);

module.exports = automationRouter;