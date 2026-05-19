import React from "react";
import { MAX_VISIBLE_PAGES } from "./helpers/Constants";

export default Pagination = ({
  currentPage = 1,
  totalPages = 1,
  handlePrevious,
  handlePageClick,
  handleNext,
}) => {
  // Early return if props are invalid
  if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages) || totalPages < 1) {
    return null;
  }

  // Clamp currentPage to valid range
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  let pageNumbers = [];

  if (totalPages <= MAX_VISIBLE_PAGES) {
    pageNumbers = [...Array(totalPages).keys()].map((i) => i + 1);
  } else {
    if (safeCurrentPage <= MAX_VISIBLE_PAGES - 2) {
      pageNumbers = [
        ...Array(MAX_VISIBLE_PAGES).keys()
      ].map((i) => i + 1).concat(["...", totalPages]);
    } else if (safeCurrentPage >= totalPages - 2) {
      pageNumbers = [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ].filter(n => typeof n === "string" || (n >= 1 && n <= totalPages));
    } else {
      pageNumbers = [
        1,
        "...",
        safeCurrentPage - 1,
        safeCurrentPage,
        safeCurrentPage + 1,
        "...",
        totalPages
      ];
    }
  }

  return (
    <nav aria-label="Page Navigation">
      <ul className="pagination">
        <li className="page-item">
          <button
            className={`page-link ${safeCurrentPage === 1 ? "disabled" : ""}`}
            onClick={handlePrevious}
            disabled={safeCurrentPage === 1}
          >
            Previous
          </button>
        </li>

        {pageNumbers
          .filter((p) => typeof p === "number" || p === "...")
          .map((page, i) => (
            <li className="page-item" key={`page-btn-${i}`}>
              {page === "..." ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className={`page-link ${
                    safeCurrentPage === page ? "active" : ""
                  }`}
                  onClick={() => handlePageClick(page)}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

        <li className="page-item">
          <button
            className={`page-link ${
              safeCurrentPage === totalPages ? "disabled" : ""
            }`}
            onClick={handleNext}
            disabled={safeCurrentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};
