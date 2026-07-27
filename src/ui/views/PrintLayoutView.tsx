import React from 'react';
import { PaginatedPrintLayout, type PaginatedPrintLayoutProps } from '../editor/PaginatedPrintLayout';

export type PrintLayoutViewProps = PaginatedPrintLayoutProps;

export const PrintLayoutView: React.FC<PrintLayoutViewProps> = (props) => {
  return (
    <div data-testid="print-layout-view" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <PaginatedPrintLayout {...props} />
    </div>
  );
};
