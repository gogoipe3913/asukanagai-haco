// Templates.tsx
import React, { useState, useCallback } from "react";
import style from "./style.module.scss";
import Works from "../organisms/Works";
import Loading from "../atoms/Loading";
import SideColumn from "../organisms/SideColumn";

const Templates: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isLoadedFirstImage, setIsLoadedFirstImage] = useState(false);

  // Works から進捗(0-100)を受け取る
  const handleProgress = useCallback((p: number) => {
    setProgress((prev) => (p > prev ? p : prev)); // 逆戻り防止
  }, []);

  // Works から「初期表示分の画像がすべて読み終わった」通知を受け取る
  const handleLoaded = useCallback(() => {
    setIsLoadedFirstImage(true);
    setProgress(100);
  }, []);

  return (
    <>
      <Loading isLoadedFirstImage={isLoadedFirstImage} progress={progress} />
      <div className={style.Templates}>
        <SideColumn
          isLoaded={isLoadedFirstImage}
          className={style.Templates__sideColumn}
        />
        <div className={style.Templates__mainColumn}>
          <Works
            onFirstViewProgress={handleProgress}
            onFirstViewLoaded={handleLoaded}
          />
        </div>
      </div>
    </>
  );
};

export default Templates;
