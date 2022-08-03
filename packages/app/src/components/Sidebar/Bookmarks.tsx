
import React, { useCallback, useState } from 'react';

import nodePath from 'path';

import { DevidedPagePath, pathUtils } from '@growi/core';
import { useTranslation } from 'react-i18next';
import { UncontrolledTooltip, DropdownToggle } from 'reactstrap';

import { unbookmark } from '~/client/services/page-operation';
import { toastError, toastSuccess } from '~/client/util/apiNotification';
import { apiv3Put } from '~/client/util/apiv3-client';
import { IPageHasId, IPageInfoAll, IPageToDeleteWithMeta } from '~/interfaces/page';
import { OnDeletedFunction } from '~/interfaces/ui';
import { useSWRxCurrentUserBookmarks } from '~/stores/bookmark';
import { useIsGuestUser } from '~/stores/context';
import { usePageDeleteModal } from '~/stores/modal';


import ClosableTextInput, { AlertInfo, AlertType } from '../Common/ClosableTextInput';
import { MenuItemType, PageItemControl } from '../Common/Dropdown/PageItemControl';


type Props = {
  bookmarkedPage: IPageHasId,
  onPageOperationSuccess: () => void
}

const BookmarkItem = (props: Props) => {
  const { bookmarkedPage, onPageOperationSuccess } = props;
  const { t } = useTranslation();
  const [isRenameInputShown, setRenameInputShown] = useState(false);
  const dPagePath = new DevidedPagePath(bookmarkedPage.path, false, true);
  const { latter: pageTitle, former, isRoot } = dPagePath;
  const formerPagePath = isRoot ? pageTitle : pathUtils.addTrailingSlash(former);
  const bookmarkItemId = `bookmark-item-${bookmarkedPage._id}`;
  const { open: openDeleteModal } = usePageDeleteModal();

  const bookmarkMenuItemClickHandler = useCallback(async() => {
    await unbookmark(bookmarkedPage._id);
    onPageOperationSuccess();
  }, [onPageOperationSuccess, bookmarkedPage]);

  const renameMenuItemClickHandler = useCallback(() => {
    setRenameInputShown(true);
  }, []);

  const inputValidator = (title: string | null): AlertInfo | null => {
    if (title == null || title === '' || title.trim() === '') {
      return {
        type: AlertType.WARNING,
        message: t('form_validation.title_required'),
      };
    }

    return null;
  };

  const pressEnterForRenameHandler = useCallback(async(inputText: string) => {
    const parentPath = pathUtils.addTrailingSlash(nodePath.dirname(bookmarkedPage.path ?? ''));
    const newPagePath = nodePath.resolve(parentPath, inputText);
    if (newPagePath === bookmarkedPage.path) {
      setRenameInputShown(false);
      return;
    }

    try {
      setRenameInputShown(false);
      await apiv3Put('/pages/rename', {
        pageId: bookmarkedPage._id,
        revisionId: bookmarkedPage.revision,
        newPagePath,
      });
      onPageOperationSuccess();
      toastSuccess(t('renamed_pages', { path: bookmarkedPage.path }));
    }
    catch (err) {
      setRenameInputShown(true);
      toastError(err);
    }
  }, [bookmarkedPage, onPageOperationSuccess, t]);

  const deleteMenuItemClickHandler = useCallback(async(_pageId: string, pageInfo: IPageInfoAll | undefined): Promise<void> => {
    const onClickDeleteMenuItem = (pageToDelete: IPageToDeleteWithMeta) => {
      const onDeletedHandler: OnDeletedFunction = (pathOrPathsToDelete, _isRecursively, isCompletely) => {
        if (typeof pathOrPathsToDelete !== 'string') {
          return;
        }
        const path = pathOrPathsToDelete;

        if (isCompletely) {
          toastSuccess(t('deleted_pages_completely', { path }));
        }
        else {
          toastSuccess(t('deleted_pages', { path }));
        }
        onPageOperationSuccess();
      };
      openDeleteModal([pageToDelete], { onDeleted: onDeletedHandler });
    };

    if (bookmarkedPage._id == null || bookmarkedPage.path == null) {
      throw Error('_id and path must not be null.');
    }

    const pageToDelete: IPageToDeleteWithMeta = {
      data: {
        _id: bookmarkedPage._id,
        revision: bookmarkedPage.revision as string,
        path: bookmarkedPage.path,
      },
      meta: pageInfo,
    };

    onClickDeleteMenuItem(pageToDelete);
  }, [bookmarkedPage, openDeleteModal, onPageOperationSuccess, t]);

  return (
    <div className="d-flex justify-content-between" key={bookmarkedPage._id}>
      <li className="list-group-item list-group-item-action border-0 py-0 pr-3 d-flex align-items-center" id={bookmarkItemId}>
        { isRenameInputShown ? (
          <ClosableTextInput
            value={nodePath.basename(bookmarkedPage.path ?? '')}
            placeholder={t('Input page name')}
            onClickOutside={() => { setRenameInputShown(false) }}
            onPressEnter={pressEnterForRenameHandler}
            inputValidator={inputValidator}
          />
        ) : (
          <a href={`/${bookmarkedPage._id}`} className="grw-bookmarks-title-anchor flex-grow-1">
            <p className={`text-truncate m-auto ${bookmarkedPage.isEmpty && 'grw-sidebar-text-muted'}`}>{pageTitle}</p>
          </a>
        )}
        <PageItemControl
          pageId={bookmarkedPage._id}
          isEnableActions
          forceHideMenuItems={[MenuItemType.DUPLICATE]}
          onClickBookmarkMenuItem={bookmarkMenuItemClickHandler}
          onClickRenameMenuItem={renameMenuItemClickHandler}
          onClickDeleteMenuItem={deleteMenuItemClickHandler}
        >
          <DropdownToggle color="transparent" className="border-0 rounded btn-page-item-control p-0 grw-visible-on-hover mr-1">
            <i className="icon-options fa fa-rotate-90 p-1"></i>
          </DropdownToggle>
        </PageItemControl>
        <UncontrolledTooltip
          modifiers={{ preventOverflow: { boundariesElement: 'window' } }}
          autohide={false}
          placement="right"
          target={bookmarkItemId}
          fade={false}
        >
          { formerPagePath }
        </UncontrolledTooltip>
      </li>
    </div>
  );
};

const Bookmarks = () : JSX.Element => {
  const { t } = useTranslation();
  const { data: isGuestUser } = useIsGuestUser();
  const { data: currentUserBookmarksData, mutate: mutateCurrentUserBookmarks } = useSWRxCurrentUserBookmarks();

  const renderBookmarkList = () => {
    if (currentUserBookmarksData?.length === 0) {
      return (
        <h4 className="pl-3">
          { t('No bookmarks yet') }
        </h4>
      );
    }
    return (
      <ul className="grw-bookmarks-list list-group p-3">
        <div className="grw-bookmarks-item-container">
          { currentUserBookmarksData?.map((currentUserBookmark) => {
            return (
              <BookmarkItem key={currentUserBookmark._id} bookmarkedPage={currentUserBookmark} onPageOperationSuccess={mutateCurrentUserBookmarks} />
            );
          })}
        </div>
      </ul>
    );
  };

  return (
    <>
      <div className="grw-sidebar-content-header p-3">
        <h3 className="mb-0">{t('Bookmarks')}</h3>
      </div>
      { isGuestUser
        ? (
          <h4 className="pl-3">
            { t('Not available for guest') }
          </h4>
        ) : renderBookmarkList()
      }
    </>
  );
};

export default Bookmarks;
