class Gene extends Interval {

  constructor(gen) {
    super(gen);
  }

  // The title for the popover on the gene
  get popoverTitle() {
    return 'Gene #' + this.title;
  }

}