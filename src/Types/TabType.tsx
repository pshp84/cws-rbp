export interface TabHeadingProps {
    activeTab: number,
    iconClassName: string,
    title: string,
}

export interface NavComponentProp {
    callbackActive: (val: number | undefined) => void;
    activeTab: number | undefined;
    userRole?: string | undefined;
}

export interface TabContentPropsType {
    activeTab: number | undefined;
    callbackActive: (val: number | undefined) => void;
    userId?: any;
}


export interface FormCallbackProp {
    callbackActive: (val: number | undefined) => void;
}