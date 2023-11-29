import React, { ReactNode } from 'react';

import { BasicLayout } from '~/components/Layout/BasicLayout';

import styles from './SearchResultLayout.module.scss';

const moduleClass = styles['on-search'] ?? '';


type Props = {
  children?: ReactNode,
}

const SearchResultLayout = ({ children }: Props): JSX.Element => {

  return (
    <BasicLayout className={moduleClass}>
      { children }
    </BasicLayout>
  );
};

export default SearchResultLayout;
