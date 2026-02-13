import type { CurrentTaxRateSectionPagination } from './types';

const FALLBACK_PAGE_SIZE = 15;

type SectionPaginationProps = {
  pagination: CurrentTaxRateSectionPagination;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function SectionPagination({
  pagination,
  loading,
  onPrev,
  onNext,
}: SectionPaginationProps) {
  const take = pagination.take ?? FALLBACK_PAGE_SIZE;
  const currentPage =
    pagination.total === 0 ? 1 : Math.floor(pagination.skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / take));
  const prevDisabled = loading || pagination.skip <= 0;
  const nextDisabled = loading || !pagination.has_more;

  return (
    <ul className="flex justify-center gap-3 text-gray-900 dark:text-white">
      <li>
        <a
          href="#"
          aria-label="Previous page"
          onClick={(event) => {
            event.preventDefault();
            if (!prevDisabled) {
              onPrev();
            }
          }}
          className="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-gray-50 rtl:rotate-180 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-disabled={prevDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </li>

      <li className="text-sm/8 font-medium tracking-widest">
        {currentPage}/{totalPages}
      </li>

      <li>
        <a
          href="#"
          aria-label="Next page"
          onClick={(event) => {
            event.preventDefault();
            if (!nextDisabled) {
              onNext();
            }
          }}
          className="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-gray-50 rtl:rotate-180 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-disabled={nextDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </li>
    </ul>
  );
}
