import React from "react";
import { Pagination, PaginationItem, PaginationLink } from "reactstrap";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";

interface PaginationProps {
  totalRecords: number;
  perPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const UserPaginationComponent: React.FC<PaginationProps> = ({
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
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i} active={i === currentPage}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            style={{
              color: currentPage === i ? "white" : "#151515",
              borderRadius: "6px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              margin: "0 2px",
              fontSize: "12px",
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  const buttonStyle = {
    backgroundColor: "#F8F9FA",
    border: "1px solid #DEE2E6",
    borderRadius: "6px",
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#151515",
    height: "40px",
    fontSize: "12px",
    minWidth: "100px",
  };

  return (
    <div className="rbp-user-portal rbp-user-portal-pagination ff-sora-regular d-flex align-items-center justify-content-center">
      <Pagination size="md" style={{ gap: "4px" }} className="d-flex justify-content-center flex-wrap gap-2">
        <PaginationItem disabled={currentPage === 1}>
          <PaginationLink
            previous
            onClick={() => handlePageChange(currentPage - 1)}
            style={buttonStyle}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <FaChevronLeft size={8} fill="#626262" />
              <span>Back</span>
            </div>
          </PaginationLink>
        </PaginationItem>

        {renderPageNumbers()}

        <PaginationItem disabled={currentPage === totalPages}>
          <PaginationLink
            next
            onClick={() => handlePageChange(currentPage + 1)}
            style={buttonStyle}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Next</span>
              <FaChevronRight size={8} fill="#626262" />
            </div>
          </PaginationLink>
        </PaginationItem>
      </Pagination>
    </div>
  );
};

export default UserPaginationComponent;
