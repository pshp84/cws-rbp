import { addUtmCampaign, addUtmCampaignArgs, addUtmEvent, addUtmEventArgs, getUtmCampaignID, getUtmCampaignIDArgs, getUtmEvents, getUtmEventsArgs, UtmEventType } from "@/DbClient";
import ipify from "ipify2";

export const removeUTMParamsFromLS = () => {
    localStorage.removeItem('utm_params');
    localStorage.removeItem('utm_id');
    localStorage.removeItem('utm_event_id');
}

export const captureUTMParams = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = ['utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const capturedParams: any = {};

    utmParams.forEach(param => {
        if (urlParams.get(param)) {
            capturedParams[param] = urlParams.get(param);
            urlParams.delete(param);
        }
    });

    if (Object.keys(capturedParams).length > 0) {
        // Store UTM parameters in localStorage
        removeUTMParamsFromLS();
        localStorage.setItem('utm_params', JSON.stringify(capturedParams));

        const getUtmCampaignIDArgs: getUtmCampaignIDArgs = {};
        if (capturedParams.utm_campaign) getUtmCampaignIDArgs.campaign = capturedParams.utm_campaign;
        if (capturedParams.utm_id) getUtmCampaignIDArgs.campaignID = capturedParams.utm_id;
        if (capturedParams.utm_medium) getUtmCampaignIDArgs.medium = capturedParams.utm_medium;
        if (capturedParams.utm_source) getUtmCampaignIDArgs.source = capturedParams.utm_source;
        if (capturedParams.utm_content) getUtmCampaignIDArgs.content = capturedParams.utm_content;

        let utmID: string = '';
        let utmEventID: string = '';

        const utmCampaignData = await getUtmCampaignID(getUtmCampaignIDArgs);
        if (typeof utmCampaignData !== 'boolean') {
            utmID = utmCampaignData.toString();
        } else {
            const insertData: addUtmCampaignArgs = {
                campaign: capturedParams.utm_campaign,
                campaignID: capturedParams.utm_id,
                medium: capturedParams.utm_medium,
                source: capturedParams.utm_source
            };
            if (capturedParams.utm_content) insertData.content = capturedParams.utm_content;
            if (capturedParams.utm_term) insertData.term = capturedParams.utm_term;
            const addUtmCampaignData = await addUtmCampaign(insertData);

            if (typeof addUtmCampaignData !== 'boolean') {
                utmID = addUtmCampaignData.utm_id?.toString() || '';
            }
        }

        if (utmID !== '') {
            localStorage.setItem('utm_id', utmID);
            // Update the URL without reloading the page
            const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
            window.history.replaceState({}, document.title, newUrl);

            const lsUtmEventID = localStorage.getItem("utm_event_id");
            if (!lsUtmEventID || lsUtmEventID == "") {
                try {
                    const user_ip = await ipify.ipv4();
                    const utmIDNumber = parseInt(utmID)
                    const getUtmEventsArgs: getUtmEventsArgs = {
                        utmID: utmIDNumber,
                        event: UtmEventType.LinkView,
                        userIP: user_ip,
                        limit: 1
                    }
                    const eventData = await getUtmEvents(getUtmEventsArgs);

                    if (typeof eventData == "boolean" || !eventData.status) {
                        const addUtmEventArgs: addUtmEventArgs = {
                            eventType: UtmEventType.LinkView,
                            utmID: utmIDNumber,
                            userIP: user_ip
                        }
                        const utmEventData = await addUtmEvent(addUtmEventArgs);
                        if (typeof utmEventData != "boolean") {
                            utmEventID = utmEventData.event_id?.toString() || "";
                        }
                    } else {
                        const { status, data } = eventData;
                        if (status === true) {
                            utmEventID = data?.map(data => data.event_id)[0];
                        }
                    }

                    if (utmEventID != "") {
                        localStorage.setItem('utm_event_id', utmEventID);
                    }

                } catch (error) {
                    console.error('Failed to fetch IP address:', error.message);
                }
            }
        }
    }
}