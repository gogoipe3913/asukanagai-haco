import React from "react";
import classNames from "classnames";
import { Link } from "react-scroll";
import style from "./style.module.scss";
import { ANCHOR_ITEMS, EXTERNAL_URLS } from "./data";

type SideColumnProps = {
  isLoaded: boolean;
  className?: string;
};

const SideColumn: React.FC<SideColumnProps> = ({
  isLoaded,
  className = "",
}) => {
  return (
    <div
      id="SideColumn"
      className={classNames(
        style.SideColumn,
        isLoaded ? style["SideColumn--displayed"] : "",
        className
      )}
    >
      <a href="/" className={style.SideColumn__logoLink}>
        <h1>haco</h1>
        <p className={style.SideColumn__logoLinkText}>
          Architecture photographer
          <br />
          Asuka Nagai
        </p>
      </a>
      <div className={style.SideColumn__anchorsWrapper}>
        <ul className={style.SideColumn__anchors}>
          {ANCHOR_ITEMS.map((item, index) =>
            item.id !== "top" ? (
              <li key={index}>
                <Link to={item.id} duration={600} smooth={true}>
                  {item.title}
                </Link>
              </li>
            ) : null
          )}
        </ul>
        <div className={style.SideColumn__separator} />
        <a href={EXTERNAL_URLS.INSTAGRAM} className={style.SideColumn__link}>
          IG
        </a>
      </div>
    </div>
  );
};

export default SideColumn;
