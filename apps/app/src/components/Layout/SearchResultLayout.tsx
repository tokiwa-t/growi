import React, { ReactNode } from 'react';

import { BasicPageOperatableLayout } from '~/components/Layout/BasicLayout';

import styles from './SearchResultLayout.module.scss';

const moduleClass = styles['on-search'] ?? '';


type Props = {
  children?: ReactNode,
}

const SearchResultLayout = ({ children }: Props): JSX.Element => {

  return (
    <BasicPageOperatableLayout className={moduleClass}>
      { children }
    </BasicPageOperatableLayout>
  );
};

export default SearchResultLayout;
