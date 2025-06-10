import ConfigDB from "@/Config/ThemeConfig";
import { LanguagesData } from "@/Data/Layout";
import { ChangeLngType } from "@/Types/LayoutTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const Languages = () => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage;
  const [selectedLang, setSelectedLang] = useState<any>({});
  const changeLanguage = (item: ChangeLngType) => i18n.changeLanguage(item.data);
  useEffect(() => {
    const defaultLanguage = LanguagesData.find((data) => data.data == currentLanguage);
    setSelectedLang(defaultLanguage);
    router.refresh();
  }, []);
  useEffect(() => {
    if (currentLanguage === "ae") {
      document.body.classList.add("rtl");
      document.body.classList.remove("ltr");
      document.body.classList.remove("box-layout");
      document.documentElement.dir = "rtl";
      ConfigDB.data.settings.layout_type = "rtl";
    } else {
      document.body.classList.add("ltr");
      document.body.classList.remove("rtl");
      document.body.classList.remove("box-layout");
      document.documentElement.dir = "ltr";
      ConfigDB.data.settings.layout_type = "ltr";
    }
  }, [currentLanguage]);

  return (
    <li className="onhover-dropdown">
      <div className="cart-box text-uppercase f-w-700">{currentLanguage}</div>
      <div className="language-dropdown onhover-show-div language-width">
        <ul className="language-list">
          {LanguagesData.map((item, i) => (
            <li className="p-0" key={i} onClick={() => changeLanguage(item)}>
              <a className="text-decoration-none" data-lng={item.data}>
                <i className={item.logo} /> {item.language}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};

export default Languages;
