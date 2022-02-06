import React, { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import world from "./countries-110m.json";
import * as d3 from "d3";
import styled from "styled-components";
import Slider from "react-input-slider";

const Wrapper = styled.div`
  width: clamp(320px, 90vw, 1200px);
  height: 900px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: black;
  animation: fadeInDown;
  animation-duration: 1s;
  font-family: Inter;
  margin: 1rem 1rem 0 2rem;
  line-height: 35px;
  font-size: clamp(2rem, 5vw, 2.8rem);
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

const LegendContainer = styled.div`
  width: clamp(100px, 70vw, 300px);
  height: 10px;
  margin: -1rem 0 2rem 0rem;
`;

const LegendSvg = styled.svg`
  width: 100%;
  height: 100%;
  animation: fadeIn;
  animation-duration: 1s;
  overflow: visible !important;
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
  background-color: #8ab4f8;
  border-radius: 12px;
`;

const YearTitle = styled.span`
  color: #080808;
  animation: fadeIn;
  animation-duration: 1s;
  font-family: Inter;
  font-size: 2rem;
  letter-spacing: -1px;
`;

const ChoroplethMap = () => {
  const [data, setdata] = useState([]);
  const [selectedYear, setelectedYear] = useState(2020);
  const ChoroplethMapRef = useRef();
  const wrapperRef = useRef();
  const svgRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const legendContainerRef = useRef();
  const legendDimensions = useResizeObserver(legendContainerRef);
  const legend = useRef();
  const dataURL =
    "https://gist.githubusercontent.com/arslanastral/124e7f33c35c465d813e206f94c4a4c0/raw/748955149d56d4b7bef1d876da6f3280b2b6c798/co2-emissions.csv";

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const svgGroup = d3.select(ChoroplethMapRef.current);
    const LegendSvg = d3.select(legend.current);
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

      const sqrtScale = d3
        .scaleSqrt()
        .domain(d3.extent(datasetValues))
        .range([1, width / 25]);

      const colorThreshold = d3
        .scaleThreshold()
        .domain(d3.range(minProp, maxProp, maxProp / 7))
        .range([
          "#fff7ec",
          " #fee8c8",
          " #fdd49e",
          "#fdbb84",
          "#fc8d59",
          "#ef6548",
          "#d7301f",
          "   #990000",
        ]);

      const xScale = d3
        .scaleLinear()
        .domain([0, maxProp])
        .range([0, legendDimensions.width]);

      const xAxis = d3
        .axisBottom(xScale)
        .tickSize(15)
        .tickValues(colorThreshold.domain());

      LegendSvg.select(".x-axis")
        .attr("font-family", "Inter")
        .attr("font-size", "0.7rem")
        .attr("color", "#534b4b")
        .call(xAxis);

      LegendSvg.select(".domain").remove();

      LegendSvg.selectAll("rect")
        .data(colorThreshold.domain())
        .join("rect")
        .attr("x", xScale)
        .attr("width", 60)
        .attr("height", 10)
        .attr("fill", (d) => colorThreshold(d));

      svgGroup
        .selectAll(".country")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .on("mouseover", function (event, feature) {
          let countryName = feature.properties.name;
          d3.select(this).style("stroke", "blue");
          div.transition().duration(200).style("display", "block");
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
        .on("click", clicked)
        .on("mouseout", function () {
          div.transition().duration(500).style("display", "none");
          d3.select(this).style("stroke", "#c5c5c5");
        })
        .attr("fill", (feature) =>
          dataset[feature.properties.name]
            ? colorThreshold(dataset[feature.properties.name])
            : "#bdacac"
        )
        .attr("d", (feature) => mapPathGenerator(feature))
        .attr("stroke", "#c5c5c5");

      svgGroup
        .selectAll(".dot")
        .data(countries.features)
        .join("circle")
        .attr("class", "dot")
        .attr("opacity", 0.8)
        .attr("fill", "grey")
        .attr("stroke", "#333")
        .on("click", clicked)
        .on("mouseover", function (event, feature) {
          let countryName = feature.properties.name;
          d3.select(this).style("stroke", "blue");
          div.transition().duration(200).style("display", "block");
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
          d3.select(this).style("stroke", "#333");
          div.transition().duration(500).style("display", "none");
        })
        .attr("cy", (d) => mapProjection(d3.geoCentroid(d))[1])
        .attr("cx", (d) => mapProjection(d3.geoCentroid(d))[0])
        .transition()
        .attr("r", (feature) => sqrtScale(dataset[feature.properties.name]));
    }

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("display", "none")
      .style("left", "0px")
      .style("top", "0px");

    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [width + 10, height],
      ])
      .on("zoom", zoomed);

    function zoomed(event) {
      let transform = event.transform;
      svgGroup
        .attr("transform", transform)
        .attr("stroke", "#c5c5c5")
        .attr("stroke-width", 0.8 / transform.k);
      svgGroup
        .attr("transform", transform)
        .attr("stroke", "#333")
        .attr("stroke-width", 1 / transform.k);
    }

    function clicked(event, d) {
      const [[x0, y0], [x1, y1]] = mapPathGenerator.bounds(d);
      event.stopPropagation();
      svg
        .transition()
        .duration(350)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(
              Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
            )
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
          d3.pointer(event, svg.node())
        );
    }

    function reset() {
      svg
        .transition()
        .duration(350)
        .call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
    }

    if (width <= 800) {
      svg.call(zoom.transform, d3.zoomIdentity.translate(-200, -650).scale(3)); //handles initial zoom on some devices
    }

    svg.on("click", reset).call(zoom);

    return () => {
      div.remove();
    };
  }, [data, dimensions, selectedYear, legendDimensions]);

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

      <LegendContainer ref={legendContainerRef}>
        <LegendSvg ref={legend}>
          <g className="x-axis" />
        </LegendSvg>
      </LegendContainer>

      <ChoroplethMapContainer ref={wrapperRef}>
        <ChoroplethMapSvg ref={svgRef}>
          <g ref={ChoroplethMapRef} />
        </ChoroplethMapSvg>
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
