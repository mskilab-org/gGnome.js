class BrushContainer {

  constructor(frame) {
    this.frame = frame;
  }

  render() {
    var self = this;
    var width = this.frame.genomeScale.range()[1] - this.frame.genomeScale.range()[0];
    var activeId = null;
    var originalSelection;
    var currentSelection;
    var otherSelections = [];
    var fragments = [];
    var visibleFragments = [];
    var visibleIntervals = [];

    function newBrush() {

      var brush = d3.brushX()
        .extent([[0, 0], [width, 30]])
        .on('start', function() {
          // brush starts here
          originalSelection = d3.event.selection;
          activeId = d3.select(this).datum().id;
        })
        .on('brush', function() {
          // brushing happens gere
          if (!d3.event || !d3.event.sourceEvent || (d3.event.sourceEvent.type === 'brush')) return; // Only transition after input.
          //update()
        })
        .on('end', function() {
          // Only transition after input.
          if (!d3.event.sourceEvent) return;

          // Ignore empty selections.
          if (!d3.event.selection) return;

          // Figure out if our latest brush has a selection
          let lastBrushID = fragments[fragments.length - 1].id;
          let lastBrush = d3.select('#brush-' + lastBrushID).node();
          let selection = d3.brushSelection(lastBrush);
          let node = null;

          // If it does, that means we need another one
          if (selection && selection[0] !== selection[1]) {
            newBrush();
          }

          // read the current state of all the fragments before you start checking on collisions
          otherSelections = fragments.filter((d, i) => (d.selection !== null) && (d.id !== activeId)).map((d, i) => {
            node = d3.select('#brush-' + d.id).node();
            return node && d3.brushSelection(node); 
          });

          // read the active brush current selection
          currentSelection = d3.event.selection;

          // rollback if overlapping is detected
          if (otherSelections.filter((d, i) => (d3.max([d[0], currentSelection[0]]) <= d3.min([d[1], currentSelection[1]]))).length > 0) {
            d3.select(this).transition().call(d3.event.target.move, originalSelection).on('end', () => {
              update();
            });
          } else {
            update();
          }

      });

      fragments.push(new Fragment(brush));
    }

    function update() {
      // first recalculate the current selections
      let node, interval;
      visibleFragments = [];
      visibleIntervals = [];
      fragments.forEach((fragment, i) => {
        node = d3.select('#brush-' + fragment.id).node();
        fragment.selection = node && d3.brushSelection(node);
        fragment.domain = fragment.selection && fragment.selection.map(self.frame.genomeScale.invert);
        if (fragment.selection) {
          visibleFragments.push(Object.assign({}, fragment));
        }
      });

      // now sort the visible fragments from smallest to highest
      visibleFragments = Object.assign([], visibleFragments.sort((x, y) => d3.ascending(x.selection[0], y.selection[0])));
      visibleFragments.forEach((d, i) => {
        d.panelWidth = (self.frame.width - (visibleFragments.length - 1) * self.frame.margins.panels.gap) / visibleFragments.length;
        d.range = [i * (d.panelWidth + self.frame.margins.panels.gap), (i + 1) * d.panelWidth + i * self.frame.margins.panels.gap];
        d.scale = d3.scaleLinear().domain(d.domain).range(d.range);
        d.innerScale = d3.scaleLinear().domain(d.domain).range([0, d.panelWidth]);
        d.axis = d3.axisBottom(d.innerScale).tickValues(d.innerScale.ticks(10, 's').concat(d.innerScale.domain())).ticks(10, 's');
        self.frame.intervals.filter((e, j) => (e.startPlace <= d.domain[1]) && (e.startPlace >= d.domain[0]) && (e.endPlace <= d.domain[1]) && (e.endPlace >= d.domain[0])).forEach((e, j) => {
          interval = Object.assign({}, e);
          interval.range = [d.scale(interval.startPlace), d.scale(interval.endPlace)];
          interval.shapeWidth = interval.range[1] - interval.range[0];
          visibleIntervals.push(interval);
        });
      });

      // draw the brushes
      let brushSelection = self.frame.brushesContainer.selectAll('.brush')
        .data(fragments,  (d, i) => d.id);

      // Set up new brushes
      brushSelection
        .enter()
        .insert('g', '.brush')
        .attr('class', 'brush')
        .attr('id', (d, i) => 'brush-' + d.id)
        .each(function(fragment) {
          //call the brush
          d3.select(this).call(fragment.brush);
        });

      // update the brushes
      brushSelection
        .each(function (fragment){
          d3.select(this)
            .attr('class', 'brush')
            .classed('highlighted', (d, i) => d.id === activeId)
            .selectAll('.overlay')
            .style('pointer-events', function() {
              let brush = fragment.brush;
              if (fragment.id === fragments[fragments.length - 1].id && brush !== undefined) {
                return 'all';
              } else {
                return 'none';
              }
            });
        })

      // exit the brushes
      brushSelection
        .exit()
        .remove();

      let panelRectangles = self.frame.panelsContainer.selectAll('rect.panel')
        .data(visibleFragments,  (d, i) => d.id);

      panelRectangles
        .enter()
        .append('rect')
        .attr('class', 'panel')
        //.transition()
        .attr('transform', (d, i) => 'translate(' + [d.range[0], 0] + ')')
        .attr('width', (d, i) => d.panelWidth)
        .attr('height', self.frame.height - self.frame.margins.panels.upperGap + self.frame.margins.top);

      panelRectangles
        //.transition()
        .attr('transform', (d, i) => 'translate(' + [d.range[0], 0] + ')')
        .attr('width', (d, i) => d.panelWidth);

      panelRectangles
        .exit()
        .remove();

      //Axis
      let panelsAxis = self.frame.panelsAxisContainer.selectAll('g.axis')
        .data(visibleFragments,  (d, i) => d.id);

      panelsAxis
        .enter()
        .append('g')
        .attr('class', 'chromo-axis axis axis--x')
        .transition()
        .attr('transform', (d, i) => 'translate(' + [d.range[0] - 0.5, 0] + ')')
        .each(function(d,i) { 
          d3.select(this).call(d.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start'); 
        });

      panelsAxis
        .transition()
        .attr('transform', (d, i) => 'translate(' + [d.range[0] - 0.5, 0] + ')')
        .each(function(d,i) { 
          d3.select(this).call(d.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start'); 
        });

      panelsAxis
        .exit()
        .remove();

      // intervals
      let shapes = self.frame.shapesContainer.selectAll('rect.shape')
        .data(visibleIntervals,  (d, i) => d.iid);

      shapes
        .enter()
        .append('rect')
        .attr('class', 'shape')
        //.transition()
        .attr('transform', (d, i) => 'translate(' + [d.range[0], self.frame.yScale(d.y) - 0.5 * self.frame.margins.intervals.bar] + ')')
        .attr('width', (d, i) => d.shapeWidth)
        .attr('height', self.frame.margins.intervals.bar)
        .style('fill', (d, i) => d.color)
        .style('stroke', (d, i) => d3.rgb(d.color).darker(1));

      shapes
        //.transition()
        .attr('transform', (d, i) => 'translate(' + [d.range[0], self.frame.yScale(d.y) - 0.5 * self.frame.margins.intervals.bar] + ')')
        .attr('width', (d, i) => d.shapeWidth)
        .style('fill', (d, i) => d.color)
        .style('stroke', (d, i) => d3.rgb(d.color).darker(1));

      shapes
        .exit()
        .remove();

    }

    newBrush();
    update();

  }
}