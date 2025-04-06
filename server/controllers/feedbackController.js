import Feedback from '../models/Feedback.js';

/**
 * Submit user feedback
 * @route POST /api/feedback
 * @access Public - No authentication required to allow anonymous feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const { 
      gameplay, 
      bugs, 
      visual, 
      performance, 
      suggestions, 
      email, 
      name, 
      deviceInfo 
    } = req.body;

    // Basic validation
    if (!gameplay) {
      return res.status(400).json({ message: 'Gameplay feedback is required' });
    }

    // Create the feedback entry
    const feedbackData = {
      gameplay,
      bugs,
      visual,
      performance,
      suggestions,
      email,
      name,
      deviceInfo
    };

    // If user is authenticated, associate feedback with their account
    if (req.user) {
      feedbackData.user = req.user.id;
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    // Log feedback submission for monitoring
    console.log(`Feedback received${req.user ? ` from user ${req.user.id}` : ' (anonymous)'}`);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing feedback submission'
    });
  }
};

/**
 * Get all feedback (admin only)
 * @route GET /api/feedback
 * @access Private/Admin
 */
export const getAllFeedback = async (req, res) => {
  try {
    // Only accessible to admin users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to access feedback data' });
    }

    const feedback = await Feedback.find()
      .sort({ createdAt: -1 }) // Newest first
      .populate('user', 'username email'); // Get user info if available
    
    return res.status(200).json(feedback);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return res.status(500).json({ message: 'Error retrieving feedback data' });
  }
}; 