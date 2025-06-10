import React, { useState } from "react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";

interface PaginationInfoProps {
  totalRecords: number;
  recordsPerPage: number;
  currentPage: number;
  showDropDown?: boolean;
  onPerPageChange?: (perPage: number) => void;
}

const PaginationInfo: React.FC<PaginationInfoProps> = ({
  totalRecords,
  recordsPerPage,
  currentPage,
  showDropDown = false,
  onPerPageChange,
}) => {

  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);

  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  const togglePerPageDropdown = () => setPerPageDropdownOpen((prevState) => !prevState);

  if (totalRecords <= 0) {
    return;
  }

  return <div className="pagination-info-component d-flex align-items-center gap-2">
    <p className="m-0">
      Showing <span>{startRecord}</span>-<span>{endRecord}</span> of{" "}
      <span>{totalRecords}</span>
    </p>
    {(showDropDown && onPerPageChange) &&
      <>
        <span>|</span>
        <div className="d-flex align-items-center gap-1">
          <span>Per Page:</span>
          <Dropdown size="sm" isOpen={perPageDropdownOpen} toggle={togglePerPageDropdown} >
            <DropdownToggle className="px-2 py-1" color="primary" caret>{recordsPerPage}</DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => onPerPageChange(10)}>10</DropdownItem>
              <DropdownItem onClick={() => onPerPageChange(20)}>20</DropdownItem>
              <DropdownItem onClick={() => onPerPageChange(50)}>50</DropdownItem>
              <DropdownItem onClick={() => onPerPageChange(80)}>80</DropdownItem>
              <DropdownItem onClick={() => onPerPageChange(100)}>100</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </>
    }
  </div>
};

export default PaginationInfo;
