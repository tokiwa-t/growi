module.exports = {
  Page: require('./page'),
  // TODO GW-2746 bulk export pages
  // PageArchive: require('./page-archive'),
  PageTagRelation: require('./page-tag-relation'),
  User: require('./user'),
  ExternalAccount: require('./external-account'),
  UserGroup: require('./user-group'),
  UserGroupRelation: require('./user-group-relation'),
  Revision: require('./revision'),
  Tag: require('./tag'),
  Bookmark: require('./bookmark'),
  Comment: require('./comment'),
  Attachment: require('./attachment'),
  GlobalNotificationSetting: require('./GlobalNotificationSetting'),
  GlobalNotificationMailSetting: require('./GlobalNotificationSetting/GlobalNotificationMailSetting'),
  GlobalNotificationSlackSetting: require('./GlobalNotificationSetting/GlobalNotificationSlackSetting'),
  ShareLink: require('./share-link'),
  SlackAppIntegration: require('./slack-app-integration'),
  // MOCK DATA DELETE THIS GW-6972 ---------------
  SlackAppIntegrationMock: require('./slack-app-integration-mock'),
  // MOCK DATA DELETE THIS GW-6972 ---------------
};
