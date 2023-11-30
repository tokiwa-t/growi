const path = require('path');

const { AllLang, Lang } = require('@growi/core');
const { isServer } = require('@growi/core/dist/utils');
const I18nextChainedBackend = require('i18next-chained-backend').default;
const I18NextHttpBackend = require('i18next-http-backend');
const I18NextLocalStorageBackend = require('i18next-localstorage-backend').default;
const I18NextLocizeBackend = require('i18next-locize-backend/cjs');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  defaultLang: Lang.en_US,
  i18n: {
    defaultLocale: Lang.en_US,
    locales: AllLang,
  },
  defaultNS: 'translation',
  localePath: path.resolve('./public/static/locales'),
  serializeConfig: false,
  use: isServer() ? [] : [I18nextChainedBackend],
  debug: isDev,
  backend: {
    // change I18NextHttpBackend to I18NextLocizeBackend;
    // backends: isServer() ? [] : [I18NextLocalStorageBackend, I18NextHttpBackend],
    backends: isServer() ? [] : [I18NextLocizeBackend, I18NextLocalStorageBackend, I18NextHttpBackend],
    backendOptions: [
      // options for i18next-locize-backend
      {
        projectId: '18aa0d2c-329a-4c9c-a39e-ce63212684f2',
        apiKey: 'd73382b5-fa0e-45da-a104-c106e9c1432d',
        version: 'latest',
      },
      // options for i18next-localstorage-backend
      { expirationTime: isDev ? 0 : 24 * 60 * 60 * 1000 }, // 1 day in production
      // options for i18next-http-backend
      { loadPath: '/static/locales/{{lng}}/{{ns}}.json' },
    ],
  },
};
