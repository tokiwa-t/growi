import type { FormEventHandler } from 'react';
import { memo, useCallback, useState } from 'react';

import { Lang, AllLang } from '@growi/core';
import { LoadingSpinner } from '@growi/ui/dist/components';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

import { i18n as i18nConfig } from '^/config/next-i18next.config';

import { apiv3Post } from '~/client/util/apiv3-client';
import { useTWithOpt } from '~/client/util/t-with-opt';
import { toastError } from '~/client/util/toastr';
import type { IErrorV3 } from '~/interfaces/errors/v3-error';


import styles from './InstallerForm.module.scss';


const moduleClass = styles['installer-form'] ?? '';

type Props = {
  minPasswordLength: number,
}

const InstallerForm = memo((props: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const { minPasswordLength } = props;

  const router = useRouter();

  const tWithOpt = useTWithOpt();

  const isSupportedLang = AllLang.includes(i18n.language as Lang);

  const [isValidUserName, setValidUserName] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(isSupportedLang ? i18n.language : Lang.en_US);

  const [registerErrors, setRegisterErrors] = useState<IErrorV3[]>([]);

  const checkUserName = useCallback(async(event) => {
    const axios = require('axios').create({
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      responseType: 'json',
    });
    const res = await axios.get('/_api/v3/check-username', { params: { username: event.target.value } });
    setValidUserName(res.data.valid);
  }, []);

  const onClickLanguageItem = useCallback((locale) => {
    i18n.changeLanguage(locale);
    setCurrentLocale(locale);
  }, [i18n]);

  const submitHandler: FormEventHandler = useCallback(async(e: any) => {
    e.preventDefault();

    setIsLoading(true);

    const formData = e.target.elements;

    const {
      'registerForm[username]': { value: username },
      'registerForm[name]': { value: name },
      'registerForm[email]': { value: email },
      'registerForm[password]': { value: password },
    } = formData;

    const data = {
      registerForm: {
        username,
        name,
        email,
        password,
        'app:globalLang': currentLocale,
      },
    };

    try {
      setRegisterErrors([]);
      await apiv3Post('/installer', data);
      router.push('/');
    }
    catch (errs) {
      const err = errs[0];
      const code = err.code;
      setIsLoading(false);
      setRegisterErrors(errs);

      if (code === 'failed_to_login_after_install') {
        toastError(t('installer.failed_to_login_after_install'));
        setTimeout(() => { router.push('/login') }, 700); // Wait 700 ms to show toastr
      }

      toastError(t('installer.failed_to_install'));
    }
  }, [currentLocale, router, t]);

  const hasErrorClass = isValidUserName ? '' : ' has-error';
  const unavailableUserId = isValidUserName
    ? ''
    : <span><span className="material-symbols-outlined">block</span>{ t('installer.unavaliable_user_id') }</span>;

  return (
    <div data-testid="installerForm" className={`${moduleClass} nologin-dialog py-3 px-4 rounded-4 rounded-top-0 mx-auto${hasErrorClass}`}>
      <div className="row mt-3">
        <div className="col-md-12">
          <p className="alert alert-success">
            <strong>{ t('installer.create_initial_account') }</strong><br />
            <small>{ t('installer.initial_account_will_be_administrator_automatically') }</small>
          </p>
        </div>
      </div>
      <div className="row mt-2">

        {
          registerErrors != null && registerErrors.length > 0 && (
            <p className="alert alert-danger text-center">
              {registerErrors.map(err => (
                <span>
                  {tWithOpt(err.message, err.args)}<br />
                </span>
              ))}
            </p>
          )
        }

        <form role="form" id="register-form" className="ps-1" onSubmit={submitHandler}>
          <div className="dropdown mb-3">
            <div className="input-group dropdown-with-icon">
              <span className="p-2 text-white opacity-75">
                <span className="material-symbols-outlined">language</span>
              </span>
              <button
                type="button"
                className="btn btn-secondary dropdown-toggle form-control text-end rounded"
                id="dropdownLanguage"
                data-testid="dropdownLanguage"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="true"
              >
                <span className="float-start">
                  {t('meta.display_name')}
                </span>
              </button>
              <input
                type="hidden"
                name="registerForm[app:globalLang]"
              />
              <div className="dropdown-menu" aria-labelledby="dropdownLanguage">
                {
                  i18nConfig.locales.map((locale) => {
                    let fixedT;
                    if (i18n != null) {
                      fixedT = i18n.getFixedT(locale);
                      i18n.loadLanguages(i18nConfig.locales);
                    }

                    return (
                      <button
                        key={locale}
                        data-testid={`dropdownLanguageMenu-${locale}`}
                        className="dropdown-item"
                        type="button"
                        onClick={() => { onClickLanguageItem(locale) }}
                      >
                        {fixedT?.('meta.display_name')}
                      </button>
                    );
                  })
                }
              </div>
            </div>
          </div>

          <div className={`input-group mb-3${hasErrorClass}`}>
            <label className="p-2 text-white opacity-75" aria-label={t('User ID')} htmlFor="tiUsername">
              <span className="material-symbols-outlined" aria-hidden>person</span>
            </label>
            <input
              id="tiUsername"
              type="text"
              className="form-control rounded"
              placeholder={t('User ID')}
              name="registerForm[username]"
              // onBlur={checkUserName} // need not to check username before installation -- 2020.07.24 Yuki Takei
              required
            />
          </div>
          <p className="form-text">{ unavailableUserId }</p>

          <div className="input-group mb-3">
            <label className="p-2 text-white opacity-75" aria-label={t('Name')} htmlFor="tiName">
              <span className="material-symbols-outlined" aria-hidden>sell</span>
            </label>
            <input
              id="tiName"
              type="text"
              className="form-control rounded"
              placeholder={t('Name')}
              name="registerForm[name]"
              required
            />
          </div>

          <div className="input-group mb-3">
            <label className="p-2 text-white opacity-75" aria-label={t('Email')} htmlFor="tiEmail">
              <span className="material-symbols-outlined" aria-hidden>mail</span>
            </label>
            <input
              id="tiEmail"
              type="email"
              className="form-control rounded"
              placeholder={t('Email')}
              name="registerForm[email]"
              required
            />
          </div>

          <div className="input-group mb-3">
            <label className="p-2 text-white opacity-75" aria-label={t('Password')} htmlFor="tiPassword">
              <span className="material-symbols-outlined" aria-hidden>lock</span>
            </label>
            <input
              minLength={minPasswordLength}
              id="tiPassword"
              type="password"
              className="form-control rounded"
              placeholder={t('Password')}
              name="registerForm[password]"
              required
            />
          </div>

          <div className="input-group mt-4 justify-content-center">
            <button
              type="submit"
              className="btn btn-secondary btn-register col-6 d-flex"
              disabled={isLoading}
            >
              <span aria-hidden>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <span className="material-symbols-outlined">person_add</span>
                )}
              </span>
              <label className="flex-grow-1">{ t('Create') }</label>
            </button>
          </div>

          <div>
            <a href="https://growi.org" className="link-growi-org">
              <span className="growi">GROWI</span><span className="org">.org</span>
            </a>
          </div>

        </form>
      </div>
    </div>
  );
});

InstallerForm.displayName = 'InstallerForm';

export default InstallerForm;
