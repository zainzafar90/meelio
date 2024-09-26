import express, { Router } from 'express';
import { accountController } from '../../modules/account/account.controller';
import { validate } from '../../modules/validate';
import { accountValidation } from '../../modules/account/account.validation';
import { auth } from '../../modules/auth/auth.middleware';

const router: Router = express.Router();

router.post('/register', validate(accountValidation.register), accountController.register);
router.post('/login', validate(accountValidation.login), accountController.login);
router.post('/forgot-password', validate(accountValidation.forgotPassword), accountController.forgotPassword);
router.post('/reset-password', validate(accountValidation.resetPassword), accountController.resetPassword);
router.post('/send-verification-email', auth(), accountController.sendVerificationEmail);
router.post('/verify-email', validate(accountValidation.verifyEmail), accountController.verifyEmail);
router.post('/send-magic-link', validate(accountValidation.magicLinkEmail), accountController.sendMagicLinkEmail);
router.post('/verify-magic-link', validate(accountValidation.verifyMagicLink), accountController.verifyMagicLinkEmail);

router.get('/google', accountController.googleAuth);
router.get('/callback/google', accountController.googleAuthCallback);
router.get('/google/success', accountController.googleAuthCallbackSuccess);
router.get('/google/failure', accountController.googleAuthCallbackFailure);

router.get('/', auth(), accountController.getAccount);
router.put('/', auth(), validate(accountValidation.updateAccountBody), accountController.updateAccount);
router.post('/logout', auth(), accountController.logout);

export default router;

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Account management and retrieval
 */

/**
 * @swagger
 * /account:
 *   get:
 *     summary: Get a user's account
 *     description: Logged in users can fetch only their own account information.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/User'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
