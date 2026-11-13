/* ============================================================
   كتلة/خام — السكربت
   ١) حركات الظهور
   ٢) مقاس العنوان
   ٣) الزجاج (WebGL): عنوان + قطعة زجاج تتبع المؤشر وتكسر الضوء،
      الضغط يرسل موجة على النص ويغيّر شكل الزجاج
   ٤) تنبيه زر «استكشف أعمالنا»
   ============================================================ */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- الإعدادات — عدّلها من هنا ---------- */
  var CFG = {
    text: 'الافتتاح قريبًا',          // نص العنوان المرسوم داخل الزجاج
    font: '"Noto Kufi Arabic"',
    weight: 900,
    color: '#ffffff',
    fitDesktop: 0.64,                // عرض العنوان كنسبة من عرض الشاشة
    fitMobile: 0.88,
    sizeDesktop: 400,                // قطر الزجاج بالبكسل (شاشة ≥ 1600)
    sizeTablet: 320,                 // 810 – 1599
    sizeMobile: 240,                 // أقل من 810
    startShape: 'diamond',
    shapes: ['pill', 'torus', 'prism', 'diamond', 'lens', 'sphere', 'cube', 'blob'],
    ior: 1.45, refraction: 0.75, dispersion: 0.22,
    fresnel: 0.7, specular: 0.9, edges: 0.7, body: 0.06,
    follow: 0.45, bounce: 0.35, tilt: 0.6, squash: 0.5, rotation: 0.5, wobble: 0.5,
    ripple: 26                       // قوة موجة الضغط بالبكسل
  };

  /* ===== ١) حركات الظهور ===== */
  function ready() { root.classList.add('is-ready'); }
  if (document.fonts && document.fonts.ready) {
    var done = false, go = function () { if (!done) { done = true; requestAnimationFrame(ready); } };
    document.fonts.ready.then(go); setTimeout(go, 900);
  } else { requestAnimationFrame(ready); }

  /* ===== ٢) مقاس العنوان ===== */
  var headline = document.getElementById('headline');
  var measurer = document.createElement('canvas').getContext('2d');
  function heroFont(px) { return CFG.weight + ' ' + px + 'px ' + CFG.font + ', sans-serif'; }
  function fitSize(W) {
    var fit = W < 810 ? CFG.fitMobile : CFG.fitDesktop;
    measurer.font = heroFont(100);
    var w = measurer.measureText(CFG.text).width || 542;
    return Math.max(28, Math.floor(100 * fit * W / w));
  }
  function sizeHeadline() {
    var fs = fitSize(innerWidth);
    headline.style.setProperty('--hero-fs', fs + 'px');
    return fs;
  }
  sizeHeadline();

  /* ===== ٣) الزجاج ===== */
  var wrap = document.getElementById('glass');
  var canvas = document.getElementById('glassCanvas');
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) ||
         canvas.getContext('experimental-webgl');
  } catch (e) { gl = null; }

  if (!gl) {
    wrap.removeAttribute('role'); wrap.removeAttribute('tabindex'); wrap.removeAttribute('aria-label');
  } else {
    initGlass();
  }

  function initGlass() {
    var VS = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}';

    var FS = [
      'precision highp float;',
      'uniform sampler2D uScene;',
      'uniform vec2 uRes;',
      'uniform vec2 uCenter;',        // مركز الزجاج (بكسل، إحداثيات GL)
      'uniform float uRadius;',       // نصف القطر (بكسل)
      'uniform mat3 uRot;',
      'uniform vec3 uStretch;',       // xy اتجاه الحركة، z مقدار التمدد
      'uniform float uShapeA;',
      'uniform float uShapeB;',
      'uniform float uMix;',
      'uniform float uTime;',
      'uniform float uWobble;',
      'uniform float uIor;',
      'uniform float uRefr;',
      'uniform float uDisp;',
      'uniform float uFresnel;',
      'uniform float uSpec;',
      'uniform float uEdges;',
      'uniform float uBody;',
      'uniform float uTextA;',
      'uniform float uGlassA;',
      'uniform vec4 uRip[6];',
      'uniform float uRipAmp;',

      'float sdBox(vec3 p, vec3 b, float r){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r;}',
      'float sdOct(vec3 p, float s){p=abs(p);float m=p.x+p.y+p.z-s;vec3 q;',
      ' if(3.0*p.x<m)q=p.xyz;else if(3.0*p.y<m)q=p.yzx;else if(3.0*p.z<m)q=p.zxy;else return m*0.57735027;',
      ' float k=clamp(0.5*(q.z-q.y+s),0.0,s);return length(vec3(q.x,q.y-s+k,q.z-k));}',
      'float sdTri(vec3 p, vec2 h){vec3 q=abs(p);return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);}',

      'float shape(float id, vec3 p){',
      ' if(id<0.5){vec3 q=p;q.x-=clamp(q.x,-0.42,0.42);return length(q)-0.4;}',                          // كبسولة
      ' if(id<1.5){vec2 q=vec2(length(p.xy)-0.56,p.z);return length(q)-0.24;}',                           // حلقة
      ' if(id<2.5){return sdTri(p.xzy*vec3(1.0,1.0,1.0)+vec3(0.0,0.12,0.0),vec2(1.0,0.36))-0.04;}',         // منشور
      ' if(id<3.5){vec3 q=p*vec3(1.0,0.82,1.0);return sdOct(q,0.92)*0.82-0.025;}',                         // ماسة
      ' if(id<4.5){return max(length(p-vec3(0.0,0.0,0.92))-1.22,length(p+vec3(0.0,0.0,0.92))-1.22);}',    // عدسة
      ' if(id<5.5){return length(p)-0.74;}',                                                                // كرة
      ' if(id<6.5){return sdBox(p,vec3(0.46),0.08);}',                                                      // مكعّب
      ' float w=uWobble*0.09;',                                                                             // كتلة سائلة
      ' return (length(p)-0.68+w*sin(p.x*4.0+uTime*1.7)*sin(p.y*3.6+uTime*1.3)*sin(p.z*3.2+uTime*1.1)',
      '   +w*0.6*sin(p.x*2.6-uTime*1.2+p.y*2.0))*0.8;',
      '}',
      'float map(vec3 p){vec3 q=uRot*p;return mix(shape(uShapeA,q),shape(uShapeB,q),uMix);}',
      'vec3 nrm(vec3 p){vec2 e=vec2(0.0025,0.0);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}',

      'vec4 scene(vec2 px){',
      ' vec2 off=vec2(0.0);',
      ' for(int i=0;i<6;i++){vec4 r=uRip[i];if(r.w<=0.0)continue;',
      '  vec2 d=px-r.xy;float l=length(d)+0.0001;float ring=exp(-pow((l-r.z)/(36.0+r.z*0.12),2.0));',
      '  off+=d/l*ring*r.w*uRipAmp;}',
      ' return texture2D(uScene,(px-off)/uRes)*uTextA;',
      '}',

      'void main(){',
      ' vec2 px=gl_FragCoord.xy;',
      ' vec4 base=scene(px);',
      ' vec2 q=(px-uCenter)/uRadius;',
      ' if(uGlassA<=0.001||dot(q,q)>2.6){gl_FragColor=base;return;}',
      // تمدد في اتجاه الحركة
      ' vec2 dir=uStretch.xy;float s=1.0+uStretch.z;',
      ' float a=dot(q,dir);vec2 perp=q-a*dir;q=a*dir/s+perp*sqrt(s);',
      ' vec3 ro=vec3(q,2.4),rd=vec3(0.0,0.0,-1.0);',
      ' float t=0.0,md=9.0;bool hit=false;',
      ' for(int i=0;i<56;i++){float d=map(ro+rd*t);md=min(md,d);if(d<0.0012){hit=true;break;}t+=d*0.9;if(t>4.8)break;}',
      ' float aa=1.6/uRadius;',
      ' if(!hit){',
      '  float rim=(1.0-smoothstep(0.0,aa,md))*0.35*uEdges*uGlassA;',
      '  gl_FragColor=base*(1.0-rim)+vec4(rim);return;}',
      ' vec3 p=ro+rd*t;vec3 n=nrm(p);',
      ' float cosI=clamp(dot(n,-rd),0.0,1.0);',
      // الانكسار عبر السطح الأمامي ثم الخلفي
      ' vec3 r1=refract(rd,n,1.0/uIor);',
      ' float t2=0.06;vec3 p2=p;',
      ' for(int i=0;i<28;i++){p2=p+r1*t2;float d=-map(p2);if(d<0.002)break;t2+=max(d,0.01);}',
      ' vec3 n2=nrm(p2);vec3 r2=refract(r1,-n2,uIor);if(dot(r2,r2)<0.001)r2=reflect(r1,-n2);',
      ' vec2 o=((p2.xy-p.xy)*0.65+r2.xy*0.6+r1.xy*0.25)*uRadius*uRefr;',
      ' float k=uDisp;',
      ' vec4 cR=scene(px+o*(1.0-k*0.24));',
      ' vec4 cG=scene(px+o);',
      ' vec4 cB=scene(px+o*(1.0+k*0.24));',
      ' vec4 refr=vec4(cR.r,cG.g,cB.b,max(cR.a,max(cG.a,cB.a)));',
      // إضاءة: فرينل، بريق، حافة
      ' float fr=pow(1.0-cosI,3.0)*uFresnel;',
      ' vec3 L1=normalize(vec3(-0.45,0.62,0.65));vec3 L2=normalize(vec3(0.6,-0.35,0.7));',
      ' vec3 h1=normalize(L1-rd),h2=normalize(L2-rd);',
      ' float sp=pow(max(dot(n,h1),0.0),70.0)*uSpec+pow(max(dot(n,h2),0.0),28.0)*uSpec*0.22;',
      ' float edge=smoothstep(0.55,1.0,1.0-cosI)*uEdges*0.55;',
      ' float bodyL=uBody+fr*0.55+edge*0.5;',
      ' vec3 tint=vec3(0.92,0.96,1.0);',
      ' vec3 col=refr.rgb*(1.0-bodyL*0.5)+tint*(bodyL+sp);',
      ' float al=clamp(max(refr.a,bodyL+sp),0.0,1.0);',
      ' vec4 g=vec4(min(col,vec3(1.0)),max(al,max(col.r,max(col.g,col.b))));',
      ' gl_FragColor=mix(base,g,uGlassA);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
      return s;
    }
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      if (window.console) console.warn('[glass]', err.message);
      wrap.removeAttribute('role'); wrap.removeAttribute('tabindex'); wrap.removeAttribute('aria-label');
      return;
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uScene', 'uRes', 'uCenter', 'uRadius', 'uRot', 'uStretch', 'uShapeA', 'uShapeB', 'uMix', 'uTime',
     'uWobble', 'uIor', 'uRefr', 'uDisp', 'uFresnel', 'uSpec', 'uEdges', 'uBody', 'uTextA', 'uGlassA',
     'uRip', 'uRipAmp'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    gl.uniform1i(U.uScene, 0);
    gl.uniform1f(U.uIor, CFG.ior);
    gl.uniform1f(U.uRefr, CFG.refraction);
    gl.uniform1f(U.uDisp, CFG.dispersion);
    gl.uniform1f(U.uFresnel, CFG.fresnel);
    gl.uniform1f(U.uSpec, CFG.specular);
    gl.uniform1f(U.uEdges, CFG.edges);
    gl.uniform1f(U.uBody, CFG.body);
    gl.uniform1f(U.uWobble, CFG.wobble);

    /* --- النص كنسيج (يُرسم على لوحة ثنائية الأبعاد) --- */
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    var sceneCv = document.createElement('canvas');
    var sctx = sceneCv.getContext('2d');

    var W = 0, H = 0, dpr = 1, radius = 120;

    function drawScene() {
      sceneCv.width = canvas.width; sceneCv.height = canvas.height;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, sceneCv.width, sceneCv.height);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var fs = sizeHeadline();
      sctx.font = heroFont(fs);
      sctx.fillStyle = CFG.color;
      sctx.direction = 'rtl';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'alphabetic';
      var m = sctx.measureText(CFG.text);
      var asc = m.actualBoundingBoxAscent || fs * 0.7, desc = m.actualBoundingBoxDescent || fs * 0.25;
      sctx.fillText(CFG.text, W / 2, H / 2 + (asc - desc) / 2);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sceneCv);
    }

    function resize() {
      var r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      var size = W < 810 ? CFG.sizeMobile : (W < 1600 ? CFG.sizeTablet : CFG.sizeDesktop);
      radius = size / 2;
      drawScene();
      if (!moved) { pos.x = tgt.x = W / 2; pos.y = tgt.y = H / 2; }
    }

    /* --- الحالة والحركة --- */
    var pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
    var moved = false, inside = false;
    var rot = { x: 0.5, y: 0.6, z: 0 }, tiltX = 0, tiltY = 0;
    var stretch = { x: 1, y: 0, a: 0 };
    var shapeIdx = Math.max(0, CFG.shapes.indexOf(CFG.startShape));
    var shapeA = shapeIdx, shapeB = shapeIdx, mixT = 1, pop = 1;
    var ripples = [];
    var textA = 0, glassA = 0, t0 = performance.now(), last = t0;
    var SHAPE_ID = { pill: 0, torus: 1, prism: 2, diamond: 3, lens: 4, sphere: 5, cube: 6, blob: 7 };

    function local(e) {
      var r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' && !e.isPrimary) return;
      var p = local(e);
      inside = p.y >= 0 && p.y <= H;
      if (!inside) return;
      tgt.x = p.x; tgt.y = p.y; moved = true;
    }, { passive: true });

    function splash(x, y) {
      if (reduce) return;
      ripples.push({ x: x, y: y, age: 0, life: 1.25 });
      if (ripples.length > 6) ripples.shift();
    }
    function nextShape() {
      shapeA = shapeB;
      shapeIdx = (shapeIdx + 1) % CFG.shapes.length;
      shapeB = shapeIdx; mixT = 0; pop = 0;
    }
    wrap.addEventListener('pointerdown', function (e) {
      var p = local(e);
      if (e.pointerType !== 'mouse') { tgt.x = p.x; tgt.y = p.y; moved = true; }
      splash(p.x, p.y);
      var dx = p.x - pos.x, dy = p.y - pos.y;
      if (e.pointerType !== 'mouse' || dx * dx + dy * dy < radius * radius * 1.1) nextShape();
    });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); if (e.repeat) return;
        splash(pos.x, pos.y); nextShape();
      }
    });

    function rotMat(ax, ay, az) {
      var cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
      // R = Rz * Ry * Rx (عمودي — صيغة GLSL)
      return new Float32Array([
        cz * cy, sz * cy, -sy,
        cz * sy * sx - sz * cx, sz * sy * sx + cz * cx, cy * sx,
        cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx
      ]);
    }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

    var ripBuf = new Float32Array(24);
    function frame(now) {
      var dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      var el = (now - t0) / 1000;

      // الظهور
      textA = Math.min(1, Math.max(0, (el - 0.2) / 1.0)); textA = ease(textA);
      glassA = Math.min(1, Math.max(0, (el - 0.9) / 0.9)); glassA = ease(glassA);

      // نابض المتابعة
      if (reduce) { pos.x = tgt.x; pos.y = tgt.y; vel.x = vel.y = 0; }
      else {
        var k = 30 + 90 * CFG.follow, c = 2 * Math.sqrt(k) * (1 - CFG.bounce * 0.75);
        vel.x += ((tgt.x - pos.x) * k - vel.x * c) * dt;
        vel.y += ((tgt.y - pos.y) * k - vel.y * c) * dt;
        pos.x += vel.x * dt; pos.y += vel.y * dt;
      }

      // دوران + ميل في اتجاه الحركة
      if (!reduce) {
        rot.y += dt * (0.25 + CFG.rotation * 0.7);
        rot.x = 0.45 + Math.sin(el * 0.4) * 0.25;
        var tx = Math.max(-1, Math.min(1, vel.y * 0.0016)) * CFG.tilt;
        var ty = Math.max(-1, Math.min(1, vel.x * 0.0016)) * CFG.tilt;
        tiltX += (tx - tiltX) * Math.min(1, dt * 8);
        tiltY += (ty - tiltY) * Math.min(1, dt * 8);
      }
      var sp = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      var sa = reduce ? 0 : Math.min(0.32, sp * 0.00028 * CFG.squash * 2);
      if (sp > 1) { stretch.x = vel.x / sp; stretch.y = -vel.y / sp; }
      stretch.a += (sa - stretch.a) * Math.min(1, dt * 10);

      // التحوّل بين الأشكال
      if (mixT < 1) { mixT = Math.min(1, mixT + dt / (reduce ? 0.01 : 0.7)); }
      if (pop < 1) { pop = Math.min(1, pop + dt / 0.75); }
      var popS = pop < 1 ? 1 - Math.sin(pop * Math.PI) * 0.16 + Math.sin(pop * Math.PI * 2) * 0.05 : 1;

      // الموجات
      for (var i = ripples.length - 1; i >= 0; i--) { ripples[i].age += dt; if (ripples[i].age >= ripples[i].life) ripples.splice(i, 1); }
      ripBuf.fill(0);
      for (var j = 0; j < ripples.length; j++) {
        var r = ripples[j], s = r.age / r.life;
        ripBuf[j * 4] = r.x * dpr;
        ripBuf[j * 4 + 1] = (H - r.y) * dpr;
        ripBuf[j * 4 + 2] = (40 + 520 * (1 - Math.pow(1 - s, 2.4))) * dpr;
        ripBuf[j * 4 + 3] = Math.pow(1 - s, 1.6);
      }

      gl.uniform2f(U.uCenter, pos.x * dpr, (H - pos.y) * dpr);
      gl.uniform1f(U.uRadius, radius * dpr * popS);
      gl.uniformMatrix3fv(U.uRot, false, rotMat(rot.x + tiltX, rot.y + tiltY, -tiltY * 0.4));
      gl.uniform3f(U.uStretch, stretch.x, stretch.y, stretch.a);
      gl.uniform1f(U.uShapeA, SHAPE_ID[CFG.shapes[shapeA]]);
      gl.uniform1f(U.uShapeB, SHAPE_ID[CFG.shapes[shapeB]]);
      gl.uniform1f(U.uMix, ease(mixT));
      gl.uniform1f(U.uTime, el);
      gl.uniform1f(U.uTextA, textA);
      gl.uniform1f(U.uGlassA, glassA);
      gl.uniform4fv(U.uRip, ripBuf);
      gl.uniform1f(U.uRipAmp, CFG.ripple * dpr);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }

    var rt;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 80); });
    resize();
    if (document.fonts && document.fonts.load) {
      document.fonts.load(heroFont(100), CFG.text).then(function () { drawScene(); });
      document.fonts.ready.then(function () { drawScene(); });
    }
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); }, false);

    root.classList.add('gl-on');
    requestAnimationFrame(frame);
  }

  /* ===== ٤) تنبيه زر «استكشف أعمالنا» ===== */
  var toast = document.getElementById('toast'), tt;
  document.getElementById('explore').addEventListener('click', function (e) {
    e.preventDefault();
    toast.textContent = 'معرض الأعمال يُفتتح قريبًا — تابعنا.';
    toast.classList.add('is-on');
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
  });
})();
