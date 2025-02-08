import * as functions from 'firebase-functions';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = '6LdwJ9EqAAAAAHMCsQtofbIuJG7UT2rwixHkp-S3';

export const verifyRecaptcha = functions.firestore
  .document('trainingRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const token = data.captchaToken;

    try {
      // Verify the token
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
      );

      if (response.data.success) {
        // Token is valid, update document with verification status
        await snap.ref.update({
          recaptchaVerified: true,
          verifiedAt: new Date()
        });
      } else {
        // Token is invalid, mark as spam and log the error
        await snap.ref.update({
          recaptchaVerified: false,
          status: 'spam',
          verificationError: response.data['error-codes']
        });
        
        // Optionally delete spam requests
        // await snap.ref.delete();
      }
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      await snap.ref.update({
        recaptchaVerified: false,
        status: 'error',
        verificationError: error.message
      });
    }
  }); 