"use client";

import { dealsBannerInterface, dealsBucketFolderName, deleteUploadedFile, getDealsBanner, getOption, getUploadedFileUrl, updateOption, uploadFile } from "@/DbClient";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Card, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

const DealsBannerAdmin = () => {
    const [modal, setModal] = useState<boolean>(false);
    const [actionType, setActionType] = useState<"add" | "edit">("add");
    const [actionID, setActionID] = useState<number | undefined>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [modalTitle, setModalTitle] = useState("Add New Banner");
    const [dealsBanner, setDealsBanner] = useState<Array<dealsBannerInterface>>([]);
    const [bannerTitle, setBannerTitle] = useState<string | undefined>();
    const [bannerText, setBannerText] = useState<string | undefined>();
    const [bannerButtonText, setBannerButtonText] = useState<string | undefined>();
    const [bannerButtonLink, setBannerButtonLink] = useState<string | undefined>();
    const [bannerImage, setBannerImage] = useState<File | undefined>();
    const [bannerImageUrl, setBannerImageUrl] = useState<string | undefined>();
    const [validationErrorData, setValidationErrorData] = useState<{
        bannerTitle: boolean;
        bannerText: boolean;
        bannerButtonText: boolean;
        bannerButtonLink: boolean;
        bannerImage: boolean;
    }>({
        bannerTitle: false,
        bannerText: false,
        bannerButtonText: false,
        bannerButtonLink: false,
        bannerImage: false
    });

    const fetchDealsBanner = async () => {
        setIsLoading(true);
        const data = await getDealsBanner();
        if (typeof data == "boolean") {
            setDealsBanner([]);
            setIsLoading(false);
            return;
        }
        setDealsBanner(data);
        setIsLoading(false);
        return;
    }

    const validationProcess = (): Boolean => {
        let isValidation = false;
        let validationError = {
            bannerTitle: false,
            bannerText: false,
            bannerButtonText: false,
            bannerButtonLink: false,
            bannerImage: false
        };

        if (!bannerTitle || bannerTitle == "") {
            isValidation = true;
            validationError = { ...validationError, bannerTitle: true }
        }

        if (!bannerText || bannerText == "") {
            isValidation = true;
            validationError = { ...validationError, bannerText: true }
        }

        if (!bannerButtonText || bannerButtonText == "") {
            isValidation = true;
            validationError = { ...validationError, bannerButtonText: true }
        }

        if (!bannerButtonLink || bannerButtonLink == "") {
            isValidation = true;
            validationError = { ...validationError, bannerButtonLink: true }
        }

        if (!bannerImage && actionType == "add") {
            isValidation = true;
            validationError = { ...validationError, bannerImage: true }
        }

        if (isValidation) {
            setValidationErrorData(validationError);
            return true;
        }
        return false;
    }

    const dealsBannerAction = async () => {
        if (validationProcess()) {
            return;
        }

        setIsLoading(true);
        let newBannerImage = "";
        if (typeof bannerImage != "undefined") {
            if (actionType == "edit" && typeof actionID != "undefined") {
                const deleteImageName = dealsBanner[actionID].bannerImage;
                if (deleteImageName) {
                    await deleteUploadedFile(deleteImageName);
                }
            }
            const fileUploadData: any = await uploadFile(bannerImage, dealsBucketFolderName);
            if (fileUploadData) {
                newBannerImage = fileUploadData.path;
            }
        }

        const newDealsBanner: dealsBannerInterface = {
            bannerButtonLink: bannerButtonLink || "",
            bannerButtonText: bannerButtonText || "",
            bannerImage: newBannerImage || "",
            bannerText: bannerText || "",
            bannerTitle: bannerTitle || ""
        };

        let newDealsBannerList: Array<dealsBannerInterface> = [];
        let forceUpdate = dealsBanner.length > 0 ? true : false;
        if (actionType == "edit" && typeof actionID != "undefined") {
            forceUpdate = true;
            newDealsBannerList = dealsBanner.map((data, index) => {
                if (index == actionID) {
                    return newDealsBanner;
                }
                return data;
            });
        } else {
            newDealsBannerList = [...dealsBanner, newDealsBanner];
        }

        const dealsBannerActionStatus = await updateOption('dealsBanner', newDealsBannerList, forceUpdate);
        if (!dealsBannerActionStatus) {
            setModal(false);
            setIsLoading(false);
            toast.error(`Something went wrong! The deal banner was not ${actionType == "add" ? `added` : `updated`}.`);
        }

        fetchDealsBanner();
        setModal(false);
        toast.success(`Deal banner has been ${actionType == "add" ? `added` : `updated`} successfully.`);
    }

    const deleteBannerAction = async (deleteIndex: number) => {
        if (!confirm("Are you sure?")) return;
        setIsLoading(true);
        const newDealsBanner = dealsBanner.filter((data, index) => index != deleteIndex);
        const deleteStatus = await updateOption('dealsBanner', newDealsBanner, true);
        if (!deleteStatus) {
            setIsLoading(false);
            toast.error("Something went wrong! The deal banner was not deleted");
            return;
        }

        const deleteImageName = dealsBanner[deleteIndex].bannerImage;
        if (deleteImageName) {
            await deleteUploadedFile(deleteImageName);
        }

        fetchDealsBanner();
        toast.success("deal banner has been deleted successfully.");
    }

    const resetBannerInputs = () => {
        setBannerTitle(undefined);
        setBannerText(undefined);
        setBannerText(undefined);
        setBannerButtonText(undefined);
        setBannerButtonLink(undefined);
        setBannerImage(undefined);
        setBannerImageUrl(undefined);
        setBannerImage(undefined);
    }

    const modalToggle = () => setModal(!modal);

    useEffect(() => {
        setModalTitle((actionType == "add") ? "Add New Banner" : "Edit Banner");
        setValidationErrorData({
            bannerTitle: false,
            bannerText: false,
            bannerButtonText: false,
            bannerButtonLink: false,
            bannerImage: false
        });
    }, [actionType]);

    useEffect(() => {
        fetchDealsBanner();
    }, []);

    return <div className="deals-banner-admin col-12 mb-4">

        <div className="deals-banner-top-bar d-flex justify-content-end align-items-center gap-2 mb-3">
            <button
                className="btn btn-primary px-3"
                onClick={e => {
                    setActionID(undefined);
                    setActionType("add");
                    resetBannerInputs();
                    setModal(true);
                }}
            >
                Add New
            </button>
        </div>

        <Card className="overflow-hidden">
            <div className="table-responsive">
                {isLoading && (
                    <div
                        className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
                        style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
                    >
                        Loading please wait...
                    </div>
                )}
                <table className="table">
                    <thead>
                        <tr>
                            <th className="text-center" style={{ width: `50px` }}>#</th>
                            <th>Banner</th>
                            <th className="text-end" style={{ width: `125px` }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!isLoading && dealsBanner.length <= 0) &&
                            <tr>
                                <td colSpan={3} className="text-center">Deals banner not found!</td>
                            </tr>
                        }
                        {(!isLoading && dealsBanner.length > 0) &&
                            dealsBanner.map((dealBanner, dealBannerID) => {
                                return <tr key={`dealBannerID${dealBannerID}`}>
                                    <td className="text-center">{dealBannerID + 1}</td>
                                    <td>
                                        <div className="d-flex align-items-top gap-2">
                                            {(!dealBanner.bannerImageURL) && (
                                                <span
                                                    className="rounded-3 bg-primary bg-gradient d-flex justify-content-center align-items-center text-white"
                                                    style={{
                                                        width: "150px",
                                                        height: "100px",
                                                        fontSize: "30px",
                                                    }}
                                                >
                                                    <i className="fa fa-image"></i>
                                                </span>
                                            )}
                                            {dealBanner.bannerImageURL && <img className="rounded-3" src={dealBanner.bannerImageURL} alt={dealBanner.bannerTitle} style={{ width: "150px", height: "auto" }} />}
                                            <div>
                                                <h4>{dealBanner.bannerTitle}</h4>
                                                <p className="mb-1">{dealBanner.bannerText}</p>
                                                <Link href={dealBanner.bannerButtonLink} className="btn btn-sm btn-primary px-2" target="_blank">{dealBanner.bannerButtonText}</Link>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex align-items-center justify-content-end gap-1 h5 mb-0">
                                            <button className="border-0 p-0 bg-transparent text-primary"
                                                onClick={e => {
                                                    setActionType("edit");
                                                    setActionID(dealBannerID);
                                                    setBannerTitle(dealBanner.bannerTitle);
                                                    setBannerText(dealBanner.bannerText);
                                                    setBannerButtonText(dealBanner.bannerButtonText);
                                                    setBannerButtonLink(dealBanner.bannerButtonLink);
                                                    setBannerImageUrl(dealBanner.bannerImageURL);
                                                    setModal(true);
                                                }}
                                            ><i className="fa fa-pencil"></i></button>
                                            <button className="border-0 p-0 bg-transparent text-danger" onClick={e => deleteBannerAction(dealBannerID)}><i className="fa fa-trash-o"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
        </Card>

        <Modal isOpen={modal} toggle={modalToggle} backdrop={`static`}>
            {isLoading && (
                <div
                    className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: "rgba(255,255,255, 0.8)", zIndex: "1000", borderRadius: "var(--bs-modal-border-radius)" }}
                >
                    Loading please wait...
                </div>
            )}
            <ModalHeader toggle={modalToggle}>{modalTitle}</ModalHeader>
            <ModalBody className="position-relative">

                <div className="row g-3 align-items-center">
                    <div className="col-5">
                        <label htmlFor="bannerTitle" className="form-label m-0">Banner Title*</label>
                    </div>
                    <div className="col-7">
                        <input
                            type="text"
                            className={`form-control ${validationErrorData.bannerTitle ? `is-invalid` : ``}`}
                            id="bannerTitle"
                            onChange={e => setBannerTitle(e.target.value)}
                            value={bannerTitle}
                        />
                    </div>

                    <div className="col-5">
                        <label htmlFor="bannerButtonText" className="form-label m-0">Banner Button Text*</label>
                    </div>
                    <div className="col-7">
                        <input
                            type="text"
                            className={`form-control ${validationErrorData.bannerButtonText ? `is-invalid` : ``}`}
                            id="bannerButtonText"
                            onChange={e => setBannerButtonText(e.target.value)}
                            value={bannerButtonText}
                        />
                    </div>

                    <div className="col-5">
                        <label htmlFor="bannerButtonLink" className="form-label m-0">Banner Button Link*</label>
                    </div>
                    <div className="col-7">
                        <input
                            type="url"
                            className={`form-control ${validationErrorData.bannerButtonLink ? `is-invalid` : ``}`}
                            id="bannerButtonLink"
                            onChange={e => setBannerButtonLink(e.target.value)}
                            value={bannerButtonLink}
                        />
                    </div>

                    <div className="col-5">
                        <label htmlFor="bannerText" className="form-label mb-5">Banner Text*</label>
                    </div>
                    <div className="col-7">
                        <textarea
                            id="bannerText"
                            className={`form-control ${validationErrorData.bannerText ? `is-invalid` : ``}`}
                            onChange={e => setBannerText(e.target.value)} value={bannerText}
                        ></textarea>
                    </div>

                    <div className="col-5">
                        <label htmlFor="bannerImage" className="form-label m-0">Banner Image*</label>
                    </div>
                    <div className="col-7">
                        <input type="file" id="bannerImage" className="d-none" accept="image/*"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setBannerImageUrl(reader.result as string); // Set the image data URL
                                    };
                                    reader.readAsDataURL(file);
                                    setBannerImage(file);
                                }
                            }}
                        />
                        {!bannerImageUrl && (
                            <label
                                htmlFor="bannerImage"
                                className={`d-flex justify-content-center align-items-center bg-light border text-dark rounded-3 m-0 ${validationErrorData.bannerImage ? `border-danger` : ``} `}
                                style={{ height: "100px", cursor: "pointer" }}
                            >
                                Click To Upload Image
                            </label>
                        )}
                        {bannerImageUrl && (
                            <>
                                <img src={bannerImageUrl} alt="Deals Banner Image" className="img-fluid rounded-3" />
                                <button
                                    className="btn btn-link text-danger p-0 m-0"
                                    onClick={() => {
                                        setBannerImageUrl(undefined);
                                        setBannerImage(undefined);
                                    }}
                                >
                                    Remove Image
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={modalToggle} disabled={isLoading}>Cancel</Button> {' '}
                <Button color="primary" onClick={e => {
                    dealsBannerAction();
                }} disabled={isLoading}>
                    Save
                </Button>
            </ModalFooter>
        </Modal>
    </div>
}

export default DealsBannerAdmin;