// Data.
const educationDataURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const countyDataURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

let promises = [d3.json(educationDataURL), d3.json(countyDataURL)];
Promise.all(promises).then((response) => {
  const educationData = response[0];
  const educationDataMin = d3.min(
    educationData.map((item) => item.bachelorsOrHigher)
  );
  const educationDataMax = d3.max(
    educationData.map((item) => item.bachelorsOrHigher)
  );
  const countiesJSON = topojson.feature(
    response[1],
    response[1].objects.counties
  ).features;
  const stateJSON = topojson.feature(response[1], response[1].objects.states)
    .features;

  const colorSelector = d3
    .scaleThreshold()
    .domain(d3.range(educationDataMin, educationDataMax, educationDataMax / 6))
    .range(d3.schemeBlues[7]);

  // Tooltip.
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  // SVG.
  const mapW = 950;
  const mapH = 600;
  const svg = d3
    .select("#map")
    .append("svg")
    .attr("width", mapW)
    .attr("height", mapH);

  // Draw the map.
  const path = d3.geoPath();
  svg
    .selectAll("path")
    .data(countiesJSON)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("data-fips", (d, i) => d.id)
    .attr("data-education", (d, i) => {
      const result = educationData.filter((item) => item.fips === d.id);
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      } else {
        return 0;
      }
    })
    .style("fill", (d, i) => {
      const result = educationData.filter((item) => item.fips === d.id);
      if (result[0]) {
        return colorSelector(result[0].bachelorsOrHigher);
      } else {
        return colorSelector(0);
      }
    })
    .style("stroke", "white")
    .on("mouseover", (d, i) => {
      const fips = d.id;
      const data = educationData.filter((area) => area.fips === fips)[0];
      tooltip.html(
        "<p>" +
          data.area_name +
          " " +
          data.state +
          ", " +
          data.bachelorsOrHigher +
          "%</p>"
      );
      tooltip
        .attr("data-education", data.bachelorsOrHigher)
        .style("opacity", 0.7)
        .style("top", this.event.pageY + 10 + "px")
        .style("left", this.event.pageX + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  svg
    .selectAll(".state")
    .data(stateJSON)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", "gray");

  // Draw the Legend.
  const legendScale = d3
    .scaleLinear()
    .domain([educationDataMin, educationDataMax])
    .range([0, 200]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .tickSize(10)
    .tickFormat((value) => Math.round(value) + "%")
    .tickValues(colorSelector.domain());
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(600, 40)")
    .call(legendAxis);

  legend
    .selectAll("rect")
    .data(colorSelector.range().map((val) => colorSelector.invertExtent(val)))
    .enter()
    .append("rect")
    .attr("width", 34)
    .attr("height", 10)
    .attr("x", (d, i) => legendScale(d[0]))
    .attr("fill", (d, i) => colorSelector(d[0]));
});
