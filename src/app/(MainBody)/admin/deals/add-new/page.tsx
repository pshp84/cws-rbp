"use client";

import DealFormComponent from "@/Components/Applications/Deal/Admin/DealForm";
import withAuth from "@/Components/WithAuth/WithAuth";
import { addDeal, AddDealArgsInterface } from "@/DbClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import LoadingIcon from "@/CommonComponent/LoadingIcon";

const DealsAddNewAdmin = () => {

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const formSubmit = async (data: any) => {
        setIsLoading(true);

        const { dealName: name, dealSlug: slug, description, termsAndConditions, smallDescription, dealType, dealActionValue, dealStatus, authorID, regularPrice, salePrice, discountText, dealCategories: categories, dealImage, startDate, endDate, dealWebsiteURL, isFeatured } = data;
        const addDealArgs: AddDealArgsInterface = {
            name,
            slug,
            authorID,
            dealType,
            dealActionValue
        }

        if (description) addDealArgs.description = description;
        if (termsAndConditions) addDealArgs.termsAndConditions = termsAndConditions;
        if (smallDescription) addDealArgs.smallDescription = smallDescription;
        if (typeof dealStatus !== "undefined") addDealArgs.dealStatus = dealStatus;
        if (regularPrice) addDealArgs.regularPrice = parseFloat(regularPrice);
        if (salePrice) addDealArgs.salePrice = parseFloat(salePrice);
        if (discountText) addDealArgs.discountText = discountText;
        if (categories && categories.length > 0) addDealArgs.categories = categories;
        if (dealImage) addDealArgs.dealImage = dealImage;
        if (startDate) addDealArgs.startDate = new Date(startDate);
        if (endDate) addDealArgs.endDate = new Date(endDate);
        if (dealWebsiteURL) addDealArgs.dealWebsiteURL = dealWebsiteURL;
        if (typeof isFeatured == "boolean") addDealArgs.isFeatured = isFeatured;        

        const addDealStatus = await addDeal(addDealArgs);
        if (!addDealStatus) {
            toast.error("Something is wrong! deal is not added, please try again.");
            setIsLoading(false);
            return;
        }

        const { deal_id: dealID } = addDealStatus;
        toast.success("Deal added successfully.");
        setIsLoading(false);
        router.push(`/admin/deals/edit/${dealID}`);
    }

    return <div className="deals-add-new col-12 position-relative">
        {isLoading &&
            <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                <div className="custom-loader">
                    <LoadingIcon withOverlap={true} />
                </div>
            </div>
        }
        <DealFormComponent onSubmit={formSubmit} />
    </div>;
};

export default withAuth(DealsAddNewAdmin);
