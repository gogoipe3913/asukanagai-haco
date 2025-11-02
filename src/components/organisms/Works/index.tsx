import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "microcms-js-sdk";
import classNames from "classnames";
import style from "./style.module.scss";

type WorksItemImagesInterface = {
  url: string;
  width: string;
  height: string;
};

export type WorksItemDataInterface = {
  title: string;
  workCategory: string;
  category: string;
  createDate: string;
  images: WorksItemImagesInterface[];
};

type WorkItemsProps = WorksItemDataInterface & {
  setItemRef: (el: HTMLLIElement | null, index: number) => void;
  isVisible: boolean;
  index: number;
};

const REVEAL_INTERVAL_MS = 140; // 1つずつ出す間隔（好みで調整）

const WorkItem: React.FC<WorkItemsProps> = ({
  title,
  workCategory,
  category,
  images,
  setItemRef,
  isVisible,
  index,
}) => {
  return (
    // li 自体を観測するのでここで ref を渡す
    <li
      ref={(el) => setItemRef(el, index)}
      className={classNames(style.Works__item, {
        [style.isVisible]: isVisible,
      })}
    >
      <button className={style.Works__itemImageWrapper}>
        {images.map((image, i) =>
          i < 2 ? (
            <img
              key={i}
              src={image.url}
              alt={`${title}のサムネイル画像`}
              className={style.Works__itemImage}
              style={{
                aspectRatio: `${image.width} / ${image.height}`,
              }}
            />
          ) : null
        )}
      </button>
      <div className={style.Works__itemInfo}>
        <p className={style.Works__itemInfoTexts}>
          <span className={style.Works__itemInfoCategory}>{category}</span>
        </p>
        <h3 className={style.Works__itemInfoTitle}>{title}</h3>
        <span className={style.Works__itemInfoId}>{workCategory}</span>
      </div>
    </li>
  );
};

const Works: React.FC = () => {
  const [worksData, setWorksData] = useState<WorksItemDataInterface[]>([]);
  // 各アイテムの表示状態
  const [visibleMap, setVisibleMap] = useState<Record<number, boolean>>({});
  // DOM 参照を保持
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  // すでに「表示予定（または表示済み）」として確定したかどうか
  const lockedSetRef = useRef<Set<number>>(new Set());
  // 「可視になったら並ぶ」キュー
  const queueRef = useRef<number[]>([]);
  // キューを処理中かどうか
  const tickingRef = useRef(false);

  const serviceDomain = import.meta.env.VITE_SERVICE_DOMAIN;
  const apiKey = import.meta.env.VITE_API_KEY;
  const client = useMemo(
    () =>
      createClient({
        serviceDomain,
        apiKey,
      }),
    [serviceDomain, apiKey]
  );

  // データ取得
  useEffect(() => {
    client
      .get({
        endpoint: "works",
        queries: { limit: 50, orders: "-createDate" }, // 新しい順など好みで
      })
      .then((res) => {
        const data = res.contents as WorksItemDataInterface[];
        setWorksData(data);
        // 初期化
        setVisibleMap({});
        itemRefs.current = [];
        lockedSetRef.current.clear();
        queueRef.current = [];
      })
      .catch((err) => console.log(err));
  }, [client]);

  // IntersectionObserver を一度だけ作る
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      // フォールバック：全部表示
      setVisibleMap((prev) => {
        const next: Record<number, boolean> = { ...prev };
        worksData.forEach((_, i) => (next[i] = true));
        return next;
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLLIElement;
          const idxAttr = target.getAttribute("data-work-index");
          if (!idxAttr) return;
          const index = Number(idxAttr);

          // すでに確定しているなら無視
          if (lockedSetRef.current.has(index)) return;

          if (entry.isIntersecting) {
            // 可視になったらキューに積む（重複ガード）
            lockedSetRef.current.add(index); // 一度だけ入れる
            queueRef.current.push(index);
            processQueue(); // 処理開始／継続
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px", // ちょい手前で検知
        threshold: 0.1,
      }
    );

    // 既に持っている参照を監視
    itemRefs.current.forEach((el) => el && io.observe(el));

    return () => {
      io.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksData.length]);

  // キューを一定間隔で 1 件ずつ表示
  const processQueue = () => {
    if (tickingRef.current) return;
    tickingRef.current = true;

    const tick = () => {
      const nextIndex = queueRef.current.shift();
      if (typeof nextIndex === "number") {
        setVisibleMap((prev) => ({ ...prev, [nextIndex]: true }));
        setTimeout(tick, REVEAL_INTERVAL_MS);
      } else {
        tickingRef.current = false;
      }
    };

    tick();
  };

  // 子から渡す ref セッター
  const setItemRef = (el: HTMLLIElement | null, index: number) => {
    if (el) {
      el.setAttribute("data-work-index", String(index));
      itemRefs.current[index] = el;
    }
  };

  return (
    <div id="works" className={classNames(style.Works)}>
      <h2 className={style.Works__title}>
        <span className={style.Works__titleBody}>Works</span>
      </h2>

      <ul className={style.Works__items}>
        {worksData.map((item, index) => {
          const frag =
            index % 3 === 0 ? (
              <React.Fragment key={`frag-${index}`}>
                <div id={`forResizingByLenis${index / 3}`} />
                <WorkItem
                  key={index}
                  index={index}
                  {...item}
                  setItemRef={setItemRef}
                  isVisible={!!visibleMap[index]}
                />
              </React.Fragment>
            ) : (
              <WorkItem
                key={index}
                index={index}
                {...item}
                setItemRef={setItemRef}
                isVisible={!!visibleMap[index]}
              />
            );

          return frag;
        })}
      </ul>
    </div>
  );
};

export default Works;
