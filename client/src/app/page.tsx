'use client';

import { Alert } from '@/components/Alert';
import { Button, ButtonGroup } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormField, FormInput } from '@/components/FormField';
import { LoadingInline, TableSkeletonRows } from '@/components/LoadingState';
import { PageShell } from '@/components/PageShell';
import { StateCodeSelectField } from '@/components/StateCodeSelectField';
import { useGeographyZipList } from '@/hooks/use-geography-zip-list';
import { useStateCodes } from '@/hooks/use-state-codes';

export default function Home() {
  const {
    apiBase,
    appliedFilters,
    applyDraftFilters,
    currentPage,
    draftFilters,
    error,
    goToNextPage,
    goToPrevPage,
    hasNext,
    hasPendingFilterChanges,
    hasPrev,
    loading,
    rows,
    setDraftSkip,
    setDraftStateCode,
    setDraftTake,
  } = useGeographyZipList();
  const {
    states,
    error: statesError,
    loading: statesLoading,
  } = useStateCodes();

  return (
    <PageShell
      className="max-[768px]:px-3 max-[768px]:py-6"
      mainClassName="max-w-5xl font-sans max-[768px]:gap-5"
    >
      <header className="flex flex-col gap-3 max-[768px]:gap-2">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
          Geography Explorer
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 max-[768px]:text-2xl">
          Browse ZIPs by state
        </h1>
        <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300 max-[768px]:text-sm">
          Pulling data from the backend endpoint{' '}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            /geography/state/:stateCode
          </span>
          . Update the filters below and reload to view ZIP summaries.
        </p>
      </header>

      <Card variant="light" className="max-[768px]:p-4">
        <div className="grid gap-4 max-[768px]:gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
          <StateCodeSelectField
            value={draftFilters.stateCode}
            states={states}
            loading={statesLoading}
            error={statesError}
            onChange={setDraftStateCode}
            fieldClassName="text-slate-700 dark:text-slate-300"
            hintClassName="text-slate-500 dark:text-slate-400"
            errorClassName="text-rose-500"
            selectClassName="text-base max-[768px]:text-sm"
          />
          <FormField
            label="Page size"
            className="text-slate-700 dark:text-slate-300"
          >
            <FormInput
              value={draftFilters.take}
              onChange={(event) => setDraftTake(Number(event.target.value))}
              type="number"
              min={1}
              max={250}
              className="text-base max-[768px]:text-sm"
            />
          </FormField>
          <FormField
            label="Skip"
            className="text-slate-700 dark:text-slate-300"
          >
            <FormInput
              value={draftFilters.skip}
              onChange={(event) => setDraftSkip(Number(event.target.value))}
              type="number"
              min={0}
              max={100000}
              className="text-base max-[768px]:text-sm"
            />
          </FormField>
          <Button
            type="button"
            variant="primary"
            onClick={applyDraftFilters}
            disabled={!hasPendingFilterChanges || loading}
            className="h-11 px-6 text-sm font-semibold uppercase tracking-wide max-[768px]:h-9 max-[768px]:px-4 max-[768px]:text-xs"
          >
            {loading ? 'Loading...' : 'Reload'}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300 max-[768px]:mt-3 max-[768px]:text-xs">
          <div className="flex items-center gap-3 max-[768px]:flex-col max-[768px]:items-start">
            {loading ? (
              <LoadingInline
                label="Fetching ZIP records..."
                className="text-slate-600 dark:text-slate-300"
              />
            ) : (
              <span>
                Showing {rows.length} ZIP{rows.length === 1 ? '' : 's'}
              </span>
            )}
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              Page {currentPage}
            </span>
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            API base: {apiBase}
          </span>
        </div>

        {error ? (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}
      </Card>

      <Card variant="plain" className="p-0">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 max-[768px]:px-4 max-[768px]:py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            ZIP Summary
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-[768px]:gap-2 max-[768px]:px-4 max-[768px]:py-3 max-[768px]:text-xs">
          <ButtonGroup>
            <Button
              type="button"
              position="left"
              onClick={goToPrevPage}
              disabled={!hasPrev || loading || hasPendingFilterChanges}
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wide max-[768px]:px-2.5 max-[768px]:py-0.5 max-[768px]:text-[11px]"
            >
              Prev
            </Button>
            <Button
              type="button"
              position="right"
              onClick={goToNextPage}
              disabled={!hasNext || loading || hasPendingFilterChanges}
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wide max-[768px]:px-2.5 max-[768px]:py-0.5 max-[768px]:text-[11px]"
            >
              Next
            </Button>
          </ButtonGroup>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            offset {appliedFilters.skip} · limit {appliedFilters.take}
          </span>
        </div>
        <div className="max-h-[540px] overflow-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 text-sm dark:divide-gray-700 max-[768px]:text-xs">
            <thead className="sticky top-0 bg-white ltr:text-left rtl:text-right dark:bg-slate-900">
              <tr className="*:font-medium *:text-gray-900 dark:*:text-white">
                <th className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                  ZIP
                </th>
                <th className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                  State
                </th>
                <th className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                  County
                </th>
                <th className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                  Primary City
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <TableSkeletonRows
                  columns={4}
                  rows={8}
                  tone="light"
                  cellClassName="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5"
                />
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.zip}
                    className="*:text-gray-900 *:first:font-medium hover:bg-gray-50 dark:*:text-white dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                      {row.zip}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                      {row.state_code}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                      {row.county_name ?? '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap max-[768px]:px-2 max-[768px]:py-1.5">
                      {row.primary_city_name ?? '—'}
                    </td>
                  </tr>
                ))
              )}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400 max-[768px]:px-2 max-[768px]:py-6 max-[768px]:text-xs"
                  >
                    No data found for this state.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
