import React from "react";
import { Pagination, PaginationItem, PaginationLink } from "reactstrap";

interface PaginationProps {
  totalRecords: number;
  perPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationProps> = ({
  totalRecords,
  perPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalRecords / perPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages: any[] = [];
    const maxPagesToShow = 5;
    const visiblePages = [];

    // Always show the first page
    visiblePages.push(1);

    if (totalPages <= maxPagesToShow) {
      for (let i = 2; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage > 3) {
        visiblePages.push("...");
      }

      const startPage = Math.max(currentPage - 2, 2);
      const endPage = Math.min(currentPage + 2, totalPages - 1);

      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }

      if (currentPage < totalPages - 2) {
        visiblePages.push("...");
      }

      visiblePages.push(totalPages);
    }
    visiblePages.forEach((page: any, index) => {
      if (page === "...") {
        pages.push(
          <PaginationItem disabled key={index}>
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      } else {
        pages.push(
          <PaginationItem key={page} active={page === currentPage}>
            <PaginationLink onClick={() => handlePageChange(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>
        );
      }
    });

    return pages;
  };

  return (
    <Pagination>
      <PaginationItem disabled={currentPage === 1}>
        <PaginationLink first onClick={() => handlePageChange(1)} />
      </PaginationItem>

      <PaginationItem disabled={currentPage === 1}>
        <PaginationLink
          previous
          onClick={() => handlePageChange(currentPage - 1)}
        />
      </PaginationItem>

      {renderPageNumbers()}

      <PaginationItem disabled={currentPage === totalPages}>
        <PaginationLink
          next
          onClick={() => handlePageChange(currentPage + 1)}
        />
      </PaginationItem>

      <PaginationItem disabled={currentPage === totalPages}>
        <PaginationLink last onClick={() => handlePageChange(totalPages)} />
      </PaginationItem>
    </Pagination>
  );
};

export default PaginationComponent;
