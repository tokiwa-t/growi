import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  TabContent, TabPane,
} from 'reactstrap';

import * as toastr from 'toastr';

import { UserPicture } from '@growi/ui';
import AppContainer from '~/client/services/AppContainer';
import PageContainer from '~/client/services/PageContainer';
import CommentContainer from '~/client/services/CommentContainer';
import EditorContainer from '~/client/services/EditorContainer';
import GrowiRenderer from '~/client/util/GrowiRenderer';

import { withUnstatedContainers } from '../UnstatedUtils';
import Editor from '../PageEditor/Editor';
import { SlackNotification } from '../SlackNotification';

import CommentPreview from './CommentPreview';
import NotAvailableForGuest from '../NotAvailableForGuest';
import { CustomNavTab } from '../CustomNavigation/CustomNav';

import { useCurrentPagePath, useCurrentUser } from '~/stores/context';
import { useSWRxSlackChannels, useIsSlackEnabled } from '~/stores/editor';
import { useIsMobile } from '~/stores/ui';


const navTabMapping = {
  comment_editor: {
    Icon: () => <i className="icon-settings" />,
    i18n: 'Write',
    index: 0,
  },
  comment_preview: {
    Icon: () => <i className="icon-settings" />,
    i18n: 'Preview',
    index: 1,
  },
};

/**
 *
 * @author Yuki Takei <yuki@weseek.co.jp>
 *
 * @extends {React.Component}
 */

class CommentEditor extends React.Component {

  constructor(props) {
    super(props);

    const config = this.props.appContainer.getConfig();
    const isUploadable = config.upload.image || config.upload.file;
    const isUploadableFile = config.upload.file;

    this.state = {
      isReadyToUse: !this.props.isForNewComment,
      comment: this.props.commentBody || '',
      isMarkdown: true,
      html: '',
      activeTab: 'comment_editor',
      isUploadable,
      isUploadableFile,
      errorMessage: undefined,
      isSlackConfigured: config.isSlackConfigured,
      slackChannels: this.props.slackChannels,
    };

    this.updateState = this.updateState.bind(this);
    this.updateStateCheckbox = this.updateStateCheckbox.bind(this);

    this.cancelButtonClickedHandler = this.cancelButtonClickedHandler.bind(this);
    this.commentButtonClickedHandler = this.commentButtonClickedHandler.bind(this);
    this.ctrlEnterHandler = this.ctrlEnterHandler.bind(this);
    this.postComment = this.postComment.bind(this);
    this.uploadHandler = this.uploadHandler.bind(this);

    this.renderHtml = this.renderHtml.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.onSlackEnabledFlagChange = this.onSlackEnabledFlagChange.bind(this);
    this.fetchSlackChannels = this.fetchSlackChannels.bind(this);
  }

  updateState(value) {
    this.setState({ comment: value });
  }

  fetchSlackChannels(slackChannels) {
    this.setState({ slackChannels });
  }

  componentDidUpdate(prevProps) {
    if (this.props.slackChannels !== prevProps.slackChannels) {
      this.fetchSlackChannels(this.props.slackChannels);
    }
  }

  updateStateCheckbox(event) {
    const value = event.target.checked;
    this.setState({ isMarkdown: value });
    // changeMode
    this.editor.setGfmMode(value);
  }

  handleSelect(activeTab) {
    this.setState({ activeTab });
    this.renderHtml(this.state.comment);
  }

  onSlackEnabledFlagChange(isSlackEnabled) {
    this.props.commentContainer.setState({ isSlackEnabled });
  }

  onSlackChannelsChange(slackChannels) {
    this.setState({ slackChannels });
  }

  initializeEditor() {
    this.setState({
      comment: '',
      isMarkdown: true,
      html: '',
      activeTab: 'comment_editor',
      errorMessage: undefined,
    });
    // reset value
    this.editor.setValue('');
  }

  cancelButtonClickedHandler() {
    const { isForNewComment, onCancelButtonClicked } = this.props;

    // change state to not ready
    // when this editor is for the new comment mode
    if (isForNewComment) {
      this.setState({ isReadyToUse: false });
    }

    if (onCancelButtonClicked != null) {
      const { replyTo, currentCommentId } = this.props;
      onCancelButtonClicked(replyTo || currentCommentId);
    }
  }

  commentButtonClickedHandler() {
    this.postComment();
  }

  ctrlEnterHandler(event) {
    if (event != null) {
      event.preventDefault();
    }

    this.postComment();
  }

