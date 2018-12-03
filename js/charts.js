window.timeChartObs = dc.lineChart("#time-chart-obs");
window.timeChartCount = dc.lineChart("#time-chart-count");
window.dataTable = dc.dataTable("#data-table");
window.timeBar = dc.barChart("#time-bar");
window.penguinChart = dc.rowChart("#penguin-chart");
window.yearPie = dc.pieChart("#year-pie");

function getName(common_name){
    switch(common_name) {
        case 'adélie penguin':
          return "Adélie";
        case 'gentoo penguin':
          return "Gentoo";
        case 'chinstrap penguin':
          return "Chinstrap";
        case 'emperor penguin':
          return "Emperor";
        default:
          return "Unknown";
      }
}

d3.csv("data/penguins_23_11_18.csv", (data) => {
    const dateFormat = d3.time.format("%d %B %Y");
    const shortFormat = d3.time.format("%B %Y");
    data.forEach(function(d) {
        d.date = new Date(+d.year, +d.month, +d.day);
        d.name = getName(d.common_name);
        d.penguin_count = +d.penguin_count;
      });

    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    const penguinDimension = ndx.dimension(d => d.name);
    const penguinGroup = penguinDimension.group();

    //const observationDimension = ndx.dimension(d => d3.time.month(d.date));
    const observationDimension = ndx.dimension(d => d.date);

    const observationGroup = observationDimension.group().reduceCount(d => d.date);
    const observationCountGroup = observationDimension.group().reduceSum(d => d.penguin_count);
    const countDimension = ndx.dimension(d => d.penguin_count);

    const yearDimension = ndx.dimension(d => d.year);
    const yearGroup = yearDimension.group();
    
    timeChartObs
    .renderArea(true)
    .width(990)
    .height(270)
    .transitionDuration(500)
    .margins({
      top: 30, right: 50, bottom: 25, left: 40,
    })
    .dimension(observationDimension)
    .group(observationGroup)
    .rangeChart(timeBar)
    .brushOn(false)
    .mouseZoomable(false)
    .x(d3.time.scale().domain(d3.extent(data, d => d.date)))
    .round(d3.time.month.round)
    .xUnits(d3.time.months)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .title(d => `${shortFormat(d.key)}\nNumber of observations : ${d.value}`)
    .xAxis();

    timeChartCount
    .renderArea(true)
    .width(990)
    .height(270)
    .transitionDuration(500)
    .margins({
      top: 30, right: 50, bottom: 25, left: 40,
    })
    .dimension(observationDimension)
    .group(observationCountGroup)
    .rangeChart(timeBar)
    .brushOn(false)
    .mouseZoomable(false)
    .x(d3.time.scale().domain(d3.extent(data, d => d.date)))
    .round(d3.time.month.round)
    .xUnits(d3.time.months)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .title(d => `${shortFormat(d.key)}\nTotal penguin count in observations : ${d.value}`)
    .xAxis();


    // Time bar
    timeBar.
    width(990)
    .height(60)
    .margins({
        top: 0, right: 50, bottom: 20, left: 40,
    })
    .dimension(observationDimension)
    .group(observationGroup)
    .centerBar(true)
    .gap(1)
    .x(d3.time.scale().domain(d3.extent(data, d => d.date)))
    .round(d3.time.month.round)
    .alwaysUseRounding(true)
    .xUnits(d3.time.months)
    .yAxis()
    .tickFormat(v => '');

    yearPie.width(300)
    .height(300)
    .radius(100)
    .innerRadius(30)
    .dimension(yearDimension)
    .title((d) => {
        let label = d.key;
        if (all.value()) {
        label += ` (${Math.floor(d.value / all.value() * 100)}%)`;
        }
        return `${label}\nNumber of observations : ${d.value}`;
    })
    .group(yearGroup);


    penguinChart
    .width(300)
    .height(300)
    .margins({
      top: 5, left: 10, right: 10, bottom: 20,
    })
    .dimension(penguinDimension)
    .group(penguinGroup)
    .colors(d3.scale.category10())
    .label(d => d.key)
    .elasticX(true)
    .xAxis()
    .ticks(4);

    // data table
    dataTable
    .dimension(countDimension)
    .group(d => 'Obervations with highest penguin count in selection')
    .size(10)
    .columns([
        {
        label: 'Site name',
        format(d) {
            return d.site_name;
        },
        },
        {
        label: 'Penguin type',
        format(d) {
            return d.name + " penguin";
        },
        },
        {
        label: 'Observation date',
        format(d) {
            return d.date;
        },
        },
        {
        label: 'Penguin count',
        format(d) {
            return d.penguin_count;
        },
        },
        {
        label: 'Reference',
        format(d) {
            return d.reference;
        },
        },
    ])
    .sortBy(d => d.penguin_count)
    .order(d3.descending)
    .on('renderlet', (table) => {
        table.selectAll('.dc-table-group').classed('info', true);
    });

      // number selected
    dc.dataCount('.data-count')
    .dimension(ndx) // set dimension to all data
    .group(all); // set group to ndx.groupAll()

    dc.renderAll();
    dc.redrawAll();
});