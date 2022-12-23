import React, { useCallback } from 'react';

import { apiv3Post } from '~/client/util/apiv3-client';
import { toastSuccess, toastError } from '~/client/util/toastr';
import { useSWRxPlugins } from '~/stores/plugin';


export const PluginInstallerForm = (): JSX.Element => {
  const { mutate } = useSWRxPlugins();

  const submitHandler = useCallback(async(e) => {
    e.preventDefault();

    const formData = e.target.elements;

    const {
      'pluginInstallerForm[url]': { value: url },
      // 'pluginInstallerForm[ghBranch]': { value: ghBranch },
      // 'pluginInstallerForm[ghTag]': { value: ghTag },
    } = formData;

    const pluginInstallerForm = {
      url,
      // ghBranch,
      // ghTag,
    };

    try {
      await apiv3Post('/plugins', { pluginInstallerForm });
      toastSuccess('Plugin Install Successed!');
    }
    catch (e) {
      toastError(e);
    }
    finally {
      mutate();
    }
  }, [mutate]);

  return (
    <form role="form" onSubmit={submitHandler}>
      <div className='form-group row'>
        <label className="text-left text-md-right col-md-3 col-form-label">GitHub Repository URL</label>
        <div className="col-md-6">
          <input
            className="form-control"
            type="text"
            name="pluginInstallerForm[url]"
            placeholder="https://github.com/growi/plugins"
            required
          />
          <p className="form-text text-muted">You can install plugins by inputting the GitHub URL.</p>
        </div>
      </div>

      <div className="row my-3">
        <div className="mx-auto">
          <button type="submit" className="btn btn-primary">Install</button>
        </div>
      </div>
    </form>
  );
};