  /**
   * Post comment with CommentContainer and update state
   */
  async postComment() {
    const {
      commentContainer, replyTo, currentCommentId, commentCreator, onCommentButtonClicked,
    } = this.props;
    try {
      if (currentCommentId != null) {
        await commentContainer.putComment(
          this.state.comment,
          this.state.isMarkdown,
          currentCommentId,
          commentCreator,
        );
      }
      else {
        await this.props.commentContainer.postComment(
          this.state.comment,
          this.state.isMarkdown,
          replyTo,
          commentContainer.state.isSlackEnabled,
          commentContainer.state.slackChannels,
        );
      }
      this.initializeEditor();

      if (onCommentButtonClicked != null) {
        onCommentButtonClicked(replyTo || currentCommentId);
      }
    }
    catch (err) {
      const errorMessage = err.message || 'An unknown error occured when posting comment';
      this.setState({ errorMessage });
    }
  }

  uploadHandler(file) {
    this.props.commentContainer.uploadAttachment(file)
      .then((res) => {
        const attachment = res.attachment;
        const fileName = attachment.originalName;

        let insertText = `[${fileName}](${attachment.filePathProxied})`;
        // when image
        if (attachment.fileFormat.startsWith('image/')) {
          // modify to "![fileName](url)" syntax
          insertText = `!${insertText}`;
        }
        this.editor.insertText(insertText);
      })
      .catch(this.apiErrorHandler)
      // finally
      .then(() => {
        this.editor.terminateUploadingState();
      });
  }

  apiErrorHandler(error) {
    toastr.error(error.message, 'Error occured', {
      closeButton: true,
      progressBar: true,
      newestOnTop: false,
      showDuration: '100',
      hideDuration: '100',
      timeOut: '3000',
    });
  }

  getCommentHtml() {
    return (
      <CommentPreview
        inputRef={(el) => { this.previewElement = el }}
        html={this.state.html}
      />
    );
  }

  renderHtml(markdown) {
    const context = {
      markdown,
    };

    const { growiRenderer } = this.props;
    const interceptorManager = this.props.appContainer.interceptorManager;
    interceptorManager.process('preRenderCommnetPreview', context)
      .then(() => { return interceptorManager.process('prePreProcess', context) })
      .then(() => {
        context.markdown = growiRenderer.preProcess(context.markdown);
      })
      .then(() => { return interceptorManager.process('postPreProcess', context) })
      .then(() => {
        const parsedHTML = growiRenderer.process(context.markdown);
        context.parsedHTML = parsedHTML;
      })
      .then(() => { return interceptorManager.process('prePostProcess', context) })
      .then(() => {
        context.parsedHTML = growiRenderer.postProcess(context.parsedHTML);
      })
      .then(() => { return interceptorManager.process('postPostProcess', context) })
      .then(() => { return interceptorManager.process('preRenderCommentPreviewHtml', context) })
      .then(() => {
        this.setState({ html: context.parsedHTML });
      })
      // process interceptors for post rendering
      .then(() => { return interceptorManager.process('postRenderCommentPreviewHtml', context) });
  }

  generateInnerHtml(html) {
    return { __html: html };
  }

  renderBeforeReady() {
    return (
      <div className="text-center">
        <NotAvailableForGuest>
          <button
            type="button"
            className="btn btn-lg btn-link"
            onClick={() => this.setState({ isReadyToUse: true })}
          >
            <i className="icon-bubble"></i> Add Comment
          </button>
        </NotAvailableForGuest>
      </div>
    );
  }

