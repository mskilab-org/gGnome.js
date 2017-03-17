// The hashmap mapping the chromosome id to the chromosome metadata
function getMetadata(dataArray) {
  return dataArray.metadata.reduce(function(hash, elem) { hash[elem.chromosome] = elem; return hash }, {});
}

// The hashmap mapping each interval id to the interval itself
function getIntervalBins(dataArray) {
  return dataArray.intervals.reduce(function(hash, elem) { hash[elem.iid] = elem; return hash }, {});
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
// The hashmap mapping the connection id to the connections within the same chromosome
function getLocalConnectionBins(dataArray, connectionBins) {
  return dataArray.connections.reduce(function(hash, elem) {
  var source = connectionBins[elem.cid].source;
  var sink = connectionBins[elem.cid].sink;
  if ((elem.type !== 'UKN') && (source.chromosome === sink.chromosome)) {
    if (!hash[source.chromosome]) {
      hash[source.chromosome] = [];
    }
    hash[source.chromosome].push(elem);
  }
  return hash; }, {});
}
// The hashmap mapping the connection id to the connections between intervals in different chromosomes
function getInterChromosomeConnectionBins(dataArray, panels, connectionBins) {
  var panelChromosomes = panels.map(function(d,i) { return d.chromosome; });
  return dataArray.connections.filter(function(elem, index) {
    var source = connectionBins[elem.cid].source;
    var sink = connectionBins[elem.cid].sink;
    return ((elem.type !== 'UKN') && (source.chromosome != sink.chromosome) && (panelChromosomes.includes(source.chromosome)) && (panelChromosomes.includes(sink.chromosome)));
  });
}
// The hashmap mapping the connection id to the unknown connections within the same chromosome
function getUknownConnectionBins(dataArray, connectionBins) {
  return dataArray.connections.reduce(function(hash, elem) {
  var source = connectionBins[elem.cid].source;
  var sink = connectionBins[elem.cid].sink;
  if (!source && sink) {
    if (!hash[sink.chromosome]) {
      hash[sink.chromosome] = [];
    }
    hash[sink.chromosome].push(elem);
  }
  if (source && !sink) {
    if (!hash[source.chromosome]) {
      hash[source.chromosome] = [];
    }
    hash[source.chromosome].push(elem);
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
  return 'Connection #' + d.cid;
}

// The content for the popover on the connections
function popoverConnectionContent(d,i) {
  var content = '';
  var array = [{label: 'Type', value: d.type}, {label: 'Source Chromosome', value: d.sourceChromosome}, {label: 'Source Interval', value: Math.abs(d.source) + (d.source > 0 ? ' (tail)' : ' (head)')}, {label: 'Source Point', value: d3.format(',')(d.sourcePoint)},
   {label: 'Source Jabba', value: (d.sourceJabba)}, {label: 'Sink Chromosome', value: d.sinkChromosome}, {label: 'Sink Interval', value: Math.abs(d.sink) + (d.sink > 0 ? ' (tail)' : ' (head)')},
   {label: 'Sink Point', value: d3.format(',')(d.sinkPoint)}, {label: 'Sink Jabba', value: (d.sinkJabba)}, {label: 'Distance', value: (d.distance ? d3.format(',')(d.distance) : '-')}];
  if (!d.source) {
    array = [{label: 'Sink Chromosome', value: d.sinkChromosome}, {label: 'Sink Interval', value: Math.abs(d.sink) + (d.sink > 0 ? ' (tail)' : ' (head)')},
    {label: 'Sink Point', value: d3.format(',')(d.sinkPoint)}, {label: 'Sink Jabba', value: (d.sinkJabba)}, {label: 'Distance', value: (d.distance ? d3.format(',')(d.distance) : '-')}];
  }
  if (!d.sink) {
    array = [{label: 'Type', value: d.type}, {label: 'Source Chromosome', value: d.sourceChromosome}, {label: 'Source Interval', value: Math.abs(d.source) + (d.source > 0 ? ' (tail)' : ' (head)')}, {label: 'Source Point', value: d3.format(',')(d.sourcePoint)},
    {label: 'Source Jabba', value: (d.sourceJabba)}, {label: 'Distance', value: (d.distance ? d3.format(',')(d.distance) : '-')}];
  }
  array.forEach(function(e,j) {
     content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
   });
  return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
}

// The array of points forming the connections between its endpoints
function calculateConnectorEndpoints(yScale, record, connector, chromosome) {
  record.sourceJabba = connector.source.y;
  record.sinkJabba = connector.sink.y;
  record.sourceChromosome = connector.source.chromosome;
  record.sinkChromosome = connector.sink.chromosome;
  if ((record.type === 'ALT' ) && (Math.abs(connector.source.y) === Math.abs(connector.sink.y))) {
    record.sourcePoint = connector.source.endPoint;
    record.sinkPoint = connector.sink.startPoint;
    record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
    return [[chromosome.scale(connector.source.endPoint),yScale(connector.source.y)],
            [0.5 * (chromosome.scale(connector.source.endPoint) + chromosome.scale(connector.sink.startPoint)),yScale(connector.source.y) - 20],
            [chromosome.scale(connector.sink.startPoint), yScale(connector.sink.y)]];
  } else {
    if ((connector.connection.source > 0) && (connector.connection.sink < 0)) {
      record.sourcePoint = connector.source.endPoint;
      record.sinkPoint = connector.sink.startPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [[chromosome.scale(connector.source.endPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source > 0) && (connector.connection.sink > 0)) {
      record.sourcePoint = connector.source.endPoint;
      record.sinkPoint = connector.sink.endPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.endPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source < 0) && (connector.connection.sink < 0)) {
      record.sourcePoint = connector.source.startPoint;
      record.sinkPoint = connector.sink.startPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.startPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source < 0) && (connector.connection.sink > 0)) {
      record.sourcePoint = connector.source.startPoint;
      record.sinkPoint = connector.sink.endPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.startPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), yScale(connector.sink.y)]];
    }
  }
}

// The array of points forming the connections between its endpoints in different chromosomes
function calculateInterConnectorEndpoints(yScale, record, connector, panelsArray) {
  record.sourceJabba = connector.source.y;
  record.sinkJabba = connector.sink.y;
  var sourceChromosome = panelsArray.filter(function(d,i) { return d.chromosome === "" + connector.source.chromosome })[0]; // TODO Refactor 
  var sinkChromosome = panelsArray.filter(function(d,i) { return d.chromosome === "" + connector.sink.chromosome })[0]; // TODO Refactor 
  record.sourceChromosome = sourceChromosome.chromosome;
  record.sinkChromosome = sinkChromosome.chromosome;
  if ((record.type === 'ALT' ) && (Math.abs(connector.source.y) === Math.abs(connector.sink.y))) {
    record.sourcePoint = connector.source.endPoint;
    record.sinkPoint = connector.sink.startPoint;
    record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
    return [[sourceChromosome.panelScale(connector.source.endPoint),yScale(connector.source.y)],
            [0.5 * (sourceChromosome.panelScale(connector.source.endPoint) + sinkChromosome.panelScale(connector.sink.startPoint)),yScale(connector.source.y) - 20],
            [sinkChromosome.panelScale(connector.sink.startPoint), yScale(connector.sink.y)]];
  } else {
    if ((connector.connection.source > 0) && (connector.connection.sink < 0)) {
      record.sourcePoint = connector.source.endPoint;
      record.sinkPoint = connector.sink.startPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [[sourceChromosome.panelScale(connector.source.endPoint), yScale(connector.source.y)],
        [sourceChromosome.panelScale(connector.source.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.startPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source > 0) && (connector.connection.sink > 0)) {
      record.sourcePoint = connector.source.endPoint;
      record.sinkPoint = connector.sink.endPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [sourceChromosome.panelScale(connector.source.endPoint), yScale(connector.source.y)],
        [sourceChromosome.panelScale(connector.source.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.endPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source < 0) && (connector.connection.sink < 0)) {
      record.sourcePoint = connector.source.startPoint;
      record.sinkPoint = connector.sink.startPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [sourceChromosome.panelScale(connector.source.startPoint), yScale(connector.source.y)],
        [sourceChromosome.panelScale(connector.source.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.startPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source < 0) && (connector.connection.sink > 0)) {
      record.sourcePoint = connector.source.startPoint;
      record.sinkPoint = connector.sink.endPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [sourceChromosome.panelScale(connector.source.startPoint), yScale(connector.source.y)],
        [sourceChromosome.panelScale(connector.source.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [sinkChromosome.panelScale(connector.sink.endPoint), yScale(connector.sink.y)]];
    }
  }
}

// The array of points forming the unknown connections with one endpoint missing
function calculateUknownConnectorEndpoints(yScale, record, connector, chromosome) {
  if (!record.source && !record.sink) return;
  var touchpointX, touchpointY, touchpointSign;
  if (record.source && !record.sink) {
    record.sourceJabba = connector.source.y;
    record.sourceChromosome = connector.source.chromosome;
    record.sourcePoint = connector.connection.source > 0 ? connector.source.endPoint : connector.source.startPoint;
    touchpointX = record.sourcePoint;
    touchpointY = connector.source.y;
    touchpointSign = Math.sign(connector.connection.source);
  }
  if (!record.source && record.sink) {
    record.sinkJabba = connector.sink.y;
    record.sinkChromosome = connector.sink.chromosome;
    record.sinkPoint = connector.connection.sink > 0 ? connector.sink.endPoint : connector.sink.startPoint;
    touchpointX = record.sinkPoint;
    touchpointY = connector.sink.y;
    touchpointSign = Math.sign(connector.connection.sink);
  }
  return [
    [chromosome.scale(touchpointX), yScale(touchpointY)],
    [chromosome.scale(touchpointX) + touchpointSign * 20, yScale(touchpointY + 0.17)],
    [chromosome.scale(touchpointX) - touchpointSign * 20, yScale(touchpointY + 0.34)],
    [chromosome.scale(touchpointX), yScale(touchpointY + 0.5)]];
}
