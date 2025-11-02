import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import classNames from "classnames";

type LoadingProps = {
  isLoadedFirstImage: boolean;
  progress: number;
};

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

const Loading: React.FC<LoadingProps> = ({ isLoadedFirstImage, progress }) => {
  const [isDisplayed, setIsDisplayed] = useState(true);
  const [displayed, setDisplayed] = useState(0);
  const [shouldFade, setShouldFade] = useState(false);

  // 進捗を滑らかに追従
  useEffect(() => {
    const target = clamp(progress);
    if (target <= displayed) return;

    let raf = 0;
    const start = performance.now();
    const startVal = displayed;
    const delta = target - startVal;
    const duration = Math.min(700, 80 * delta);

    const tick = (t: number) => {
      const e = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - e, 3);
      setDisplayed(Math.round(startVal + delta * eased));
      if (e < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  // 100%になったら0.8秒待ってフェードアウト
  useEffect(() => {
    if (!isLoadedFirstImage || displayed < 100 || shouldFade) return;

    const holdTimer = setTimeout(() => {
      setShouldFade(true);
    }, 800);

    return () => clearTimeout(holdTimer);
  }, [isLoadedFirstImage, displayed, shouldFade]);

  // フェード完了後にDOMを外す
  useEffect(() => {
    if (!shouldFade) return;
    const hideTimer = setTimeout(() => setIsDisplayed(false), 500);
    return () => clearTimeout(hideTimer);
  }, [shouldFade]);

  if (!isDisplayed) return null;

  return (
    <div
      className={classNames(
        style.Loading,
        shouldFade ? style["Loading--end"] : ""
      )}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${displayed}%`}
    >
      <div className={style.Loading__logo}>haco</div>
      <div className={style.Loading__textWrapper}>
        <p className={style.Loading__text}>Now Loading</p>
        {/* 下線の伸び率をインラインスタイルで制御 */}
        <div
          className={style.Loading__underline}
          style={{
            transform: `scaleX(${displayed / 100})`,
          }}
        />
      </div>
      <p className={style.Loading__percent}>{displayed}%</p>
    </div>
  );
};

export default Loading;
