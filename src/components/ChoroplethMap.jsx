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
  color: black;
  animation: fadeInDown;
  animation-duration: 1s;
  font-family: "Playfair Display", serif;
  margin: 1rem 2rem 0 2rem;
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
  animation: fadeIn;
  animation-duration: 1s;
  overflow: visible !important;
`;

const YearTitle = styled.span`
  color: #080808;
  animation: fadeIn;
  animation-duration: 1s;
  font-family: Inter;
  text-align: center;
  /* margin: 2rem 2rem 3rem 2rem; */
  /* font-size: clamp(1rem, 4vw, 1.5rem) */
  font-size: 2rem;
  letter-spacing: -1px;
`;

const ChoroplethMap = () => {
  const [data, setdata] = useState([]);
  const [selectedYear, setelectedYear] = useState(2020);
  const ChoroplethMapRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const dataURL =
    "https://gist.githubusercontent.com/arslanastral/124e7f33c35c465d813e206f94c4a4c0/raw/748955149d56d4b7bef1d876da6f3280b2b6c798/co2-emissions.csv";

  useEffect(() => {
    const svg = d3.select(ChoroplethMapRef.current);
    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    const countries = feature(world, world.objects.countries);
    const mapProjection = d3.geoMercator().fitSize([width, height], countries);
    const mapPathGenerator = d3.geoPath().projection(mapProjection);

    if (data.length) {
      let dataset = data.filter((data) => data.Year === selectedYear)[0];
      let datasetValues = Object.values(dataset);
      datasetValues.shift(); // removes the year

      const minProp = d3.min(datasetValues);
      const maxProp = d3.max(datasetValues);

      let sqrtScale = d3
        .scaleSqrt()
        .domain([minProp, maxProp])
        .range([1, dimensions.width / 19]);

      const colorScale = d3
        .scaleSequential()
        .domain([minProp, maxProp])
        .interpolator(d3.interpolateOrRd);

      svg
        .selectAll(".country")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .attr("d", (feature) => mapPathGenerator(feature))
        .on("mouseover", function (event, feature) {
          let countryName = feature.properties.name;
          d3.select(this).style("stroke", "blue").attr("stroke-width", "1");
          div.transition().duration(200).style("opacity", 1);
          div
            .html(
              `<span style="font-weight:600;font-size:1rem">${
                dataset[countryName]
                  ? d3.format(".1f")(dataset[countryName]) +
                    " MtCO<sub>2</sub></span>"
                  : "Data Not Available"
              }` +
                " " +
                "<br/>" +
                `<span style="font-size:0.95rem">Year: ${selectedYear}</span>` +
                "<br/>" +
                `<span style="font-size:0.95rem">Country: ${countryName}</span>`
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px");
        })
        .on("mouseout", function () {
          d3.select(this).style("stroke", "grey").attr("stroke-width", "0.4");
          div.transition().duration(500).style("opacity", 0);
        })
        .transition()
        .attr("fill", (feature) =>
          dataset[feature.properties.name]
            ? colorScale(dataset[feature.properties.name])
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
        .attr("cy", (d) => mapProjection(d3.geoCentroid(d))[1])
        .transition()
        .attr("r", (feature) => sqrtScale(dataset[feature.properties.name]));
    }

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("left", "0px")
      .style("top", "0px");

    return () => {
      div.remove();
    };
  }, [data, dimensions, selectedYear]);

  useEffect(() => {
    d3.csv(dataURL, d3.autoType).then((data) => setdata(data));
  }, []);

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
        style={{ width: "50%", height: "3px", margin: "2rem 0 1rem 0" }}
        xmin={1960}
        xmax={2020}
        x={selectedYear}
        onChange={({ x }) => setelectedYear(x)}
      />
      <YearTitle>{selectedYear}</YearTitle>
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
