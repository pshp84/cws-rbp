import { getUploadedFileUrl, getOption } from "@/DbClient";

export interface dealsBannerInterface {
    bannerTitle: string;
    bannerText: string;
    bannerButtonText: string;
    bannerButtonLink: string;
    bannerImage: string;
    bannerImageURL?: string;
}

export const getDealsBanner = async (): Promise<boolean | Array<dealsBannerInterface>> => {
    const data = await getOption('dealsBanner', true);
    if (typeof data == "boolean") {
        return false;
    }
    if (data == "") return false;
    let listData = JSON.parse(data);
    listData = await updateDataWithImageURLs(listData);
    return listData;
}

const updateDataWithImageURLs = async (dealsBannerData: any) => {
    const updatedData = await Promise.all(
        dealsBannerData.map(async (deal: any) => {
            const { bannerImage } = deal;
            if (bannerImage) {
                const bannerImageURL = await getUploadedFileUrl(bannerImage, {
                    width: 150,
                    height: 100
                });
                return bannerImageURL ? { ...deal, bannerImageURL } : deal;
            }
            return deal;
        })
    );
    return updatedData;
};