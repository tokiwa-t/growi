function K(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var $ = { exports: {} }, d = {};
Object.defineProperty(d, "__esModule", {
  value: !0
});
d.DATA_CLONE_ERROR = d.MESSAGE = d.REJECTED = d.FULFILLED = d.REPLY = d.CALL = d.HANDSHAKE_REPLY = d.HANDSHAKE = void 0;
const B = "handshake";
d.HANDSHAKE = B;
const j = "handshake-reply";
d.HANDSHAKE_REPLY = j;
const J = "call";
d.CALL = J;
const W = "reply";
d.REPLY = W;
const k = "fulfilled";
d.FULFILLED = k;
const q = "rejected";
d.REJECTED = q;
const Q = "message";
d.MESSAGE = Q;
const X = "DataCloneError";
d.DATA_CLONE_ERROR = X;
var S = {};
Object.defineProperty(S, "__esModule", {
  value: !0
});
S.ERR_NO_IFRAME_SRC = S.ERR_NOT_IN_IFRAME = S.ERR_CONNECTION_TIMEOUT = S.ERR_CONNECTION_DESTROYED = void 0;
const Z = "ConnectionDestroyed";
S.ERR_CONNECTION_DESTROYED = Z;
const ee = "ConnectionTimeout";
S.ERR_CONNECTION_TIMEOUT = ee;
const re = "NotInIframe";
S.ERR_NOT_IN_IFRAME = re;
const te = "NoIframeSrc";
S.ERR_NO_IFRAME_SRC = te;
var F = { exports: {} };
(function(r, e) {
  Object.defineProperty(e, "__esModule", {
    value: !0
  }), e.default = void 0;
  var t = () => {
    const n = [];
    let u = !1;
    return {
      destroy() {
        u = !0, n.forEach((a) => {
          a();
        });
      },
      onDestroy(a) {
        u ? a() : n.push(a);
      }
    };
  };
  e.default = t, r.exports = e.default;
})(F, F.exports);
var ne = F.exports, H = { exports: {} }, M = {};
Object.defineProperty(M, "__esModule", {
  value: !0
});
M.deserializeError = M.serializeError = void 0;
const oe = (r) => {
  let e = r.name, t = r.message, n = r.stack;
  return {
    name: e,
    message: t,
    stack: n
  };
};
M.serializeError = oe;
const ae = (r) => {
  const e = new Error();
  return Object.keys(r).forEach((t) => e[t] = r[t]), e;
};
M.deserializeError = ae;
(function(r, e) {
  Object.defineProperty(e, "__esModule", {
    value: !0
  }), e.default = void 0;
  var t = d, n = M, u = (a, v, O) => {
    const i = a.localName, f = a.local, s = a.remote, h = a.originForSending, p = a.originForReceiving;
    let g = !1;
    O(`${i}: Connecting call receiver`);
    const L = (_) => {
      if (_.source !== s || _.data.penpal !== t.CALL)
        return;
      if (_.origin !== p) {
        O(`${i} received message from origin ${_.origin} which did not match expected origin ${p}`);
        return;
      }
      const m = _.data, C = m.methodName, l = m.args, T = m.id;
      O(`${i}: Received ${C}() call`);
      const E = (c) => (R) => {
        if (O(`${i}: Sending ${C}() reply`), g) {
          O(`${i}: Unable to send ${C}() reply due to destroyed connection`);
          return;
        }
        const N = {
          penpal: t.REPLY,
          id: T,
          resolution: c,
          returnValue: R
        };
        c === t.REJECTED && R instanceof Error && (N.returnValue = (0, n.serializeError)(R), N.returnValueIsError = !0);
        try {
          s.postMessage(N, h);
        } catch (D) {
          throw D.name === t.DATA_CLONE_ERROR && s.postMessage({
            penpal: t.REPLY,
            id: T,
            resolution: t.REJECTED,
            returnValue: (0, n.serializeError)(D),
            returnValueIsError: !0
          }, h), D;
        }
      };
      new Promise((c) => c(v[C].apply(v, l))).then(E(t.FULFILLED), E(t.REJECTED));
    };
    return f.addEventListener(t.MESSAGE, L), () => {
      g = !0, f.removeEventListener(t.MESSAGE, L);
    };
  };
  e.default = u, r.exports = e.default;
})(H, H.exports);
var ie = H.exports, b = { exports: {} }, x = { exports: {} };
(function(r, e) {
  Object.defineProperty(e, "__esModule", {
    value: !0
  }), e.default = void 0;
  let t = 0;
  var n = () => ++t;
  e.default = n, r.exports = e.default;
})(x, x.exports);
var de = x.exports;
(function(r, e) {
  Object.defineProperty(e, "__esModule", {
    value: !0
  }), e.default = void 0;
  var t = d, n = S, u = v(de), a = M;
  function v(i) {
    return i && i.__esModule ? i : { default: i };
  }
  var O = (i, f, s, h, p) => {
    const g = f.localName, L = f.local, _ = f.remote, m = f.originForSending, C = f.originForReceiving;
    let l = !1;
    p(`${g}: Connecting call sender`);
    const T = (E) => function() {
      for (var c = arguments.length, R = new Array(c), N = 0; N < c; N++)
        R[N] = arguments[N];
      p(`${g}: Sending ${E}() call`);
      let D;
      try {
        _.closed && (D = !0);
      } catch {
        D = !0;
      }
      if (D && h(), l) {
        const w = new Error(`Unable to send ${E}() call due to destroyed connection`);
        throw w.code = n.ERR_CONNECTION_DESTROYED, w;
      }
      return new Promise((w, P) => {
        const y = (0, u.default)(), A = (o) => {
          if (o.source !== _ || o.data.penpal !== t.REPLY || o.data.id !== y)
            return;
          if (o.origin !== C) {
            p(`${g} received message from origin ${o.origin} which did not match expected origin ${C}`);
            return;
          }
          p(`${g}: Received ${E}() reply`), L.removeEventListener(t.MESSAGE, A);
          let I = o.data.returnValue;
          o.data.returnValueIsError && (I = (0, a.deserializeError)(I)), (o.data.resolution === t.FULFILLED ? w : P)(I);
        };
        L.addEventListener(t.MESSAGE, A), _.postMessage({
          penpal: t.CALL,
          id: y,
          methodName: E,
          args: R
        }, m);
      });
    };
    return s.reduce((E, c) => (E[c] = T(c), E), i), () => {
      l = !0;
    };
  };
  e.default = O, r.exports = e.default;
})(b, b.exports);
var ce = b.exports, Y = { exports: {} };
(function(r, e) {
  Object.defineProperty(e, "__esModule", {
    value: !0
  }), e.default = void 0;
  var t = (n) => function() {
    if (n) {
      for (var u = arguments.length, a = new Array(u), v = 0; v < u; v++)
        a[v] = arguments[v];
      console.log("[Penpal]", ...a);
    }
  };
  e.default = t, r.exports = e.default;
})(Y, Y.exports);
var se = Y.exports;
(function(r, e) {
  Object.defineProperty(e, "__esModule", {
    value: !0
  }), e.default = void 0;
  var t = d, n = S, u = i(ne), a = i(ie), v = i(ce), O = i(se);
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  var f = function() {
    let h = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, p = h.parentOrigin, g = p === void 0 ? "*" : p, L = h.methods, _ = L === void 0 ? {} : L, m = h.timeout, C = h.debug;
    const l = (0, O.default)(C);
    if (window === window.top) {
      const w = new Error("connectToParent() must be called within an iframe");
      throw w.code = n.ERR_NOT_IN_IFRAME, w;
    }
    const T = (0, u.default)(), E = T.destroy, c = T.onDestroy, R = window, N = R.parent;
    return {
      promise: new Promise((w, P) => {
        let y;
        m !== void 0 && (y = setTimeout(() => {
          const o = new Error(`Connection to parent timed out after ${m}ms`);
          o.code = n.ERR_CONNECTION_TIMEOUT, P(o), E();
        }, m));
        const A = (o) => {
          try {
            clearTimeout();
          } catch {
            return;
          }
          if (o.source !== N || o.data.penpal !== t.HANDSHAKE_REPLY)
            return;
          if (g !== "*" && g !== o.origin) {
            l(`Child received handshake reply from origin ${o.origin} which did not match expected origin ${g}`);
            return;
          }
          l("Child: Received handshake reply"), R.removeEventListener(t.MESSAGE, A);
          const I = {
            localName: "Child",
            local: R,
            remote: N,
            originForSending: o.origin === "null" ? "*" : o.origin,
            originForReceiving: o.origin
          }, V = {}, z = (0, a.default)(I, _, l);
          c(z);
          const U = (0, v.default)(V, I, o.data.methodNames, E, l);
          c(U), clearTimeout(y), w(V);
        };
        R.addEventListener(t.MESSAGE, A), c(() => {
          R.removeEventListener(t.MESSAGE, A);
          const o = new Error("Connection destroyed");
          o.code = n.ERR_CONNECTION_DESTROYED, P(o);
        }), l("Child: Sending handshake"), N.postMessage({
          penpal: t.HANDSHAKE,
          methodNames: Object.keys(_)
        }, g);
      }),
      destroy: E
    };
  };
  e.default = f, r.exports = e.default;
})($, $.exports);
var le = $.exports;
const ue = /* @__PURE__ */ K(le);
function Ee(r, e, t) {
  var n = t || {}, u = n.noTrailing, a = u === void 0 ? !1 : u, v = n.noLeading, O = v === void 0 ? !1 : v, i = n.debounceMode, f = i === void 0 ? void 0 : i, s, h = !1, p = 0;
  function g() {
    s && clearTimeout(s);
  }
  function L(m) {
    var C = m || {}, l = C.upcomingOnly, T = l === void 0 ? !1 : l;
    g(), h = !T;
  }
  function _() {
    for (var m = arguments.length, C = new Array(m), l = 0; l < m; l++)
      C[l] = arguments[l];
    var T = this, E = Date.now() - p;
    if (h)
      return;
    function c() {
      p = Date.now(), e.apply(T, C);
    }
    function R() {
      s = void 0;
    }
    !O && f && !s && c(), g(), f === void 0 && E > r ? O ? (p = Date.now(), a || (s = setTimeout(f ? R : c, r))) : c() : a !== !0 && (s = setTimeout(f ? R : c, f === void 0 ? r - E : r));
  }
  return _.cancel = L, _;
}
function fe(r, e, t) {
  var n = t || {}, u = n.atBegin, a = u === void 0 ? !1 : u;
  return Ee(r, e, {
    debounceMode: a !== !1
  });
}
const ge = !1, _e = "<%= origin %>";
function Re() {
  return window.editor.doc.getValue();
}
function G(r) {
  window.editor.doc.setValue(r);
}
function ve(r) {
  if (window.cmClient != null) {
    G(r);
    return;
  }
  const e = setInterval(() => {
    window.cmClient != null && (clearInterval(e), G(r));
  }, 250);
}
function pe(r) {
  window.growi.notifyBodyChanges(r);
}
const me = fe(800, pe);
function Ce(r) {
  window.growi.saveWithShortcut(r);
}
function Oe() {
  const r = window.CodeMirror, e = window.editor;
  r == null || e == null || (e.on("change", (t, n) => {
    n.origin !== "ignoreHistory" && me(t.doc.getValue());
  }), r.commands.save = function(t) {
    Ce(t.doc.getValue());
  }, delete e.options.extraKeys["Cmd-S"], delete e.options.extraKeys["Ctrl-S"]);
}
function he() {
  ue({
    parentOrigin: _e,
    // Methods child is exposing to parent
    methods: {
      getValue() {
        return Re();
      },
      setValue(e) {
        G(e);
      },
      setValueOnInit(e) {
        ve(e);
      }
    },
    debug: ge
  }).promise.then((e) => {
    window.growi = e;
  }).catch((e) => {
    console.log(e);
  });
}
(function() {
  if (window === window.parent) {
    console.log("[GROWI] Loading agent for HackMD is not processed because currently not in iframe");
    return;
  }
  console.log("[HackMD] Loading GROWI agent for HackMD..."), window.addEventListener("load", () => {
    Oe();
  }), he(), console.log("[HackMD] GROWI agent for HackMD has successfully loaded.");
})();
//# sourceMappingURL=hackmd-agent.js.map
