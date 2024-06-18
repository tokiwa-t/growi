import React from 'react';

import { IExternalAuthProviderType } from '@growi/core';
import type {
  NextPage, GetServerSideProps, GetServerSidePropsContext,
} from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { NoLoginLayout } from '~/components/Layout/NoLoginLayout';
import { LoginForm } from '~/components/LoginForm';
import type { CrowiRequest } from '~/interfaces/crowi-request';
import type { IExternalAccountLoginError } from '~/interfaces/errors/external-account-login-error';
import { isExternalAccountLoginError } from '~/interfaces/errors/external-account-login-error';
import type { RegistrationMode } from '~/interfaces/registration-mode';
import type { CommonProps } from '~/pages/utils/commons';
import { getServerSideCommonProps, generateCustomTitle, getNextI18NextConfig } from '~/pages/utils/commons';
import {
  useCsrfToken,
  useCurrentPathname,
} from '~/stores/context';

import styles from './index.module.scss';


type Props = CommonProps & {
  registrationMode: RegistrationMode,
  pageWithMetaStr: string,
  isMailerSetup: boolean,
  enabledExternalAuthType: IExternalAuthProviderType[],
  registrationWhitelist: string[],
  isLocalStrategySetup: boolean,
  isLdapStrategySetup: boolean,
  isLdapSetupFailed: boolean,
  isPasswordResetEnabled: boolean,
  isEmailAuthenticationEnabled: boolean,
  externalAccountLoginError?: IExternalAccountLoginError,
  minPasswordLength: number,
};

const LoginPage: NextPage<Props> = (props: Props) => {
  const { t } = useTranslation();

  // commons
  useCsrfToken(props.csrfToken);

  // page
  useCurrentPathname(props.currentPathname);

  const title = generateCustomTitle(props, t('login.title'));
  const classNames: string[] = ['login-page', styles['login-page']];

  return (
    <NoLoginLayout className={classNames.join(' ')}>
      <Head>
        <title>{title}</title>
      </Head>
      <LoginForm
        enabledExternalAuthType={props.enabledExternalAuthType}
        isLocalStrategySetup={props.isLocalStrategySetup}
        isLdapStrategySetup={props.isLdapStrategySetup}
        isLdapSetupFailed={props.isLdapSetupFailed}
        isEmailAuthenticationEnabled={props.isEmailAuthenticationEnabled}
        registrationWhitelist={props.registrationWhitelist}
        isPasswordResetEnabled={props.isPasswordResetEnabled}
        isMailerSetup={props.isMailerSetup}
        registrationMode={props.registrationMode}
        externalAccountLoginError={props.externalAccountLoginError}
        minPasswordLength={props.minPasswordLength}
      />
    </NoLoginLayout>
  );
};

/**
 * for Server Side Translations
 * @param context
 * @param props
 * @param namespacesRequired
 */
async function injectNextI18NextConfigurations(context: GetServerSidePropsContext, props: Props, namespacesRequired?: string[] | undefined): Promise<void> {
  const nextI18NextConfig = await getNextI18NextConfig(serverSideTranslations, context, namespacesRequired);
  props._nextI18Next = nextI18NextConfig._nextI18Next;
}

function injectEnabledStrategies(context: GetServerSidePropsContext, props: Props): void {
  const req: CrowiRequest = context.req as CrowiRequest;
  const { crowi } = req;
  const {
    configManager,
  } = crowi;

  props.enabledExternalAuthType = [
    configManager.getConfig('crowi', 'security:passport-google:isEnabled') === true ? IExternalAuthProviderType.google : undefined,
    configManager.getConfig('crowi', 'security:passport-github:isEnabled') === true ? IExternalAuthProviderType.github : undefined,
    // configManager.getConfig('crowi', 'security:passport-facebook:isEnabled') ?? IExternalAuthProviderType.facebook : undefined,
    configManager.getConfig('crowi', 'security:passport-saml:isEnabled') === true ? IExternalAuthProviderType.saml : undefined,
    configManager.getConfig('crowi', 'security:passport-oidc:isEnabled') === true ? IExternalAuthProviderType.oidc : undefined,

  ]
    .filter((authType): authType is Exclude<typeof authType, undefined> => authType != null);
}

async function injectServerConfigurations(context: GetServerSidePropsContext, props: Props): Promise<void> {
  const req: CrowiRequest = context.req as CrowiRequest;
  const { crowi } = req;
  const {
    mailService,
    configManager,
    passportService,
  } = crowi;

  props.isPasswordResetEnabled = crowi.configManager.getConfig('crowi', 'security:passport-local:isPasswordResetEnabled');
  props.isMailerSetup = mailService.isMailerSetup;
  props.isLocalStrategySetup = passportService.isLocalStrategySetup;
  props.isLdapStrategySetup = passportService.isLdapStrategySetup;
  props.isLdapSetupFailed = configManager.getConfig('crowi', 'security:passport-ldap:isEnabled') && !props.isLdapStrategySetup;
  props.registrationWhitelist = configManager.getConfig('crowi', 'security:registrationWhitelist');
  props.isEmailAuthenticationEnabled = configManager.getConfig('crowi', 'security:passport-local:isEmailAuthenticationEnabled');
  props.registrationMode = configManager.getConfig('crowi', 'security:registrationMode');
  props.minPasswordLength = configManager.getConfig('crowi', 'app:minPasswordLength');
}

export const getServerSideProps: GetServerSideProps = async(context: GetServerSidePropsContext) => {
  const result = await getServerSideCommonProps(context);

  // check for presence
  // see: https://github.com/vercel/next.js/issues/19271#issuecomment-730006862
  if (!('props' in result)) {
    throw new Error('invalid getSSP result');
  }

  const props: Props = result.props as Props;

  const externalAccountLoginError = (context.req as CrowiRequest).session.externalAccountLoginError;
  if (externalAccountLoginError != null) {
    delete (context.req as CrowiRequest).session.externalAccountLoginError;
    const parsedError = JSON.parse(externalAccountLoginError);
    if (isExternalAccountLoginError(parsedError)) {
      props.externalAccountLoginError = { ...parsedError as IExternalAccountLoginError };
    }
  }

  injectServerConfigurations(context, props);
  injectEnabledStrategies(context, props);
  await injectNextI18NextConfigurations(context, props, ['translation']);

  return {
    props,
  };
};

export default LoginPage;
