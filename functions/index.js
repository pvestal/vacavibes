const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize Firebase Admin
admin.initializeApp();


/**
 * Sends a confirmation email to the linked user.
 * @param {string} linkedUserEmail - The email address of the linked user.
 * @param {string} userEmail - The email address of the user.
 * @param {string} displayName - The display name of the user.
 */
exports.sendConfirmationEmail = functions.https.onCall(async (data, context) => {
  const { linkedUserEmail, userEmail, displayName } = data;
  const msg = {
    to: linkedUserEmail,
    from: 'patrick.vestal@gmail.com', // Use the email address or domain you verified with SendGrid
    subject: 'Confirmation Email',
    templateId: 'd-f3e84313c024455797d1e3b4d951c950', // Dynamic Template ID
    dynamic_template_data: {
      linkedUserEmail: linkedUserEmail,
      userEmail: userEmail,
      displayName: displayName
    },
  };

  try {
    await sgMail.send(msg);
    console.log('Confirmation email sent');
    return { success: true };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Sends a rating email notification.
 * @param {string} email - The email address of the recipient.
 * @param {object} submission - The submission details.
 */
exports.sendRatingEmail = functions.https.onCall(async (data, context) => {
  const { email, submission } = data;
  const msg = {
    to: email,
    from: 'patrick.vestal@gmail.com', // Use the email address or domain you verified with SendGrid
    subject: 'New Rating Submission',
    templateId: 'd-e02bc95ca4bd430bbe25225170a0e96b', // Dynamic Template ID
    dynamic_template_data: {
      user: submission.user,
      locationName: submission.locationName,
      countryPreference: submission.countryPreference,
      travelingWithKids: submission.travelingWithKids ? 'Yes' : 'No',
      activityPreference: submission.activityPreference,
      interestFocus: submission.interestFocus,
      budgetLevel: submission.budgetLevel,
      travelStyle: submission.travelStyle,
      tripDuration: submission.tripDuration,
      seasonPreference: submission.seasonPreference,
      specialConsiderations: submission.specialConsiderations,
      submitterRating: submission.submitterRating,
      raterRating: submission.raterRating,
    },
  };

  try {
    await sgMail.send(msg);
    console.log('Rating email sent');
    return { success: true };
  } catch (error) {
    console.error('Error sending rating email:', error);
    return { success: false, error: error.message };
  }
});
