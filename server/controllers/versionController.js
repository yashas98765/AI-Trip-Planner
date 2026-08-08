const Trip = require('../models/Trip');

/**
 * Get version history for a trip
 * @route GET /api/trips/:id/versions
 */
exports.getVersionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const trip = await Trip.findById(id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Check if user has access to this trip
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const history = trip.getVersionHistory();
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting version history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get version history',
      error: error.message 
    });
  }
};

/**
 * Save new version of trip
 * @route POST /api/trips/:id/versions
 */
exports.saveVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    
    const trip = await Trip.findById(id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Check if user has access to this trip
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Save new version
    await trip.saveVersion(req.user.id, description);
    
    res.status(201).json({
      success: true,
      message: 'Version saved successfully',
      data: {
        versionNumber: trip.currentVersion,
        totalVersions: trip.versions.length
      }
    });
  } catch (error) {
    console.error('Error saving version:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to save version',
      error: error.message 
    });
  }
};

/**
 * Restore a previous version
 * @route POST /api/trips/:id/versions/:versionNumber/restore
 */
exports.restoreVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    
    const trip = await Trip.findById(id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Check if user has access to this trip
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Restore version
    const restored = await trip.restoreVersion(parseInt(versionNumber));
    
    if (!restored) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    res.status(200).json({
      success: true,
      message: `Version ${versionNumber} restored successfully`,
      data: {
        currentVersion: trip.currentVersion,
        itinerary: trip.itinerary
      }
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to restore version',
      error: error.message 
    });
  }
};

/**
 * Compare two versions
 * @route GET /api/trips/:id/versions/compare
 */
exports.compareVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const { v1, v2 } = req.query;
    
    if (!v1 || !v2) {
      return res.status(400).json({ 
        message: 'Please provide both version numbers (v1 and v2)' 
      });
    }
    
    const trip = await Trip.findById(id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Check if user has access to this trip
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const comparison = trip.compareVersions(parseInt(v1), parseInt(v2));
    
    if (!comparison) {
      return res.status(404).json({ message: 'One or both versions not found' });
    }
    
    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to compare versions',
      error: error.message 
    });
  }
};

/**
 * Get a public shared trip (no authentication required)
 * @route GET /api/trips/shared/:id
 */
exports.getSharedTrip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const trip = await Trip.findById(id)
      .populate('userId', 'name email')
      .select('-versions'); // Exclude version history from public view
    
    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found' 
      });
    }
    
    // Check if trip is public/shareable (you might want to add a isPublic field to Trip model)
    // For now, we'll allow all trips to be shared
    
    res.status(200).json({
      success: true,
      data: {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        duration: trip.duration,
        budget: trip.budget,
        travelStyle: trip.travelStyle,
        itinerary: trip.itinerary,
        createdBy: trip.userId ? trip.userId.name : 'Anonymous'
      }
    });
  } catch (error) {
    console.error('Error getting shared trip:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get shared trip',
      error: error.message 
    });
  }
};
