import React from "react";
import style from "./style.module.scss";
import { FadeInContainer } from "../../atoms/FadeInContainer";

const About: React.FC = () => {
  return (
    <div id="About" className={style.About}>
      <FadeInContainer>
        <p className={style.About__text}>
          -
          <br />
          -
          <br />
          <br />-
        </p>
        <p className={style.About__separator}>-</p>
        <p className={style.About__textEnglish}>
          -
          <br />
          -
          <br />
          <br />-
        </p>
      </FadeInContainer>
    </div>
  );
};

export default About;
