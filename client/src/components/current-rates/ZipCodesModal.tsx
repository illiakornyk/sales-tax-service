'use client';

import { useEffect } from 'react';

type ZipCodesModalProps = {
  cityId: string;
  cityName: string;
  zipCodes: string[];
  onClose: () => void;
};

export function ZipCodesModal({
  cityId,
  cityName,
  zipCodes,
  onClose,
}: ZipCodesModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-content-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zipModalTitle"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2
            id="zipModalTitle"
            className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white"
          >
            ZIP Codes
          </h2>

          <button
            type="button"
            className="-me-4 -mt-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          <p className="text-pretty text-gray-700 dark:text-gray-200">
            {cityName} (City ID: {cityId})
          </p>
          <div className="mt-4 max-h-[360px] overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-2 text-sm text-gray-700 dark:text-gray-200">
              {zipCodes.map((zip) => (
                <span
                  key={zip}
                  className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-center dark:border-gray-600 dark:bg-gray-800"
                >
                  {zip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
