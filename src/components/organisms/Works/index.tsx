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
  category: string[] | string;
  createDate: string;
  images: WorksItemImagesInterface[];
};

type WorksProps = {
  onFirstViewProgress?: (percent: number) => void;
  onFirstViewLoaded?: () => void;
};

type WorkItemsProps = WorksItemDataInterface & {
  setItemRef: (el: HTMLLIElement | null, index: number) => void;
  isVisible: boolean;
  index: number;
};

const REVEAL_INTERVAL_MS = 140; // フェードイン間隔

const WorkItem: React.FC<WorkItemsProps> = ({
  title,
  workCategory,
  category,
  images,
  setItemRef,
  isVisible,
  index,
}) => {
  const categories: string[] = Array.isArray(category)
    ? category
    : typeof category === "string" && category.length > 0
    ? [category]
    : [];

  return (
    <li
      ref={(el) => setItemRef(el, index)}
      className={classNames(style.Works__item, {
        [style.isVisible]: isVisible,
      })}
    >
      <button className={style.Works__itemImageWrapper}>
        {images.slice(0, 2).map((image, i) => (
          <img
            key={i}
            src={image.url}
            alt={`${title}のサムネイル画像`}
            className={style.Works__itemImage}
            style={{ aspectRatio: `${image.width} / ${image.height}` }}
          />
        ))}
      </button>
      <div className={style.Works__itemInfo}>
        <p className={style.Works__itemInfoTexts}>
          <span className={style.Works__itemInfoCategory}>
            {categories.join(", ")}
          </span>
        </p>
        <h3 className={style.Works__itemInfoTitle}>{title}</h3>
        <span className={style.Works__itemInfoId}>{workCategory}</span>
      </div>
    </li>
  );
};

const Works: React.FC<WorksProps> = ({
  onFirstViewProgress,
  onFirstViewLoaded,
}) => {
  const [worksData, setWorksData] = useState<WorksItemDataInterface[]>([]);
  const [visibleMap, setVisibleMap] = useState<Record<number, boolean>>({});
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const lockedSetRef = useRef<Set<number>>(new Set());
  const queueRef = useRef<number[]>([]);
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

  // Worksデータ取得
  useEffect(() => {
    client
      .get({
        endpoint: "works",
        queries: { limit: 50, orders: "-createDate" },
      })
      .then((res) => {
        const data = res.contents as WorksItemDataInterface[];
        setWorksData(data);
        setVisibleMap({});
        itemRefs.current = [];
        lockedSetRef.current.clear();
        queueRef.current = [];
      })
      .catch((err) => console.error(err));
  }, [client]);

  // IntersectionObserverによる順次フェードイン
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
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

          if (lockedSetRef.current.has(index)) return;

          if (entry.isIntersecting) {
            lockedSetRef.current.add(index);
            queueRef.current.push(index);
            processQueue();
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    itemRefs.current.forEach((el) => el && io.observe(el));

    return () => io.disconnect();
  }, [worksData.length]);

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

  const setItemRef = (el: HTMLLIElement | null, index: number) => {
    if (el) {
      el.setAttribute("data-work-index", String(index));
      itemRefs.current[index] = el;
    }
  };

  // ファーストビュー画像のロード進捗
  useEffect(() => {
    if (!worksData.length) return;

    const raf = requestAnimationFrame(() => {
      const container = document.getElementById("works");
      if (!container) return;

      const imgs = Array.from(
        container.querySelectorAll<HTMLImageElement>(
          "img." + style.Works__itemImage
        )
      );

      // ビューポート内の画像のみ対象
      const inView = imgs.filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });

      if (inView.length === 0) {
        onFirstViewProgress?.(100);
        onFirstViewLoaded?.();
        return;
      }

      let loaded = 0;
      const total = inView.length;

      const update = () => {
        const percent = Math.min(100, Math.round((loaded / total) * 100));
        onFirstViewProgress?.(percent);
        if (loaded >= total) {
          onFirstViewLoaded?.();
          cleanup();
        }
      };

      const handlers: Array<{
        el: HTMLImageElement;
        onLoad: () => void;
        onError: () => void;
      }> = [];

      const cleanup = () => {
        handlers.forEach(({ el, onLoad, onError }) => {
          el.removeEventListener("load", onLoad);
          el.removeEventListener("error", onError);
        });
      };

      inView.forEach((el) => {
        const onLoad = () => {
          loaded += 1;
          update();
        };
        const onError = () => {
          loaded += 1;
          update();
        };

        handlers.push({ el, onLoad, onError });

        if (el.complete && el.naturalWidth > 0) {
          loaded += 1;
        } else {
          el.addEventListener("load", onLoad, { once: true });
          el.addEventListener("error", onError, { once: true });
        }
      });

      update();
      return cleanup;
    });

    return () => cancelAnimationFrame(raf);
  }, [worksData, onFirstViewProgress, onFirstViewLoaded]);

  return (
    <div id="works" className={classNames(style.Works)}>
      <h2 className={style.Works__title}>
        <span className={style.Works__titleBody}>Works</span>
      </h2>
      <ul className={style.Works__items}>
        {worksData.map((item, index) =>
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
          )
        )}
      </ul>
    </div>
  );
};

export default Works;
