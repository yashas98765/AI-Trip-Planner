const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const versionController = require('../controllers/versionController');

// All versioning routes require authentication except shared trips
router.get('/:id/versions', protect, versionController.getVersionHistory);
router.post('/:id/versions', protect, versionController.saveVersion);
router.post('/:id/versions/:versionNumber/restore', protect, versionController.restoreVersion);
router.get('/:id/versions/compare', protect, versionController.compareVersions);

// Public shared trip endpoint (no auth required)
router.get('/shared/:id', versionController.getSharedTrip);

module.exports = router;
