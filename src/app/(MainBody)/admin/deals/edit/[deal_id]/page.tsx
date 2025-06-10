"use client";

import withAuth from "@/Components/WithAuth/WithAuth";
import DealFormComponent from "@/Components/Applications/Deal/Admin/DealForm";
import { getDeal, updateDeal, UpdateDealArgsInterface } from "@/DbClient";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
import LoadingIcon from "@/CommonComponent/LoadingIcon";

const DealsEditAdmin = () => {

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [dealID, setDealID] = useState<number>();
    const [dealData, setDealData] = useState<any>();
    const { deal_id } = useParams();

    const fetchDealDetails = async () => {
        if (!dealID) return;
        setIsLoading(true);
        const dealDetails = await getDeal(dealID, true);
        if (!dealDetails) {
            toast.error("Deal is not found");
            setIsLoading(false);
            router.push(`/admin/deals`);
        }

        const {
            dealImageURL: imageURL,
            deal_action_value: dealActionValue,
            deal_type: dealType,
            description,
            discount_text: discountText,
            end_date: endDate,
            name: dealName,
            regular_price: regularPrice,
            sale_price: salePrice,
            slug: dealSlug,
            small_description: smallDescription,
            start_date: startDate,
            status: dealStatus,
            terms_and_conditions: termsAndConditions,
            categories,
            deal_website_url: dealWebsiteURL,
            is_featured: isFeatured
        } = dealDetails;

        let dealCategories = [];

        if (categories && categories.length > 0) dealCategories = categories.map((data: { category_id: any; }) => data.category_id);

        setDealData({
            dealID,
            imageURL,
            dealActionValue,
            dealType,
            description,
            discountText,
            endDate,
            dealName,
            regularPrice,
            salePrice,
            dealSlug,
            smallDescription,
            startDate,
            dealStatus,
            termsAndConditions,
            dealCategories,
            dealWebsiteURL,
            isFeatured
        });
        setIsLoading(false);
    }

    const formSubmit = async (data: any) => {
        if (!dealID) return;
        setIsLoading(true);

        const { dealName: name, dealSlug: slug, description, termsAndConditions, smallDescription, dealType, dealActionValue, dealStatus, authorID, regularPrice, salePrice, discountText, dealCategories: categories, dealImage, startDate, endDate, dealWebsiteURL, isFeatured } = data;
        const updateDealArgs: UpdateDealArgsInterface = {}

        if (name) updateDealArgs.name = name;
        if (slug) updateDealArgs.slug = slug;
        if (dealType) updateDealArgs.dealType = dealType;
        if (dealActionValue) updateDealArgs.dealActionValue = dealActionValue;
        if (description) updateDealArgs.description = description;
        if (termsAndConditions) updateDealArgs.termsAndConditions = termsAndConditions;
        if (smallDescription) updateDealArgs.smallDescription = smallDescription;
        if (typeof dealStatus !== "undefined") updateDealArgs.dealStatus = dealStatus;
        if (regularPrice) updateDealArgs.regularPrice = parseFloat(regularPrice);
        if (salePrice) updateDealArgs.salePrice = parseFloat(salePrice);
        if (discountText) updateDealArgs.discountText = discountText;
        if (categories && categories.length > 0) updateDealArgs.categories = categories;
        if (dealImage) updateDealArgs.dealImage = dealImage;
        if (startDate) updateDealArgs.startDate = new Date(startDate);
        if (endDate) updateDealArgs.endDate = new Date(endDate);
        if (dealWebsiteURL) updateDealArgs.dealWebsiteURL = dealWebsiteURL;
        if (typeof dealStatus !== "undefined") updateDealArgs.isFeatured = isFeatured;

        const addDealStatus = await updateDeal(dealID, updateDealArgs);
        if (!addDealStatus) {
            toast.error("Something is wrong! deal is not updated, please try again.");
            setIsLoading(false);
            return;
        }

        toast.success("Deal updated successfully.");
        setIsLoading(false);
    }

    useEffect(() => {
        fetchDealDetails();
    }, [dealID])

    useEffect(() => {
        if (deal_id) {
            const dealIDAsString = deal_id as string;
            setDealID(parseInt(dealIDAsString, 10));
        }
    }, [deal_id]);

    return <div className="deals-edit col-12 position-relative">
        {isLoading &&
            <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                <div className="custom-loader">
                    <LoadingIcon withOverlap={true} />
                </div>
            </div>
        }
        <DealFormComponent dealData={dealData} onSubmit={formSubmit} />
    </div>;
}

export default withAuth(DealsEditAdmin);