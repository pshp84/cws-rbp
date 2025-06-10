import React, { useEffect, useRef, useState } from "react";
import UploadIcon from "../../../../public/assets/images/home/UploadIcon.png";
import { Button, Col, Row } from "reactstrap";
import {
  addLeaseInfo,
  getLeaseInfo,
  updateLeaseInfo,
  updateLeaseInfoArgs,
} from "@/DbClient";
import { FaRegFilePdf } from "react-icons/fa6";
import { toast } from "react-toastify";
import LoadingIcon from "@/CommonComponent/LoadingIcon";

const UserLeaseDocument = ({ onComplete }: { onComplete: () => void }) => {
  const userId = localStorage.getItem("userId");
  const [file, setFile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isData, setIsData] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRentDetails = async () => {
    try {
      const result = await getLeaseInfo(userId as string);
      if (result) {
        setData(result);
        setIsData(false);
      } else {
        setIsData(true);
        setData(null);
      }
    } catch (err) { }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Handle drag over event
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Handle file drop event
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    fetchRentDetails();
  }, []);

  const submitDocument = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const { type } = file;
    if (!type || type != "application/pdf") {
      toast.error("Please upload valid PDF file.");
      setFile(null);
      return;
    }

    const updatedFile: updateLeaseInfoArgs = {
      leaseDocument: file,
    };

    setLoading(true);

    try {
      if (!isData) {
        const result = await updateLeaseInfo(userId as string, updatedFile);

        if (result) {
          await fetchRentDetails();
          onComplete();
          setFile(null);
          toast.success("Document updated successfully....");
          // fetchRentDetails();
          // onComplete();
          // setFile(null);
          setLoading(false);
        } else {
          await fetchRentDetails();
          toast.error("Something went wrong");
          onComplete();
          setFile(null);
          setLoading(false);
        }
      } else {
        const result1 = await addLeaseInfo({
          userID: userId as string,
          leaseDocument: updatedFile.leaseDocument,
        });

        if (result1) {
          await fetchRentDetails();
          toast.success("Document added successfully....");
          onComplete();
          //fetchRentDetails();
          setFile(null);
          setLoading(false);
        } else {
          await fetchRentDetails();
          toast.error("Something went wrong");
          onComplete();
          // fetchRentDetails();
          setFile(null);
          setLoading(false);
        }
      }
    } catch (error) {
      toast.error("An error occurred while processing the document.");
      onComplete();
      await fetchRentDetails();
      setFile(null);
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <>
          <LoadingIcon withOverlap={true} />
          <div className="user-signup-page ff-sora user-lease-document tab-view">
            <div className="mb-3">
              <h4>Lease Document</h4>
              <span className="mt-1">
                Complete these actions to fully setup your account
              </span>
              <hr className="mt-2" />
              {!isData && data && data.lease_document && (
                <div className="mb-2">
                  View your document:{" "}
                  <FaRegFilePdf
                    style={{ cursor: "pointer" }}
                    size={16}
                    className="ms-2"
                    onClick={() =>
                      window.open(
                        data.leaseDocumentURL,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  />
                </div>
              )}
              <div>Lease Document</div>
              <Row className="mt-2">
                <Col>
                  <div className="min-h-screen bg-gray-50 p-4 document-content">
                    <div
                      style={{ backgroundColor: "rgba(241, 245, 255, 0.5)" }}
                      className={`max-w-md mx-auto p-6 rounded-lg text-center transition-colors pointer-cursor`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <img
                        src={UploadIcon.src}
                        alt="uploadIcon"
                        width={53}
                        height={45}
                      />
                      <p className="text-dark ff-sora-regular mb-2">
                        Drag & drop file or{" "}
                        <span
                          className="ff-sora-regular cursor-pointer browse-text"
                          onClick={handleBrowseClick}
                        >
                          Browse
                        </span>
                      </p>
                      <p className="ff-sora-regular supported-text">
                        Supported formats: PDF
                      </p>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />
                    </div>
                    {file && <div className="text-center">{file.name}</div>}
                  </div>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col md="6"></Col>
                <Col md="2" className="ms-auto">
                  {/* <div className="text-right">
                    <Button block className="btn btn-light" type="button">
                      Cancel
                    </Button>
                  </div> */}
                </Col>
                <Col md="2">
                  <Button
                    block
                    type="button"
                    // disabled={disableButton}
                    onClick={submitDocument}
                    color="primary"
                    className="w-100"
                  >
                    Update
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="user-signup-page ff-sora user-lease-document tab-view">
            <div className="mb-3">
              <h4>Lease Document</h4>
              <span className="mt-1">
                Complete these actions to fully setup your account
              </span>
              <hr className="mt-2" />
              {!isData && data && data.lease_document && (
                <div className="mb-2">
                  View your document:{" "}
                  <FaRegFilePdf
                    style={{ cursor: "pointer" }}
                    size={16}
                    className="ms-2"
                    onClick={() =>
                      window.open(
                        data.leaseDocumentURL,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  />
                </div>
              )}
              <div>Lease Document</div>
              <Row className="mt-2">
                <Col>
                  <div className="min-h-screen bg-gray-50 p-4 document-content">
                    <div
                      style={{ backgroundColor: "rgba(241, 245, 255, 0.5)" }}
                      className={`max-w-md mx-auto p-6 rounded-lg text-center transition-colors pointer-cursor`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <img
                        src={UploadIcon.src}
                        alt="uploadIcon"
                        width={53}
                        height={45}
                      />
                      <p className="text-dark ff-sora-regular mb-2">
                        Drag & drop file or{" "}
                        <span
                          className="ff-sora-regular cursor-pointer browse-text"
                          onClick={handleBrowseClick}
                        >
                          Browse
                        </span>
                      </p>
                      <p className="ff-sora-regular supported-text">
                        Supported formats: PDF
                      </p>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />
                    </div>
                    {file && <div className="text-center">{file.name}</div>}
                  </div>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col md="6"></Col>
                <Col md="2" className="ms-auto">
                  {/* <div className="text-right">
                    <Button block className="btn btn-light" type="button">
                      Cancel
                    </Button>
                  </div> */}
                </Col>
                <Col md="2">
                  <Button
                    block
                    type="button"
                    // disabled={disableButton}
                    onClick={submitDocument}
                    color="primary"
                    className="w-100"
                  >
                    Update
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UserLeaseDocument;
