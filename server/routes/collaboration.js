const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// This file exports a function that takes the collaboration controller
module.exports = (collaborationController) => {
  // Invite collaborator
  router.post('/:id/collaborators/invite', 
    protect, 
    collaborationController.inviteCollaborator.bind(collaborationController)
  );

  // Get collaborators
  router.get('/:id/collaborators', 
    protect, 
    collaborationController.getCollaborators.bind(collaborationController)
  );

  // Remove collaborator
  router.delete('/:id/collaborators/:userId', 
    protect, 
    collaborationController.removeCollaborator.bind(collaborationController)
  );

  // Update collaborator role
  router.patch('/:id/collaborators/:userId', 
    protect, 
    collaborationController.updateCollaboratorRole.bind(collaborationController)
  );

  return router;
};
