import React, { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import world from "./countries-110m.json";
import * as d3 from "d3";
import styled from "styled-components";
import Slider from "react-input-slider";

const Wrapper = styled.div`
  /* background: white; */
  width: clamp(320px, 90vw, 1200px);
  /* box-shadow: 0 2px 25px rgba(255, 0, 130, 0.5); */
  height: 900px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  /* flex-wrap: wrap; */
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
  /* margin: 2rem 2rem 3rem 2rem; */
  font-size: clamp(1rem, 4vw, 1.5rem)
  letter-spacing: -1px;
`;

const ChoroplethMapContainer = styled.div`
  border-radius: 10px;
  width: clamp(310px, 80vw, 1100px);
  height: 800px;
  margin-top: 1rem;
`;

const ChoroplethMapSvg = styled.svg`
  width: 100%;
  height: 100%;
  /* margin-left: 3rem; */
  /* margin-right: 1rem; */
  animation: fadeIn;
  animation-duration: 1s;
  overflow: visible !important;
`;

const ChoroplethMap = () => {
  const [data, setdata] = useState([]);
  const [year, setYear] = useState(60);
  const ChoroplethMapRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const yearMap = d3.range(1960, 2021);
  const dataURL =
    "https://gist.githubusercontent.com/arslanastral/124e7f33c35c465d813e206f94c4a4c0/raw/748955149d56d4b7bef1d876da6f3280b2b6c798/co2-emissions.csv";

  // console.log(world.objects.countries.geometries[0].properties.name);

  // console.log(world.objects.countries.geometries);
  useEffect(() => {
    const svg = d3.select(ChoroplethMapRef.current);
    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const countries = feature(world, world.objects.countries);
    const mapProjection = d3.geoMercator().fitSize([width, height], countries);
    // const projection = d3.geoMercator();
    const mapPathGenerator = d3.geoPath().projection(mapProjection);

    let newArr = Object.values(data);
    newArr.shift();
    const minProp = d3.min(newArr);
    const maxProp = d3.max(newArr);

    console.log(data["W. Sahara"]);
    let sqrtScale = d3.scaleSqrt().domain([minProp, maxProp]).range([1, 50]);

    const colorScale = d3
      .scaleSequential()
      .domain([minProp, maxProp])
      .interpolator(d3.interpolateReds);

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("left", "0px")
      .style("top", "0px");

    svg
      .selectAll(".country")
      .data(countries.features)
      .join("path")
      .attr("class", "country")
      .attr("d", (feature) => mapPathGenerator(feature))
      .on("mouseover", function (event, feature) {
        d3.select(this).style("stroke", "blue").attr("stroke-width", "1");
        div.transition().duration(200).style("opacity", 1);
        div
          .html(
            `<span style="font-weight:600;font-size:1rem">${
              data[feature.properties.name]
                ? d3.format(".1f")(data[feature.properties.name]) +
                  " MtCO<sub>2</sub></span>"
                : "Data Not Available"
            }` +
              " " +
              `<span style="font-size:0.9rem">(${yearMap[year]})</span>` +
              "<br/>" +
              `<span style="font-size:0.95rem">Country: ${feature.properties.name}</span>`
          )
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", function () {
        d3.select(this).style("stroke", "black").attr("stroke-width", "0.4");
        div.transition().duration(500).style("opacity", 0);
      })
      .transition()
      .attr("r", (feature) => sqrtScale(data[feature.properties.name]))
      .transition()
      .attr("fill", (feature) =>
        data[feature.properties.name]
          ? colorScale(data[feature.properties.name])
          : "#bdacac"
      )
      .attr("stroke", "grey")
      .attr("stroke-width", "0.4");

    svg
      .selectAll(".dot")
      .data(countries.features)
      .join("circle")
      .attr("class", "dot")
      .attr("opacity", 0.8)
      .attr("fill", "grey")
      .attr("stroke", "black")
      .attr("stroke-width", "0.8")
      .attr("cx", (d) => mapProjection(d3.geoCentroid(d))[0])
      .attr("cy", (d) => mapProjection(d3.geoCentroid(d))[1]);

    return () => {
      div.remove();
    };
  }, [data, dimensions, year, yearMap]);

  useEffect(() => {
    d3.csv(dataURL, d3.autoType).then((data) => setdata(data[year]));
  }, [year]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <Wrapper>
      <Title>
        Land CO<sub>2</sub> Emissions in MtCO<sub>2</sub>
      </Title>
      <Subtitle></Subtitle>

      <ChoroplethMapContainer ref={wrapperRef}>
        <ChoroplethMapSvg ref={ChoroplethMapRef}></ChoroplethMapSvg>
      </ChoroplethMapContainer>
      <Slider
        style={{ width: "500px", height: "3px" }}
        xmin={0}
        xmax={60}
        x={year}
        onChange={({ x }) => setYear(x)}
      />
      <span>{yearMap[year]}</span>
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
