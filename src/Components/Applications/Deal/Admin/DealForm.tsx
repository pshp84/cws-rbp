"use client";

import dynamic from "next/dynamic";

const CustomEditor = dynamic(() => import("@/CommonComponent/CKEditor"), {
  ssr: false,
});

import { useEffect, useState } from "react";
import { Card, CardBody, CardFooter, CardHeader, InputGroup } from "reactstrap";
import {
  addDealCategory,
  DealType,
  deleteDeal,
  getDealCategories,
} from "@/DbClient";
import Link from "next/link";
import { toast } from "react-toastify";
import { createSlug } from "@/Helper/commonHelpers";
import { useRouter } from "next/navigation";

interface DealFormComponentProps {
  dealData?: any;
  onSubmit: (formData: any) => void;
}

const DealFormComponent: React.FC<DealFormComponentProps> = ({
  dealData,
  onSubmit,
}) => {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [dealID, setDealID] = useState();
  const [dealName, setDealName] = useState("");
  const [dealSlug, setDealSlug] = useState("");
  const [description, setDescription] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [smallDescription, setSmallDescription] = useState("");
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [dealImage, setDealImage] = useState<File | null>(null);
  const [dealType, setDealType] = useState<DealType>(DealType.Affiliate);
  const [dealActionValue, setDealActionValue] = useState("");
  const [dealWebsiteURL, setDealWebsiteURL] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dealStatus, setDealStatus] = useState<boolean>(true);
  const [authorID, setAuthorID] = useState(
    "c10ba24b-3465-4b8c-9b3e-704e3c4885af"
  );
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [discountText, setDiscountText] = useState("");
  const [categories, setCategories] = useState<Array<any>>([]);
  const [dealCategories, setDealCategories] = useState<Array<number>>([]);
  const [addNewCategoryName, setAddNewCategoryName] = useState("");
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isCategorySubmitted, setIsCategorySubmitted] = useState<boolean>(false);

  const fetchDealCategories = async () => {
    setLoadingCategories(true);
    const dealCategoriesData = await getDealCategories();
    if (!dealCategoriesData) {
      setCategories([]);
      setLoadingCategories(false);
      return;
    }
    setCategories(dealCategoriesData);
    setLoadingCategories(false);
    return;
  };

  const saveNewCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCategorySubmitted(true);
    if (addNewCategoryName == "") {
      toast.error("Category name is require");
      setIsCategorySubmitted(false);
      return;
    }

    setLoadingCategories(true);

    const addDealCategoryStatus = await addDealCategory({
      name: addNewCategoryName,
      slug: createSlug(addNewCategoryName),
    });

    if (!addDealCategoryStatus) {
      toast.error("Something is wrong! please try again");
      setLoadingCategories(false);
      setIsCategorySubmitted(false);
      return;
    }

    fetchDealCategories();
    setAddNewCategoryName("");
    setIsCategorySubmitted(false);
    toast.success("Category added successfully.");
    return;
  };

  const handleSave = () => {
    let shouldProceed = true;

    if (dealName == "") {
      toast.error("Deal name is required.");
      shouldProceed = false;
    }

    if (dealSlug == "") {
      toast.error("Deal slag is required.");
      shouldProceed = false;
    }

    // if (dealWebsiteURL == "") {
    //     toast.error(`Affilate URL is require`);
    //     shouldProceed = false;
    // }

    if (!shouldProceed) return;

    const formData = {
      dealName,
      dealSlug,
      description,
      termsAndConditions,
      smallDescription,
      dealType,
      dealActionValue,
      dealStatus,
      authorID,
      regularPrice,
      salePrice,
      discountText,
      dealCategories,
      dealImage,
      startDate,
      endDate,
      dealWebsiteURL,
      isFeatured,
    };
    onSubmit(formData);
  };

  const deleteDealAction = async () => {
    if (isDeleting) return;
    if (!dealID) return;
    if (!confirm("Are you sure you want to delete this deal?")) return;
    setIsDeleting(true);

    const deleteDealStatus = await deleteDeal(dealID);

    if (!deleteDealStatus) {
      toast.error("Something is wrong! deal was not deleted");
      setIsDeleting(false);
      return;
    }

    router.push(`/admin/deals`);
    toast.success("Deal deleted successfully.");
    setIsDeleting(false);
    return;
  };

  useEffect(() => {
    if (dealData) {
      setDealID(dealData.dealID || null);
      setDealName(dealData.dealName || "");
      setDealSlug(dealData.dealSlug || "");
      setDescription(dealData.description || "");
      setTermsAndConditions(dealData.termsAndConditions || "");
      setSmallDescription(dealData.smallDescription || "");
      setImageURL(dealData.imageURL || "");
      setDealType(dealData.dealType || DealType.Affiliate);
      setDealActionValue(dealData.dealActionValue || "");
      setStartDate(dealData.startDate || "");
      setEndDate(dealData.endDate || "");
      setDealStatus(dealData.dealStatus ?? true);
      setAuthorID(dealData.authorID || "");
      setRegularPrice(dealData.regularPrice || 0);
      setSalePrice(dealData.salePrice || 0);
      setDiscountText(dealData.discountText || "");
      setDealCategories(dealData.dealCategories || []);
      setDealWebsiteURL(dealData.dealWebsiteURL || "");
      if (typeof dealData.isFeatured == "boolean") {
        setIsFeatured(dealData.isFeatured);
      }
    }
  }, [dealData]);

  useEffect(() => {
    fetchDealCategories();
  }, []);

  return (
    <>
      <div className="row mb-5">
        {isDeleting ? (
          <>
            <div
              className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0"
              style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
            >
              Loading...
            </div>

            <div className="col-md-8 col-lg-8">
              <Card className="mb-4">
                <CardHeader>General Details</CardHeader>
                <CardBody>
                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="dealTitleInput">Title*:</label>
                      <input
                        type="text"
                        id="dealTitleInput"
                        className="form-control"
                        required
                        onChange={(e) => {
                          setDealName(e.target.value);
                          setDealSlug(createSlug(e.target.value));
                        }}
                        value={dealName}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="dealSlugInput">Slug*:</label>
                      <input
                        type="text"
                        id="dealSlugInput"
                        className="form-control"
                        required
                        onChange={(e) => setDealSlug(e.target.value)}
                        value={dealSlug}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="dealSummaryInput">Summary:</label>
                    <textarea
                      id="dealSummaryInput"
                      className="form-control"
                      rows={4}
                      onChange={(e) => setSmallDescription(e.target.value)}
                      value={smallDescription}
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="">Description:</label>
                    <CustomEditor
                      editorText={description || ""}
                      onChangeText={(data) => setDescription(data)}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>Deal Details</CardHeader>
                <CardBody>
                  {/* <div className="d-flex align-content-center gap-3 mb-3">
                        <label htmlFor="">Deal Type:</label>
                        <div className="d-flex flex-row gap-2">
                            <label className="m-0 d-flex align-items-center gap-1" htmlFor="dealTypeAffilate">
                                <input type="radio" name="dealType" id="dealTypeAffilate" checked={dealType === DealType.Affiliate} onChange={() => setDealType(DealType.Affiliate)} />
                                <span>Affilate</span>
                            </label>
                            <label className="m-0 d-flex align-items-center gap-1" htmlFor="dealTypeCoupon">
                                <input type="radio" name="dealType" id="dealTypeCoupon" checked={dealType === DealType.Coupon} onChange={() => setDealType(DealType.Coupon)} />
                                <span>Coupon</span>
                            </label>
                        </div>
                    </div> */}

                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="dealWebsiteURL">Affilate URL*:</label>
                      <input
                        type="url"
                        id="dealWebsiteURL"
                        className="form-control"
                        required
                        value={dealWebsiteURL}
                        onChange={(e) => setDealWebsiteURL(e.target.value)}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="dealActionValue">Coupon Code:</label>
                      <input
                        type="text"
                        id="dealActionValue"
                        className="form-control"
                        value={dealActionValue}
                        onChange={(e) => setDealActionValue(e.target.value)}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="discountText">Discount Text:</label>
                      <input
                        type="text"
                        id="discountText"
                        className="form-control"
                        placeholder="Example: 70% off"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="regularPrice">Start Date:</label>
                      <input
                        type="date"
                        className="form-control"
                        placeholder="From"
                        onClick={(e: any) => e.target.showPicker()}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="salePrice">End Date:</label>
                      <input
                        type="date"
                        className="form-control"
                        placeholder="To"
                        onClick={(e: any) => e.target.showPicker()}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="regularPrice">Regular Price:</label>
                      <input
                        type="number"
                        id="regularPrice"
                        min={0}
                        className="form-control"
                        value={regularPrice}
                        onChange={(e) =>
                          setRegularPrice(parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="salePrice">Discount Price:</label>
                      <input
                        type="number"
                        id="salePrice"
                        className="form-control"
                        min={0}
                        value={salePrice}
                        onChange={(e) =>
                          setSalePrice(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="">Terms and Conditions:</label>
                    <CustomEditor
                      editorText={termsAndConditions || ""}
                      onChangeText={(data) => setTermsAndConditions(data)}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
            <div className="col-md-4 col-lg-4">
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <label className="m-0" style={{ width: "85px" }}>
                      Status:
                    </label>
                    <div className="d-flex flex-row gap-2">
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealStatusActive"
                      >
                        <input
                          type="radio"
                          name="dealStatus"
                          id="dealStatusActive"
                          checked={dealStatus}
                          onChange={() => setDealStatus(true)}
                        />
                        <span>Active</span>
                      </label>
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealStatusInactive"
                      >
                        <input
                          type="radio"
                          name="dealStatus"
                          id="dealStatusInactive"
                          checked={!dealStatus}
                          onChange={() => setDealStatus(false)}
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <label className="m-0" style={{ width: "85px" }}>
                      Is featured:
                    </label>
                    <div className="d-flex flex-row gap-2">
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealIsFeaturedYes"
                      >
                        <input
                          type="radio"
                          name="dealIsFeatured"
                          id="dealIsFeaturedYes"
                          checked={isFeatured}
                          onChange={() => setIsFeatured(true)}
                        />
                        <span>Yes</span>
                      </label>
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealIsFeaturedNo"
                      >
                        <input
                          type="radio"
                          name="dealIsFeatured"
                          id="dealIsFeaturedNo"
                          checked={!isFeatured}
                          onChange={() => setIsFeatured(false)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </CardBody>
                <CardFooter className="d-flex gap-2 align-items-center">
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save
                  </button>
                  <Link href="/admin/deals" className="btn btn-outline-primary">
                    Back
                  </Link>
                  {dealID && (
                    <button
                      className="btn btn-link text-danger m-0 p-0"
                      onClick={deleteDealAction}
                    >
                      {isDeleting ? "Deleting.." : "Delete"}
                    </button>
                  )}
                </CardFooter>
              </Card>

              <Card className="mb-4">
                <CardHeader>Deal Image</CardHeader>
                <CardBody>
                  <input
                    type="file"
                    name="dealImage"
                    id="dealImage"
                    className="d-none"
                    accept="image/*"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageURL(reader.result as string); // Set the image data URL
                        };
                        reader.readAsDataURL(file);
                        setDealImage(file);
                      }
                    }}
                  />
                  {!imageURL && (
                    <label
                      htmlFor="dealImage"
                      className="d-flex justify-content-center align-items-center border bg-light text-dark rounded-3 m-0"
                      style={{ height: "150px", cursor: "pointer" }}
                    >
                      Click To Upload Image
                    </label>
                  )}
                  {imageURL && (
                    <img
                      src={imageURL}
                      alt="Deal image"
                      className="img-fluid rounded-3"
                    />
                  )}
                </CardBody>
                {imageURL && (
                  <CardFooter>
                    <button
                      className="btn btn-link text-danger p-0 m-0"
                      onClick={() => {
                        setDealImage(null);
                        setImageURL(null);
                      }}
                    >
                      Remove Image
                    </button>
                  </CardFooter>
                )}
              </Card>

              <Card>
                <CardHeader>Categories</CardHeader>
                <CardBody className="position-relative">
                  {loadingCategories && (
                    <div
                      className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0"
                      style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
                    >
                      Loading Categories...
                    </div>
                  )}
                  {categories.length > 0 && (
                    <div
                      className="border bg-light text-dark rounded-3 w-100 overflow-auto py-2 px-3"
                      style={{ maxHeight: "150px" }}
                    >
                      <ul className="list-unstyled m-0 p-0">
                        {categories.map((category, categoryIndex) => {
                          return (
                            <li
                              key={`deal-form-category-list-${categoryIndex}`}
                            >
                              <label
                                className="m-0 d-flex align-items-center gap-2"
                                htmlFor={`dealCategory${category.category_id}`}
                              >
                                <input
                                  type="checkbox"
                                  id={`dealCategory${category.category_id}`}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDealCategories((prev) => [
                                        ...prev,
                                        category.category_id,
                                      ]);
                                    } else {
                                      setDealCategories((prev) =>
                                        prev.filter(
                                          (id) => id !== category.category_id
                                        )
                                      );
                                    }
                                  }}
                                  checked={dealCategories.includes(
                                    category.category_id
                                  )}
                                />
                                <span>{category.name}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {!loadingCategories && categories.length <= 0 && (
                    <div className="alert alert-warning rounded-3">
                      Categories not found, please add new category
                    </div>
                  )}
                </CardBody>
                <CardFooter className="position-relative">
                  {loadingCategories && (
                    <div
                      className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0"
                      style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
                    ></div>
                  )}
                  <form onSubmit={saveNewCategory}>
                    <InputGroup>
                      <input
                        type="text"
                        style={{ borderRadius: "0.25rem" }}
                        className="form-control form-control-sm"
                        placeholder="Category Name"
                        required
                        value={addNewCategoryName}
                        onChange={(e) => setAddNewCategoryName(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-outline-primary btn-sm ms-2 button-active"
                      >
                        Add
                      </button>
                    </InputGroup>
                  </form>
                </CardFooter>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="col-md-8 col-lg-8">
              <Card className="mb-4">
                <CardHeader>General Details</CardHeader>
                <CardBody>
                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="dealTitleInput">Title*:</label>
                      <input
                        type="text"
                        id="dealTitleInput"
                        className="form-control"
                        required
                        onChange={(e) => {
                          setDealName(e.target.value);
                          setDealSlug(createSlug(e.target.value));
                        }}
                        value={dealName}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="dealSlugInput">Slug*:</label>
                      <input
                        type="text"
                        id="dealSlugInput"
                        className="form-control"
                        required
                        onChange={(e) => setDealSlug(e.target.value)}
                        value={dealSlug}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="dealSummaryInput">Summary:</label>
                    <textarea
                      id="dealSummaryInput"
                      className="form-control"
                      rows={4}
                      onChange={(e) => setSmallDescription(e.target.value)}
                      value={smallDescription}
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="">Description:</label>
                    <CustomEditor
                      editorText={description || ""}
                      onChangeText={(data) => setDescription(data)}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>Deal Details</CardHeader>
                <CardBody>
                  {/* <div className="d-flex align-content-center gap-3 mb-3">
                        <label htmlFor="">Deal Type:</label>
                        <div className="d-flex flex-row gap-2">
                            <label className="m-0 d-flex align-items-center gap-1" htmlFor="dealTypeAffilate">
                                <input type="radio" name="dealType" id="dealTypeAffilate" checked={dealType === DealType.Affiliate} onChange={() => setDealType(DealType.Affiliate)} />
                                <span>Affilate</span>
                            </label>
                            <label className="m-0 d-flex align-items-center gap-1" htmlFor="dealTypeCoupon">
                                <input type="radio" name="dealType" id="dealTypeCoupon" checked={dealType === DealType.Coupon} onChange={() => setDealType(DealType.Coupon)} />
                                <span>Coupon</span>
                            </label>
                        </div>
                    </div> */}

                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="dealWebsiteURL">Affilate URL*:</label>
                      <input
                        type="url"
                        id="dealWebsiteURL"
                        className="form-control"
                        required
                        value={dealWebsiteURL}
                        onChange={(e) => setDealWebsiteURL(e.target.value)}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="dealActionValue">Coupon Code:</label>
                      <input
                        type="text"
                        id="dealActionValue"
                        className="form-control"
                        value={dealActionValue}
                        onChange={(e) => setDealActionValue(e.target.value)}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="discountText">Discount Text:</label>
                      <input
                        type="text"
                        id="discountText"
                        className="form-control"
                        placeholder="Example: 70% off"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="regularPrice">Start Date:</label>
                      <input
                        type="date"
                        className="form-control"
                        placeholder="From"
                        onClick={(e: any) => e.target.showPicker()}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="salePrice">End Date:</label>
                      <input
                        type="date"
                        className="form-control"
                        placeholder="To"
                        onClick={(e: any) => e.target.showPicker()}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-content-center gap-3 mb-3">
                    <div className="flex-fill">
                      <label htmlFor="regularPrice">Regular Price:</label>
                      <input
                        type="number"
                        id="regularPrice"
                        min={0}
                        className="form-control"
                        value={regularPrice}
                        onChange={(e) =>
                          setRegularPrice(parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex-fill">
                      <label htmlFor="salePrice">Discount Price:</label>
                      <input
                        type="number"
                        id="salePrice"
                        className="form-control"
                        min={0}
                        value={salePrice}
                        onChange={(e) =>
                          setSalePrice(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="">Terms and Conditions:</label>
                    <CustomEditor
                      editorText={termsAndConditions || ""}
                      onChangeText={(data) => setTermsAndConditions(data)}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
            <div className="col-md-4 col-lg-4">
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <label className="m-0" style={{ width: "85px" }}>
                      Status:
                    </label>
                    <div className="d-flex flex-row gap-2">
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealStatusActive"
                      >
                        <input
                          type="radio"
                          name="dealStatus"
                          id="dealStatusActive"
                          checked={dealStatus}
                          onChange={() => setDealStatus(true)}
                        />
                        <span>Active</span>
                      </label>
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealStatusInactive"
                      >
                        <input
                          type="radio"
                          name="dealStatus"
                          id="dealStatusInactive"
                          checked={!dealStatus}
                          onChange={() => setDealStatus(false)}
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <label className="m-0" style={{ width: "85px" }}>
                      Is featured:
                    </label>
                    <div className="d-flex flex-row gap-2">
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealIsFeaturedYes"
                      >
                        <input
                          type="radio"
                          name="dealIsFeatured"
                          id="dealIsFeaturedYes"
                          checked={isFeatured}
                          onChange={() => setIsFeatured(true)}
                        />
                        <span>Yes</span>
                      </label>
                      <label
                        className="m-0 d-flex align-items-center gap-1"
                        htmlFor="dealIsFeaturedNo"
                      >
                        <input
                          type="radio"
                          name="dealIsFeatured"
                          id="dealIsFeaturedNo"
                          checked={!isFeatured}
                          onChange={() => setIsFeatured(false)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </CardBody>
                <CardFooter className="d-flex gap-2 align-items-center">
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save
                  </button>
                  <Link href="/admin/deals" className="btn btn-outline-primary">
                    Back
                  </Link>
                  {dealID && (
                    <button
                      className="btn btn-link text-danger m-0 p-0"
                      onClick={deleteDealAction}
                    >
                      {isDeleting ? "Deleting.." : "Delete"}
                    </button>
                  )}
                </CardFooter>
              </Card>

              <Card className="mb-4">
                <CardHeader>Deal Image</CardHeader>
                <CardBody>
                  <input
                    type="file"
                    name="dealImage"
                    id="dealImage"
                    className="d-none"
                    accept="image/*"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageURL(reader.result as string); // Set the image data URL
                        };
                        reader.readAsDataURL(file);
                        setDealImage(file);
                      }
                    }}
                  />
                  {!imageURL && (
                    <label
                      htmlFor="dealImage"
                      className="d-flex justify-content-center align-items-center border bg-light text-dark rounded-3 m-0"
                      style={{ height: "150px", cursor: "pointer" }}
                    >
                      Click To Upload Image
                    </label>
                  )}
                  {imageURL && (
                    <img
                      src={imageURL}
                      alt="Deal image"
                      className="img-fluid rounded-3"
                    />
                  )}
                </CardBody>
                {imageURL && (
                  <CardFooter>
                    <button
                      className="btn btn-link text-danger p-0 m-0"
                      onClick={() => {
                        setDealImage(null);
                        setImageURL(null);
                      }}
                    >
                      Remove Image
                    </button>
                  </CardFooter>
                )}
              </Card>

              <Card>
                <CardHeader>Categories</CardHeader>
                <CardBody className="position-relative">
                  {loadingCategories && (
                    <div
                      className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0"
                      style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
                    >
                      Loading Categories...
                    </div>
                  )}
                  {categories.length > 0 && (
                    <div
                      className="border bg-light text-dark rounded-3 w-100 overflow-auto py-2 px-3"
                      style={{ maxHeight: "150px" }}
                    >
                      <ul className="list-unstyled m-0 p-0">
                        {categories.map((category, categoryIndex) => {
                          return (
                            <li
                              key={`deal-form-category-list-${categoryIndex}`}
                            >
                              <label
                                className="m-0 d-flex align-items-center gap-2"
                                htmlFor={`dealCategory${category.category_id}`}
                              >
                                <input
                                  type="checkbox"
                                  id={`dealCategory${category.category_id}`}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDealCategories((prev) => [
                                        ...prev,
                                        category.category_id,
                                      ]);
                                    } else {
                                      setDealCategories((prev) =>
                                        prev.filter(
                                          (id) => id !== category.category_id
                                        )
                                      );
                                    }
                                  }}
                                  checked={dealCategories.includes(
                                    category.category_id
                                  )}
                                />
                                <span>{category.name}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {!loadingCategories && categories.length <= 0 && (
                    <div className="alert alert-warning rounded-3">
                      Categories not found, please add new category
                    </div>
                  )}
                </CardBody>
                <CardFooter className="position-relative">
                  {loadingCategories && (
                    <div
                      className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0"
                      style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
                    ></div>
                  )}
                  <form onSubmit={saveNewCategory}>
                    <InputGroup>
                      <input
                        type="text"
                        style={{ borderRadius: "0.25rem" }}
                        className="form-control form-control-sm"
                        placeholder="Category Name"
                        required
                        value={addNewCategoryName}
                        onChange={(e) => setAddNewCategoryName(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={isCategorySubmitted}
                        className="btn btn-sm ms-2 button-active outline-button-custom"
                      >
                        Add
                      </button>
                    </InputGroup>
                  </form>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DealFormComponent;
