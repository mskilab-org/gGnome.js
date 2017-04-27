// The hashmap mapping the chromosome id to the chromosome metadata
function getMetadata(dataArray) {
  return dataArray.metadata.reduce(function(hash, elem) { hash[elem.chromosome] = elem; return hash }, {});
}

// The hashmap mapping each interval id to the interval itself
function getIntervalBins(dataArray) {
  return dataArray.intervals.reduce(function(hash, elem) { hash[elem.iid] = elem; return hash }, {});
}
// merge and deduplicate array in the form [ [1, 2, 3], [101, 2, 1, 10], [2, 1] ]
function getArraysIntersection(array1, array2) {
  array1.filter(function(n) {
    return array2.indexOf(n) !== -1;
  })
}
// The hashmap mapping the connection id to the connection and its intervals
function getConnectionBins(dataArray, intervalBins) {
  return dataArray.connections.reduce(function(hash, elem) { 
    hash[elem.cid] = {
      connection: elem,
      source: intervalBins[elem.source && Math.abs(elem.source)],
      sink: intervalBins[elem.sink && Math.abs(elem.sink)]
    }; 
    return hash; }, {});
}
// The hashmap mapping the connection id to the connections between intervals in different chromosomes selected on the panels
function getInterChromosomeConnectionBins(dataArray, panels, connectionBins) {
  console.log('----------------------')
  var outbounded = [];
  var currentPanel, nextPanel, previousPanel, record;
  var verdict, guard1, guard2, guard3, sourceBounded, sinkBounded;
  var source, sink, isLastPanel, isFirstPanel, results = [];
  for (var i = 0; i < panels.length; i++) {
    isLastPanel = (i === (panels.length - 1));
    isFirstPanel = i < 1;
    previousPanel = panels[i - 1];
    currentPanel = panels[i];
    nextPanel = panels[i + 1];
    dataArray.connections.forEach(function(elem, index) {
      record = Object.assign({}, elem); // Always copy the content!
      source = connectionBins[record.cid].source;
      sink = connectionBins[record.cid].sink;
      if (record.type === 'LOOSE') {
        if ((!source) && (sink) && (sink.chromosome === currentPanel.chromosome)) {
          record.panel = panels[i];
          record.sinkJabba = sink.y;
          record.sinkChromosome = sink.chromosome;
          record.sinkPoint = record.sink > 0 ? sink.endPoint : sink.startPoint;
          record.touchPointX = record.sinkPoint;
          record.touchPointY = record.sinkJabba;
          record.touchpointSign = Math.sign(record.sink);
        } else if ((source) && (!sink) && (source.chromosome === currentPanel.chromosome))  {
          record.panel = panels[i];
          record.sourceJabba = source.y;
          record.sourceChromosome = source.chromosome;
          record.sourcePoint = record.source > 0 ? source.endPoint : source.startPoint;
          record.touchPointX = record.sourcePoint;
          record.touchPointY = record.sourceJabba;
          record.touchpointSign = Math.sign(record.source);
        }
        verdict = ((record.touchPointX <= currentPanel.scale.domain()[1]) && (record.touchPointX >= currentPanel.scale.domain()[0]));
        if (verdict) {
          record.identifier = record.cid + '-'+ record.panel.column;
          record.points = getLooseConnectorEndpoints(record);
          record.popoverTitle = popoverConnectionTitle(record, index);
          record.popoverContent = popoverConnectionContent(record, index);
          record.render = record.panel.lineRenderer(record.points);
          record.styleClass = 'popovered connection local ' + record.type;
          record.transform = "translate(" + [0, 0] + ")";
          record.clipPath = "url(#clipWidth)";
          results.push(record);
        }
      } else {
        guard1 = (!isLastPanel && (((source.chromosome === currentPanel.chromosome) && (sink.chromosome === nextPanel.chromosome)) || ((source.chromosome === nextPanel.chromosome) && (sink.chromosome === currentPanel.chromosome))));
        guard2 = ((!isLastPanel) && (currentPanel.chromosome !== nextPanel.chromosome) && (sink.chromosome === source.chromosome) && (source.chromosome === currentPanel.chromosome) && ((isFirstPanel) || (currentPanel.chromosome !== previousPanel.chromosome)));
        guard2 = guard2 || (isLastPanel && (currentPanel.chromosome !== previousPanel.chromosome) && (sink.chromosome === source.chromosome) && (source.chromosome === currentPanel.chromosome));
        guard3 = ((!isLastPanel) && (((source.chromosome === currentPanel.chromosome) && (sink.chromosome !== nextPanel.chromosome)) || ((sink.chromosome === currentPanel.chromosome) && (source.chromosome !== nextPanel.chromosome))));
        guard3 = guard3 || ((isLastPanel) && (((source.chromosome === currentPanel.chromosome) && (sink.chromosome !== previousPanel.chromosome)) || ((sink.chromosome === currentPanel.chromosome) && (source.chromosome !== previousPanel.chromosome)))); 
        verdict = guard1 || guard2;
        if (verdict) {
          if (guard2) {
            record.sourcePanel = currentPanel;
            record.sinkPanel = currentPanel;
          } else if (guard1) {
            if ((source.chromosome === currentPanel.chromosome) && (sink.chromosome === nextPanel.chromosome)) {
              record.sourcePanel = currentPanel;
              record.sinkPanel = nextPanel;
            } else {
              record.sourcePanel = nextPanel;
              record.sinkPanel = currentPanel;
            }
          }
          record.identifier = record.cid + '-'+ record.sourcePanel.column + '-' + record.sinkPanel.column;
          record.sourcePoint = (record.source < 0) ? source.startPoint : source.endPoint;
          record.sinkPoint   = (record.sink < 0)   ? sink.startPoint   : sink.endPoint;
          record.sourceJabba = source.y;
          record.sinkJabba = sink.y;
          record.sourceChromosome = source.chromosome;
          record.sinkChromosome = sink.chromosome;
          record.popoverTitle = popoverConnectionTitle(record, index);
          record.popoverContent = popoverConnectionContent(record, index);
          sourceBounded = (record.sourcePoint <= record.sourcePanel.scale.domain()[1]) && (record.sourcePoint >= record.sourcePanel.scale.domain()[0]);
          sinkBounded = (record.sinkPoint <= record.sinkPanel.scale.domain()[1]) && (record.sinkPoint >= record.sinkPanel.scale.domain()[0]);
          verdict = verdict && (sourceBounded && sinkBounded);
          console.log(i, record.sinkPanel.scale.domain().join())
          if (verdict) {
            record.points = getInterConnectorEndpoints(record);
            record.render = currentPanel.lineRenderer(record.points);
            record.styleClass = 'popovered connection local ' + record.type;
            record.transform = 'translate(' + [0, 0] + ')';
            record.clipPath = 'url(#clipWidth)';
            results.push(record);
          }
          if (sourceBounded && !sinkBounded) {
            outbounded.push(record)
            console.log(i, record.cid, source.iid, record.sinkPoint, record.sourcePanel.chromosome, record.sinkPanel.scale.domain())
          }
            /* 
            else if (sourceBounded && !sinkBounded) {
              record.touchPointX = record.sourcePoint;
              record.touchPointY = record.sourceJabba;
              record.touchpointSign = Math.sign(record.source);
              record.points = [record.sourcePanel.panelScale(record.touchPointX), record.sourcePanel.yScale(record.touchPointY)];
              record.render = currentPanel.arcRenderer(record);
              record.transform = 'translate(' + record.points + ')';
              record.styleClass = 'popovered arc';
              record.clipPath = "";
              results.push(record);
            } else if (!sourceBounded && sinkBounded) {
              record.touchPointX = record.sinkPoint;
              record.touchPointY = record.sinkJabba;
              record.touchpointSign = Math.sign(record.sink);
              record.points = [record.sinkPanel.panelScale(record.touchPointX), record.sinkPanel.yScale(record.touchPointY)];
              record.render = currentPanel.arcRenderer(record);
              record.transform = 'translate(' + record.points + ')';
              record.styleClass = 'popovered arc';
              record.clipPath = "";
              results.push(record);
            }
            */
        }
      }
    });
  }
  console.log(outbounded)
  return results;
}
// The hashmap mapping the connection id to the connections between intervals in different chromosomes, not selected on the panels
function getAnchorInterChromosomeConnectionBins(dataArray, panels, connectionBins) {
  var panelChromosomes = panels.map(function(d,i) { return d.chromosome; });
  return dataArray.connections.reduce(function(hash, elem) {
  var source = connectionBins[elem.cid].source;
  var sink = connectionBins[elem.cid].sink;
  if ((elem.type !== 'LOOSE') && (source.chromosome !== sink.chromosome) && !((panelChromosomes.includes(source.chromosome)) && (panelChromosomes.includes(sink.chromosome)))) {
    if (!hash[source.chromosome]) {
      hash[source.chromosome] = [];
    }
    if (!hash[sink.chromosome]) {
      hash[sink.chromosome] = [];
    }
    hash[source.chromosome].push(elem);
    hash[sink.chromosome].push(elem);
  }
  return hash; }, {});
}

