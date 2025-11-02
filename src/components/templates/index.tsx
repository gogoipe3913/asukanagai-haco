import React, { useState } from "react";
import style from "./style.module.scss";
import Works from "../organisms/Works";
import Loading from "../atoms/Loading";
import SideColumn from "../organisms/SideColumn";

const Templates: React.FC = () => {
  // ファーストビューのステータス
  const [isLoaded, setIsLoaded] = useState(true);

  return (
    <>
      <Loading isLoadedFirstImage={isLoaded} />
      <div className={style.Templates}>
        <SideColumn
          isLoaded={isLoaded}
          className={style.Templates__sideColumn}
        />
        <div className={style.Templates__mainColumn}>
          <Works />
        </div>
      </div>
    </>
  );
};

export default Templates;
