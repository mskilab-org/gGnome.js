class ReglCanvas extends Base {

  constructor(canvasId) {
    super();
    let regl = createREGL({
      canvas: document.getElementById(canvasId)
    });
    let drawDots = regl({

      // circle code comes from:
      // https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
      frag: `
      precision highp float;
      varying vec4 fragColor;
      void main () {
        float r = 0.0, delta = 0.0, alpha = 1.0;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);
        if (r > 1.0) {
            discard;
        }
        #ifdef GL_OES_standard_derivatives
            delta = fwidth(r);
            alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
        #endif
        gl_FragColor = vec4(fragColor) * alpha;
      }`,

      vert: `
      precision mediump float;
      attribute vec2 position;
      attribute float pointWidth;
      attribute vec4 color;
    	// variables to send to the fragment shader
    	varying vec4 fragColor;
      uniform float stageWidth;
      uniform float stageHeight;
      // helper function to transform from pixel space to normalized
      // device coordinates (NDC). In NDC (0,0) is the middle,
      // (-1, 1) is the top left and (1, -1) is the bottom right.
      // Stolen from Peter Beshai's great blog post:
      // http://peterbeshai.com/beautifully-animate-points-with-webgl-and-regl.html
      vec2 normalizeCoords(vec2 position) {
        // read in the positions into x and y vars
        float x = position[0];
        float y = position[1];
        return vec2(
          2.0 * ((x / stageWidth) - 0.5),
          // invert y to treat [0,0] as bottom left in pixel space
          -(2.0 * ((y / stageHeight) - 0.5)));
      }
      void main () {
        // send color to the fragment shader
        fragColor = color;
        gl_PointSize = pointWidth;
        gl_Position = vec4(normalizeCoords(position), 0, 1);
      }`,

      attributes: {
        // There will be a position value for each point
        // we pass in
        position: function(context, props) {
          return props.points.map(function(point) {
            return [point.x, point.y]
          });
        },
        // Now pointWidth is an attribute, as each
        // point will have a different size.
        pointWidth: function(context, props) {
          return  props.points.map(function(point) {
            return point.size;
          });
        },
        color: function(context, props) {
          return  props.points.map(function(point) {
            return point.color;
          });
        },
      },

      uniforms: {
        // FYI: there is a helper method for grabbing
        // values out of the context as well.
        // These uniforms are used in our fragment shader to
        // convert our x / y values to WebGL coordinate space.
        stageWidth: regl.context('drawingBufferWidth'),
        stageHeight: regl.context('drawingBufferHeight')
      },

      count: function(context, props) {
        // set the count based on the number of points we have
        return props.points.length
      },
      primitive: 'points'

    })

    this.points = [];

    regl.frame((context) => {
      // Each loop, update the data
      //updateData(points);
      if (this.points.length < 1) {
        regl.clear({
          color: [0, 0, 0, 0],
          depth: 1
        });
      }
      // And draw it!
      drawDots({
        points: this.points
      });
    });
  }
}