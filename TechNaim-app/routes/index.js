const express = require('express');
const authRoutes = require('./authRoutes');
// const companyRoutes = require('./companyRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
// router.use('/company', companyRoutes);

module.exports = router;