  renderReady() {
    const { appContainer, commentContainer, isMobile } = this.props;
    const { activeTab } = this.state;

    const commentPreview = this.state.isMarkdown ? this.getCommentHtml() : null;
    const emojiStrategy = appContainer.getEmojiStrategy();

    const errorMessage = <span className="text-danger text-right mr-2">{this.state.errorMessage}</span>;
    const cancelButton = (
      <Button outline color="danger" size="xs" className="btn btn-outline-danger rounded-pill" onClick={this.cancelButtonClickedHandler}>
        Cancel
      </Button>
    );
    const submitButton = (
      <Button
        outline
        color="primary"
        className="btn btn-outline-primary rounded-pill"
        onClick={this.commentButtonClickedHandler}
      >
        Comment
      </Button>
    );


    return (
      <>
        <div className="comment-write">
          <CustomNavTab activeTab={activeTab} navTabMapping={navTabMapping} onNavSelected={this.handleSelect} hideBorderBottom />
          <TabContent activeTab={activeTab}>
            <TabPane tabId="comment_editor">
              <Editor
                ref={(c) => { this.editor = c }}
                value={this.state.comment}
                isGfmMode={this.state.isMarkdown}
                lineNumbers={false}
                isMobile={isMobile}
                isUploadable={this.state.isUploadable}
                isUploadableFile={this.state.isUploadableFile}
                emojiStrategy={emojiStrategy}
                onChange={this.updateState}
                onUpload={this.uploadHandler}
                onCtrlEnter={this.ctrlEnterHandler}
              />
              {/*
                Note: <OptionsSelector /> is not optimized for ComentEditor in terms of responsive design.
                See a review comment in https://github.com/weseek/growi/pull/3473
              */}
            </TabPane>
            <TabPane tabId="comment_preview">
              <div className="comment-form-preview">
                {commentPreview}
              </div>
            </TabPane>
          </TabContent>
        </div>

        <div className="comment-submit">
          <div className="d-flex">
            <label className="mr-2">
              {activeTab === 'comment_editor' && (
                <span className="custom-control custom-checkbox">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="comment-form-is-markdown"
                    name="isMarkdown"
                    checked={this.state.isMarkdown}
                    value="1"
                    onChange={this.updateStateCheckbox}
                  />
                  <label
                    className="ml-2 custom-control-label"
                    htmlFor="comment-form-is-markdown"
                  >
                    Markdown
                  </label>
                </span>
              ) }
            </label>
            <span className="flex-grow-1" />
            <span className="d-none d-sm-inline">{ this.state.errorMessage && errorMessage }</span>

            { this.state.isSlackConfigured
              && (
                <div className="form-inline align-self-center mr-md-2">
                  <SlackNotification
                    isSlackEnabled={this.props.isSlackEnabled}
                    slackChannels={this.state.slackChannels}
                    onEnabledFlagChange={this.props.onSlackEnabledFlagChange}
                    onChannelChange={this.onSlackChannelsChange}
                    id="idForComment"
                  />
                </div>
              )
            }
            <div className="d-none d-sm-block">
              <span className="mr-2">{cancelButton}</span><span>{submitButton}</span>
            </div>
          </div>
          <div className="d-block d-sm-none mt-2">
            <div className="d-flex justify-content-end">
              { this.state.errorMessage && errorMessage }
              <span className="mr-2">{cancelButton}</span><span>{submitButton}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  render() {
    const { currentUser } = this.props;
    const { isReadyToUse } = this.state;

    return (
      <div className="form page-comment-form">
        <div className="comment-form">
          <div className="comment-form-user">
            <UserPicture user={currentUser} noLink noTooltip />
          </div>
          <div className="comment-form-main">
            { !isReadyToUse
              ? this.renderBeforeReady()
              : this.renderReady()
            }
          </div>
        </div>
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const CommentEditorHOCWrapper = withUnstatedContainers(CommentEditor, [AppContainer, PageContainer, EditorContainer, CommentContainer]);

CommentEditor.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
  editorContainer: PropTypes.instanceOf(EditorContainer).isRequired,
  commentContainer: PropTypes.instanceOf(CommentContainer).isRequired,

  slackChannels: PropTypes.string.isRequired,
  isSlackEnabled: PropTypes.bool.isRequired,
  growiRenderer: PropTypes.instanceOf(GrowiRenderer).isRequired,
  currentUser: PropTypes.instanceOf(Object),
  isMobile: PropTypes.bool,
  isForNewComment: PropTypes.bool,
  replyTo: PropTypes.string,
  currentCommentId: PropTypes.string,
  commentBody: PropTypes.string,
  commentCreator: PropTypes.string,
  onCancelButtonClicked: PropTypes.func,
  onCommentButtonClicked: PropTypes.func,
  onSlackEnabledFlagChange: PropTypes.func,
};


// export default CommentEditorWrapper;

const CommentEditorWrapper = (props) => {
  const { data: isMobile } = useIsMobile();
  const { data: currentUser } = useCurrentUser();
  const { data: isSlackEnabled, mutate: mutateIsSlackEnabled } = useIsSlackEnabled();
  const { data: currentPagePath } = useCurrentPagePath();
  const { data: slackChannelsData } = useSWRxSlackChannels(currentPagePath);

  const onSlackEnabledFlagChange = (isSlackEnabled) => {
    mutateIsSlackEnabled(isSlackEnabled, false);
  };

  return (
    <CommentEditorHOCWrapper
      {...props}
      onSlackEnabledFlagChange={onSlackEnabledFlagChange}
      slackChannels={slackChannelsData.toString()}
      isSlackEnabled={isSlackEnabled}
      currentUser={currentUser}
      isMobile={isMobile}
    />
  );
};

export default CommentEditorWrapper;
