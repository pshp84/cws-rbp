import React from "react";

interface LoadingIcon {
    text?: string;
    textClassName?: string;
    iconClassName?: string;
    iconSize?: number;
    withOverlap?: boolean;
}

const LoadingIcon: React.FC<LoadingIcon> = (props) => {
    const { text, textClassName = "", iconClassName = "text-primary", withOverlap = false, iconSize = 4 } = props;

    if (withOverlap) {
        return <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-white-transparent z-index-5 top-0 start-0">{iconHTML(iconClassName, text, textClassName, iconSize)}</div>
    } else {
        return iconHTML(iconClassName, text, textClassName, iconSize)
    }
}

const iconHTML = (iconClassName: string | undefined, text: string | undefined, textClassName: string | undefined, iconSize: number = 4) => {
    return <div className="rbp-club-loader d-flex justify-content-center align-items-center gap-2">
        <i className={`fa fa-circle-o-notch fa-spin fs-${iconSize} ${iconClassName}`}></i>
        {text &&
            <h6 className={`m-0 ff-sora-medium ${textClassName}`}>{text}</h6>
        }
    </div>
}

export default LoadingIcon;