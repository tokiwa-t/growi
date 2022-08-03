import React, {
  useState, useRef, useImperativeHandle, useCallback, useMemo,
} from 'react';

import Dropzone from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import {
  Modal, ModalHeader, ModalBody,
} from 'reactstrap';

import { toastError } from '~/client/util/apiNotification';
import { useDefaultIndentSize } from '~/stores/context';
import { useEditorSettings } from '~/stores/editor';
import { useIsMobile } from '~/stores/ui';

import { IEditorMethods } from '../../interfaces/editor-methods';

import Cheatsheet from './Cheatsheet';
import CodeMirrorEditor from './CodeMirrorEditor';
import pasteHelper from './PasteHelper';
import TextAreaEditor from './TextAreaEditor';


type EditorPropsType = {
  value?: string,
  isGfmMode?: boolean,
  noCdn?: boolean,
  isUploadable?: boolean,
  isUploadableFile?: boolean,
  onChange?: () => void,
  onUpload?: (file) => void,
  indentSize?: number,
  onScrollCursorIntoView?: (line: number) => void,
  onSave?: () => Promise<void>,
  onPasteFiles?: (event: Event) => void,
  onCtrlEnter?: (event: Event) => void,
}

type DropzoneRef = {
  open: () => void
}

const Editor = React.forwardRef((props: EditorPropsType, ref): JSX.Element => {
  const {
    onUpload, isUploadable, isUploadableFile, indentSize, isGfmMode = true,
  } = props;

  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheatsheetModalShown, setIsCheatsheetModalShown] = useState(false);

  const { t } = useTranslation();
  const { data: editorSettings } = useEditorSettings();
  const { data: defaultIndentSize } = useDefaultIndentSize();
  const { data: isMobile } = useIsMobile();

  const dropzoneRef = useRef<DropzoneRef>(null);
  const cmEditorRef = useRef<CodeMirrorEditor>(null);
  const taEditorRef = useRef<TextAreaEditor>(null);

  const editorSubstance = isMobile ? taEditorRef.current : cmEditorRef.current;

  const methods: Partial<IEditorMethods> = useMemo(() => {
    return {
      forceToFocus: () => {
        if (editorSubstance == null) { return }
        editorSubstance.forceToFocus();
      },
      setValue: (newValue: string) => {
        if (editorSubstance == null) { return }
        editorSubstance.setValue(newValue);
      },
      setGfmMode: (bool: boolean) => {
        if (editorSubstance == null) { return }
        editorSubstance.setGfmMode(bool);
      },
      setCaretLine: (line: number) => {
        if (editorSubstance == null) { return }
        editorSubstance.setCaretLine(line);
      },
      setScrollTopByLine: (line: number) => {
        if (editorSubstance == null) { return }
        editorSubstance.setScrollTopByLine(line);
      },
      insertText: (text: string) => {
        if (editorSubstance == null) { return }
        editorSubstance.insertText(text);
      },
      getNavbarItems: (): JSX.Element[] => {
        if (editorSubstance == null) { return [] }
        // concat common items and items specific to CodeMirrorEditor or TextAreaEditor
        const navbarItems = editorSubstance.getNavbarItems() ?? [];
        return navbarItems;
      },
    };
  }, [editorSubstance]);

  // methods for ref
  useImperativeHandle(ref, () => ({
    forceToFocus: methods.forceToFocus,
    setValue: methods.setValue,
    setGfmMode: methods.setGfmMode,
    setCaretLine: methods.setCaretLine,
    setScrollTopByLine: methods.setScrollTopByLine,
    insertText: methods.insertText,
    /**
   * remove overlay and set isUploading to false
   */
    terminateUploadingState: () => {
      setDropzoneActive(false);
      setIsUploading(false);
    },
  }));

  /**
   * dispatch onUpload event
   */
  const dispatchUpload = useCallback((files) => {
    if (onUpload != null) {
      onUpload(files);
    }
  }, [onUpload]);

  /**
   * get acceptable(uploadable) file type
   */
  const getAcceptableType = useCallback(() => {
    let accept = 'null'; // reject all
    if (isUploadable) {
      if (!isUploadableFile) {
        accept = 'image/*'; // image only
      }
      else {
        accept = ''; // allow all
      }
    }

    return accept;
  }, [isUploadable, isUploadableFile]);

  const pasteFilesHandler = useCallback((event) => {
    const items = event.clipboardData.items || event.clipboardData.files || [];

    toastError(t('toaster.file_upload_failed'));

    // abort if length is not 1
    if (items.length < 1) {
      return;
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const file = items[i].getAsFile();
        // check file type (the same process as Dropzone)
        if (file != null && pasteHelper.isAcceptableType(file, getAcceptableType())) {
          dispatchUpload(file);
          setIsUploading(true);
        }
      }
      catch (e) {
        toastError(t('toaster.file_upload_failed'));
      }
    }
  }, [dispatchUpload, getAcceptableType, t]);

  const dragEnterHandler = useCallback((event) => {
    const dataTransfer = event.dataTransfer;

    // do nothing if contents is not files
    if (!dataTransfer.types.includes('Files')) {
      return;
    }

    setDropzoneActive(true);
  }, []);

  const dropHandler = useCallback((accepted) => {
    // rejected
    if (accepted.length !== 1) { // length should be 0 or 1 because `multiple={false}` is set
      setDropzoneActive(false);
      return;
    }

    const file = accepted[0];
    dispatchUpload(file);
    setIsUploading(true);
  }, [dispatchUpload]);

  const addAttachmentHandler = useCallback(() => {
    if (dropzoneRef.current == null) { return }
    dropzoneRef.current.open();
  }, []);

  const getDropzoneClassName = useCallback((isDragAccept: boolean, isDragReject: boolean) => {
    let className = 'dropzone';
    if (!isUploadable) {
      className += ' dropzone-unuploadable';
    }
    else {
      className += ' dropzone-uploadable';

      if (isUploadableFile) {
        className += ' dropzone-uploadablefile';
      }
    }

    // uploading
    if (isUploading) {
      className += ' dropzone-uploading';
    }

    if (isDragAccept) {
      className += ' dropzone-accepted';
    }

    if (isDragReject) {
      className += ' dropzone-rejected';
    }

    return className;
  }, [isUploadable, isUploading, isUploadableFile]);

  const renderDropzoneOverlay = useCallback(() => {
    return (
      <div className="overlay overlay-dropzone-active">
        {isUploading
          && (
            <span className="overlay-content">
              <div className="speeding-wheel d-inline-block"></div>
              <span className="sr-only">Uploading...</span>
            </span>
          )
        }
        {!isUploading && <span className="overlay-content"></span>}
      </div>
    );
  }, [isUploading]);

  const renderNavbar = useCallback(() => {
    return (
      <div className="m-0 navbar navbar-default navbar-editor" style={{ minHeight: 'unset' }}>
        <ul className="pl-2 nav nav-navbar">
          { methods.getNavbarItems?.().map((item, idx) => {
            // eslint-disable-next-line react/no-array-index-key
            return <li key={`navbarItem-${idx}`}>{item}</li>;
          }) }
        </ul>
      </div>
    );
  }, [methods]);

  const renderCheatsheetModal = useCallback(() => {
    const hideCheatsheetModal = () => {
      setIsCheatsheetModalShown(false);
    };

    return (
      <Modal isOpen={isCheatsheetModalShown} toggle={hideCheatsheetModal} className="modal-gfm-cheatsheet">
        <ModalHeader tag="h4" toggle={hideCheatsheetModal} className="bg-primary text-light">
          <i className="icon-fw icon-question" />Markdown help
        </ModalHeader>
        <ModalBody>
          <Cheatsheet />
        </ModalBody>
      </Modal>
    );
  }, [isCheatsheetModalShown]);

  if (editorSettings == null) {
    return <></>;
  }

  const flexContainer: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      <div style={flexContainer} className="editor-container">
        <Dropzone
          ref={dropzoneRef}
          accept={getAcceptableType()}
          noClick
          noKeyboard
          multiple={false}
          onDragLeave={() => { setDropzoneActive(false) }}
          onDrop={dropHandler}
        >
          {({
            getRootProps,
            getInputProps,
            isDragAccept,
            isDragReject,
          }) => {
            return (
              <div className={getDropzoneClassName(isDragAccept, isDragReject)} {...getRootProps()}>
                { dropzoneActive && renderDropzoneOverlay() }

                { renderNavbar() }

                {/* for PC */}
                { !isMobile && (
                  // eslint-disable-next-line arrow-body-style
                  <CodeMirrorEditor
                    ref={cmEditorRef}
                    indentSize={indentSize ?? defaultIndentSize}
                    onPasteFiles={pasteFilesHandler}
                    onDragEnter={dragEnterHandler}
                    onMarkdownHelpButtonClicked={() => { setIsCheatsheetModalShown(true) }}
                    onAddAttachmentButtonClicked={addAttachmentHandler}
                    editorSettings={editorSettings}
                    isGfmMode={isGfmMode}
                    {...props}
                  />
                )}

                {/* for mobile */}
                { isMobile && (
                  <TextAreaEditor
                    ref={taEditorRef}
                    onPasteFiles={pasteFilesHandler}
                    onDragEnter={dragEnterHandler}
                    {...props}
                  />
                )}

                <input {...getInputProps()} />
              </div>
            );
          }}
        </Dropzone>

        { isUploadable
          && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-block btn-open-dropzone"
              onClick={addAttachmentHandler}
            >
              <i className="icon-paper-clip" aria-hidden="true"></i>&nbsp;
              Attach files
              <span className="d-none d-sm-inline">
              &nbsp;by dragging &amp; dropping,&nbsp;
                <span className="btn-link">selecting them</span>,&nbsp;
                or pasting from the clipboard.
              </span>

            </button>
          )
        }

        { renderCheatsheetModal() }

      </div>
    </>
  );
});


export default Editor;
