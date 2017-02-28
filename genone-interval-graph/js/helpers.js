// Function to flatten an array of arrays
function flatten(ary) {
  return ary.reduce(function(a, b) {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}

function popoverIntervalTitle(d,i) {
  return 'Interval #' + d.title;
}

function popoverIntervalContent(d,i) {
  var content = '';
  [{label: 'Chromosome', value: d.chromosome}, {label: 'Jabba', value: d.y}, {label: 'Start Point', value: d3.format(',')(d.startPoint)},
   {label: 'End Point', value: d3.format(',')(d.endPoint)}, {label: 'Interval Length', value: d3.format(',')(d.intervalLength)}, {label: 'Strand', value: d.strand}].forEach(function(e,j) {
     content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
   });
  return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
}

function popoverConnectionTitle(d,i) {
  return 'Connection #' + d.cid;
}

function popoverConnectionContent(d,i) {
  var content = '';
  [{label: 'Type', value: d.type}, {label: 'Source Interval', value: Math.abs(d.source) + (d.source > 0 ? ' (tail)' : ' (head)')}, {label: 'Source Point', value: d3.format(',')(d.sourcePoint)},
   {label: 'Source Jabba', value: (d.sourceJabba)}, {label: 'Sink Interval', value: Math.abs(d.sink) + (d.sink > 0 ? ' (tail)' : ' (head)')},
   {label: 'Sink Point', value: d3.format(',')(d.sinkPoint)}, {label: 'Sink Jabba', value: (d.sinkJabba)}, {label: 'Distance', value: d3.format(',')(d.distance)}].forEach(function(e,j) {
     content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
   });
  return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
}