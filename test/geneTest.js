var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


// const Base = require('../js/base.js').Base;
const Interval = require('../js/interval.js').Interval;
const Gene = require('../js/gene.js').Gene;

var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "strand":"*", 
    "group_id": "geneA"});


// constructor

describe('testing gene.js', function() {
  it('Gene constructor', function() {
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA"});
    assert.equal(gene.iid, 42);  
    assert.equal(gene.chromosome, 22);  
    assert.equal(gene.startPoint, 105000);
    assert.equal(gene.endPoint, 130000);  
    assert.equal(gene.intervalLength, 25001);  
    assert.equal(gene.y, 10);
    assert.equal(gene.title, "foo");  
    assert.equal(gene.type, "gene");  
    assert.equal(gene.strand, "*");  
    expect(gene.errors).to.eql([]).but.not.equal([]); 
    assert.equal(gene.group_id, "geneA"); 
    assert.equal(gene.margins['arrow'], 5); 
    assert.equal(gene.coefficient, 1); 
  });
});

// fill()

describe('testing gene.js', function() {
  it('Gene fill()', function() {
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA"});
    expect(gene.fill).to.be.undefined;   /// I think this is strange; this.color isn't an attribute in gene.js
    var exon = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"exon", "strand":"*", 
    "group_id": "exonA"});
    assert.equal(exon.fill, 'red');
    var intron = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"intron", "strand":"*", 
    "group_id": "intronA"});
    assert.equal(intron.fill, 'blue');
    var utr = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"UTR", "strand":"*", 
    "group_id": "utrA"});
    assert.equal(utr.fill, 'green');
    var othertypes = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"other", "strand":"*", 
    "group_id": "otherA"});
    assert.equal(othertypes.fill, '#000');   // why return this output?
  });
});

// stroke()
// revise this test, as these are the same outputs

describe('testing gene.js', function() {
  it('Gene stroke()', function() {
  	// if gene, d3.rgb(this.color).darker(1);
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA", "color":"blue"});
    // Rgb { r: NaN, g: NaN, b: NaN, opacity: NaN }
    expect(gene.stroke['r']).to.be.NaN;
    expect(gene.stroke['g']).to.be.NaN;
    expect(gene.stroke['b']).to.be.NaN;
    expect(gene.stroke['opacity']).to.be.NaN;
    // else
    // d3.rgb(this.color).brighter(1);
    var exon = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"exon", "strand":"*", 
    "group_id": "exonA"});
    // Rgb { r: NaN, g: NaN, b: NaN, opacity: NaN }
    expect(exon.stroke['r']).to.be.NaN;
    expect(exon.stroke['g']).to.be.NaN;
    expect(exon.stroke['b']).to.be.NaN;
    expect(exon.stroke['opacity']).to.be.NaN;
  });
});

// modalTitle()

describe('testing gene.js', function() {
  it('Gene modalTitle()', function() {
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA"});
    assert.equal(gene.modalTitle, "Gene #foo | 22:105,000 - 130,000");  
  });
});


// popoverTitle()

describe('testing gene.js', function() {
  it('Gene popoverTitle()', function() {
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA"});
    assert.equal(gene.popoverTitle, "Gene #foo");  
  });
});

// popoverContent()

describe('testing gene.js', function() {
  it('Gene popoverContent()', function() {
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA"});
    assert.equal(gene.popoverContent.substring(0, 17), '<div class="row">');  
  });
});


// location()

describe('testing gene.js', function() {
  it('Gene popoverContent()', function() {
    var gene = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA"});
    assert.equal(gene.location, '22: 105000 - 130000');  
  });
});

// points()
// what should we do with the non-genes? 

describe('testing gene.js', function() {
  it('Gene points()', function() {
    var gene_strand_positive = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"+", 
    "group_id": "geneA", "color":"blue"});
    assert.equal(gene_strand_positive.points[0],  0);
    expect(gene_strand_positive.points[1]).to.be.NaN;
    expect(gene_strand_positive.points[2]).to.be.undefined;
    expect(gene_strand_positive.points[3]).to.be.NaN;
    expect(gene_strand_positive.points[4]).to.be.undefined;
    assert.equal(gene_strand_positive.points[5],  -5);
    expect(gene_strand_positive.points[6]).to.be.NaN;
    assert.equal(gene_strand_positive.points[7],  0);
    expect(gene_strand_positive.points[8]).to.be.undefined;
    assert.equal(gene_strand_positive.points[9],  5);
    expect(gene_strand_positive.points[10]).to.be.undefined;
    expect(gene_strand_positive.points[11]).to.be.NaN;
    assert.equal(gene_strand_positive.points[12],  0);
    expect(gene_strand_positive.points[13]).to.be.NaN;
    // [ 0, NaN, undefined, NaN, undefined, -5, NaN, 0, undefined, 5, undefined, NaN, 0, NaN ]
    var gene_strand_negative = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"-", 
    "group_id": "geneA", "color":"blue"});
    // [ undefined, NaN, 0, NaN, 0, -5, -5, 0, 0, 5, 0, NaN, undefined, NaN ]
    expect(gene_strand_negative.points[0]).to.be.undefined;    
    expect(gene_strand_negative.points[1]).to.be.NaN;   
    assert.equal(gene_strand_negative.points[2], 0);
    expect(gene_strand_negative.points[3]).to.be.NaN;  
    assert.equal(gene_strand_negative.points[4], 0);
    assert.equal(gene_strand_negative.points[5], -5);
    assert.equal(gene_strand_negative.points[6], -5);
    assert.equal(gene_strand_negative.points[7], 0);
    assert.equal(gene_strand_negative.points[8], 0);
    assert.equal(gene_strand_negative.points[9], 5);
    assert.equal(gene_strand_negative.points[10], 0);
    expect(gene_strand_negative.points[11]).to.be.NaN;
    expect(gene_strand_negative.points[12]).to.be.undefined;
    expect(gene_strand_negative.points[13]).to.be.NaN;
    var gene_strand_neutral = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"gene", "strand":"*", 
    "group_id": "geneA", "color":"blue"});
    // undefined
    expect(gene_strand_neutral.points).to.be.undefined;
    var exon = new Gene({"iid":42, "chromosome":22, "startPoint":105000, 
	"endPoint":130000, "y":10, "title": "foo", "type":"exon", "strand":"*", 
    "group_id": "exonA"});
    // [ 0, NaN, undefined, NaN, undefined, NaN, 0, NaN ]
    assert.equal(exon.points[0], 0); 
    expect(exon.points[1]).to.be.NaN;  
    expect(exon.points[2]).to.be.undefined; 
    expect(exon.points[3]).to.be.NaN; 
    expect(exon.points[4]).to.be.undefined;
    expect(exon.points[5]).to.be.NaN;  
    assert.equal(exon.points[6], 0);
    expect(exon.points[7]).to.be.NaN;  
  });
});





