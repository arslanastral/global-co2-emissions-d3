import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styled from "styled-components";

const Wrapper = styled.div`
  background: white;
  width: clamp(320px, 90vw, 1000px);
  box-shadow: 0 2px 25px rgba(255, 0, 130, 0.5);
  height: 850px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: #2fdb39;
  animation: fadeInDown;
  animation-duration: 1s;
  font-family: "Playfair Display", serif;
  margin: -2rem 2rem 0 2rem;
  line-height: 45px;
  font-size: clamp(2rem, 4vw, 2.8rem);
`;

const Subtitle = styled.p`
  color: #525257;
  animation: fadeIn;
  animation-duration: 1s;
  font-family: Inter;
  text-align: center;
  margin: 2rem 2rem 3rem 2rem;
  font-size: clamp(1rem, 4vw, 1.5rem)
  letter-spacing: -1px;
`;

const ChoroplethMapContainer = styled.div`
  border-radius: 10px;
  width: clamp(200px, 60vw, 800px);
  height: 400px;
  margin-top: 1rem;
`;

const ChoroplethMapSvg = styled.svg`
  width: 100%;
  height: 100%;
  margin-left: 3rem;
  margin-right: 1rem;
  animation: fadeIn;
  animation-duration: 1s;
  overflow: visible !important;
`;

const ChoroplethMap = () => {
  const [data, setdata] = useState([]);
  const ChoroplethMapRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const dataURL = "";

  useEffect(() => {
    const svg = d3.select(ChoroplethMapRef.current);
    if (!dimensions) return;
  }, [data, dimensions]);

  useEffect(() => {
    d3.json(dataURL).then((data) => setdata(data));
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <Wrapper>
      <Title></Title>
      <Subtitle></Subtitle>

      <ChoroplethMapContainer ref={wrapperRef}>
        <ChoroplethMapSvg ref={ChoroplethMapRef}>
          <g className="x-axis" />
          <g className="y-axis" />
        </ChoroplethMapSvg>
      </ChoroplethMapContainer>
    </Wrapper>
  );
};

const useResizeObserver = (ref) => {
  const [dimensions, setDimensions] = useState(null);
  useEffect(() => {
    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions(entry.contentRect);
      });
    });
    resizeObserver.observe(observeTarget);
    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);
  return dimensions;
};

export default ChoroplethMap;
