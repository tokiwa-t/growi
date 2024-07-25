
import { PageHeader } from '~/client/components/PageHeader';
import { useEditingUsers } from '~/stores/use-editing-users';

import { EditingUserList } from './EditingUserList';

import styles from './EditorNavbar.module.scss';

const moduleClass = styles['editor-navbar'] ?? '';

export const EditorNavbar = (): JSX.Element => {
  const { data: editingUsers } = useEditingUsers();

  const isEnableYjs = false;

  return (
    <div className={`${moduleClass} d-flex flex-column flex-sm-row justify-content-between ps-3 ps-md-5 ps-xl-4 pe-4 py-1 align-items-sm-end`}>
      <div className="order-2 order-sm-1">
        <PageHeader />
      </div>

      <div className="order-1 order-sm-2">
        {isEnableYjs
          ? (
            <EditingUserList userList={editingUsers?.userList ?? []} />
          )
          : (
            <div className="text-warning bg-warning-subtle rounded-1 px-1">
              <div className="d-flex align-items-center justify-content-center">
                <span className="material-symbols-outlined fs-6 me-1">error</span>SINGLE
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};