// The title for the popover on the intervals
function popoverIntervalTitle(d,i) {
  return 'Interval #' + d.title;
}

// The content for the popover of the intervals
function popoverIntervalContent(d,i) {
  var content = '';
  [{label: 'Chromosome', value: d.chromosome}, {label: 'Jabba', value: d.y}, {label: 'Start Point', value: d3.format(',')(d.startPoint)},
   {label: 'End Point', value: d3.format(',')(d.endPoint)}, {label: 'Interval Length', value: d3.format(',')(d.intervalLength)}, {label: 'Strand', value: d.strand}].forEach(function(e,j) {
     content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
   });
  return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
}

// The title for the popover on the connections
function popoverConnectionTitle(d,i) {
  return 'Connection #' + d.cid + ' - ' + d.type;
}

// The content for the popover on the connections
function popoverConnectionContent(d,i) {
  var content = '';
  var array = [
    ['&nbsp;', '<strong>Source</strong>', '<strong>Sink</strong>'], 
    ['Chromosome', ((!d.source) ? 'Unknown' : d.sourceChromosome), ((!d.sink) ? 'Unknown' : d.sinkChromosome)], 
    ['Interval', ((!d.source) ? 'Unknown' : (Math.abs(d.source) + (d.source > 0 ? ' (tail)' : ' (head)'))), ((!d.sink) ? 'Unknown' : (Math.abs(d.sink) + (d.sink > 0 ? ' (tail)' : ' (head)')))],
    ['Point', ((!d.source) ? 'Unknown' : d3.format(',')(d.sourcePoint)), ((!d.sink) ? 'Unknown' : d3.format(',')(d.sinkPoint))],
    ['Jabba', ((!d.source) ? 'Unknown' : (d.sourceJabba)), ((!d.sink) ? 'Unknown' : (d.sinkJabba))]
  ];
  array.forEach(function(e,j) {
     content += '<tr><td class="table-label" align="left" width="100" valign="top"><strong>' + e[0] + 
    '</strong></td><td class="table-value" width="100" align="right" valign="top">' + e[1] + 
    '</td><td class="table-value" width="100" align="right" valign="top">' + e[2] + '</td></tr>';
   });
   content += '<tr><td class="table-label" align="left" width="200" valign="top" colspan="2"><strong>Distance</strong></td><td class="table-value" width="100" align="right" valign="top">' + (d.distance ? d3.format(',')(d.distance) : '-') + '</td></tr>';
  return '<div class="row"><div class="col-lg-12"><table class="table-striped" width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
}

