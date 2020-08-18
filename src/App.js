import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.css';
import csvData from './data.csv';

const margin = { top: 20, right: 120, bottom: 20, left: 120 },
  width = 960 - margin.right - margin.left,
  height = 500 - margin.top - margin.bottom,
  radius = width / 2;

const colorRange = ['#FFFFFF', '#FF5C5C'];
const color = d3.scaleLinear().range(colorRange);

const colors = {
  node: {
    level1: '#FF5C5C',
    level2: '#FF6F76',
    level3: '#FF9398'
  },
  connector: {
    gradient: ['#FFFFFF', '#FF5C5C']
  },
  text: {
    leaf: '#142843',
    parent: '#0A131F'
  }
}

const schema = {
  fields: [
    { name: 'name', type: 'text', display: 'Name: ' },
    { name: 'email', type: 'text', display: 'Email: ' },
  ]
};

function App() {
  const [data, setData] = useState([]);
  const [leafClicked, setLeafClicked] = useState(false);
  const svgRef = useRef();

  useEffect(() => {

    const svg = d3.select(svgRef.current),
      width = +svg.attr('width'),
      height = +svg.attr('height'),
      g = svg.append('g')
        .attr('transform', `translate(${(width / 2)},${(height / 2)})`);

    const form = d3.select("body").append("form").style("class", "form");

    const p = form.selectAll("p")
      .data(schema.fields)
      .enter()
      .append("p")
      .each(function (d) {
        const self = d3.select(this);
        const label = self.append("label")
          .text(d.display)
          .style("width", "50px")
          .style("display", "inline-block");

        if (d.type == 'text') {
          const input = self.append("input")
            .attr({
              type: function (d) { return d.type; },
              name: function (d) { return d.name; }
            });
        }
      });

    form.append("button").attr('type', 'submit').text('Submit');
    form.append("button").attr('type', 'button').on('click', d => form.style("visibility", "hidden"));

    function showForm() {
      form.style("visibility", "visible");
      form.style("top",
        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
    }

    var linearGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'linear-gradient')
      .attr('gradientTransform', 'rotate(90)');

    linearGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colors.connector.gradient[0]);

    linearGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colors.connector.gradient[1]);

    d3.csv(csvData).then(vCsvData => {

      const vData = d3.stratify()(vCsvData);
      drawViz(vData);

      setData(data);
    });

    function drawViz(vData) {
      var vWidth = 500;
      var vHeight = 400;

      // Declare d3 layout
      var vLayout = d3.cluster().size([2 * Math.PI, Math.min(vWidth, vHeight) / 2 - 10])
        .separation(function (a, b) { return (a.parent == b.parent ? 1 : 5) / a.depth; });;

      // Layout + Data
      var vRoot = d3.hierarchy(vData);
      console.log(vRoot)

      var vNodes = vRoot.descendants();
      console.log(vNodes)

      var vLinks = vLayout(vRoot).links();
      console.log(vLinks)

      svg.append('g')
        .attr('transform', `translate(${(width / 2)},${(height / 2)})`)
        .attr('fill', 'none')
        .attr('stroke', 'url(#linear-gradient)')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(vLinks)
        .join('path')
        .attr('d', d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y));

      svg.append('g')
        .attr('transform', `translate(${(width / 2)},${(height / 2)})`)
        .selectAll('circle')
        .data(vNodes)
        .join('circle')
        .attr('transform', d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y},0)
      `)
        .attr('fill', d => d.depth === 0 ? colors.node.level1 :
          d.children ? colors.node.level2 : colors.node.level3)
        .attr('r', 2.5)
        .on('click', d => d.data.data.id === 'industry1' ? showForm() : '');

      var node = g.selectAll('.node')
        .data(vNodes)
        .enter().append('g')
        .attr('class', d => `node ${(d.children ? " node--internal" : " node--leaf")}`);

      node.append('text')
        .attr('dy', ".31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr('stroke', d => d.children ? colors.text.parent : colors.text.leaf)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .attr('transform', d => `
          rotate(${d.x * 180 / Math.PI - 90}) 
          translate(${d.y},${d.x}) 
          rotate(${d.x >= Math.PI ? 180 : 0})
        `)
        .text(d => d.data.id);
    }

  }, [data]);

  return (
    <>
      <h1>Welcome to data visualization with D3 and React</h1>
      <svg width="500" height="500" ref={svgRef}></svg>

      {leafClicked && <form>
        First name: <input type="text" name="firstname" /><br />
        Last name: <input type="text" name="lastname" />
      </form>}
    </>
  );
}

export default App;
