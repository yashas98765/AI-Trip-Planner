const Trip = require('../models/Trip');

class CollaborationController {
  constructor(io) {
    this.io = io;
    this.activeCollaborators = new Map(); // tripId -> Set of userIds
    
    // Initialize Socket.IO event handlers
    this.initializeSocketHandlers();
  }

  /**
   * Initialize Socket.IO event handlers
   */
  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join trip room
      socket.on('join-trip', async ({ tripId, userId, userName }) => {
        try {
          socket.join(tripId);
          
          // Add to active collaborators
          if (!this.activeCollaborators.has(tripId)) {
            this.activeCollaborators.set(tripId, new Set());
          }
          this.activeCollaborators.get(tripId).add(userId);
          
          // Store user info in socket
          socket.userId = userId;
          socket.userName = userName;
          socket.tripId = tripId;
          
          // Notify others in the room
          socket.to(tripId).emit('collaborator-joined', {
            userId,
            userName,
            timestamp: new Date()
          });
          
          // Send current collaborators list
          const collaborators = Array.from(this.activeCollaborators.get(tripId));
          socket.emit('current-collaborators', collaborators);
          
          console.log(`User ${userName} (${userId}) joined trip ${tripId}`);
        } catch (error) {
          console.error('Error joining trip:', error);
          socket.emit('error', { message: 'Failed to join trip' });
        }
      });

      // Leave trip room
      socket.on('leave-trip', ({ tripId, userId, userName }) => {
        this.handleLeaveTrip(socket, tripId, userId, userName);
      });

      // Broadcast trip updates
      socket.on('trip-update', async ({ tripId, update, userId }) => {
        try {
          socket.to(tripId).emit('trip-updated', {
            update,
            userId,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error broadcasting update:', error);
        }
      });

      // Cursor position updates
      socket.on('cursor-move', ({ tripId, position, userId, userName }) => {
        socket.to(tripId).emit('cursor-moved', {
          userId,
          userName,
          position,
          timestamp: new Date()
        });
      });

      // Add comment to trip day
      socket.on('add-comment', async ({ tripId, dayIndex, comment, userId, userName }) => {
        try {
          socket.to(tripId).emit('comment-added', {
            dayIndex,
            comment,
            userId,
            userName,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error adding comment:', error);
        }
      });

      // Vote on activity
      socket.on('vote-activity', ({ tripId, activityId, vote, userId }) => {
        socket.to(tripId).emit('activity-voted', {
          activityId,
          vote,
          userId,
          timestamp: new Date()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.tripId && socket.userId) {
          this.handleLeaveTrip(socket, socket.tripId, socket.userId, socket.userName);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  /**
   * Handle user leaving a trip
   */
  handleLeaveTrip(socket, tripId, userId, userName) {
    socket.leave(tripId);
    
    // Remove from active collaborators
    if (this.activeCollaborators.has(tripId)) {
      this.activeCollaborators.get(tripId).delete(userId);
      
      // Remove trip entry if no collaborators left
      if (this.activeCollaborators.get(tripId).size === 0) {
        this.activeCollaborators.delete(tripId);
      }
    }
    
    // Notify others
    socket.to(tripId).emit('collaborator-left', {
      userId,
      userName,
      timestamp: new Date()
    });
    
    console.log(`User ${userName} (${userId}) left trip ${tripId}`);
  }

  /**
   * Invite collaborator to trip
   * @route POST /api/trips/:id/collaborators/invite
   */
  async inviteCollaborator(req, res) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ 
          message: 'Email and role are required' 
        });
      }
      
      if (!['owner', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({ 
          message: 'Invalid role. Must be owner, editor, or viewer' 
        });
      }
      
      const trip = await Trip.findById(id);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      // Check if user is owner
      if (trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: 'Only trip owner can invite collaborators' 
        });
      }
      
      // TODO: Add collaborators field to Trip model and save invitation
      // For now, we'll just return success
      
      res.status(200).json({
        success: true,
        message: `Invitation sent to ${email}`,
        data: { email, role }
      });
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to invite collaborator',
        error: error.message 
      });
    }
  }

  /**
   * Remove collaborator from trip
   * @route DELETE /api/trips/:id/collaborators/:userId
   */
  async removeCollaborator(req, res) {
    try {
      const { id, userId } = req.params;
      
      const trip = await Trip.findById(id);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      // Check if user is owner
      if (trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: 'Only trip owner can remove collaborators' 
        });
      }
      
      // TODO: Remove from collaborators field in Trip model
      
      // Notify via Socket.IO
      this.io.to(id).emit('collaborator-removed', {
        userId,
        timestamp: new Date()
      });
      
      res.status(200).json({
        success: true,
        message: 'Collaborator removed successfully'
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to remove collaborator',
        error: error.message 
      });
    }
  }

  /**
   * Update collaborator role
   * @route PATCH /api/trips/:id/collaborators/:userId
   */
  async updateCollaboratorRole(req, res) {
    try {
      const { id, userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['owner', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({ 
          message: 'Valid role is required (owner, editor, or viewer)' 
        });
      }
      
      const trip = await Trip.findById(id);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      // Check if user is owner
      if (trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: 'Only trip owner can update collaborator roles' 
        });
      }
      
      // TODO: Update role in collaborators field in Trip model
      
      // Notify via Socket.IO
      this.io.to(id).emit('collaborator-role-updated', {
        userId,
        role,
        timestamp: new Date()
      });
      
      res.status(200).json({
        success: true,
        message: 'Collaborator role updated successfully',
        data: { userId, role }
      });
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update collaborator role',
        error: error.message 
      });
    }
  }

  /**
   * Get active collaborators for a trip
   * @route GET /api/trips/:id/collaborators
   */
  async getCollaborators(req, res) {
    try {
      const { id } = req.params;
      
      const trip = await Trip.findById(id);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      // Check if user has access
      if (trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get active collaborators
      const activeUsers = this.activeCollaborators.get(id) 
        ? Array.from(this.activeCollaborators.get(id))
        : [];
      
      res.status(200).json({
        success: true,
        data: {
          active: activeUsers,
          // TODO: Add full collaborator list from Trip model
        }
      });
    } catch (error) {
      console.error('Error getting collaborators:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get collaborators',
        error: error.message 
      });
    }
  }
}

module.exports = CollaborationController;
