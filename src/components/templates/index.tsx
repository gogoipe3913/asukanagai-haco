import React from "react";
import style from "./style.module.scss";
import Works from "../organisms/Works";
import Loading from "../atoms/Loading";
import SideColumn from "../organisms/SideColumn";

const Templates: React.FC = () => {
  return (
    <>
      <Loading isLoadedFirstImage={true} />
      <div className={style.Templates}>
        <SideColumn isLoaded={true} className={style.Templates__sideColumn} />
        <div className={style.Templates__mainColumn}>
          <Works />
        </div>
      </div>
    </>
  );
};

export default Templates;
