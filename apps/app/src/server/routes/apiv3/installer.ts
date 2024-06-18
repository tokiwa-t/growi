import { ErrorV3 } from '@growi/core/dist/models';
import type { Request, Router } from 'express';
import express from 'express';

import { SupportedAction } from '~/interfaces/activity';
import { configManager } from '~/server/service/config-manager';
import loggerFactory from '~/utils/logger';

import type Crowi from '../../crowi';
import { generateAddActivityMiddleware } from '../../middlewares/add-activity';
import { registerRules, registerValidation } from '../../middlewares/register-form-validator';
import { InstallerService, FailedToCreateAdminUserError } from '../../service/installer';

import type { ApiV3Response } from './interfaces/apiv3-response';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = loggerFactory('growi:routes:apiv3:installer');


type FormRequest = Request & { form: any, logIn: any };

module.exports = (crowi: Crowi): Router => {
  const addActivity = generateAddActivityMiddleware(crowi);

  const activityEvent = crowi.event('activity');

  const router = express.Router();

  const minPasswordLength = configManager.getConfig('crowi', 'app:minPasswordLength');

  // eslint-disable-next-line max-len
  router.post('/', registerRules(minPasswordLength), registerValidation, addActivity, async(req: FormRequest, res: ApiV3Response) => {
    const appService = crowi.appService;
    if (appService == null) {
      return res.apiv3Err(new ErrorV3('GROWI cannot be installed due to an internal error', 'app_service_not_setup'), 500);
    }

    if (!req.form.isValid) {
      const errors = req.form.errors;
      return res.apiv3Err(errors, 400);
    }

    const registerForm = req.body.registerForm || {};

    const name = registerForm.name;
    const username = registerForm.username;
    const email = registerForm.email;
    const password = registerForm.password;
    const language = registerForm['app:globalLang'] || 'en_US';

    const installerService = new InstallerService(crowi);

    let adminUser;
    try {
      adminUser = await installerService.install({
        name,
        username,
        email,
        password,
      }, language);
    }
    catch (err) {
      if (err instanceof FailedToCreateAdminUserError) {
        return res.apiv3Err(new ErrorV3(err.message, 'failed_to_create_admin_user'));
      }
      return res.apiv3Err(new ErrorV3(err, 'failed_to_install'));
    }

    await appService.setupAfterInstall();

    const parameters = { action: SupportedAction.ACTION_USER_REGISTRATION_SUCCESS };
    activityEvent.emit('update', res.locals.activity._id, parameters);

    // login with passport
    req.logIn(adminUser, (err) => {
      if (err != null) {
        return res.apiv3Err(new ErrorV3(err, 'failed_to_login_after_install'));
      }

      return res.apiv3({ message: 'Installation completed (Logged in as an admin user)' });
    });
  });

  return router;
};
