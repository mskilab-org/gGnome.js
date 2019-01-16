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
    this.visibleGenes = [];
    this.panelWidth = 0;
    this.panelHeight = 0;
  }

  render() {
    this.reset();
    this.createBrush();
    this.update();
  }

  createDefaults(domain) {
    this.createBrush();
    let fragment = this.fragments[this.fragments.length - 1];
    this.update();
    fragment = d3.select('#brush-' + fragment.id).datum();
    fragment.domain = domain;
    fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
    d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
    this.update();
    this.createBrush();
    this.update();
    this.activeId = fragment.id;
    this.frame.brushesContainer.selectAll('.brush').classed('highlighted', false);
    d3.select('#brush-' + fragment.id).classed('highlighted', true);
  }
  
  deleteBrush() {
    this.fragments = this.fragments.filter(fragment => fragment.id !== this.activeId);
    this.update();
  }

  createBrush() {
    var self = this;
    var brush = d3.brushX()
      .extent([[0, 0], [this.totalBrushWidth, this.frame.margins.brushes.height]])
      .on('start', function() {
        // brush starts here
        self.originalSelection = d3.event.selection;
      })
      .on('brush', function() {
        // brushing happens here

        // ignore brush-by-zoom
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return;

        // Only transition after input.
        if (!d3.event || !d3.event.sourceEvent || (d3.event.sourceEvent.type === 'brush')) return;

        let fragment = d3.select(this).datum();
        self.activeId = d3.select(this).datum().id;
        let originalSelection = fragment.selection;
        let currentSelection = d3.event.selection;
        let selection = Object.assign([], currentSelection);
        let node;

        // read the current state of all the self.fragments before you start checking on collisions
        self.otherSelections = self.fragments.filter((d,i) => (d.selection !== null) && (d.id !== self.activeId)).map((d,i) => {
          node = d3.select('#brush-' + d.id).node();
          return node && d3.brushSelection(node);
        });

        // calculate the lower allowed selection edge this brush can move
        let lowerEdge = d3.max(self.otherSelections.filter((d,i) => (d.selection !== null))
          .filter((d,i) => originalSelection && (d[0] <= originalSelection[0]) && (originalSelection[0] <= d[1]))
          .map((d,i) => d[1]));

        // calculate the upper allowed selection edge this brush can move
        let upperEdge = d3.min(self.otherSelections.filter((d,i) => (d.selection !== null))
          .filter((d,i) => originalSelection && (d[1] >= originalSelection[0]) && (originalSelection[1] <= d[1]))
          .map((d,i) => d[0]));

        // if there is an upper edge, then set this to be the upper bound of the current selection
        if ((upperEdge !== undefined) && (selection[1] >= upperEdge)) {
          selection[1] = upperEdge;
          selection[0] = d3.min([selection[0], upperEdge - 1]);
        }

        // if there is a lower edge, then set this to the be the lower bound of the current selection
        if ((lowerEdge !== undefined) && (selection[0] <= lowerEdge)) {
          selection[0] = lowerEdge;
          selection[1] = d3.max([selection[1], lowerEdge + 1]);
        }

        // move the brush to stay within the allowed bounded selection zone
        if ((selection !== undefined) && (selection !== null) && (selection[1] !== selection[0])) {
          d3.select(this).call(fragment.brush.move, selection);
        }

        // finally, update the chart with the selection in question
        self.update();
      })
      .on('end', function() {
        // ignore brush-by-zoom
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return;

        // Only transition after input.
        if (!d3.event.sourceEvent) return;

        // Ignore empty selections.
        if (!d3.event.selection) return;

        // Figure out if our latest brush has a selection
        let lastBrushID = self.fragments[self.fragments.length - 1].id;
        let lastBrush = d3.select('#brush-' + lastBrushID).node();
        let selection = d3.brushSelection(lastBrush);

        // If it does, that means we need another one
        if (selection && selection[0] !== selection[1]) {
          self.createBrush();
        }

        // finally, update the chart with the selection in question
        self.update();

        // update the url state
        self.frame.url = `index.html?file=${self.frame.dataFile}&location=${self.frame.note}`;
        history.replaceState(self.frame.url, 'Project gGnome.js', self.frame.url);
    });

    this.fragments.push(new Fragment(brush));
  }

  update() {

    // first recalculate the current selections
    this.updateFragments(false);

    // Draw the notes of the fragments
    this.renderFragmentsNote(this.panelDomainsText());

    // Draw the full details of the fragments
    this.renderFragmentsDetails(this.panelDomainsDetails());

    // draw the brushes
    this.renderBrushes();

    // Draw the panel rectangles
    this.renderPanels();

    // Draw the chromosome axis
    this.renderChromoAxis();

    // Draw the Y Axis
    this.renderYAxis()

    // Draw the intervals
    this.renderIntervals();

    // Draw the genes
    this.renderGenes();

    // Draw the walk intervals
    this.renderWalkIntervals();
    
    // Draw the interconnections
    this.renderInterconnections();
    
    // Draw the walk interconnections
    this.renderWalkInterconnections();
    
    // The Genes Clip Path
    this.renderGenesClipPath();
    
    // update clipPath
    this.renderClipPath();

    // update the reads
    this.renderReads();

    window.pc = this;
  }

  updateFragments(force) {
    let node;
    this.visibleFragments = [];
    this.visibleIntervals = [];
    this.visibleGenes = [];
    this.visibleWalks = [];
    this.connections = [];
    this.walkConnections = [];

    let frameConnections = Object.assign([], this.frame.connections);
    let frameWalkConnections = Object.assign([], this.frame.walkConnections);

    // delete any brushes that have a zero selection size
    this.fragments = this.fragments.filter((d,i) => (d.selection === null) || (d.selection[0] !== d.selection[1]));

    // filter the brushes that are visible on the screen
    this.visibleFragments = this.fragments.map((fragment, i) => {
      node = d3.select('#brush-' + fragment.id).node();
      fragment.previousSelection = fragment.selection;
      fragment.previousSelectionSize = fragment.selectionSize;
      fragment.selection = node && d3.brushSelection(node);
      fragment.domain = fragment.selection && fragment.selection.map(this.frame.genomeScale.invert,this.frame.genomeScale);
      if (fragment.selection) {
        fragment.changed = force || (!fragment.previousSelection) || ((fragment.selection[0] !== fragment.previousSelection[0]) || (fragment.selection[1] !== fragment.previousSelection[1]));
        fragment.selectionSize = fragment.selection[1] - fragment.selection[0];
      }
      return fragment;
    }).filter((fragment,i) => fragment.selection);

    // determine the new Panel Width
    this.panelWidth = (this.frame.width - (this.visibleFragments.length - 1) * this.frame.margins.panels.gap) / this.visibleFragments.length;
    this.panelHeight = this.frame.height - this.frame.margins.panels.upperGap + this.frame.margins.top;

    // determine the Genes Panel Dimensions
    this.genesPanelWidth = (this.frame.width - (this.visibleFragments.length - 1) * this.frame.margins.panels.gap) / this.visibleFragments.length;
    this.genesPanelHeight = this.frame.margins.panels.upperGap - this.frame.margins.panels.chromoGap;

    // now sort the visible self.fragments from smallest to highest
    this.visibleFragments = Object.assign([], this.visibleFragments.sort((x, y) => d3.ascending(x.selection[0], y.selection[0])));

    // Determine the panel parameters for rendering
    this.visibleFragments.forEach((d,i) => {
      d.panelWidth = this.panelWidth;
      d.panelHeight = this.panelHeight;
      d.domainWidth = d.domain[1] - d.domain[0];
      d.range = [i * (d.panelWidth + this.frame.margins.panels.gap), (i + 1) * d.panelWidth + i * this.frame.margins.panels.gap];
      d.scale = d3.scaleLinear().domain(d.domain).range(d.range);
      d.innerScale = d3.scaleLinear().domain(d.domain).range([0, d.panelWidth]);
      d.zoom = d3.zoom().scaleExtent([1, Infinity]).translateExtent([[0, 0], [this.frame.width, d.panelHeight]]).extent([[0, 0], [this.frame.width, d.panelHeight]]).on('zoom', () => this.zoomed(d)).on('end', () => this.zoomEnded(d));
      d.chromoAxis = Object.keys(this.frame.chromoBins)
        .map(x => this.frame.chromoBins[x])
        .filter(chromo => chromo.contains(d.domain))
        .map((chromo, j) => {
          let domainStart = ((d.domain[0] < chromo.scaleToGenome.range()[1]) && (d.domain[0] >= chromo.scaleToGenome.range()[0])) ? chromo.scaleToGenome.invert(d.domain[0]) : chromo.scaleToGenome.domain()[0];
          let domainEnd   = ((d.domain[1] < chromo.scaleToGenome.range()[1]) && (d.domain[1] >= chromo.scaleToGenome.range()[0])) ? chromo.scaleToGenome.invert(d.domain[1]) : chromo.scaleToGenome.domain()[1];
          let rangeWidth = d.innerScale(chromo.scaleToGenome(domainEnd)) - d.innerScale(chromo.scaleToGenome(domainStart));
          let scale = d3.scaleLinear().domain([domainStart, domainEnd]).range([0, rangeWidth]);
          let axisBottom = d3.axisBottom(scale).ticks(d3.max([d3.min([Math.round(rangeWidth / 25), 10]),1]), 's');
          let magnitude = Misc.magnitude(domainEnd - domainStart);
          let magnitudeDistance = Misc.magnitude(domainEnd - domainStart) * rangeWidth / (domainEnd - domainStart);
          let magnitudeLegendPoints = [0, -5, 0, 0, magnitudeDistance, 0, magnitudeDistance, -5];
          return {identifier: Misc.guid, transform: 'translate(' + [d.innerScale(chromo.scaleToGenome(domainStart)), 0] + ')',
            labelTopTranslate: 'translate(' + [0.5 * (d.innerScale(chromo.scaleToGenome(domainEnd)) - d.innerScale(chromo.scaleToGenome(domainStart))), - this.frame.margins.panels.label] + ')',
            chromo: chromo, scale: scale, rangeWidth: rangeWidth, separatorHeight: (this.genesPanelHeight + d.panelHeight), axisBottom: axisBottom,
            labelMagnitudeTranslate: 'translate(' + [0.5 * (d.innerScale(chromo.scaleToGenome(domainEnd)) - d.innerScale(chromo.scaleToGenome(domainStart))), - 5 * this.frame.margins.panels.label] + ')',
            magnitude: magnitude, magnitudeDistance: magnitudeDistance,
            magnitudeLegendTransform: 'translate(' + [0.5 * (d.innerScale(chromo.scaleToGenome(domainEnd)) - d.innerScale(chromo.scaleToGenome(domainStart)) - magnitudeDistance), - 4.5 * this.frame.margins.panels.label] + ')',
            magnitudeLegendPoints: magnitudeLegendPoints
        };
      });
      // filter the intervals
      d.visibleIntervals = [];
      this.frame.intervals
      .filter((e, j) => ((d.selectionSize < this.frame.margins.brushes.minSelectionSize) ? ((!this.frame.hasSubintervals) || (e.isSubInterval)) : (!e.isSubInterval)))
      .filter((e, j) => ((e.startPlace <= d.domain[1]) && (e.startPlace >= d.domain[0])) || ((e.endPlace <= d.domain[1]) && (e.endPlace >= d.domain[0]))
        || ((d.domain[1] <= e.endPlace) && (d.domain[1] >= e.startPlace)) || ((d.domain[0] <= e.endPlace) && (d.domain[0] >= e.startPlace)))
      .forEach((inter, j) => {
        let interval = Object.assign(new Interval({}), inter); 
        interval.identifier = Misc.guid + '|' + d.id;
        interval.range = [d3.max([0, d.innerScale(interval.startPlace)]), d.innerScale(interval.endPlace)];
        interval.shapeWidth = interval.range[1] - interval.range[0];
        interval.fragment = d;
        d.visibleIntervals.push(interval);
      });
      // filter the Genes
      d.visibleGenes = [];
      if (this.frame.genes) {
        this.frame.genes
        .map((e,j) => {e.y = 0; return e;})
        .filter((e, j) => ((e.startPlace <= d.domain[1]) && (e.startPlace >= d.domain[0])) || ((e.endPlace <= d.domain[1]) && (e.endPlace >= d.domain[0]))
          || (((d.domain[1] <= e.endPlace) && (d.domain[1] >= e.startPlace)) || ((d.domain[0] <= e.endPlace) && (d.domain[0] >= e.startPlace))))
        .forEach((gen, j) => {
          let gene = Object.assign(new Gene(gen), gen);
          gene.identifier = Misc.guid;
          gene.range = [d3.max([0, d.innerScale(gene.startPlace)]), d.innerScale(gene.endPlace)];
          gene.shapeWidth = gene.range[1] - gene.range[0];
          gene.shapeHeight = (gene.type === 'gene') ? this.frame.margins.intervals.geneBar : this.frame.margins.intervals.bar;
          gene.fragment = d;
          if (gene.shapeWidth > this.frame.margins.genes.selectionSize) {
            let collisions = d.visibleGenes.filter((f,k) => (gene.identifier !== f.identifier) && gene.isOverlappingWith(f));
            gene.y = collisions.length > 0 ? d3.max(collisions.map((f,k) => f.y)) + 1 : 0;
            d.visibleGenes.push(gene);
          }
        });
        d.yGenes = d3.map(d.visibleGenes, e => e.y).keys().sort((x,y) => d3.ascending(x,y));
        d.yGeneScale = d3.scalePoint().domain(d.yGenes).padding([1]).rangeRound(this.frame.yGeneScale.range());
      }
      // filter the coveragePoints
      if (this.frame.showReads) {
        if (d.changed || d.visibleCoveragePoints === undefined) {

          d.visibleCoveragePoints = this.frame.downsampledCoveragePoints
            .filter((e, j) => ((e.place <= d.domain[1]) && (e.place >= d.domain[0])))
            .map((cov,j) => {
              let coveragePoint = new CoveragePoint(cov);
              coveragePoint.fragment = d;
              return coveragePoint;
            });
          
          let remaining = this.frame.coveragePointsThreshold - d.visibleCoveragePoints.length;
          if (remaining > 0 * this.frame.coveragePointsThreshold) {
            let filteredPoints = this.frame.coveragePoints.filter((e, j) => ((e.place <= d.domain[1]) && (e.place >= d.domain[0])));
            for (let k = 0; k < d3.min([remaining, filteredPoints.length]); k++) {
              let index = remaining < filteredPoints.length ? Math.floor(filteredPoints.length * Math.random()) : k;
              let coveragePoint = new CoveragePoint(filteredPoints[index]);
              //if (d.visibleCoveragePoints.filter((e,j) => e.identifier === coveragePoint.identifier).length < 1) {
                coveragePoint.fragment = d;
                d.visibleCoveragePoints.push(coveragePoint);
                //}
            }
          }
          
        }
      }
      // filter the Walks
      d.visibleWalkIntervals = [];
      this.frame.walks.forEach((walk, j) => {
        walk.intervals
        .filter((e, j) => ((e.startPlace <= d.domain[1]) && (e.startPlace >= d.domain[0])) || ((e.endPlace <= d.domain[1]) && (e.endPlace >= d.domain[0]))
          || (((d.domain[1] <= e.endPlace) && (d.domain[1] >= e.startPlace)) || ((d.domain[0] <= e.endPlace) && (d.domain[0] >= e.startPlace))))
        .forEach((interval, j) => {
          interval.identifier = Misc.guid;
          interval.range = [d3.max([0, d.innerScale(interval.startPlace)]), d.innerScale(interval.endPlace)];
          interval.shapeWidth = interval.range[1] - interval.range[0];
          interval.fragment = d;
          interval.walk = walk;
          d.visibleWalkIntervals.push(interval);
        });
      });
      d.yWalks = d3.map(d.visibleWalkIntervals, e => e.y).keys().sort((x,y) => d3.ascending(x,y));
      d.yWalkScale = d3.scalePoint().domain(d.yWalks).padding([1]).rangeRound([this.frame.margins.panels.gap, this.frame.margins.panels.upperGap - this.frame.margins.panels.chromoGap - this.frame.margins.panels.gap]);
      // filter the connections on same fragment
      frameConnections = frameConnections.filter((e, j) => ((d.selectionSize < this.frame.margins.brushes.minSelectionSize) || (!e.isSubConnection)))
      frameConnections
        .filter((e, j) => (!e.source || ((e.source.place <= d.domain[1]) && (e.source.place >= d.domain[0]))) && (!e.sink || ((e.sink.place <= d.domain[1]) && (e.sink.place >= d.domain[0]))))
        .forEach((connection, j) => {
          if (connection.source) {
            connection.source.scale = d.scale;
            connection.source.fragment = d;
          }
          if (connection.sink) {
            connection.sink.scale = d.scale;
            connection.sink.fragment = d;
          }
          connection.touchScale = d.scale;
          connection.identifier = Misc.guid;
          this.connections.push(connection);
        });
      // filter the walk connections on same fragment
      frameWalkConnections
        .filter((e, j) => (!e.source || ((e.source.place <= d.domain[1]) && (e.source.place >= d.domain[0]))) && (!e.sink || ((e.sink.place <= d.domain[1]) && (e.sink.place >= d.domain[0]))))
        .forEach((connection, j) => {
          if (connection.source) {
            connection.source.scale = d.scale;
            connection.source.fragment = d;
          }
          if (connection.sink) {
            connection.sink.scale = d.scale;
            connection.sink.fragment = d;
          }
          connection.touchScale = d.scale;
          connection.yScale = d.yWalkScale;
          connection.identifier = Misc.guid;
          this.walkConnections.push(connection);
         });
    });
    // filter the connections between the visible fragments
    k_combinations(this.visibleFragments, 2).forEach((pair, i) => {
      frameConnections
        .filter((e, j) => (e.type !== 'LOOSE')
          && (((e.source.place <= pair[0].domain[1]) && (e.source.place >= pair[0].domain[0]) && (e.sink.place <= pair[1].domain[1]) && (e.sink.place >= pair[1].domain[0]))
          ||((e.source.place <= pair[1].domain[1]) && (e.source.place >= pair[1].domain[0]) && (e.sink.place <= pair[0].domain[1]) && (e.sink.place >= pair[0].domain[0]))))
        .forEach((connection, j) => {
          if ((connection.source.place <= pair[0].domain[1]) && (connection.source.place >= pair[0].domain[0])) {
            connection.source.scale = pair[0].scale;
            connection.source.fragment = pair[0];
          } else {
            connection.source.scale = pair[1].scale;
            connection.source.fragment = pair[1];
          }
          if ((connection.sink.place <= pair[0].domain[1]) && (connection.sink.place >= pair[0].domain[0])) {
            connection.sink.scale = pair[0].scale;
            connection.sink.fragment = pair[0];
          } else {
            connection.sink.scale = pair[1].scale;
            connection.sink.fragment = pair[1];
          }
          connection.identifier = Misc.guid;
          this.connections.push(connection);
        });
    });
    // filter the walk connections between the visible fragments
    k_combinations(this.visibleFragments, 2).forEach((pair, i) => {
      frameWalkConnections
        .filter((e, j) => (e.type !== 'LOOSE')
          && (((e.source.place <= pair[0].domain[1]) && (e.source.place >= pair[0].domain[0]) && (e.sink.place <= pair[1].domain[1]) && (e.sink.place >= pair[1].domain[0]))
          ||((e.source.place <= pair[1].domain[1]) && (e.source.place >= pair[1].domain[0]) && (e.sink.place <= pair[0].domain[1]) && (e.sink.place >= pair[0].domain[0]))))
        .forEach((connection, j) => {
          if ((connection.source.place <= pair[0].domain[1]) && (connection.source.place >= pair[0].domain[0])) {
            connection.source.scale = pair[0].scale;
            connection.source.fragment = pair[0];
          } else {
            connection.source.scale = pair[1].scale;
            connection.source.fragment = pair[1];
          }
          if ((connection.sink.place <= pair[0].domain[1]) && (connection.sink.place >= pair[0].domain[0])) {
            connection.sink.scale = pair[0].scale;
            connection.sink.fragment = pair[0];
          } else {
            connection.sink.scale = pair[1].scale;
            connection.sink.fragment = pair[1];
          }
          connection.identifier = Misc.guid;
          this.walkConnections.push(connection);
        });
    });
    // filter the anchor connections
    let visibleConnections = Object.assign([], this.connections).map((d,i) => d.cid);
    this.visibleFragments.forEach((fragment, i) => {
      frameConnections
        .filter((e, j) => { return (e.type !== 'LOOSE') && (!visibleConnections.includes(e.cid))
          && (((e.source.place <= fragment.domain[1]) && (e.source.place >= fragment.domain[0]))
          ||((e.sink.place <= fragment.domain[1]) && (e.sink.place >= fragment.domain[0])))})
        .forEach((con, j) => {
          let connection = Object.assign(new Connection(con), con);
          connection.yScale = this.frame.yScale;
          connection.locateAnchor(fragment);
          this.connections.push(connection);
        });
    });
    // filter the anchor walk connections
    let visibleWalkConnections = Object.assign([], this.walkConnections).map((d,i) => d.cid);
    this.visibleFragments.forEach((fragment, i) => {
      frameWalkConnections
        .filter((e, j) => { return (e.type !== 'LOOSE') && (!visibleWalkConnections.includes(e.cid))
          && (((e.source.place <= fragment.domain[1]) && (e.source.place >= fragment.domain[0]))
          ||((e.sink.place <= fragment.domain[1]) && (e.sink.place >= fragment.domain[0])))})
        .forEach((con, j) => {
          let connection = Object.assign(new Connection(con), con);
          connection.locateAnchor(fragment);
          connection.yScale = fragment.yWalkScale;
          this.walkConnections.push(connection);
        });
    });
    // Calculate the yMax from all the intervals present in the current visible fragments
    this.frame.yMax = d3.min([d3.max(this.visibleFragments.map((d,i) => d.visibleIntervals.map((d,i) => d.y)).reduce((acc, c) => acc.concat(c),[9])), 500]);
    // if we are at less than 10, then render the y axis from 0 to 10
    if (this.frame.yMax < 10) {
      this.frame.yMax = 10;
      this.frame.yScale.domain([0, this.frame.yMax]).range([this.frame.height - this.frame.margins.panels.upperGap + this.frame.margins.top, 2 * this.frame.margins.intervals.bar]).nice();
    } else { // else render the y axis from 0 to 10 and then in orders of 10
      this.frame.yMax = 10 * Math.ceil(this.frame.yMax / 10  + 1);
      this.frame.yScale.domain([0, 10, this.frame.yMax]).range([this.frame.height - this.frame.margins.panels.upperGap + this.frame.margins.top, 0.4 * (this.frame.height - this.frame.margins.panels.upperGap + this.frame.margins.top), 2 * this.frame.margins.intervals.bar]).nice();
    }
    this.frame.yAxis = d3.axisLeft(this.frame.yScale)
      .tickSize(-this.frame.width)
      .tickFormat(d3.format("d"))
      .tickValues(d3.range(0, 10)
      .concat(d3.range(10, 10 * Math.ceil(this.frame.yMax / 10  + 1), 10)));
    if (this.frame.showReads && this.frame.yCoverageScale) {
      // Calculate the yMax from all the coverage points present in the current visible fragments
      let points = [... new Set(this.visibleFragments.map((d,i) => d.visibleCoveragePoints.map((e,j) => Math.round(e.y * 10) / 10)).reduce((acc, c) => acc.concat(c),[]))].sort((a,b) => d3.descending(a,b));
      let upperbound = points[Math.floor(0.01 * points.length)]; //d3.max(points)
      this.frame.yCoverageExtent = [0, upperbound];
      if (this.frame.yCoverageExtent[1] === this.frame.yCoverageExtent[0]) {
        this.frame.yCoverageExtent[0] = this.frame.yCoverageExtent[0] - 1;
        this.frame.yCoverageExtent[1] = this.frame.yCoverageExtent[1] + 1;
      }
      this.frame.yCoverageScale.domain(this.frame.yCoverageExtent.reverse()).nice();
      this.frame.yCoverageAxis = d3.axisLeft(this.frame.yCoverageScale)
        .tickSize(-this.frame.width);
    }
  }

  zoomed(fragment) {
    var self = this;
    fragment.zoomTransform = d3.event.transform;
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
    // set this brush as active

    // get the mouse position in the current panel
    let position = d3.mouse(d3.select('#panel-' + fragment.id).node());
    // get the genome value for the specific mouse position
    let genomePosition = fragment.innerScale.invert(position[0]);

    if (isNaN(fragment.previousZoom)) {
      fragment.previousZoom = {k: 1, x: 0, y: 0};
    }

    // Get the current zoom transform
    let t = d3.event.transform;

    // Get the generated domain upon zoom
    let zoomedDomain = t.rescaleX(this.frame.genomeScale).domain();
    // assign the zoomed domain to the existing panel width
    fragment.innerScale.domain(zoomedDomain);
    // find the new genome value for the specific mouse position
    let zoomedGenomePosition = fragment.innerScale.invert(position[0]);
    // calculate the offset between the original and the zoomed genome position
    let domainOffset = genomePosition - zoomedGenomePosition;

    // shift the zoom tranform by the domain offset
    if (!isNaN(domainOffset) && (Math.abs(fragment.previousZoom.k - t.k) > 1e-3)) {
      t.x = d3.max([d3.min([t.x - t.k * this.frame.genomeScale(domainOffset), 0]), this.frame.width * (1 - t.k)]);
    }

    fragment.previousZoom = Object.assign([], t);
    zoomedDomain = t.rescaleX(this.frame.genomeScale).domain();
    let domain = Object.assign([], zoomedDomain);

    // Calculate the other domains and the domain bounds for the current brush
    let otherDomains = this.fragments.filter((d,i) => (d.selection !== null) && (d.id !== fragment.id)).map((d,i) => d.domain);
    let lowerBound = d3.max(otherDomains.filter((d,i) => fragment.domain && (d[1] <= fragment.domain[0])).map((d,i) => d[1]));
    let upperBound = d3.min(otherDomains.filter((d,i) => fragment.domain && (d[0] >= fragment.domain[1])).map((d,i) => d[0]));

    // if there is an upper bound, set this to the maximum allowed limit
    if ((upperBound !== undefined) && (domain[1] >= upperBound)) {
      domain[1] = upperBound;
      domain[0] = d3.min([domain[0], upperBound - 1]);
    }
    // if there is a lower bound, set this to the lowest allowed limit
    if ((lowerBound !== undefined) && (domain[0] <= lowerBound)) {
      domain[0] = lowerBound;
      domain[1] = d3.max([domain[1], lowerBound + 1]);
    }

    // update the current brush
    fragment.scale.domain(domain);
    fragment.innerScale.domain(domain);
    let selection = [this.frame.genomeScale(domain[0]), this.frame.genomeScale(domain[1])];
    d3.select('#brush-' + fragment.id).call(fragment.brush.move, selection);

    // update the data
    this.updateFragments(false);

    // update the interconnections
    this.renderInterconnections();

    // update the walk interconnections
    this.renderWalkInterconnections();

    //update the panel axis Top
    this.frame.panelsChromoAxisContainerTop.selectAll('g.axis')
      .data(this.visibleFragments,  (d,i) => d.id)
      .each(function(d,i) {
        d3.select(this).select('rect').attr('width', (e, j) => d.rangeWidth);
        d3.select(this).select('text.label-legend').attr('transform', (e, j) => d.labelTopTranslate);
      });

    //update the panel axis Top
    this.frame.panelsChromoAxisContainerBottom.selectAll('g.axis')
      .data(this.visibleFragments,  (d,i) => d.id)
      .each(function(d,i) {
        d3.select(this).call(d.axisBottom).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start');
      });

    // update the chromosome axis
    this.renderChromoAxis();

    // render the Y Axis
    this.renderYAxis();

    // update the intervals
    this.renderIntervals();

    // update the genes
    this.renderGenes();

    // update the walk intervals
    this.renderWalkIntervals();
    
    // update the fragments note
    this.renderFragmentsNote(this.panelDomainsText());

    // update the fragments note
    this.renderFragmentsDetails(this.panelDomainsDetails());

    //d3.selectAll('circle.coverage-circle').style('opacity', 0.33);
    // update the reads
    this.renderReads();
  }

  zoomEnded(fragment) {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush

    // update the browser history
    this.frame.url = `index.html?file=${this.frame.dataFile}&location=${this.frame.note}`;
    history.replaceState(this.frame.url, 'Project gGnome.js', this.frame.url);

  }

  renderClipPath() {
    if (this.visibleFragments.length > 0) {
      this.frame.svgFilter.renderClipPath(this.panelWidth + this.frame.margins.panels.widthOffset, this.panelHeight);
    }
  }

  renderGenesClipPath() {
    if (this.visibleFragments.length > 0) {
      this.frame.svgFilter.renderGenesClipPath(this.panelWidth + this.frame.margins.panels.widthOffset, this.genesPanelHeight);
    }
  }

  renderBrushes() {

    var self = this;

    let brushSelection = this.frame.brushesContainer.selectAll('.brush')
      .data(this.fragments,  (d,i) => d.id);

    // Set up new brushes
    brushSelection
      .enter()
      .insert('g', '.brush')
      .attr('class', 'brush')
      .attr('id', (d,i) => 'brush-' + d.id)
      .each(function(fragment) {
        //call the brush
        d3.select(this).call(fragment.brush);
      });

    // update the brushes
    brushSelection
      .each(function (fragment){
        d3.select(this)
          .attr('class', 'brush')
          .classed('highlighted', (d,i) => d.id === self.activeId)
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
    let self = this;
    let correctionOffset = 1; // used for aligning the rectenges on the y Axis lines

    // Draw the panel rectangles
    let panelRectangles = this.frame.panelsContainer.selectAll('rect.panel')
      .data(this.visibleFragments,  (d,i) => d.id);

    panelRectangles
      .enter()
      .append('rect')
      .attr('class', 'panel')
      .attr('id', (d,i) => 'panel-' + d.id)
      .style('clip-path','url(#clip)')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')')
      .attr('width', (d,i) => d.panelWidth + this.frame.margins.panels.widthOffset)
      .attr('height', (d,i) => d.panelHeight + correctionOffset)
      .each(function(d,i) {
        d3.select(this)
          .call(d.zoom.transform, d3.zoomIdentity
          .scale(self.frame.width / (d.selection[1] - d.selection[0]))
          .translate(-d.selection[0], 0));
      })
      .on('click', (d,i) => {
        this.activeId = d.id;
        this.frame.brushesContainer.selectAll('.brush').classed('highlighted', false);
        d3.select('#brush-' + d.id).classed('highlighted', true);
        this.renderFragmentsNote(this.panelDomainsText());
      })

    panelRectangles
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')')
      .attr('width', (d,i) => d.panelWidth + this.frame.margins.panels.widthOffset)
      .attr('height', (d,i) => d.panelHeight + correctionOffset)
      .each(function(d,i) {
        d3.select(this).call(d.zoom)
         .call(d.zoom.transform, d3.zoomIdentity
         .scale(self.frame.width / (d.selection[1] - d.selection[0]))
         .translate(-d.selection[0], 0));
      });

    panelRectangles
      .exit()
      .remove();
  }

  renderYAxis() {
    this.frame.panelsContainer.select('.axis.axis--y')
      .call(this.frame.yAxis);
  }

  renderChromoAxis() {

    let self = this;

    //Chromo Axis Top
    let chromoAxisContainer = this.frame.panelsChromoAxisContainerTop.selectAll('g.chromo-axis-container')
      .data(this.visibleFragments,  (d,i) => d.id);

    chromoAxisContainer
      .enter()
      .append('g')
      .attr('class', 'chromo-axis-container')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    chromoAxisContainer
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    chromoAxisContainer
      .exit()
      .remove();

    let chromoAxis = chromoAxisContainer.selectAll('g.chromo-legend')
      .data((d,i) => d.chromoAxis, (d,i) => d.identifier);

    chromoAxis
      .enter()
      .append('g')
      .attr('class', 'chromo-legend')
      .attr('transform', (d,i) => d.transform)
      .each(function(d,i) {
        d3.select(this).append('rect').attr('width', (e, j) => d.rangeWidth).attr('y', -self.frame.margins.panels.legend).attr('height', self.frame.margins.panels.legend).style('fill', (e, j) => "url('#gradient" + d.chromo.chromosome +"')");
        d3.select(this).append('text').attr('class', 'label-chromosome').attr('transform', (e, j) => d.labelTopTranslate).text((e, j) => d.chromo.chromosome);
        d3.select(this).append('line').attr('class', 'label-separator').attr('transform', 'translate(0.5,0)').attr('y2', (e, j) => d.separatorHeight).style('stroke', (e, j) => d.chromo.color);
        d3.select(this).append('text').attr('class', 'label-magnitude').attr('text-anchor', 'middle').attr('transform', (e, j) => d.labelMagnitudeTranslate).text((e, j) => d3.format(".1s")(d.magnitude));
        d3.select(this).append('polyline').attr('class', 'line-magnitude').attr('transform', (e, j) => d.magnitudeLegendTransform).attr('points', (e, j) => e.magnitudeLegendPoints);
      })

    chromoAxis
      .attr('transform', (d,i) => d.transform)
      .each(function(d,i) {
        d3.select(this).select('rect').attr('width', (e, j) => d.rangeWidth);
        d3.select(this).select('text.label-chromosome').attr('transform', (e, j) => d.labelTopTranslate);
        d3.select(this).select('line.label-separator').attr('y2', (e, j) => d.separatorHeight);
        d3.select(this).select('text.label-magnitude').attr('transform', (e, j) => d.labelMagnitudeTranslate).text((e, j) => d3.format(".2s")(d.magnitude));
        d3.select(this).select('polyline.line-magnitude').attr('transform', (e, j) => d.magnitudeLegendTransform).attr('points', (e, j) => e.magnitudeLegendPoints);
      });

    chromoAxis
      .exit()
      .remove();

    // Chromo Axis Bottom
    let chromoAxisContainerBottom = this.frame.panelsChromoAxisContainerBottom.selectAll('g.chromo-axis-container-bottom')
      .data(this.visibleFragments,  (d,i) => d.id);

    chromoAxisContainerBottom
      .enter()
      .append('g')
      .attr('class', 'chromo-axis-container-bottom')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    chromoAxisContainerBottom
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    chromoAxisContainerBottom
      .exit()
      .remove();

    let chromoAxisBottom = chromoAxisContainerBottom.selectAll('g.chromo-axis-bottom')
      .data((d,i) => d.chromoAxis, (d,i) => d.identifier);

    chromoAxisBottom
      .enter()
      .append('g')
      .attr('class', 'chromo-axis-bottom axis axis--x')
      .attr('transform', (d,i) => d.transform)
      .each(function(d,i) {
        d3.select(this).call(d.axisBottom).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start').style('fill', (e, j) => d.chromo.color);
      });

    chromoAxisBottom
      .attr('transform', (d,i) => d.transform)
      .each(function(d,i) {
        d3.select(this).call(d.axisBottom).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start').style('fill', (e, j) => d.chromo.color);
      });

    chromoAxisBottom
      .exit()
      .remove();
  }

  renderIntervals() {
    let self = this;

    // create the g elements containing the intervals
    let shapesPanels = this.frame.shapesContainer.selectAll('g.shapes-panel')
      .data(this.visibleFragments, (d,i) => d.id);

    shapesPanels
      .enter()
      .append('g')
      .attr('class', 'shapes-panel')
      .style('clip-path','url(#clip)')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    shapesPanels
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    shapesPanels
      .exit()
      .remove();

    // add the actual intervals as rectangles
    let shapes = shapesPanels.selectAll('rect.shape')
      .data((d,i) => d.visibleIntervals, (d,i) =>  d.identifier);

    shapes
      .enter()
      .append('rect')
      .attr('id', (d,i) => d.identifier)
      .attr('class', 'popovered shape')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], this.frame.yScale(d.y) - 0.5 * this.frame.margins.intervals.bar] + ')')
      .attr('width', (d,i) => d.shapeWidth)
      .attr('height', this.frame.margins.intervals.bar)
      .style('fill', (d,i) => d.color)
      .style('stroke', (d,i) => d3.rgb(d.color).darker(1))
      .on('mouseover', function(d,i) {
        d3.select(this).classed('highlighted', true);
      })
      .on('mouseout', function(d,i) {
        d3.select(this).classed('highlighted', false);
      })
      .on('mousemove', (d,i) => this.loadPopover(d))
      .on('click', (d,i) => {
        this.renderFragmentsNote(d.location);
      })
      .on('dblclick', (d,i) => {
        let fragment = d.fragment;
        let lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.endPlace - d.startPlace);
        let domainOffset = this.frame.margins.intervals.gap / lambda;
        fragment.domain = [d.startPlace - domainOffset, d.endPlace + domainOffset];
        fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
        d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
        this.update();
      })
      .call(d3.drag()
        .subject((d,i) =>  {return {x: d.range[0], y: (this.frame.yScale(d.y) - 0.5 * this.frame.margins.intervals.bar)}})
        .on('start', function(d,i) {
          if (self.frame.settings && self.frame.settings.y_axis && !self.frame.settings.y_axis.visible) {
            d3.select(this).raise()
              .classed('highlighted', false)
              .classed('dragged', true)
              .attr('cursor', 'move');
            self.frame.clearPopovers();
          } else {
            return;
          }
        })
        .on('drag', function(d,i) {
          if (self.frame.settings && self.frame.settings.y_axis && !self.frame.settings.y_axis.visible) {
            d3.select(this).raise().classed('highlighted', false);
            let ypos = (self.frame.yScale.invert(d3.event.y));
            ypos = d3.max([ypos, d3.min(self.frame.yScale.domain())]);
            ypos = d3.min([ypos, d3.max(self.frame.yScale.domain())]);
            d3.select(this).attr('transform', 'translate(' + [d.range[0], self.frame.yScale(ypos) - 0.5 * self.frame.margins.intervals.bar] + ')');
            d.y = ypos;
            self.frame.intervals.find((e,j) => e.iid === d.iid).y = ypos;
            self.frame.intervalBins[d.iid] = d;
            self.frame.connectionsContainer.selectAll('path.connection')
              .filter((e,j) => (e.source && (e.source.intervalId === d.iid)) || (e.sink && (e.sink.intervalId === d.iid)))
              .each((e,j) => e.pinpoint(self.frame.intervalBins))
              .attr('d', (e,j) => e.render);
          } else {
            return;
          }
        })
        .on('end', function(d,i) {
          if (self.frame.settings && self.frame.settings.y_axis && !self.frame.settings.y_axis.visible) {
            d3.select(this).classed('dragged', false).attr('cursor', 'default');
          } else {
            return;
          }
        }));

    shapes
      .attr('id', (d,i) => d.identifier)
      .attr('transform', (d,i) => 'translate(' + [d.range[0], this.frame.yScale(d.y) - 0.5 * this.frame.margins.intervals.bar] + ')')
      .attr('width', (d,i) => d.shapeWidth)
      .style('fill', (d,i) => d.color)
      .style('stroke', (d,i) => d3.rgb(d.color).darker(1));

    shapes
      .exit()
      .remove();
  }

  renderGenes() {
    var self = this;
    // create the g elements containing the intervals
    let genesPanels = this.frame.genesContainer.selectAll('g.genes-panel')
      .data(this.visibleFragments, (d,i) => d.id);

    genesPanels
      .enter()
      .append('g')
      .attr('class', 'genes-panel')
      .style('clip-path','url(#genes-clip)')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    genesPanels
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    genesPanels
      .exit()
      .remove();

    if (this.frame.showGenes) {
      // add the actual intervals as rectangles
      let genes = genesPanels.selectAll('polygon.geneShape')
        .data((d,i) => d.visibleGenes, (d,i) =>  d.identifier);

      genes
        .enter()
        .append('polygon')
        .attr('id', (d,i) => d.identifier)
        .attr('class', (d,i) => 'popovered geneShape ' + d.type)
        .attr('transform', (d,i) => 'translate(' + [d.range[0], d.fragment.yGeneScale(d.y)] + ')')
        .attr('points', (d,i) => d.points)
        .style('fill', (d,i) => d.fill)
        .style('stroke', (d,i) => d.stroke)
        .on('mouseover', function(d,i) {
          d3.select(this).classed('highlighted', true);
        })
        .on('mouseout', function(d,i) {
          d3.select(this).classed('highlighted', false);
        })
        .on('mousemove', (d,i) => this.loadPopover(d))
        .on('click', (d,i) => {
          // show the gene location on the fragment note
          this.renderFragmentsNote(d.location);
          // filter the Genes
          var geneScale = d3.scaleLinear().domain([d.startPoint, d.endPoint]).range([0, this.frame.genesPlotWidth]);
          let modalGenes = [];
          this.frame.dataInput.genes
          .filter((e, j) => (e.group_id === d.group_id))
          .forEach((e, j) => {
            let gene = new Gene(e);
            gene.color = this.frame.chromoBins[gene.chromosome].color;
            gene.identifier = Misc.guid;
            gene.startPlace = Math.floor(this.frame.chromoBins[gene.chromosome].scaleToGenome(gene.startPoint));
            gene.endPlace = Math.floor(this.frame.chromoBins[gene.chromosome].scaleToGenome(gene.endPoint));
            gene.range = [d3.max([0, geneScale(gene.startPoint)]), geneScale(gene.endPoint)];
            gene.shapeWidth = gene.range[1] - gene.range[0];
            gene.shapeHeight = (gene.type === 'gene') ? this.frame.margins.intervals.geneBar : this.frame.margins.intervals.bar;
            gene.fragment = d;
            gene.coefficient = 4;
            modalGenes.push(gene);
          });
          this.renderGeneModalPlot(d, modalGenes);
          this.frame.clearPopovers();
          this.frame.showGeneModal();
        });

      genes
        .attr('id', (d,i) => d.identifier)
        .attr('transform', (d,i) => 'translate(' + [d.range[0], d.fragment.yGeneScale(d.y)] + ')')
        .attr('points', (d,i) => d.points)
        .style('fill', (d,i) => d.fill)
        .style('stroke', (d,i) => d.stroke);

      genes
       .exit()
       .remove();
    
      // add the actual intervals as rectangles
      let genesLabels = genesPanels.selectAll('text.gene-label')
        .data((d,i) => d.visibleGenes, (d,i) =>  d.identifier);
    
      genesLabels
        .enter()
        .append('text')
        .attr('id', (d,i) => d.identifier)
        .attr('class', (d,i) => 'gene-label')
        .attr('transform', (d,i) => 'translate(' + [d.range[0], d.fragment.yGeneScale(d.y) - this.frame.margins.genes.textGap] + ')')
        .text((d,i) => d.title);
    
      genesLabels
        .attr('id', (d,i) => d.identifier)
        .attr('transform', (d,i) => 'translate(' + [d.range[0], d.fragment.yGeneScale(d.y) - this.frame.margins.genes.textGap] + ')')
        .text((d,i) => d.title);

      genesLabels
        .exit()
        .remove();

      genesPanels.selectAll('text.gene-label')
        .style('opacity', function(d,i) {
          let textLength = d3.select(this).node().getComputedTextLength();
          let collisions = d.fragment.visibleGenes.filter((e,j) => ((e.identifier !== d.identifier) && (e.y === d.y) && (e.range[0] > d.range[0]) && (e.range[0] <= (d.range[0] + textLength)) && (e.opacity > 0))).length;
          d.opacity = ((collisions < 1) ? 1 : 0);
          return d.opacity;
        });
    } else {
      genesPanels.selectAll('polygon.geneShape').remove();
      genesPanels.selectAll('text.gene-label').remove();
    }

  }

  renderWalkIntervals() {
    let self = this;

    // create the g elements containing the intervals
    let shapesPanels = this.frame.walksContainer.selectAll('g.walks-panel')
      .data(this.visibleFragments, (d,i) => d.id);

    shapesPanels
      .enter()
      .append('g')
      .attr('class', 'walks-panel')
      .style('clip-path','url(#genes-clip)')
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    shapesPanels
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')');

    shapesPanels
      .exit()
      .remove();

    if (this.frame.showWalks) {
      // add the actual intervals as rectangles
      let shapes = shapesPanels.selectAll('polygon.shape')
        .data((d,i) => d.visibleWalkIntervals, (d,i) =>  d.identifier);

      shapes
        .enter()
        .append('polygon')
        .attr('id', (d,i) => d.identifier)
        .attr('class', 'popovered shape')
        .attr('transform', (d,i) => 'translate(' + [d.range[0], d.fragment.yWalkScale(d.y) - 0.5 * this.frame.margins.walks.bar] + ')')
        .attr('points', (d,i) => d.points)
        .style('fill', (d,i) => 'url(#fill-tilted)')
        .style('stroke', (d,i) => d3.rgb(d.color).darker(1))
        .on('mouseover', function(d,i) {
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid === d.walk.pid).classed('walk-highlighted', true);
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', true);
          self.frame.walkConnectionsContainer.selectAll('path.connection').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', true);
        })
        .on('mouseout', function(d,i) {
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid === d.walk.pid).classed('walk-highlighted', false);
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', false);
          self.frame.walkConnectionsContainer.selectAll('path.connection').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', false);
        })
        .on('mousemove', (d,i) => this.loadPopover(d));

      shapes
        .attr('id', (d,i) => d.identifier)
        .attr('transform', (d,i) => 'translate(' + [d.range[0], d.fragment.yWalkScale(d.y) - 0.5 * this.frame.margins.walks.bar] + ')')
        .attr('points', (d,i) => d.points)
        .style('fill', (d,i) => 'url(#fill-tilted)')
        .style('stroke', (d,i) => d3.rgb(d.color).darker(1));

      shapes
        .exit()
        .remove();
    } else {
      shapesPanels.selectAll('polygon.shape').remove();
    }
  }
  
  renderInterconnections() {

    let connections = this.frame.connectionsContainer.selectAll('path.connection')
      .data(this.connections, (d,i) => d.identifier);

    connections.exit().remove();

    connections
      .attr('class', (d,i) => d.styleClass)
      .style('fill', (d,i) => d.fill)
      .style('stroke', (d,i) => d.stroke)
      .attr('transform', (d,i) => d.transform)
      .attr('d', (d,i) => d.render);

    connections
      .enter()
      .append('path')
      .attr('id', (d,i) => d.identifier)
      .attr('class', (d,i) => d.styleClass)
      .attr('transform', (d,i) => d.transform)
      .style('fill', (d,i) => d.fill)
      .style('stroke', (d,i) => d.stroke)
      .attr('d', (d,i) =>  d.render)
      .on('mouseover', function(d,i) {
        d3.select(this).classed('highlighted', true);
      })
      .on('mouseout', function(d,i) {
        d3.select(this).classed('highlighted', false);
      })
      .on('mousemove', (d,i) => this.loadPopover(d))
      .on('click', (d,i) => {
        this.renderFragmentsNote(d.location);
      })
      .on('dblclick', (d,i) => {
        if (d.kind === 'ANCHOR') {
          this.createBrush();
          let fragment = this.fragments[this.fragments.length - 1];
          fragment.domain = [0.99 * d.otherEnd.interval.startPlace, 1.01 * d.otherEnd.interval.endPlace];
          fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
          this.update();
          fragment = d3.select('#brush-' + fragment.id).datum();
          let lambda = (this.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.otherEnd.interval.endPlace - d.otherEnd.interval.startPlace);
          let domainOffset = this.frame.margins.intervals.gap / lambda;
          fragment.domain = [d.otherEnd.interval.startPlace - domainOffset, d.otherEnd.interval.endPlace + domainOffset];
          fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
          d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
          this.update();
        } else {
          if (d.source.fragment.id === d.sink.fragment.id) {
            let fragment = d.source.fragment;
            let lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / Math.abs(d.source.place - d.sink.place);
            let domainOffset = this.frame.margins.intervals.gap / lambda;
            fragment.domain = [d3.min([d.source.place, d.sink.place]) - domainOffset, d3.max([d.source.place, d.sink.place]) + domainOffset];
            fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
            d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
            this.update();
          } else {
            // first align the source interval
            let fragment = d.source.fragment;
            let lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.source.interval.endPlace - d.source.interval.startPlace);
            let domainOffset = this.frame.margins.intervals.gap / lambda;
            fragment.domain = [d.source.interval.startPlace - domainOffset, d.source.interval.endPlace + domainOffset];
            fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
            d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
            this.update();
            // second align the sink interval
            fragment = d.sink.fragment;
            lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.sink.interval.endPlace - d.sink.interval.startPlace);
            domainOffset = this.frame.margins.intervals.gap / lambda;
            fragment.domain = [d.sink.interval.startPlace - domainOffset, d.sink.interval.endPlace + domainOffset];
            fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
            d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
            this.update();
          }
        }
      });
  }

  renderWalkInterconnections() {
    var self = this;

    if (this.frame.showWalks) {
      let connections = this.frame.walkConnectionsContainer.selectAll('path.connection')
        .data(this.walkConnections, (d,i) => d.identifier);

      connections.exit().remove();

      connections
        .attr('class', (d,i) => d.styleClass)
        .style('fill', (d,i) => d.fill)
        .style('stroke', (d,i) => d.stroke)
        .attr('transform', (d,i) => d.transform)
        .attr('d', (d,i) => d.render);

      connections
        .enter()
        .append('path')
        .attr('id', (d,i) => d.identifier)
        .attr('class', (d,i) => d.styleClass)
        .attr('transform', (d,i) => d.transform)
        .style('fill', (d,i) => d.fill)
        .style('stroke', (d,i) => d.stroke)
        .attr('d', (d,i) =>  d.render)
        .on('mouseover', function(d,i) {
          d3.select(this).classed('highlighted', true);
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid === d.walk.pid).classed('walk-highlighted', true);
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', true);
          self.frame.walkConnectionsContainer.selectAll('path.connection').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', true);
        })
        .on('mouseout', function(d,i) {
          d3.select(this).classed('highlighted', false);
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid === d.walk.pid).classed('walk-highlighted', false);
          d3.selectAll('polygon.shape').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', false);
          self.frame.walkConnectionsContainer.selectAll('path.connection').filter((e,j) => e.walk.pid !== d.walk.pid).classed('faded', false);
        })
        .on('mousemove', (d,i) => this.loadPopover(d))
        .on('dblclick', (d,i) => {
          if (d.kind === 'ANCHOR') {
            this.createBrush();
            let fragment = this.fragments[this.fragments.length - 1];
            fragment.domain = [0.99 * d.otherEnd.interval.startPlace, 1.01 * d.otherEnd.interval.endPlace];
            fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
            this.update();
            fragment = d3.select('#brush-' + fragment.id).datum();
            let lambda = (this.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.otherEnd.interval.endPlace - d.otherEnd.interval.startPlace);
            let domainOffset = this.frame.margins.intervals.gap / lambda;
            fragment.domain = [d.otherEnd.interval.startPlace - domainOffset, d.otherEnd.interval.endPlace + domainOffset];
            fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
            d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
            this.update();
          } else {
            if (d.source.fragment.id === d.sink.fragment.id) {
              let fragment = d.source.fragment;
              let lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / Math.abs(d.source.place - d.sink.place);
              let domainOffset = this.frame.margins.intervals.gap / lambda;
              fragment.domain = [d3.min([d.source.place, d.sink.place]) - domainOffset, d3.max([d.source.place, d.sink.place]) + domainOffset];
              fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
              d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
              this.update();
            } else {
              // first align the source interval
              let fragment = d.source.fragment;
              let lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.source.interval.endPlace - d.source.interval.startPlace);
              let domainOffset = this.frame.margins.intervals.gap / lambda;
              fragment.domain = [d.source.interval.startPlace - domainOffset, d.source.interval.endPlace + domainOffset];
              fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
              d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
              this.update();
              // second align the sink interval
              fragment = d.sink.fragment;
              lambda = (fragment.panelWidth - 2 * this.frame.margins.intervals.gap) / (d.sink.interval.endPlace - d.sink.interval.startPlace);
              domainOffset = this.frame.margins.intervals.gap / lambda;
              fragment.domain = [d.sink.interval.startPlace - domainOffset, d.sink.interval.endPlace + domainOffset];
              fragment.selection = [this.frame.genomeScale(fragment.domain[0]), this.frame.genomeScale(fragment.domain[1])];
              d3.select('#brush-' + fragment.id).call(fragment.brush.move, fragment.selection);
              this.update();
            }
          }
        });
    } else {
      this.frame.walkConnectionsContainer.selectAll('path.connection').remove();
    }
  }

  renderReads() {

    if (this.frame.showReads) {

     // render the reads coverage Y axis
     this.frame.readsContainer.select('.axis.axis--y')
       .call(this.frame.yCoverageAxis);

       this.frame.reglCanvas.points = [];
       this.visibleFragments.forEach((fragment) => {
         fragment.visibleCoveragePoints.forEach((d,i) => {
           this.frame.reglCanvas.points.push({
             x: Math.floor(fragment.range[0] + this.frame.margins.left + d.fragment.innerScale(d.place)),
             y: Math.floor(this.frame.margins.panels.chromoGap + this.frame.yCoverageScale(d.y)),
             size: 2 * d.radius,
             color: d.fill
           });
         });
       });
    } else {
      this.frame.reglCanvas.points = [];
    }

  }

  panelDomainsText() {
    return this.visibleFragments.map((d,i) => d.chromoAxis.map((e, j) => {
      return (e.chromo.chromosome + ':' + Math.floor(e.scale.domain()[0]) + '-' + Math.floor(e.scale.domain()[1]));
    }).join(' ')).join(' | ');
  }

  panelDomainsDetails() {
    return this.visibleFragments.map((d,i) => {
    let text = 'Panel #' + (i + 1) + '\r\n';
    text += d.chromoAxis.map((e, j) => {
      return (e.chromo.chromosome + ':' + Math.floor(e.scale.domain()[0]) + '-' + Math.floor(e.scale.domain()[1]));
    }).join(' ')
    return text;
    }).join('\r\n');
  }

  renderFragmentsNote(note) {
    this.frame.note = note;
    d3.select('#fragmentsNote').text(note);
  }

  renderFragmentsDetails(note) {
    d3.select('#fragmentsDetails').text(note);
  }

  renderGeneModalPlot(gene, modalGenes) {
    // Add the title
    this.frame.geneModalTitle.text(gene.modalTitle);
    // add the actual genes as rectangles
    let genes = this.frame.genesTypesPlot.selectAll('polygon.geneShape')
      .data(modalGenes, (d,i) =>  d.identifier);

    genes
      .enter()
      .append('polygon')
      .attr('id', (d,i) => d.identifier)
      .attr('class', (d,i) => 'popovered geneShape ' + d.type)
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')')
      .attr('points', (d,i) => d.points)
      .style('fill', (d,i) => d.fill)
      .style('stroke', (d,i) => d.stroke)
      .on('mouseover', function(d,i) {
        d3.select(this).classed('highlighted', true);
      })
      .on('mouseout', function(d,i) {
        d3.select(this).classed('highlighted', false);
      })
      .on('mousemove', (d,i) => this.loadPopover(d))
      .on('dblclick', (d,i) => {
      });

    genes
      .attr('id', (d,i) => d.identifier)
      .attr('transform', (d,i) => 'translate(' + [d.range[0], 0] + ')')
      .attr('points', (d,i) => d.points)
      .style('fill', (d,i) => d.fill)
      .style('stroke', (d,i) => d.stroke);

    genes
     .exit()
    .remove();
  }

  loadPopover(d) {
    var popover = d3.select('.popover');
    popover.select('.popover-title').html(d.popoverTitle);
    popover.select('.popover-content').html(d.popoverContent);
    popover.select('.popover-content span').style('color', d.color)
    popover
      .style('left', (d3.event.pageX - 1.0 *  popover.node().getBoundingClientRect().width / 2) + 'px')
      .style('top', (d3.event.pageY - 1.51 * popover.node().getBoundingClientRect().height - 3) + 'px')
      .classed('hidden', false)
      .style('display', 'block')
      .transition()
      .duration(5)
      .style('opacity', 1);
  }

}