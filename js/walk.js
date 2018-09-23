class Walk extends Base {

  constructor(walk) {
    super();
    this.pid = walk.pid;
    this.cn = walk.cn;
    this.type = walk.type;
    this.strand = walk.strand;
    this.cids = walk.cids;
    this.iids = walk.iids;
    this.title = `${this.pid} | ${this.cn}`;
    this.errors = [];
  }

  valid() {
    this.errors = [];
    if (!Number.isInteger(this.pid) || (this.pid < 1)) {
      this.errors.push(`The pid ${this.pid} must be a positive integer!`);
    }
    if (!Number.isInteger(this.cn) || (this.cn < 0)) {
      this.errors.push(`The cn ${this.cn} must be a non-negative integer!`);
    }
    if (!Misc.isString(this.type)) {
      this.errors.push(`The type ${this.type} must be a string!`);
    }
    if (!Misc.isString(this.strand)) {
      this.errors.push(`The strand ${this.stand} must be a string!`);
    }
    if (!Array.isArray(this.cids)) {
      this.errors.push(`The cids ${this.cids} Array object is missing!`);
    }
    if (!Array.isArray(this.iids)) {
      this.errors.push(`The iids ${this.iids} Array object is missing!`);
    }
    this.validateWalkIntervals();
    this.validateWalkConnections();
    return this.errors.length < 1;
  }

  validateWalkIntervals() {
    let valid = true;
    if (Array.isArray(this.iids)) {
      if (this.iids.length > 1) {
        Misc.alerting(`Walk ${this.pid} contains <strong>${this.iids.length}</strong> WalkIntervals`, 'info');
        let interval, ids = [];
        this.iids.forEach((d,i) => {
          ids.push(d.iid);
          interval = new WalkInterval(d, this);
          if (!interval.valid()) {
            interval.errors.forEach((e, j) => {
              this.errors.push(`WalkInterval entry <strong>${i + 1}</strong> with iid ${d.iid} failed with error: ${e}`);
              valid = false;
            });
          }
        });
        if (ids.length > Misc.unique(ids).length) {
          this.errors.push(`The WalkIntervals Array for walk ${this.pid} contains duplicate iid values!`);
          valid = false;
        }
      } else {
        Misc.alerting(`Walk ${this.pid} contains <strong>no WalkIntervals</strong>`, 'warning');
      }
    } else {
      if (this.iids === undefined) {
        this.errors.push('The WalkIntervals Array object is missing!');
        valid = false;
      }
      if (!Array.isArray(this.iids)) {
        this.errors.push('The WalkIntervals object is not an Array!');
        valid = false;
      }
    }
    return valid;
  }

  validateWalkConnections() {
    let valid = true;
    if (Array.isArray(this.cids)) {
      if (this.cids.length > 1) {
        Misc.alerting(`Walk ${this.pid} contains <strong>${this.cids.length}</strong> WalkConnections`, 'info');
        let iids = this.iids.map((d,i) => d.iid);
        let connection, intervalIds = [], cids = [];
        this.cids.forEach((d,i) => {
          connection = new WalkConnection(d, this);
          cids.push(d.cid);
          if (connection.source !== null) { 
            intervalIds.push(connection.source.intervalId);
          }
          if (connection.sink !== null) {
            intervalIds.push(connection.sink.intervalId);
          }
          if (!connection.valid()) {
            connection.errors.forEach((e, j) => {
              this.errors.push(`Connection entry <strong>${i + 1}</strong> with cid ${d.cid} failed with error: ${e}`);
              valid = false;
            });
          }
        });
        if (cids.length > Misc.unique(cids).length) {
          this.errors.push(`The WalkConnections Array contains duplicate cid values!`);
          valid = false;
        }
        Misc.unique(intervalIds).forEach((iid, j) => {
          if (!iids.includes(iid)) {
            this.errors.push(`The source or sink with absolute value ${iid} does not correspond to an existing WalkInterval!`);
            valid = false;
          }
        });
      } else {
        Misc.alerting(`Walk ${this.pid} contains <strong>no WalkConnections</strong>`, 'warning');
      }
    } else {
      if (json.connection === undefined) {
        this.errors.push('The WalkConnections Array object is missing!');
        valid = false;
      }
      if (!Array.isArray(json.connections)) {
        this.errors.push('The WalkConnections object is not an Array!');
        valid = false;
      }
    }
    return valid;
  }

  // The title for the popover on the intervals
  get popoverTitle() {
    return 'Interval #' + this.title;
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    [{label: 'Chromosome', value: this.chromosome}, {label: 'Y', value: this.y}, {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)},
     {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint)}, {label: 'Interval Length', value: d3.format(',')(this.intervalLength)}, {label: 'Strand', value: this.strand}].forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
    return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }

  get location() {
    return `${this.chromosome}: ${this.startPoint} - ${this.endPoint}`;
  }

  get toString() {
    return `identifier: ${this.identifier},
    iid: ${this.iid},
    title: ${this.title},
    type: ${this.type},
    strand: ${this.strand}
    `;
  }
}

