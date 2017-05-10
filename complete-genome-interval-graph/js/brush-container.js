class BrushContainer {

  constructor(frame) {
    this.frame = frame;
    this.reset();
  }

  reset() {
    this.activeId = null;
    this.originalSelection = null;
    this.currentSelection = null;
    this.totalBrushWidth = this.frame.genomeScale.range()[1] - this.frame.genomeScale.range()[0];
    this.otherSelections = [];
    this.fragments = [];
    this.visibleFragments = [];
    this.visibleIntervals = [];
    this.panelWidth = 0;
    this.panelHeight = 0;
  }

  render() {
    this.reset();
    this.createBrush();
    this.update();
  }

  createBrush() {
    var self = this;
    var brush = d3.brushX()
      .extent([[0, 0], [this.totalBrushWidth, this.frame.margins.brushes.height]])
      .on('start', function() {
        // brush starts here
        self.originalSelection = d3.event.selection;
        self.activeId = d3.select(this).datum().id;
      })
      .on('brush', () => {
        // brushing happens gere
        if (!d3.event || !d3.event.sourceEvent || (d3.event.sourceEvent.type === 'brush')) return; // Only transition after input.
        this.update()
      })
      .on('end', () => {
        // Only transition after input.
        if (!d3.event.sourceEvent) return;

        // Ignore empty selections.
        if (!d3.event.selection) return;

        // Figure out if our latest brush has a selection
        let lastBrushID = this.fragments[this.fragments.length - 1].id;
        let lastBrush = d3.select('#brush-' + lastBrushID).node();
        let selection = d3.brushSelection(lastBrush);
        let node = null;

        // If it does, that means we need another one
        if (selection && selection[0] !== selection[1]) {
          this.createBrush();
        }

        // read the current state of all the self.fragments before you start checking on collisions
        this.otherSelections = this.fragments.filter((d, i) => (d.selection !== null) && (d.id !== this.activeId)).map((d, i) => {
          node = d3.select('#brush-' + d.id).node();
          return node && d3.brushSelection(node); 
        });

        // read the active brush current selection
        this.currentSelection = d3.event.selection;

        /* rollback if overlapping is detected
        if (self.otherSelections.filter((d, i) => (d3.max([d[0], self.currentSelection[0]]) <= d3.min([d[1], self.currentSelection[1]]))).length > 0) {
          d3.select(this).transition().call(d3.event.target.move, self.originalSelection).on('end', () => {
            update();
          });
        } else {
          update();
        }
        */

        this.update();
    });

    this.fragments.push(new Fragment(brush));
  }

  update() {

    // first recalculate the current selections
    this.updateFragments();

    // update clipPath
    this.renderClipPath();

    // draw the brushes
    this.renderBrushes();

    // Draw the panel rectangles
    this.renderPanels();

    // Draw the intervals
    this.renderIntervals();

  }

  updateFragments() {
    let node, interval;
    this.visibleFragments = [];
    this.visibleIntervals = [];

    this.fragments.forEach((fragment, i) => {
      node = d3.select('#brush-' + fragment.id).node();
      fragment.selection = node && d3.brushSelection(node);
      fragment.domain = fragment.selection && fragment.selection.map(this.frame.genomeScale.invert);
      if (fragment.selection) {
        this.visibleFragments.push(Object.assign({}, fragment));
      }
    });

    // determine the new Panel Width
    this.panelWidth = (this.frame.width - (this.visibleFragments.length - 1) * this.frame.margins.panels.gap) / this.visibleFragments.length;
    this.panelHeight = this.frame.height - this.frame.margins.panels.upperGap + this.frame.margins.top;

    // now sort the visible self.fragments from smallest to highest
    this.visibleFragments = Object.assign([], this.visibleFragments.sort((x, y) => d3.ascending(x.selection[0], y.selection[0])));
    this.visibleFragments.forEach((d, i) => {
      d.panelWidth = this.panelWidth;
      d.panelHeight = this.panelHeight;
      d.range = [i * (d.panelWidth + this.frame.margins.panels.gap), (i + 1) * d.panelWidth + i * this.frame.margins.panels.gap];
      d.scale = d3.scaleLinear().domain(d.domain).range(d.range);
      d.scale2 = d3.scaleLinear().domain(d.domain).range(d.range);
      d.innerScale = d3.scaleLinear().domain(d.domain).range([0, d.panelWidth]);
      d.axis = d3.axisBottom(d.innerScale).tickValues(d.innerScale.ticks().concat(d.innerScale.domain())).tickFormat(d3.format(".2s"));
      d.zoom = d3.zoom().scaleExtent([1, Infinity]).translateExtent([[0, 0], [d.panelWidth, d.panelHeight]]).extent([[0, 0], [d.panelWidth, d.panelHeight]]).on('zoom', () => this.zoomed(d));
      this.frame.intervals
      .filter((e, j) => (e.startPlace <= d.domain[1]) && (e.startPlace >= d.domain[0]) && (e.endPlace <= d.domain[1]) && (e.endPlace >= d.domain[0]))
      .forEach((e, j) => {
        interval = Object.assign({}, e);
        interval.range = [d.scale(interval.startPlace), d.scale(interval.endPlace)];
        interval.shapeWidth = interval.range[1] - interval.range[0];
        this.visibleIntervals.push(interval);
      });
    });
  }

  zoomed(fragment) {
    console.log(fragment);
  }

  renderClipPath() {
    if (this.visibleFragments.length > 0) {
      this.frame.svgFilter.renderClipPath(this.panelWidth, this.panelHeight);
    }
  }

  renderBrushes() {
    var self = this;

    let brushSelection = this.frame.brushesContainer.selectAll('.brush')
      .data(this.fragments,  (d, i) => d.id);

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
          .classed('highlighted', (d, i) => d.id === self.activeId)
          .selectAll('.overlay')
          .style('pointer-events',(d,i) => {
            let brush = fragment.brush;
            if (fragment.id === self.fragments[self.fragments.length - 1].id && brush !== undefined) {
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
  }

  renderPanels() {
    let correctionOffset = 1; // used for aligning the rectenges on the y Axis lines

    // Draw the panel rectangles
    let panelRectangles = this.frame.panelsContainer.selectAll('rect.panel')
      .data(this.visibleFragments,  (d, i) => d.id);

    panelRectangles
      .enter()
      .append('rect')
      .attr('class', 'panel')
      .style('clip-path','url(#clip)')
      //.transition()
      .attr('transform', (d, i) => 'translate(' + [d.range[0], 0] + ')')
      .attr('width', (d, i) => d.panelWidth)
      .attr('height', (d, i) => d.panelHeight + correctionOffset)
      .each(function(d,i) {
        d3.select(this).call(d.zoom);
      });

    panelRectangles
      //.transition()
      .attr('transform', (d, i) => 'translate(' + [d.range[0], 0] + ')')
      .attr('width', (d, i) => d.panelWidth);

    panelRectangles
      .exit()
      .remove();

    //Axis
    let panelsAxis = this.frame.panelsAxisContainer.selectAll('g.axis')
      .data(this.visibleFragments,  (d, i) => d.id);

    panelsAxis
      .enter()
      .append('g')
      .attr('class', 'chromo-axis axis axis--x')
      //.transition()
      .attr('transform', (d, i) => 'translate(' + [d.range[0], 0] + ')')
      .each(function(d,i) { 
        d3.select(this).call(d.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start'); 
      });

    panelsAxis
      //.transition()
      .attr('transform', (d, i) => 'translate(' + [d.range[0], 0] + ')')
      .each(function(d,i) { 
        d3.select(this).call(d.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start'); 
      });

    panelsAxis
      .exit()
      .remove();
  }

  renderIntervals() {
    let shapes = this.frame.shapesContainer.selectAll('rect.shape')
      .data(this.visibleIntervals,  (d, i) => d.iid);

    shapes
      .enter()
      .append('rect')
      .attr('class', 'shape')
      .style('clip-path','url(#clip)')
      //.transition()
      .attr('transform', (d, i) => 'translate(' + [d.range[0], this.frame.yScale(d.y) - 0.5 * this.frame.margins.intervals.bar] + ')')
      .attr('width', (d, i) => d.shapeWidth)
      .attr('height', this.frame.margins.intervals.bar)
      .style('fill', (d, i) => d.color)
      .style('stroke', (d, i) => d3.rgb(d.color).darker(1));

    shapes
      //.transition()
      .attr('transform', (d, i) => 'translate(' + [d.range[0], this.frame.yScale(d.y) - 0.5 * this.frame.margins.intervals.bar] + ')')
      .attr('width', (d, i) => d.shapeWidth)
      .style('fill', (d, i) => d.color)
      .style('stroke', (d, i) => d3.rgb(d.color).darker(1));

    shapes
      .exit()
      .remove();
  }

}