// Calculate the points for inter-chromosome connections
function getInterConnectorEndpoints(record) {
  var points = [];

  var origin = d3.min([record.sourcePanel.panelScale(record.sourcePoint), record.sinkPanel.panelScale(record.sinkPoint)]);
  var target = d3.max([record.sourcePanel.panelScale(record.sourcePoint), record.sinkPanel.panelScale(record.sinkPoint)]);
  var originSign = (origin === record.sourcePanel.panelScale(record.sourcePoint)) ? record.source : record.sink;
  var targetSign = (target === record.sourcePanel.panelScale(record.sourcePoint)) ? record.source : record.sink;
  var originY = (origin === record.sourcePanel.panelScale(record.sourcePoint)) ? Math.abs(record.sourceJabba) : Math.abs(record.sinkJabba);
  var targetY = (target === record.sourcePanel.panelScale(record.sourcePoint)) ? Math.abs(record.sourceJabba) : Math.abs(record.sinkJabba);
  var midPointX = 0.5 * origin + 0.5 * target;
  var midPointY = 0.5 * originY + 0.5 * targetY;

  if (record.type === 'ALT') {
    if (Math.abs(record.sourceJabba) === Math.abs(record.sinkJabba)) {
      points = [
              [origin, record.sourcePanel.yScale(originY)],
              [d3.min([origin + Math.sign(originSign) * 5,  midPointX - 5]), record.sourcePanel.yScale(originY)],
              [d3.min([origin + Math.sign(originSign) * 25, midPointX - 5]), record.sourcePanel.yScale((midPointY + (midPointY < 10 ? 0.5 : 5 )))],
              [midPointX, record.sourcePanel.yScale((midPointY + (midPointY < 10 ? 0.75 : 10 )))],
              [d3.max([target + Math.sign(targetSign) * 25, midPointX + 5]), record.sourcePanel.yScale((midPointY + (midPointY < 10 ? 0.5 : 5 )))],
              [d3.max([target + Math.sign(targetSign) * 5,  midPointX + 5]), record.sourcePanel.yScale(targetY)],
              [target, record.sourcePanel.yScale(targetY)]];
    } else {
      points = [
              [origin, record.sourcePanel.yScale(originY)],
              [origin + Math.sign(originSign) * 5, record.sourcePanel.yScale(originY)],
              [origin + Math.sign(originSign) * 25, record.sourcePanel.yScale((originY + Math.sign(targetY - originY) * (originY < 10 ? 0.25 : 5 )))],
              [target + Math.sign(targetSign) * 25, record.sourcePanel.yScale((targetY - Math.sign(targetY - originY) * (targetY < 10 ? 0.25 : 5 )))],
              [target + Math.sign(targetSign) * 5, record.sourcePanel.yScale(targetY)],
              [target, record.sourcePanel.yScale(targetY)]];
    }
  } else {
    points = [
            [origin, record.sourcePanel.yScale(originY)],
            [target, record.sourcePanel.yScale(targetY)]];
  }
  return points;
}

