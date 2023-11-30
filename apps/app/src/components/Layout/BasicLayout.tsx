import React, { ReactNode } from 'react';

import dynamic from 'next/dynamic';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Sidebar } from '../Sidebar';

import { RawLayout } from './RawLayout';

const AlertSiteUrlUndefined = dynamic(() => import('../AlertSiteUrlUndefined').then(mod => mod.AlertSiteUrlUndefined), { ssr: false });
const GrowiNavbarBottom = dynamic(() => import('../Navbar/GrowiNavbarBottom').then(mod => mod.GrowiNavbarBottom), { ssr: false });
const ShortcutsModal = dynamic(() => import('../ShortcutsModal'), { ssr: false });
const SystemVersion = dynamic(() => import('../SystemVersion'), { ssr: false });
const PagePresentationModal = dynamic(() => import('../PagePresentationModal'), { ssr: false });

type Props = {
  children?: ReactNode
  className?: string
}

export const BasicLayout = ({ children, className }: Props): JSX.Element => {
  return (
    <RawLayout className={`${className ?? ''}`}>
      <DndProvider backend={HTML5Backend}>

        <div className="page-wrapper flex-row">
          <div className="z-2">
            <Sidebar />
          </div>

          <div className="d-flex flex-grow-1 flex-column z-1">{/* neccessary for nested {children} make expanded */}
            <AlertSiteUrlUndefined />
            {children}
          </div>
        </div>

        <GrowiNavbarBottom />
      </DndProvider>

      <ShortcutsModal />
      <PagePresentationModal />

      <SystemVersion showShortcutsButton />
    </RawLayout>
  );
};


// Page modals
const PageCreateModal = dynamic(() => import('../PageCreateModal'), { ssr: false });
const PageDuplicateModal = dynamic(() => import('../PageDuplicateModal'), { ssr: false });
const PageDeleteModal = dynamic(() => import('../PageDeleteModal'), { ssr: false });
const PageRenameModal = dynamic(() => import('../PageRenameModal'), { ssr: false });
const PutbackPageModal = dynamic(() => import('../PutbackPageModal'), { ssr: false });
const PageAccessoriesModal = dynamic(() => import('../PageAccessoriesModal').then(mod => mod.PageAccessoriesModal), { ssr: false });
const DeleteAttachmentModal = dynamic(() => import('../PageAttachment/DeleteAttachmentModal').then(mod => mod.DeleteAttachmentModal), { ssr: false });
const DeleteBookmarkFolderModal = dynamic(() => import('../DeleteBookmarkFolderModal').then(mod => mod.DeleteBookmarkFolderModal), { ssr: false });
const HotkeysManager = dynamic(() => import('../Hotkeys/HotkeysManager'), { ssr: false });

export const BasicPageOperatableLayout = ({ children, className }: Props): JSX.Element => {
  return (
    <>
      <BasicLayout className={`${className ?? ''}`}>
        {children}
      </BasicLayout>

      <PageCreateModal />
      <PageDuplicateModal />
      <PageDeleteModal />
      <PageRenameModal />
      <PageAccessoriesModal />
      <DeleteAttachmentModal />
      <DeleteBookmarkFolderModal />
      <PutbackPageModal />

      <HotkeysManager />
    </>
  );
};
