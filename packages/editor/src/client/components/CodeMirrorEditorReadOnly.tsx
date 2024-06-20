import { useEffect } from 'react';

import { type Extension, EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

import { GlobalCodeMirrorEditorKey } from '../../consts';
import { setDataLine } from '../services-internal';
import { useCodeMirrorEditorIsolated } from '../stores';

import { CodeMirrorEditor } from '.';

const additionalExtensions: Extension[] = [
  [
    setDataLine,
    EditorState.readOnly.of(true),
  ],
];

type Props = {
  markdown?: string,
  onScroll?: () => void,
}

export const CodeMirrorEditorReadOnly = ({ markdown, onScroll }: Props): JSX.Element => {
  const { data: codeMirrorEditor } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.READONLY);

  codeMirrorEditor?.initDoc(markdown);

  useEffect(() => {
    return codeMirrorEditor?.appendExtensions?.(additionalExtensions);
  }, [codeMirrorEditor]);


  // prevent Ctrl+V and paste
  useEffect(() => {
    const extension = keymap.of([
      {
        key: 'Mod-v',
        preventDefault: true,
        run: () => {
          return true;
        },
      },
    ]);
    const cleanupFunction = codeMirrorEditor?.appendExtensions?.(extension);

    return cleanupFunction;
  }, [codeMirrorEditor]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      return;
    };
    const extension = EditorView.domEventHandlers({
      paste: handlePaste,
    });

    const cleanupFunction = codeMirrorEditor?.appendExtensions?.(Prec.high(extension));

    return cleanupFunction;
  }, [codeMirrorEditor]);


  return (
    <CodeMirrorEditor
      hideToolbar
      editorKey={GlobalCodeMirrorEditorKey.READONLY}
      onScroll={onScroll}
    />
  );
};
