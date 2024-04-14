import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

import { useCreatePageAndTransit } from '~/client/services/create-page';
import { useGrantedGroupsInheritanceSelectModal } from '~/stores/modal';

export const GrantedGroupsInheritanceSelectModal = (): JSX.Element => {
  const { t } = useTranslation();
  const { data: modalData, close: closeModal } = useGrantedGroupsInheritanceSelectModal();
  const [onlyInheritUserRelatedGrantedGroups, setOnlyInheritUserRelatedGrantedGroups] = useState(false);
  const { createAndTransit } = useCreatePageAndTransit();

  const params = modalData?.params;
  const opts = modalData?.opts;
  const isOpened = modalData?.isOpened ?? false;

  const onCreateBtnClick = () => {
    if (params != null) {
      params.onlyInheritUserRelatedGrantedGroups = onlyInheritUserRelatedGrantedGroups;
      createAndTransit(params, opts);
    }
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpened}
      toggle={() => closeModal()}
    >
      <ModalHeader tag="h4" toggle={() => closeModal()} className="bg-primary text-light">
        閲覧権限のあるグループを選択
      </ModalHeader>
      <ModalBody>
        <div className="p-3">
          <div className="form-check radio-primary mb-3">
            <input
              type="radio"
              id="inheritAllGroupsRadio"
              className="form-check-input"
              form="formImageType"
              checked={!onlyInheritUserRelatedGrantedGroups}
              onChange={() => { setOnlyInheritUserRelatedGrantedGroups(false) }}
            />
            <label className="form-check-label" htmlFor="inheritAllGroupsRadio">
              閲覧権限のあるグループを親ページから全て引き継ぐ
            </label>
          </div>
          <div className="form-check radio-primary mb-4">
            <input
              type="radio"
              id="onlyInheritRelatedGroupsRadio"
              className="form-check-input"
              form="formImageType"
              checked={onlyInheritUserRelatedGrantedGroups}
              onChange={() => { setOnlyInheritUserRelatedGrantedGroups(true) }}
            />
            <label className="form-check-label" htmlFor="onlyInheritRelatedGroupsRadio">
              自分が所属するグループのみを親ページから引き継ぐ
            </label>
          </div>
          <div className="text-center">
            <button className="btn btn-primary" type="button" onClick={onCreateBtnClick}>{t('Create')}</button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};