// The array of points forming the loose connections with one endpoint missing
function getLooseConnectorEndpoints(record) {
  return [
    [record.panel.panelScale(record.touchPointX), record.panel.yScale(record.touchPointY)],
    [record.panel.panelScale(record.touchPointX) + record.touchpointSign * 15, record.panel.yScale(record.touchPointY + (record.touchPointY < 10 ? 0.25 : 5 ))],
    [record.panel.panelScale(record.touchPointX) + record.touchpointSign * 5,  record.panel.yScale(record.touchPointY + (record.touchPointY < 10 ? 0.75 : 5 ))]];
}

// The array of points forming the connections with the other end in another chromosome
function calculateAnchorInterConnectorEndpoints(yScale, record, connector, chromosomeObject) {
  record.sourceJabba = connector.source.y;
  record.sinkJabba = connector.sink.y;
  record.sourceChromosome = connector.source.chromosome;
  record.sinkChromosome = connector.sink.chromosome;
  record.sourcePoint = (connector.connection.source < 0) ?  connector.source.startPoint : connector.source.endPoint;
  record.sinkPoint   = (connector.connection.sink < 0)   ?  connector.sink.startPoint   : connector.sink.endPoint;
  var touchPointX, touchPointY, touchpointSign;
  if (connector.source.chromosome === chromosomeObject.chromosome) {
    touchPointX = record.sourcePoint;
    touchPointY = connector.source.y;
    touchpointSign = Math.sign(connector.connection.source);
  }
  if (connector.sink.chromosome === chromosomeObject.chromosome) {
    touchPointX = record.sinkPoint;
    touchPointY = connector.sink.y;
    touchpointSign = Math.sign(connector.connection.sink);
  }
  record.touchpointSign = touchpointSign;
  return [chromosomeObject.scale(touchPointX), yScale(touchPointY)];
} 
