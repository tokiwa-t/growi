import React, { FC, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Collapse } from 'reactstrap';

import { useSWRxAvailableActions } from '~/stores/activity';
import { useActivityExpirationSeconds } from '~/stores/context';

export const AuditLogSettings: FC = () => {
  const { t } = useTranslation();

  const [isExpandActionList, setIsExpandActionList] = useState(false);

  const { data: activityExpirationSecondsData } = useActivityExpirationSeconds();
  const activityExpirationSeconds = activityExpirationSecondsData != null ? activityExpirationSecondsData : 2592000;

  const { data: availableActionsData } = useSWRxAvailableActions();
  const availableActions = availableActionsData != null ? availableActionsData : [];

  return (
    <>
      <h4 className="mt-4">{t('admin:audit_log_management.activity_expiration_date')}</h4>
      <p className="form-text text-muted">
        {t('admin:audit_log_management.activity_expiration_date_explain')}
      </p>
      <p className="alert alert-warning col-6">
        <i className="icon-exclamation icon-fw">
        </i><b>FIXED</b><br />
        <b
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: t('admin:audit_log_management.fixed_by_env_var',
              { key: 'ACTIVITY_EXPIRATION_SECONDS', value: activityExpirationSeconds }),
          }}
        />
      </p>

      <h4 className="mt-4">{t('admin:audit_log_management.available_action_list')}</h4>
      <p className="form-text text-muted">{t('admin:audit_log_management.available_action_list_explain')}</p>
      <p className="mt-1">
        <button type="button" className="btn btn-link p-0" aria-expanded="false" onClick={() => setIsExpandActionList(!isExpandActionList)}>
          <i className={`fa fa-fw fa-arrow-right ${isExpandActionList ? 'fa-rotate-90' : ''}`}></i>
          { t('admin:audit_log_management.action_list') }
        </button>
      </p>
      <Collapse isOpen={isExpandActionList}>
        <ul className="list-group">
          { availableActions.map(action => (
            <li className="list-group-item">{ action }</li>
          )) }
        </ul>
      </Collapse>
    </>
  );
};
