var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// build/.concat-webgl-3.8.ts
(() => {
  if (!Math.fround) {
    Math.fround = /* @__PURE__ */ (function(array) {
      return function(x) {
        return array[0] = x, array[0];
      };
    })(new Float32Array(1));
  }
})();
var spine;
((spine2) => {
  class Animation {
    constructor(name, timelines, duration) {
      /** The animation's name, which is unique across all animations in the skeleton. */
      __publicField(this, "name");
      __publicField(this, "timelines");
      __publicField(this, "timelineIds");
      /** The duration of the animation in seconds, which is the highest time of all keys in the timeline. */
      __publicField(this, "duration");
      if (name == null) throw new Error("name cannot be null.");
      if (timelines == null) throw new Error("timelines cannot be null.");
      this.name = name;
      this.timelines = timelines;
      this.timelineIds = [];
      for (var i = 0; i < timelines.length; i++)
        this.timelineIds[timelines[i].getPropertyId()] = true;
      this.duration = duration;
    }
    hasTimeline(id) {
      return this.timelineIds[id] == true;
    }
    /** Applies all the animation's timelines to the specified skeleton.
     *
     * See Timeline {@link Timeline#apply(Skeleton, float, float, Array, float, MixBlend, MixDirection)}.
     * @param loop If true, the animation repeats after {@link #getDuration()}.
     * @param events May be null to ignore fired events. */
    apply(skeleton, lastTime, time, loop, events, alpha, blend, direction) {
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      if (loop && this.duration != 0) {
        time %= this.duration;
        if (lastTime > 0) lastTime %= this.duration;
      }
      let timelines = this.timelines;
      for (let i = 0, n = timelines.length; i < n; i++)
        timelines[i].apply(skeleton, lastTime, time, events, alpha, blend, direction);
    }
    /** @param target After the first and before the last value.
    	 * @returns index of first value greater than the target. */
    static binarySearch(values, target, step = 1) {
      let low = 0;
      let high = values.length / step - 2;
      if (high == 0) return step;
      let current = high >>> 1;
      while (true) {
        if (values[(current + 1) * step] <= target)
          low = current + 1;
        else
          high = current;
        if (low == high) return (low + 1) * step;
        current = low + high >>> 1;
      }
    }
    static linearSearch(values, target, step) {
      for (let i = 0, last = values.length - step; i <= last; i += step)
        if (values[i] > target) return i;
      return -1;
    }
  }
  spine2.Animation = Animation;
  let MixBlend;
  ((MixBlend2) => {
    MixBlend2[MixBlend2["setup"] = 0] = "setup";
    MixBlend2[MixBlend2["first"] = 1] = "first";
    MixBlend2[MixBlend2["replace"] = 2] = "replace";
    MixBlend2[MixBlend2["add"] = 3] = "add";
  })(MixBlend = spine2.MixBlend || (spine2.MixBlend = {}));
  let MixDirection;
  ((MixDirection2) => {
    MixDirection2[MixDirection2["mixIn"] = 0] = "mixIn";
    MixDirection2[MixDirection2["mixOut"] = 1] = "mixOut";
  })(MixDirection = spine2.MixDirection || (spine2.MixDirection = {}));
  let TimelineType;
  ((TimelineType2) => {
    TimelineType2[TimelineType2["rotate"] = 0] = "rotate";
    TimelineType2[TimelineType2["translate"] = 1] = "translate";
    TimelineType2[TimelineType2["scale"] = 2] = "scale";
    TimelineType2[TimelineType2["shear"] = 3] = "shear";
    TimelineType2[TimelineType2["attachment"] = 4] = "attachment";
    TimelineType2[TimelineType2["color"] = 5] = "color";
    TimelineType2[TimelineType2["deform"] = 6] = "deform";
    TimelineType2[TimelineType2["event"] = 7] = "event";
    TimelineType2[TimelineType2["drawOrder"] = 8] = "drawOrder";
    TimelineType2[TimelineType2["ikConstraint"] = 9] = "ikConstraint";
    TimelineType2[TimelineType2["transformConstraint"] = 10] = "transformConstraint";
    TimelineType2[TimelineType2["pathConstraintPosition"] = 11] = "pathConstraintPosition";
    TimelineType2[TimelineType2["pathConstraintSpacing"] = 12] = "pathConstraintSpacing";
    TimelineType2[TimelineType2["pathConstraintMix"] = 13] = "pathConstraintMix";
    TimelineType2[TimelineType2["twoColor"] = 14] = "twoColor";
  })(TimelineType = spine2.TimelineType || (spine2.TimelineType = {}));
  const _CurveTimeline = class _CurveTimeline {
    constructor(frameCount) {
      __publicField(this, "curves");
      if (frameCount <= 0) throw new Error("frameCount must be > 0: " + frameCount);
      this.curves = spine2.Utils.newFloatArray((frameCount - 1) * _CurveTimeline.BEZIER_SIZE);
    }
    /** The number of key frames for this timeline. */
    getFrameCount() {
      return this.curves.length / _CurveTimeline.BEZIER_SIZE + 1;
    }
    /** Sets the specified key frame to linear interpolation. */
    setLinear(frameIndex) {
      this.curves[frameIndex * _CurveTimeline.BEZIER_SIZE] = _CurveTimeline.LINEAR;
    }
    /** Sets the specified key frame to stepped interpolation. */
    setStepped(frameIndex) {
      this.curves[frameIndex * _CurveTimeline.BEZIER_SIZE] = _CurveTimeline.STEPPED;
    }
    /** Returns the interpolation type for the specified key frame.
     * @returns Linear is 0, stepped is 1, Bezier is 2. */
    getCurveType(frameIndex) {
      let index = frameIndex * _CurveTimeline.BEZIER_SIZE;
      if (index == this.curves.length) return _CurveTimeline.LINEAR;
      let type = this.curves[index];
      if (type == _CurveTimeline.LINEAR) return _CurveTimeline.LINEAR;
      if (type == _CurveTimeline.STEPPED) return _CurveTimeline.STEPPED;
      return _CurveTimeline.BEZIER;
    }
    /** Sets the specified key frame to Bezier interpolation. `cx1` and `cx2` are from 0 to 1,
     * representing the percent of time between the two key frames. `cy1` and `cy2` are the percent of the
     * difference between the key frame's values. */
    setCurve(frameIndex, cx1, cy1, cx2, cy2) {
      let tmpx = (-cx1 * 2 + cx2) * 0.03, tmpy = (-cy1 * 2 + cy2) * 0.03;
      let dddfx = ((cx1 - cx2) * 3 + 1) * 6e-3, dddfy = ((cy1 - cy2) * 3 + 1) * 6e-3;
      let ddfx = tmpx * 2 + dddfx, ddfy = tmpy * 2 + dddfy;
      let dfx = cx1 * 0.3 + tmpx + dddfx * 0.16666667, dfy = cy1 * 0.3 + tmpy + dddfy * 0.16666667;
      let i = frameIndex * _CurveTimeline.BEZIER_SIZE;
      let curves = this.curves;
      curves[i++] = _CurveTimeline.BEZIER;
      let x = dfx, y = dfy;
      for (let n = i + _CurveTimeline.BEZIER_SIZE - 1; i < n; i += 2) {
        curves[i] = x;
        curves[i + 1] = y;
        dfx += ddfx;
        dfy += ddfy;
        ddfx += dddfx;
        ddfy += dddfy;
        x += dfx;
        y += dfy;
      }
    }
    /** Returns the interpolated percentage for the specified key frame and linear percentage. */
    getCurvePercent(frameIndex, percent) {
      percent = spine2.MathUtils.clamp(percent, 0, 1);
      let curves = this.curves;
      let i = frameIndex * _CurveTimeline.BEZIER_SIZE;
      let type = curves[i];
      if (type == _CurveTimeline.LINEAR) return percent;
      if (type == _CurveTimeline.STEPPED) return 0;
      i++;
      let x = 0;
      for (let start = i, n = i + _CurveTimeline.BEZIER_SIZE - 1; i < n; i += 2) {
        x = curves[i];
        if (x >= percent) {
          let prevX, prevY;
          if (i == start) {
            prevX = 0;
            prevY = 0;
          } else {
            prevX = curves[i - 2];
            prevY = curves[i - 1];
          }
          return prevY + (curves[i + 1] - prevY) * (percent - prevX) / (x - prevX);
        }
      }
      let y = curves[i - 1];
      return y + (1 - y) * (percent - x) / (1 - x);
    }
  };
  __publicField(_CurveTimeline, "LINEAR", 0);
  __publicField(_CurveTimeline, "STEPPED", 1);
  __publicField(_CurveTimeline, "BEZIER", 2);
  __publicField(_CurveTimeline, "BEZIER_SIZE", 10 * 2 - 1);
  let CurveTimeline = _CurveTimeline;
  spine2.CurveTimeline = _CurveTimeline;
  const _RotateTimeline = class _RotateTimeline extends CurveTimeline {
    // time, degrees, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the bone in {@link Skeleton#bones} that will be changed. */
      __publicField(this, "boneIndex");
      /** The time in seconds and rotation in degrees for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount << 1);
    }
    getPropertyId() {
      return (0 /* rotate */ << 24) + this.boneIndex;
    }
    /** Sets the time and angle of the specified keyframe. */
    setFrame(frameIndex, time, degrees) {
      frameIndex <<= 1;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _RotateTimeline.ROTATION] = degrees;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let frames = this.frames;
      let bone = skeleton.bones[this.boneIndex];
      if (!bone.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            bone.rotation = bone.data.rotation;
            return;
          case 1 /* first */:
            let r2 = bone.data.rotation - bone.rotation;
            bone.rotation += (r2 - (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360) * alpha;
        }
        return;
      }
      if (time >= frames[frames.length - _RotateTimeline.ENTRIES]) {
        let r2 = frames[frames.length + _RotateTimeline.PREV_ROTATION];
        switch (blend) {
          case 0 /* setup */:
            bone.rotation = bone.data.rotation + r2 * alpha;
            break;
          case 1 /* first */:
          case 2 /* replace */:
            r2 += bone.data.rotation - bone.rotation;
            r2 -= (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360;
          // Wrap within -180 and 180.
          case 3 /* add */:
            bone.rotation += r2 * alpha;
        }
        return;
      }
      let frame = Animation.binarySearch(frames, time, _RotateTimeline.ENTRIES);
      let prevRotation = frames[frame + _RotateTimeline.PREV_ROTATION];
      let frameTime = frames[frame];
      let percent = this.getCurvePercent(
        (frame >> 1) - 1,
        1 - (time - frameTime) / (frames[frame + _RotateTimeline.PREV_TIME] - frameTime)
      );
      let r = frames[frame + _RotateTimeline.ROTATION] - prevRotation;
      r = prevRotation + (r - (16384 - (16384.499999999996 - r / 360 | 0)) * 360) * percent;
      switch (blend) {
        case 0 /* setup */:
          bone.rotation = bone.data.rotation + (r - (16384 - (16384.499999999996 - r / 360 | 0)) * 360) * alpha;
          break;
        case 1 /* first */:
        case 2 /* replace */:
          r += bone.data.rotation - bone.rotation;
        case 3 /* add */:
          bone.rotation += (r - (16384 - (16384.499999999996 - r / 360 | 0)) * 360) * alpha;
      }
    }
  };
  __publicField(_RotateTimeline, "ENTRIES", 2);
  __publicField(_RotateTimeline, "PREV_TIME", -2);
  __publicField(_RotateTimeline, "PREV_ROTATION", -1);
  __publicField(_RotateTimeline, "ROTATION", 1);
  let RotateTimeline = _RotateTimeline;
  spine2.RotateTimeline = _RotateTimeline;
  const _TranslateTimeline = class _TranslateTimeline extends CurveTimeline {
    // time, x, y, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the bone in {@link Skeleton#bones} that will be changed. */
      __publicField(this, "boneIndex");
      /** The time in seconds, x, and y values for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _TranslateTimeline.ENTRIES);
    }
    getPropertyId() {
      return (1 /* translate */ << 24) + this.boneIndex;
    }
    /** Sets the time in seconds, x, and y values for the specified key frame. */
    setFrame(frameIndex, time, x, y) {
      frameIndex *= _TranslateTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _TranslateTimeline.X] = x;
      this.frames[frameIndex + _TranslateTimeline.Y] = y;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let frames = this.frames;
      let bone = skeleton.bones[this.boneIndex];
      if (!bone.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            bone.x = bone.data.x;
            bone.y = bone.data.y;
            return;
          case 1 /* first */:
            bone.x += (bone.data.x - bone.x) * alpha;
            bone.y += (bone.data.y - bone.y) * alpha;
        }
        return;
      }
      let x = 0, y = 0;
      if (time >= frames[frames.length - _TranslateTimeline.ENTRIES]) {
        x = frames[frames.length + _TranslateTimeline.PREV_X];
        y = frames[frames.length + _TranslateTimeline.PREV_Y];
      } else {
        let frame = Animation.binarySearch(frames, time, _TranslateTimeline.ENTRIES);
        x = frames[frame + _TranslateTimeline.PREV_X];
        y = frames[frame + _TranslateTimeline.PREV_Y];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / _TranslateTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + _TranslateTimeline.PREV_TIME] - frameTime)
        );
        x += (frames[frame + _TranslateTimeline.X] - x) * percent;
        y += (frames[frame + _TranslateTimeline.Y] - y) * percent;
      }
      switch (blend) {
        case 0 /* setup */:
          bone.x = bone.data.x + x * alpha;
          bone.y = bone.data.y + y * alpha;
          break;
        case 1 /* first */:
        case 2 /* replace */:
          bone.x += (bone.data.x + x - bone.x) * alpha;
          bone.y += (bone.data.y + y - bone.y) * alpha;
          break;
        case 3 /* add */:
          bone.x += x * alpha;
          bone.y += y * alpha;
      }
    }
  };
  __publicField(_TranslateTimeline, "ENTRIES", 3);
  __publicField(_TranslateTimeline, "PREV_TIME", -3);
  __publicField(_TranslateTimeline, "PREV_X", -2);
  __publicField(_TranslateTimeline, "PREV_Y", -1);
  __publicField(_TranslateTimeline, "X", 1);
  __publicField(_TranslateTimeline, "Y", 2);
  let TranslateTimeline = _TranslateTimeline;
  spine2.TranslateTimeline = _TranslateTimeline;
  class ScaleTimeline extends TranslateTimeline {
    constructor(frameCount) {
      super(frameCount);
    }
    getPropertyId() {
      return (2 /* scale */ << 24) + this.boneIndex;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let frames = this.frames;
      let bone = skeleton.bones[this.boneIndex];
      if (!bone.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            bone.scaleX = bone.data.scaleX;
            bone.scaleY = bone.data.scaleY;
            return;
          case 1 /* first */:
            bone.scaleX += (bone.data.scaleX - bone.scaleX) * alpha;
            bone.scaleY += (bone.data.scaleY - bone.scaleY) * alpha;
        }
        return;
      }
      let x = 0, y = 0;
      if (time >= frames[frames.length - ScaleTimeline.ENTRIES]) {
        x = frames[frames.length + ScaleTimeline.PREV_X] * bone.data.scaleX;
        y = frames[frames.length + ScaleTimeline.PREV_Y] * bone.data.scaleY;
      } else {
        let frame = Animation.binarySearch(frames, time, ScaleTimeline.ENTRIES);
        x = frames[frame + ScaleTimeline.PREV_X];
        y = frames[frame + ScaleTimeline.PREV_Y];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / ScaleTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + ScaleTimeline.PREV_TIME] - frameTime)
        );
        x = (x + (frames[frame + ScaleTimeline.X] - x) * percent) * bone.data.scaleX;
        y = (y + (frames[frame + ScaleTimeline.Y] - y) * percent) * bone.data.scaleY;
      }
      if (alpha == 1) {
        if (blend == 3 /* add */) {
          bone.scaleX += x - bone.data.scaleX;
          bone.scaleY += y - bone.data.scaleY;
        } else {
          bone.scaleX = x;
          bone.scaleY = y;
        }
      } else {
        let bx = 0, by = 0;
        if (direction == 1 /* mixOut */) {
          switch (blend) {
            case 0 /* setup */:
              bx = bone.data.scaleX;
              by = bone.data.scaleY;
              bone.scaleX = bx + (Math.abs(x) * spine2.MathUtils.signum(bx) - bx) * alpha;
              bone.scaleY = by + (Math.abs(y) * spine2.MathUtils.signum(by) - by) * alpha;
              break;
            case 1 /* first */:
            case 2 /* replace */:
              bx = bone.scaleX;
              by = bone.scaleY;
              bone.scaleX = bx + (Math.abs(x) * spine2.MathUtils.signum(bx) - bx) * alpha;
              bone.scaleY = by + (Math.abs(y) * spine2.MathUtils.signum(by) - by) * alpha;
              break;
            case 3 /* add */:
              bx = bone.scaleX;
              by = bone.scaleY;
              bone.scaleX = bx + (Math.abs(x) * spine2.MathUtils.signum(bx) - bone.data.scaleX) * alpha;
              bone.scaleY = by + (Math.abs(y) * spine2.MathUtils.signum(by) - bone.data.scaleY) * alpha;
          }
        } else {
          switch (blend) {
            case 0 /* setup */:
              bx = Math.abs(bone.data.scaleX) * spine2.MathUtils.signum(x);
              by = Math.abs(bone.data.scaleY) * spine2.MathUtils.signum(y);
              bone.scaleX = bx + (x - bx) * alpha;
              bone.scaleY = by + (y - by) * alpha;
              break;
            case 1 /* first */:
            case 2 /* replace */:
              bx = Math.abs(bone.scaleX) * spine2.MathUtils.signum(x);
              by = Math.abs(bone.scaleY) * spine2.MathUtils.signum(y);
              bone.scaleX = bx + (x - bx) * alpha;
              bone.scaleY = by + (y - by) * alpha;
              break;
            case 3 /* add */:
              bx = spine2.MathUtils.signum(x);
              by = spine2.MathUtils.signum(y);
              bone.scaleX = Math.abs(bone.scaleX) * bx + (x - Math.abs(bone.data.scaleX) * bx) * alpha;
              bone.scaleY = Math.abs(bone.scaleY) * by + (y - Math.abs(bone.data.scaleY) * by) * alpha;
          }
        }
      }
    }
  }
  spine2.ScaleTimeline = ScaleTimeline;
  class ShearTimeline extends TranslateTimeline {
    constructor(frameCount) {
      super(frameCount);
    }
    getPropertyId() {
      return (3 /* shear */ << 24) + this.boneIndex;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let frames = this.frames;
      let bone = skeleton.bones[this.boneIndex];
      if (!bone.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            bone.shearX = bone.data.shearX;
            bone.shearY = bone.data.shearY;
            return;
          case 1 /* first */:
            bone.shearX += (bone.data.shearX - bone.shearX) * alpha;
            bone.shearY += (bone.data.shearY - bone.shearY) * alpha;
        }
        return;
      }
      let x = 0, y = 0;
      if (time >= frames[frames.length - ShearTimeline.ENTRIES]) {
        x = frames[frames.length + ShearTimeline.PREV_X];
        y = frames[frames.length + ShearTimeline.PREV_Y];
      } else {
        let frame = Animation.binarySearch(frames, time, ShearTimeline.ENTRIES);
        x = frames[frame + ShearTimeline.PREV_X];
        y = frames[frame + ShearTimeline.PREV_Y];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / ShearTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + ShearTimeline.PREV_TIME] - frameTime)
        );
        x = x + (frames[frame + ShearTimeline.X] - x) * percent;
        y = y + (frames[frame + ShearTimeline.Y] - y) * percent;
      }
      switch (blend) {
        case 0 /* setup */:
          bone.shearX = bone.data.shearX + x * alpha;
          bone.shearY = bone.data.shearY + y * alpha;
          break;
        case 1 /* first */:
        case 2 /* replace */:
          bone.shearX += (bone.data.shearX + x - bone.shearX) * alpha;
          bone.shearY += (bone.data.shearY + y - bone.shearY) * alpha;
          break;
        case 3 /* add */:
          bone.shearX += x * alpha;
          bone.shearY += y * alpha;
      }
    }
  }
  spine2.ShearTimeline = ShearTimeline;
  const _ColorTimeline = class _ColorTimeline extends CurveTimeline {
    // time, r, g, b, a, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the slot in {@link Skeleton#slots} that will be changed. */
      __publicField(this, "slotIndex");
      /** The time in seconds, red, green, blue, and alpha values for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _ColorTimeline.ENTRIES);
    }
    getPropertyId() {
      return (5 /* color */ << 24) + this.slotIndex;
    }
    /** Sets the time in seconds, red, green, blue, and alpha for the specified key frame. */
    setFrame(frameIndex, time, r, g, b, a) {
      frameIndex *= _ColorTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _ColorTimeline.R] = r;
      this.frames[frameIndex + _ColorTimeline.G] = g;
      this.frames[frameIndex + _ColorTimeline.B] = b;
      this.frames[frameIndex + _ColorTimeline.A] = a;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let slot = skeleton.slots[this.slotIndex];
      if (!slot.bone.active) return;
      let frames = this.frames;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            slot.color.setFromColor(slot.data.color);
            return;
          case 1 /* first */:
            let color = slot.color, setup = slot.data.color;
            color.add(
              (setup.r - color.r) * alpha,
              (setup.g - color.g) * alpha,
              (setup.b - color.b) * alpha,
              (setup.a - color.a) * alpha
            );
        }
        return;
      }
      let r = 0, g = 0, b = 0, a = 0;
      if (time >= frames[frames.length - _ColorTimeline.ENTRIES]) {
        let i = frames.length;
        r = frames[i + _ColorTimeline.PREV_R];
        g = frames[i + _ColorTimeline.PREV_G];
        b = frames[i + _ColorTimeline.PREV_B];
        a = frames[i + _ColorTimeline.PREV_A];
      } else {
        let frame = Animation.binarySearch(frames, time, _ColorTimeline.ENTRIES);
        r = frames[frame + _ColorTimeline.PREV_R];
        g = frames[frame + _ColorTimeline.PREV_G];
        b = frames[frame + _ColorTimeline.PREV_B];
        a = frames[frame + _ColorTimeline.PREV_A];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / _ColorTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + _ColorTimeline.PREV_TIME] - frameTime)
        );
        r += (frames[frame + _ColorTimeline.R] - r) * percent;
        g += (frames[frame + _ColorTimeline.G] - g) * percent;
        b += (frames[frame + _ColorTimeline.B] - b) * percent;
        a += (frames[frame + _ColorTimeline.A] - a) * percent;
      }
      if (alpha == 1)
        slot.color.set(r, g, b, a);
      else {
        let color = slot.color;
        if (blend == 0 /* setup */) color.setFromColor(slot.data.color);
        color.add((r - color.r) * alpha, (g - color.g) * alpha, (b - color.b) * alpha, (a - color.a) * alpha);
      }
    }
  };
  __publicField(_ColorTimeline, "ENTRIES", 5);
  __publicField(_ColorTimeline, "PREV_TIME", -5);
  __publicField(_ColorTimeline, "PREV_R", -4);
  __publicField(_ColorTimeline, "PREV_G", -3);
  __publicField(_ColorTimeline, "PREV_B", -2);
  __publicField(_ColorTimeline, "PREV_A", -1);
  __publicField(_ColorTimeline, "R", 1);
  __publicField(_ColorTimeline, "G", 2);
  __publicField(_ColorTimeline, "B", 3);
  __publicField(_ColorTimeline, "A", 4);
  let ColorTimeline = _ColorTimeline;
  spine2.ColorTimeline = _ColorTimeline;
  const _TwoColorTimeline = class _TwoColorTimeline extends CurveTimeline {
    // time, r, g, b, a, r2, g2, b2, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the slot in {@link Skeleton#slots()} that will be changed. The {@link Slot#darkColor()} must not be
       * null. */
      __publicField(this, "slotIndex");
      /** The time in seconds, red, green, blue, and alpha values of the color, red, green, blue of the dark color, for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _TwoColorTimeline.ENTRIES);
    }
    getPropertyId() {
      return (14 /* twoColor */ << 24) + this.slotIndex;
    }
    /** Sets the time in seconds, light, and dark colors for the specified key frame. */
    setFrame(frameIndex, time, r, g, b, a, r2, g2, b2) {
      frameIndex *= _TwoColorTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _TwoColorTimeline.R] = r;
      this.frames[frameIndex + _TwoColorTimeline.G] = g;
      this.frames[frameIndex + _TwoColorTimeline.B] = b;
      this.frames[frameIndex + _TwoColorTimeline.A] = a;
      this.frames[frameIndex + _TwoColorTimeline.R2] = r2;
      this.frames[frameIndex + _TwoColorTimeline.G2] = g2;
      this.frames[frameIndex + _TwoColorTimeline.B2] = b2;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let slot = skeleton.slots[this.slotIndex];
      if (!slot.bone.active) return;
      let frames = this.frames;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            slot.color.setFromColor(slot.data.color);
            slot.darkColor.setFromColor(slot.data.darkColor);
            return;
          case 1 /* first */:
            let light = slot.color, dark = slot.darkColor, setupLight = slot.data.color, setupDark = slot.data.darkColor;
            light.add(
              (setupLight.r - light.r) * alpha,
              (setupLight.g - light.g) * alpha,
              (setupLight.b - light.b) * alpha,
              (setupLight.a - light.a) * alpha
            );
            dark.add((setupDark.r - dark.r) * alpha, (setupDark.g - dark.g) * alpha, (setupDark.b - dark.b) * alpha, 0);
        }
        return;
      }
      let r = 0, g = 0, b = 0, a = 0, r2 = 0, g2 = 0, b2 = 0;
      if (time >= frames[frames.length - _TwoColorTimeline.ENTRIES]) {
        let i = frames.length;
        r = frames[i + _TwoColorTimeline.PREV_R];
        g = frames[i + _TwoColorTimeline.PREV_G];
        b = frames[i + _TwoColorTimeline.PREV_B];
        a = frames[i + _TwoColorTimeline.PREV_A];
        r2 = frames[i + _TwoColorTimeline.PREV_R2];
        g2 = frames[i + _TwoColorTimeline.PREV_G2];
        b2 = frames[i + _TwoColorTimeline.PREV_B2];
      } else {
        let frame = Animation.binarySearch(frames, time, _TwoColorTimeline.ENTRIES);
        r = frames[frame + _TwoColorTimeline.PREV_R];
        g = frames[frame + _TwoColorTimeline.PREV_G];
        b = frames[frame + _TwoColorTimeline.PREV_B];
        a = frames[frame + _TwoColorTimeline.PREV_A];
        r2 = frames[frame + _TwoColorTimeline.PREV_R2];
        g2 = frames[frame + _TwoColorTimeline.PREV_G2];
        b2 = frames[frame + _TwoColorTimeline.PREV_B2];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / _TwoColorTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + _TwoColorTimeline.PREV_TIME] - frameTime)
        );
        r += (frames[frame + _TwoColorTimeline.R] - r) * percent;
        g += (frames[frame + _TwoColorTimeline.G] - g) * percent;
        b += (frames[frame + _TwoColorTimeline.B] - b) * percent;
        a += (frames[frame + _TwoColorTimeline.A] - a) * percent;
        r2 += (frames[frame + _TwoColorTimeline.R2] - r2) * percent;
        g2 += (frames[frame + _TwoColorTimeline.G2] - g2) * percent;
        b2 += (frames[frame + _TwoColorTimeline.B2] - b2) * percent;
      }
      if (alpha == 1) {
        slot.color.set(r, g, b, a);
        slot.darkColor.set(r2, g2, b2, 1);
      } else {
        let light = slot.color, dark = slot.darkColor;
        if (blend == 0 /* setup */) {
          light.setFromColor(slot.data.color);
          dark.setFromColor(slot.data.darkColor);
        }
        light.add((r - light.r) * alpha, (g - light.g) * alpha, (b - light.b) * alpha, (a - light.a) * alpha);
        dark.add((r2 - dark.r) * alpha, (g2 - dark.g) * alpha, (b2 - dark.b) * alpha, 0);
      }
    }
  };
  __publicField(_TwoColorTimeline, "ENTRIES", 8);
  __publicField(_TwoColorTimeline, "PREV_TIME", -8);
  __publicField(_TwoColorTimeline, "PREV_R", -7);
  __publicField(_TwoColorTimeline, "PREV_G", -6);
  __publicField(_TwoColorTimeline, "PREV_B", -5);
  __publicField(_TwoColorTimeline, "PREV_A", -4);
  __publicField(_TwoColorTimeline, "PREV_R2", -3);
  __publicField(_TwoColorTimeline, "PREV_G2", -2);
  __publicField(_TwoColorTimeline, "PREV_B2", -1);
  __publicField(_TwoColorTimeline, "R", 1);
  __publicField(_TwoColorTimeline, "G", 2);
  __publicField(_TwoColorTimeline, "B", 3);
  __publicField(_TwoColorTimeline, "A", 4);
  __publicField(_TwoColorTimeline, "R2", 5);
  __publicField(_TwoColorTimeline, "G2", 6);
  __publicField(_TwoColorTimeline, "B2", 7);
  let TwoColorTimeline = _TwoColorTimeline;
  spine2.TwoColorTimeline = _TwoColorTimeline;
  class AttachmentTimeline {
    constructor(frameCount) {
      /** The index of the slot in {@link Skeleton#slots} that will be changed. */
      __publicField(this, "slotIndex");
      /** The time in seconds for each key frame. */
      __publicField(this, "frames");
      // time, ...
      /** The attachment name for each key frame. May contain null values to clear the attachment. */
      __publicField(this, "attachmentNames");
      this.frames = spine2.Utils.newFloatArray(frameCount);
      this.attachmentNames = new Array(frameCount);
    }
    getPropertyId() {
      return (4 /* attachment */ << 24) + this.slotIndex;
    }
    /** The number of key frames for this timeline. */
    getFrameCount() {
      return this.frames.length;
    }
    /** Sets the time in seconds and the attachment name for the specified key frame. */
    setFrame(frameIndex, time, attachmentName) {
      this.frames[frameIndex] = time;
      this.attachmentNames[frameIndex] = attachmentName;
    }
    apply(skeleton, lastTime, time, events, alpha, blend, direction) {
      let slot = skeleton.slots[this.slotIndex];
      if (!slot.bone.active) return;
      if (direction == 1 /* mixOut */) {
        if (blend == 0 /* setup */)
          this.setAttachment(skeleton, slot, slot.data.attachmentName);
        return;
      }
      let frames = this.frames;
      if (time < frames[0]) {
        if (blend == 0 /* setup */ || blend == 1 /* first */) this.setAttachment(skeleton, slot, slot.data.attachmentName);
        return;
      }
      let frameIndex = 0;
      if (time >= frames[frames.length - 1])
        frameIndex = frames.length - 1;
      else
        frameIndex = Animation.binarySearch(frames, time, 1) - 1;
      let attachmentName = this.attachmentNames[frameIndex];
      skeleton.slots[this.slotIndex].setAttachment(attachmentName == null ? null : skeleton.getAttachment(this.slotIndex, attachmentName));
    }
    setAttachment(skeleton, slot, attachmentName) {
      slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(this.slotIndex, attachmentName));
    }
  }
  spine2.AttachmentTimeline = AttachmentTimeline;
  let zeros = null;
  class DeformTimeline extends CurveTimeline {
    constructor(frameCount) {
      super(frameCount);
      /** The index of the slot in {@link Skeleton#getSlots()} that will be changed. */
      __publicField(this, "slotIndex");
      /** The attachment that will be deformed. */
      __publicField(this, "attachment");
      /** The time in seconds for each key frame. */
      __publicField(this, "frames");
      // time, ...
      /** The vertices for each key frame. */
      __publicField(this, "frameVertices");
      this.frames = spine2.Utils.newFloatArray(frameCount);
      this.frameVertices = new Array(frameCount);
      if (zeros == null) zeros = spine2.Utils.newFloatArray(64);
    }
    getPropertyId() {
      return (6 /* deform */ << 27) + +this.attachment.id + this.slotIndex;
    }
    /** Sets the time in seconds and the vertices for the specified key frame.
     * @param vertices Vertex positions for an unweighted VertexAttachment, or deform offsets if it has weights. */
    setFrame(frameIndex, time, vertices) {
      this.frames[frameIndex] = time;
      this.frameVertices[frameIndex] = vertices;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let slot = skeleton.slots[this.slotIndex];
      if (!slot.bone.active) return;
      let slotAttachment = slot.getAttachment();
      if (!(slotAttachment instanceof spine2.VertexAttachment) || !(slotAttachment.deformAttachment == this.attachment)) return;
      let deformArray = slot.deform;
      if (deformArray.length == 0) blend = 0 /* setup */;
      let frameVertices = this.frameVertices;
      let vertexCount = frameVertices[0].length;
      let frames = this.frames;
      if (time < frames[0]) {
        let vertexAttachment = slotAttachment;
        switch (blend) {
          case 0 /* setup */:
            deformArray.length = 0;
            return;
          case 1 /* first */:
            if (alpha == 1) {
              deformArray.length = 0;
              break;
            }
            let deform2 = spine2.Utils.setArraySize(deformArray, vertexCount);
            if (vertexAttachment.bones == null) {
              let setupVertices = vertexAttachment.vertices;
              for (var i = 0; i < vertexCount; i++)
                deform2[i] += (setupVertices[i] - deform2[i]) * alpha;
            } else {
              alpha = 1 - alpha;
              for (var i = 0; i < vertexCount; i++)
                deform2[i] *= alpha;
            }
        }
        return;
      }
      let deform = spine2.Utils.setArraySize(deformArray, vertexCount);
      if (time >= frames[frames.length - 1]) {
        let lastVertices = frameVertices[frames.length - 1];
        if (alpha == 1) {
          if (blend == 3 /* add */) {
            let vertexAttachment = slotAttachment;
            if (vertexAttachment.bones == null) {
              let setupVertices = vertexAttachment.vertices;
              for (let i2 = 0; i2 < vertexCount; i2++) {
                deform[i2] += lastVertices[i2] - setupVertices[i2];
              }
            } else {
              for (let i2 = 0; i2 < vertexCount; i2++)
                deform[i2] += lastVertices[i2];
            }
          } else {
            spine2.Utils.arrayCopy(lastVertices, 0, deform, 0, vertexCount);
          }
        } else {
          switch (blend) {
            case 0 /* setup */: {
              let vertexAttachment2 = slotAttachment;
              if (vertexAttachment2.bones == null) {
                let setupVertices = vertexAttachment2.vertices;
                for (let i2 = 0; i2 < vertexCount; i2++) {
                  let setup = setupVertices[i2];
                  deform[i2] = setup + (lastVertices[i2] - setup) * alpha;
                }
              } else {
                for (let i2 = 0; i2 < vertexCount; i2++)
                  deform[i2] = lastVertices[i2] * alpha;
              }
              break;
            }
            case 1 /* first */:
            case 2 /* replace */:
              for (let i2 = 0; i2 < vertexCount; i2++)
                deform[i2] += (lastVertices[i2] - deform[i2]) * alpha;
              break;
            case 3 /* add */:
              let vertexAttachment = slotAttachment;
              if (vertexAttachment.bones == null) {
                let setupVertices = vertexAttachment.vertices;
                for (let i2 = 0; i2 < vertexCount; i2++) {
                  deform[i2] += (lastVertices[i2] - setupVertices[i2]) * alpha;
                }
              } else {
                for (let i2 = 0; i2 < vertexCount; i2++)
                  deform[i2] += lastVertices[i2] * alpha;
              }
          }
        }
        return;
      }
      let frame = Animation.binarySearch(frames, time);
      let prevVertices = frameVertices[frame - 1];
      let nextVertices = frameVertices[frame];
      let frameTime = frames[frame];
      let percent = this.getCurvePercent(frame - 1, 1 - (time - frameTime) / (frames[frame - 1] - frameTime));
      if (alpha == 1) {
        if (blend == 3 /* add */) {
          let vertexAttachment = slotAttachment;
          if (vertexAttachment.bones == null) {
            let setupVertices = vertexAttachment.vertices;
            for (let i2 = 0; i2 < vertexCount; i2++) {
              let prev = prevVertices[i2];
              deform[i2] += prev + (nextVertices[i2] - prev) * percent - setupVertices[i2];
            }
          } else {
            for (let i2 = 0; i2 < vertexCount; i2++) {
              let prev = prevVertices[i2];
              deform[i2] += prev + (nextVertices[i2] - prev) * percent;
            }
          }
        } else {
          for (let i2 = 0; i2 < vertexCount; i2++) {
            let prev = prevVertices[i2];
            deform[i2] = prev + (nextVertices[i2] - prev) * percent;
          }
        }
      } else {
        switch (blend) {
          case 0 /* setup */: {
            let vertexAttachment2 = slotAttachment;
            if (vertexAttachment2.bones == null) {
              let setupVertices = vertexAttachment2.vertices;
              for (let i2 = 0; i2 < vertexCount; i2++) {
                let prev = prevVertices[i2], setup = setupVertices[i2];
                deform[i2] = setup + (prev + (nextVertices[i2] - prev) * percent - setup) * alpha;
              }
            } else {
              for (let i2 = 0; i2 < vertexCount; i2++) {
                let prev = prevVertices[i2];
                deform[i2] = (prev + (nextVertices[i2] - prev) * percent) * alpha;
              }
            }
            break;
          }
          case 1 /* first */:
          case 2 /* replace */:
            for (let i2 = 0; i2 < vertexCount; i2++) {
              let prev = prevVertices[i2];
              deform[i2] += (prev + (nextVertices[i2] - prev) * percent - deform[i2]) * alpha;
            }
            break;
          case 3 /* add */:
            let vertexAttachment = slotAttachment;
            if (vertexAttachment.bones == null) {
              let setupVertices = vertexAttachment.vertices;
              for (let i2 = 0; i2 < vertexCount; i2++) {
                let prev = prevVertices[i2];
                deform[i2] += (prev + (nextVertices[i2] - prev) * percent - setupVertices[i2]) * alpha;
              }
            } else {
              for (let i2 = 0; i2 < vertexCount; i2++) {
                let prev = prevVertices[i2];
                deform[i2] += (prev + (nextVertices[i2] - prev) * percent) * alpha;
              }
            }
        }
      }
    }
  }
  spine2.DeformTimeline = DeformTimeline;
  class EventTimeline {
    constructor(frameCount) {
      /** The time in seconds for each key frame. */
      __publicField(this, "frames");
      // time, ...
      /** The event for each key frame. */
      __publicField(this, "events");
      this.frames = spine2.Utils.newFloatArray(frameCount);
      this.events = new Array(frameCount);
    }
    getPropertyId() {
      return 7 /* event */ << 24;
    }
    /** The number of key frames for this timeline. */
    getFrameCount() {
      return this.frames.length;
    }
    /** Sets the time in seconds and the event for the specified key frame. */
    setFrame(frameIndex, event) {
      this.frames[frameIndex] = event.time;
      this.events[frameIndex] = event;
    }
    /** Fires events for frames > `lastTime` and <= `time`. */
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      if (firedEvents == null) return;
      let frames = this.frames;
      let frameCount = this.frames.length;
      if (lastTime > time) {
        this.apply(skeleton, lastTime, Number.MAX_VALUE, firedEvents, alpha, blend, direction);
        lastTime = -1;
      } else if (lastTime >= frames[frameCount - 1])
        return;
      if (time < frames[0]) return;
      let frame = 0;
      if (lastTime < frames[0])
        frame = 0;
      else {
        frame = Animation.binarySearch(frames, lastTime);
        let frameTime = frames[frame];
        while (frame > 0) {
          if (frames[frame - 1] != frameTime) break;
          frame--;
        }
      }
      for (; frame < frameCount && time >= frames[frame]; frame++)
        firedEvents.push(this.events[frame]);
    }
  }
  spine2.EventTimeline = EventTimeline;
  class DrawOrderTimeline {
    constructor(frameCount) {
      /** The time in seconds for each key frame. */
      __publicField(this, "frames");
      // time, ...
      /** The draw order for each key frame. See {@link #setFrame(int, float, int[])}. */
      __publicField(this, "drawOrders");
      this.frames = spine2.Utils.newFloatArray(frameCount);
      this.drawOrders = new Array(frameCount);
    }
    getPropertyId() {
      return 8 /* drawOrder */ << 24;
    }
    /** The number of key frames for this timeline. */
    getFrameCount() {
      return this.frames.length;
    }
    /** Sets the time in seconds and the draw order for the specified key frame.
     * @param drawOrder For each slot in {@link Skeleton#slots}, the index of the new draw order. May be null to use setup pose
     *           draw order. */
    setFrame(frameIndex, time, drawOrder) {
      this.frames[frameIndex] = time;
      this.drawOrders[frameIndex] = drawOrder;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let drawOrder = skeleton.drawOrder;
      let slots = skeleton.slots;
      if (direction == 1 /* mixOut */) {
        if (blend == 0 /* setup */) spine2.Utils.arrayCopy(skeleton.slots, 0, skeleton.drawOrder, 0, skeleton.slots.length);
        return;
      }
      let frames = this.frames;
      if (time < frames[0]) {
        if (blend == 0 /* setup */ || blend == 1 /* first */) spine2.Utils.arrayCopy(skeleton.slots, 0, skeleton.drawOrder, 0, skeleton.slots.length);
        return;
      }
      let frame = 0;
      if (time >= frames[frames.length - 1])
        frame = frames.length - 1;
      else
        frame = Animation.binarySearch(frames, time) - 1;
      let drawOrderToSetupIndex = this.drawOrders[frame];
      if (drawOrderToSetupIndex == null)
        spine2.Utils.arrayCopy(slots, 0, drawOrder, 0, slots.length);
      else {
        for (let i = 0, n = drawOrderToSetupIndex.length; i < n; i++)
          drawOrder[i] = slots[drawOrderToSetupIndex[i]];
      }
    }
  }
  spine2.DrawOrderTimeline = DrawOrderTimeline;
  const _IkConstraintTimeline = class _IkConstraintTimeline extends CurveTimeline {
    // time, mix, softness, bendDirection, compress, stretch, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the IK constraint slot in {@link Skeleton#ikConstraints} that will be changed. */
      __publicField(this, "ikConstraintIndex");
      /** The time in seconds, mix, softness, bend direction, compress, and stretch for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _IkConstraintTimeline.ENTRIES);
    }
    getPropertyId() {
      return (9 /* ikConstraint */ << 24) + this.ikConstraintIndex;
    }
    /** Sets the time in seconds, mix, softness, bend direction, compress, and stretch for the specified key frame. */
    setFrame(frameIndex, time, mix, softness, bendDirection, compress, stretch) {
      frameIndex *= _IkConstraintTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _IkConstraintTimeline.MIX] = mix;
      this.frames[frameIndex + _IkConstraintTimeline.SOFTNESS] = softness;
      this.frames[frameIndex + _IkConstraintTimeline.BEND_DIRECTION] = bendDirection;
      this.frames[frameIndex + _IkConstraintTimeline.COMPRESS] = compress ? 1 : 0;
      this.frames[frameIndex + _IkConstraintTimeline.STRETCH] = stretch ? 1 : 0;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let frames = this.frames;
      let constraint = skeleton.ikConstraints[this.ikConstraintIndex];
      if (!constraint.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            constraint.mix = constraint.data.mix;
            constraint.softness = constraint.data.softness;
            constraint.bendDirection = constraint.data.bendDirection;
            constraint.compress = constraint.data.compress;
            constraint.stretch = constraint.data.stretch;
            return;
          case 1 /* first */:
            constraint.mix += (constraint.data.mix - constraint.mix) * alpha;
            constraint.softness += (constraint.data.softness - constraint.softness) * alpha;
            constraint.bendDirection = constraint.data.bendDirection;
            constraint.compress = constraint.data.compress;
            constraint.stretch = constraint.data.stretch;
        }
        return;
      }
      if (time >= frames[frames.length - _IkConstraintTimeline.ENTRIES]) {
        if (blend == 0 /* setup */) {
          constraint.mix = constraint.data.mix + (frames[frames.length + _IkConstraintTimeline.PREV_MIX] - constraint.data.mix) * alpha;
          constraint.softness = constraint.data.softness + (frames[frames.length + _IkConstraintTimeline.PREV_SOFTNESS] - constraint.data.softness) * alpha;
          if (direction == 1 /* mixOut */) {
            constraint.bendDirection = constraint.data.bendDirection;
            constraint.compress = constraint.data.compress;
            constraint.stretch = constraint.data.stretch;
          } else {
            constraint.bendDirection = frames[frames.length + _IkConstraintTimeline.PREV_BEND_DIRECTION];
            constraint.compress = frames[frames.length + _IkConstraintTimeline.PREV_COMPRESS] != 0;
            constraint.stretch = frames[frames.length + _IkConstraintTimeline.PREV_STRETCH] != 0;
          }
        } else {
          constraint.mix += (frames[frames.length + _IkConstraintTimeline.PREV_MIX] - constraint.mix) * alpha;
          constraint.softness += (frames[frames.length + _IkConstraintTimeline.PREV_SOFTNESS] - constraint.softness) * alpha;
          if (direction == 0 /* mixIn */) {
            constraint.bendDirection = frames[frames.length + _IkConstraintTimeline.PREV_BEND_DIRECTION];
            constraint.compress = frames[frames.length + _IkConstraintTimeline.PREV_COMPRESS] != 0;
            constraint.stretch = frames[frames.length + _IkConstraintTimeline.PREV_STRETCH] != 0;
          }
        }
        return;
      }
      let frame = Animation.binarySearch(frames, time, _IkConstraintTimeline.ENTRIES);
      let mix = frames[frame + _IkConstraintTimeline.PREV_MIX];
      let softness = frames[frame + _IkConstraintTimeline.PREV_SOFTNESS];
      let frameTime = frames[frame];
      let percent = this.getCurvePercent(
        frame / _IkConstraintTimeline.ENTRIES - 1,
        1 - (time - frameTime) / (frames[frame + _IkConstraintTimeline.PREV_TIME] - frameTime)
      );
      if (blend == 0 /* setup */) {
        constraint.mix = constraint.data.mix + (mix + (frames[frame + _IkConstraintTimeline.MIX] - mix) * percent - constraint.data.mix) * alpha;
        constraint.softness = constraint.data.softness + (softness + (frames[frame + _IkConstraintTimeline.SOFTNESS] - softness) * percent - constraint.data.softness) * alpha;
        if (direction == 1 /* mixOut */) {
          constraint.bendDirection = constraint.data.bendDirection;
          constraint.compress = constraint.data.compress;
          constraint.stretch = constraint.data.stretch;
        } else {
          constraint.bendDirection = frames[frame + _IkConstraintTimeline.PREV_BEND_DIRECTION];
          constraint.compress = frames[frame + _IkConstraintTimeline.PREV_COMPRESS] != 0;
          constraint.stretch = frames[frame + _IkConstraintTimeline.PREV_STRETCH] != 0;
        }
      } else {
        constraint.mix += (mix + (frames[frame + _IkConstraintTimeline.MIX] - mix) * percent - constraint.mix) * alpha;
        constraint.softness += (softness + (frames[frame + _IkConstraintTimeline.SOFTNESS] - softness) * percent - constraint.softness) * alpha;
        if (direction == 0 /* mixIn */) {
          constraint.bendDirection = frames[frame + _IkConstraintTimeline.PREV_BEND_DIRECTION];
          constraint.compress = frames[frame + _IkConstraintTimeline.PREV_COMPRESS] != 0;
          constraint.stretch = frames[frame + _IkConstraintTimeline.PREV_STRETCH] != 0;
        }
      }
    }
  };
  __publicField(_IkConstraintTimeline, "ENTRIES", 6);
  __publicField(_IkConstraintTimeline, "PREV_TIME", -6);
  __publicField(_IkConstraintTimeline, "PREV_MIX", -5);
  __publicField(_IkConstraintTimeline, "PREV_SOFTNESS", -4);
  __publicField(_IkConstraintTimeline, "PREV_BEND_DIRECTION", -3);
  __publicField(_IkConstraintTimeline, "PREV_COMPRESS", -2);
  __publicField(_IkConstraintTimeline, "PREV_STRETCH", -1);
  __publicField(_IkConstraintTimeline, "MIX", 1);
  __publicField(_IkConstraintTimeline, "SOFTNESS", 2);
  __publicField(_IkConstraintTimeline, "BEND_DIRECTION", 3);
  __publicField(_IkConstraintTimeline, "COMPRESS", 4);
  __publicField(_IkConstraintTimeline, "STRETCH", 5);
  let IkConstraintTimeline = _IkConstraintTimeline;
  spine2.IkConstraintTimeline = _IkConstraintTimeline;
  const _TransformConstraintTimeline = class _TransformConstraintTimeline extends CurveTimeline {
    // time, rotate mix, translate mix, scale mix, shear mix, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the transform constraint slot in {@link Skeleton#transformConstraints} that will be changed. */
      __publicField(this, "transformConstraintIndex");
      /** The time in seconds, rotate mix, translate mix, scale mix, and shear mix for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _TransformConstraintTimeline.ENTRIES);
    }
    getPropertyId() {
      return (10 /* transformConstraint */ << 24) + this.transformConstraintIndex;
    }
    /** The time in seconds, rotate mix, translate mix, scale mix, and shear mix for the specified key frame. */
    setFrame(frameIndex, time, rotateMix, translateMix, scaleMix, shearMix) {
      frameIndex *= _TransformConstraintTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _TransformConstraintTimeline.ROTATE] = rotateMix;
      this.frames[frameIndex + _TransformConstraintTimeline.TRANSLATE] = translateMix;
      this.frames[frameIndex + _TransformConstraintTimeline.SCALE] = scaleMix;
      this.frames[frameIndex + _TransformConstraintTimeline.SHEAR] = shearMix;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let frames = this.frames;
      let constraint = skeleton.transformConstraints[this.transformConstraintIndex];
      if (!constraint.active) return;
      if (time < frames[0]) {
        let data = constraint.data;
        switch (blend) {
          case 0 /* setup */:
            constraint.rotateMix = data.rotateMix;
            constraint.translateMix = data.translateMix;
            constraint.scaleMix = data.scaleMix;
            constraint.shearMix = data.shearMix;
            return;
          case 1 /* first */:
            constraint.rotateMix += (data.rotateMix - constraint.rotateMix) * alpha;
            constraint.translateMix += (data.translateMix - constraint.translateMix) * alpha;
            constraint.scaleMix += (data.scaleMix - constraint.scaleMix) * alpha;
            constraint.shearMix += (data.shearMix - constraint.shearMix) * alpha;
        }
        return;
      }
      let rotate = 0, translate = 0, scale = 0, shear = 0;
      if (time >= frames[frames.length - _TransformConstraintTimeline.ENTRIES]) {
        let i = frames.length;
        rotate = frames[i + _TransformConstraintTimeline.PREV_ROTATE];
        translate = frames[i + _TransformConstraintTimeline.PREV_TRANSLATE];
        scale = frames[i + _TransformConstraintTimeline.PREV_SCALE];
        shear = frames[i + _TransformConstraintTimeline.PREV_SHEAR];
      } else {
        let frame = Animation.binarySearch(frames, time, _TransformConstraintTimeline.ENTRIES);
        rotate = frames[frame + _TransformConstraintTimeline.PREV_ROTATE];
        translate = frames[frame + _TransformConstraintTimeline.PREV_TRANSLATE];
        scale = frames[frame + _TransformConstraintTimeline.PREV_SCALE];
        shear = frames[frame + _TransformConstraintTimeline.PREV_SHEAR];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / _TransformConstraintTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + _TransformConstraintTimeline.PREV_TIME] - frameTime)
        );
        rotate += (frames[frame + _TransformConstraintTimeline.ROTATE] - rotate) * percent;
        translate += (frames[frame + _TransformConstraintTimeline.TRANSLATE] - translate) * percent;
        scale += (frames[frame + _TransformConstraintTimeline.SCALE] - scale) * percent;
        shear += (frames[frame + _TransformConstraintTimeline.SHEAR] - shear) * percent;
      }
      if (blend == 0 /* setup */) {
        let data = constraint.data;
        constraint.rotateMix = data.rotateMix + (rotate - data.rotateMix) * alpha;
        constraint.translateMix = data.translateMix + (translate - data.translateMix) * alpha;
        constraint.scaleMix = data.scaleMix + (scale - data.scaleMix) * alpha;
        constraint.shearMix = data.shearMix + (shear - data.shearMix) * alpha;
      } else {
        constraint.rotateMix += (rotate - constraint.rotateMix) * alpha;
        constraint.translateMix += (translate - constraint.translateMix) * alpha;
        constraint.scaleMix += (scale - constraint.scaleMix) * alpha;
        constraint.shearMix += (shear - constraint.shearMix) * alpha;
      }
    }
  };
  __publicField(_TransformConstraintTimeline, "ENTRIES", 5);
  __publicField(_TransformConstraintTimeline, "PREV_TIME", -5);
  __publicField(_TransformConstraintTimeline, "PREV_ROTATE", -4);
  __publicField(_TransformConstraintTimeline, "PREV_TRANSLATE", -3);
  __publicField(_TransformConstraintTimeline, "PREV_SCALE", -2);
  __publicField(_TransformConstraintTimeline, "PREV_SHEAR", -1);
  __publicField(_TransformConstraintTimeline, "ROTATE", 1);
  __publicField(_TransformConstraintTimeline, "TRANSLATE", 2);
  __publicField(_TransformConstraintTimeline, "SCALE", 3);
  __publicField(_TransformConstraintTimeline, "SHEAR", 4);
  let TransformConstraintTimeline = _TransformConstraintTimeline;
  spine2.TransformConstraintTimeline = _TransformConstraintTimeline;
  const _PathConstraintPositionTimeline = class _PathConstraintPositionTimeline extends CurveTimeline {
    // time, position, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the path constraint slot in {@link Skeleton#pathConstraints} that will be changed. */
      __publicField(this, "pathConstraintIndex");
      /** The time in seconds and path constraint position for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _PathConstraintPositionTimeline.ENTRIES);
    }
    getPropertyId() {
      return (11 /* pathConstraintPosition */ << 24) + this.pathConstraintIndex;
    }
    /** Sets the time in seconds and path constraint position for the specified key frame. */
    setFrame(frameIndex, time, value) {
      frameIndex *= _PathConstraintPositionTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _PathConstraintPositionTimeline.VALUE] = value;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let frames = this.frames;
      let constraint = skeleton.pathConstraints[this.pathConstraintIndex];
      if (!constraint.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            constraint.position = constraint.data.position;
            return;
          case 1 /* first */:
            constraint.position += (constraint.data.position - constraint.position) * alpha;
        }
        return;
      }
      let position = 0;
      if (time >= frames[frames.length - _PathConstraintPositionTimeline.ENTRIES])
        position = frames[frames.length + _PathConstraintPositionTimeline.PREV_VALUE];
      else {
        let frame = Animation.binarySearch(frames, time, _PathConstraintPositionTimeline.ENTRIES);
        position = frames[frame + _PathConstraintPositionTimeline.PREV_VALUE];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / _PathConstraintPositionTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + _PathConstraintPositionTimeline.PREV_TIME] - frameTime)
        );
        position += (frames[frame + _PathConstraintPositionTimeline.VALUE] - position) * percent;
      }
      if (blend == 0 /* setup */)
        constraint.position = constraint.data.position + (position - constraint.data.position) * alpha;
      else
        constraint.position += (position - constraint.position) * alpha;
    }
  };
  __publicField(_PathConstraintPositionTimeline, "ENTRIES", 2);
  __publicField(_PathConstraintPositionTimeline, "PREV_TIME", -2);
  __publicField(_PathConstraintPositionTimeline, "PREV_VALUE", -1);
  __publicField(_PathConstraintPositionTimeline, "VALUE", 1);
  let PathConstraintPositionTimeline = _PathConstraintPositionTimeline;
  spine2.PathConstraintPositionTimeline = _PathConstraintPositionTimeline;
  class PathConstraintSpacingTimeline extends PathConstraintPositionTimeline {
    constructor(frameCount) {
      super(frameCount);
    }
    getPropertyId() {
      return (12 /* pathConstraintSpacing */ << 24) + this.pathConstraintIndex;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let frames = this.frames;
      let constraint = skeleton.pathConstraints[this.pathConstraintIndex];
      if (!constraint.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            constraint.spacing = constraint.data.spacing;
            return;
          case 1 /* first */:
            constraint.spacing += (constraint.data.spacing - constraint.spacing) * alpha;
        }
        return;
      }
      let spacing = 0;
      if (time >= frames[frames.length - PathConstraintSpacingTimeline.ENTRIES])
        spacing = frames[frames.length + PathConstraintSpacingTimeline.PREV_VALUE];
      else {
        let frame = Animation.binarySearch(frames, time, PathConstraintSpacingTimeline.ENTRIES);
        spacing = frames[frame + PathConstraintSpacingTimeline.PREV_VALUE];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / PathConstraintSpacingTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + PathConstraintSpacingTimeline.PREV_TIME] - frameTime)
        );
        spacing += (frames[frame + PathConstraintSpacingTimeline.VALUE] - spacing) * percent;
      }
      if (blend == 0 /* setup */)
        constraint.spacing = constraint.data.spacing + (spacing - constraint.data.spacing) * alpha;
      else
        constraint.spacing += (spacing - constraint.spacing) * alpha;
    }
  }
  spine2.PathConstraintSpacingTimeline = PathConstraintSpacingTimeline;
  const _PathConstraintMixTimeline = class _PathConstraintMixTimeline extends CurveTimeline {
    // time, rotate mix, translate mix, ...
    constructor(frameCount) {
      super(frameCount);
      /** The index of the path constraint slot in {@link Skeleton#getPathConstraints()} that will be changed. */
      __publicField(this, "pathConstraintIndex");
      /** The time in seconds, rotate mix, and translate mix for each key frame. */
      __publicField(this, "frames");
      this.frames = spine2.Utils.newFloatArray(frameCount * _PathConstraintMixTimeline.ENTRIES);
    }
    getPropertyId() {
      return (13 /* pathConstraintMix */ << 24) + this.pathConstraintIndex;
    }
    /** The time in seconds, rotate mix, and translate mix for the specified key frame. */
    setFrame(frameIndex, time, rotateMix, translateMix) {
      frameIndex *= _PathConstraintMixTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + _PathConstraintMixTimeline.ROTATE] = rotateMix;
      this.frames[frameIndex + _PathConstraintMixTimeline.TRANSLATE] = translateMix;
    }
    apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
      let frames = this.frames;
      let constraint = skeleton.pathConstraints[this.pathConstraintIndex];
      if (!constraint.active) return;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            constraint.rotateMix = constraint.data.rotateMix;
            constraint.translateMix = constraint.data.translateMix;
            return;
          case 1 /* first */:
            constraint.rotateMix += (constraint.data.rotateMix - constraint.rotateMix) * alpha;
            constraint.translateMix += (constraint.data.translateMix - constraint.translateMix) * alpha;
        }
        return;
      }
      let rotate = 0, translate = 0;
      if (time >= frames[frames.length - _PathConstraintMixTimeline.ENTRIES]) {
        rotate = frames[frames.length + _PathConstraintMixTimeline.PREV_ROTATE];
        translate = frames[frames.length + _PathConstraintMixTimeline.PREV_TRANSLATE];
      } else {
        let frame = Animation.binarySearch(frames, time, _PathConstraintMixTimeline.ENTRIES);
        rotate = frames[frame + _PathConstraintMixTimeline.PREV_ROTATE];
        translate = frames[frame + _PathConstraintMixTimeline.PREV_TRANSLATE];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / _PathConstraintMixTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + _PathConstraintMixTimeline.PREV_TIME] - frameTime)
        );
        rotate += (frames[frame + _PathConstraintMixTimeline.ROTATE] - rotate) * percent;
        translate += (frames[frame + _PathConstraintMixTimeline.TRANSLATE] - translate) * percent;
      }
      if (blend == 0 /* setup */) {
        constraint.rotateMix = constraint.data.rotateMix + (rotate - constraint.data.rotateMix) * alpha;
        constraint.translateMix = constraint.data.translateMix + (translate - constraint.data.translateMix) * alpha;
      } else {
        constraint.rotateMix += (rotate - constraint.rotateMix) * alpha;
        constraint.translateMix += (translate - constraint.translateMix) * alpha;
      }
    }
  };
  __publicField(_PathConstraintMixTimeline, "ENTRIES", 3);
  __publicField(_PathConstraintMixTimeline, "PREV_TIME", -3);
  __publicField(_PathConstraintMixTimeline, "PREV_ROTATE", -2);
  __publicField(_PathConstraintMixTimeline, "PREV_TRANSLATE", -1);
  __publicField(_PathConstraintMixTimeline, "ROTATE", 1);
  __publicField(_PathConstraintMixTimeline, "TRANSLATE", 2);
  let PathConstraintMixTimeline = _PathConstraintMixTimeline;
  spine2.PathConstraintMixTimeline = _PathConstraintMixTimeline;
})(spine || (spine = {}));
((spine2) => {
  const _AnimationState = class _AnimationState {
    constructor(data) {
      /** The AnimationStateData to look up mix durations. */
      __publicField(this, "data");
      /** The list of tracks that currently have animations, which may contain null entries. */
      __publicField(this, "tracks", new Array());
      /** Multiplier for the delta time when the animation state is updated, causing time for all animations and mixes to play slower
       * or faster. Defaults to 1.
       *
       * See TrackEntry {@link TrackEntry#timeScale} for affecting a single animation. */
      __publicField(this, "timeScale", 1);
      __publicField(this, "unkeyedState", 0);
      __publicField(this, "events", new Array());
      __publicField(this, "listeners", new Array());
      __publicField(this, "queue", new EventQueue(this));
      __publicField(this, "propertyIDs", new spine2.IntSet());
      __publicField(this, "animationsChanged", false);
      __publicField(this, "trackEntryPool", new spine2.Pool(() => new TrackEntry()));
      this.data = data;
    }
    /** Increments each track entry {@link TrackEntry#trackTime()}, setting queued animations as current if needed. */
    update(delta) {
      delta *= this.timeScale;
      let tracks = this.tracks;
      for (let i = 0, n = tracks.length; i < n; i++) {
        let current = tracks[i];
        if (current == null) continue;
        current.animationLast = current.nextAnimationLast;
        current.trackLast = current.nextTrackLast;
        let currentDelta = delta * current.timeScale;
        if (current.delay > 0) {
          current.delay -= currentDelta;
          if (current.delay > 0) continue;
          currentDelta = -current.delay;
          current.delay = 0;
        }
        let next = current.next;
        if (next != null) {
          let nextTime = current.trackLast - next.delay;
          if (nextTime >= 0) {
            next.delay = 0;
            next.trackTime += current.timeScale == 0 ? 0 : (nextTime / current.timeScale + delta) * next.timeScale;
            current.trackTime += currentDelta;
            this.setCurrent(i, next, true);
            while (next.mixingFrom != null) {
              next.mixTime += delta;
              next = next.mixingFrom;
            }
            continue;
          }
        } else if (current.trackLast >= current.trackEnd && current.mixingFrom == null) {
          tracks[i] = null;
          this.queue.end(current);
          this.disposeNext(current);
          continue;
        }
        if (current.mixingFrom != null && this.updateMixingFrom(current, delta)) {
          let from = current.mixingFrom;
          current.mixingFrom = null;
          if (from != null) from.mixingTo = null;
          while (from != null) {
            this.queue.end(from);
            from = from.mixingFrom;
          }
        }
        current.trackTime += currentDelta;
      }
      this.queue.drain();
    }
    /** Returns true when all mixing from entries are complete. */
    updateMixingFrom(to, delta) {
      let from = to.mixingFrom;
      if (from == null) return true;
      let finished = this.updateMixingFrom(from, delta);
      from.animationLast = from.nextAnimationLast;
      from.trackLast = from.nextTrackLast;
      if (to.mixTime > 0 && to.mixTime >= to.mixDuration) {
        if (from.totalAlpha == 0 || to.mixDuration == 0) {
          to.mixingFrom = from.mixingFrom;
          if (from.mixingFrom != null) from.mixingFrom.mixingTo = to;
          to.interruptAlpha = from.interruptAlpha;
          this.queue.end(from);
        }
        return finished;
      }
      from.trackTime += delta * from.timeScale;
      to.mixTime += delta;
      return false;
    }
    /** Poses the skeleton using the track entry animations. There are no side effects other than invoking listeners, so the
     * animation state can be applied to multiple skeletons to pose them identically.
     * @returns True if any animations were applied. */
    apply(skeleton) {
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      if (this.animationsChanged) this._animationsChanged();
      let events = this.events;
      let tracks = this.tracks;
      let applied = false;
      for (let i2 = 0, n2 = tracks.length; i2 < n2; i2++) {
        let current = tracks[i2];
        if (current == null || current.delay > 0) continue;
        applied = true;
        let blend = i2 == 0 ? 1 /* first */ : current.mixBlend;
        let mix = current.alpha;
        if (current.mixingFrom != null)
          mix *= this.applyMixingFrom(current, skeleton, blend);
        else if (current.trackTime >= current.trackEnd && current.next == null)
          mix = 0;
        let animationLast = current.animationLast, animationTime = current.getAnimationTime();
        let timelineCount = current.animation.timelines.length;
        let timelines = current.animation.timelines;
        if (i2 == 0 && mix == 1 || blend == 3 /* add */) {
          for (let ii = 0; ii < timelineCount; ii++) {
            spine2.Utils.webkit602BugfixHelper(mix, blend);
            var timeline = timelines[ii];
            if (timeline instanceof spine2.AttachmentTimeline)
              this.applyAttachmentTimeline(timeline, skeleton, animationTime, blend, true);
            else
              timeline.apply(skeleton, animationLast, animationTime, events, mix, blend, 0 /* mixIn */);
          }
        } else {
          let timelineMode = current.timelineMode;
          let firstFrame = current.timelinesRotation.length == 0;
          if (firstFrame) spine2.Utils.setArraySize(current.timelinesRotation, timelineCount << 1, null);
          let timelinesRotation = current.timelinesRotation;
          for (let ii = 0; ii < timelineCount; ii++) {
            let timeline2 = timelines[ii];
            let timelineBlend = timelineMode[ii] == _AnimationState.SUBSEQUENT ? blend : 0 /* setup */;
            if (timeline2 instanceof spine2.RotateTimeline) {
              this.applyRotateTimeline(timeline2, skeleton, animationTime, mix, timelineBlend, timelinesRotation, ii << 1, firstFrame);
            } else if (timeline2 instanceof spine2.AttachmentTimeline) {
              this.applyAttachmentTimeline(timeline2, skeleton, animationTime, blend, true);
            } else {
              spine2.Utils.webkit602BugfixHelper(mix, blend);
              timeline2.apply(skeleton, animationLast, animationTime, events, mix, timelineBlend, 0 /* mixIn */);
            }
          }
        }
        this.queueEvents(current, animationTime);
        events.length = 0;
        current.nextAnimationLast = animationTime;
        current.nextTrackLast = current.trackTime;
      }
      var setupState = this.unkeyedState + _AnimationState.SETUP;
      var slots = skeleton.slots;
      for (var i = 0, n = skeleton.slots.length; i < n; i++) {
        var slot = slots[i];
        if (slot.attachmentState == setupState) {
          var attachmentName = slot.data.attachmentName;
          slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(slot.data.index, attachmentName));
        }
      }
      this.unkeyedState += 2;
      this.queue.drain();
      return applied;
    }
    applyMixingFrom(to, skeleton, blend) {
      let from = to.mixingFrom;
      if (from.mixingFrom != null) this.applyMixingFrom(from, skeleton, blend);
      let mix = 0;
      if (to.mixDuration == 0) {
        mix = 1;
        if (blend == 1 /* first */) blend = 0 /* setup */;
      } else {
        mix = to.mixTime / to.mixDuration;
        if (mix > 1) mix = 1;
        if (blend != 1 /* first */) blend = from.mixBlend;
      }
      let events = mix < from.eventThreshold ? this.events : null;
      let attachments = mix < from.attachmentThreshold, drawOrder = mix < from.drawOrderThreshold;
      let animationLast = from.animationLast, animationTime = from.getAnimationTime();
      let timelineCount = from.animation.timelines.length;
      let timelines = from.animation.timelines;
      let alphaHold = from.alpha * to.interruptAlpha, alphaMix = alphaHold * (1 - mix);
      if (blend == 3 /* add */) {
        for (let i = 0; i < timelineCount; i++)
          timelines[i].apply(skeleton, animationLast, animationTime, events, alphaMix, blend, 1 /* mixOut */);
      } else {
        let timelineMode = from.timelineMode;
        let timelineHoldMix = from.timelineHoldMix;
        let firstFrame = from.timelinesRotation.length == 0;
        if (firstFrame) spine2.Utils.setArraySize(from.timelinesRotation, timelineCount << 1, null);
        let timelinesRotation = from.timelinesRotation;
        from.totalAlpha = 0;
        for (let i = 0; i < timelineCount; i++) {
          let timeline = timelines[i];
          let direction = 1 /* mixOut */;
          let timelineBlend;
          let alpha = 0;
          switch (timelineMode[i]) {
            case _AnimationState.SUBSEQUENT:
              if (!drawOrder && timeline instanceof spine2.DrawOrderTimeline) continue;
              timelineBlend = blend;
              alpha = alphaMix;
              break;
            case _AnimationState.FIRST:
              timelineBlend = 0 /* setup */;
              alpha = alphaMix;
              break;
            case _AnimationState.HOLD_SUBSEQUENT:
              timelineBlend = blend;
              alpha = alphaHold;
              break;
            case _AnimationState.HOLD_FIRST:
              timelineBlend = 0 /* setup */;
              alpha = alphaHold;
              break;
            default:
              timelineBlend = 0 /* setup */;
              let holdMix = timelineHoldMix[i];
              alpha = alphaHold * Math.max(0, 1 - holdMix.mixTime / holdMix.mixDuration);
              break;
          }
          from.totalAlpha += alpha;
          if (timeline instanceof spine2.RotateTimeline)
            this.applyRotateTimeline(timeline, skeleton, animationTime, alpha, timelineBlend, timelinesRotation, i << 1, firstFrame);
          else if (timeline instanceof spine2.AttachmentTimeline)
            this.applyAttachmentTimeline(timeline, skeleton, animationTime, timelineBlend, attachments);
          else {
            spine2.Utils.webkit602BugfixHelper(alpha, blend);
            if (drawOrder && timeline instanceof spine2.DrawOrderTimeline && timelineBlend == 0 /* setup */)
              direction = 0 /* mixIn */;
            timeline.apply(skeleton, animationLast, animationTime, events, alpha, timelineBlend, direction);
          }
        }
      }
      if (to.mixDuration > 0) this.queueEvents(from, animationTime);
      this.events.length = 0;
      from.nextAnimationLast = animationTime;
      from.nextTrackLast = from.trackTime;
      return mix;
    }
    applyAttachmentTimeline(timeline, skeleton, time, blend, attachments) {
      var slot = skeleton.slots[timeline.slotIndex];
      if (!slot.bone.active) return;
      var frames = timeline.frames;
      if (time < frames[0]) {
        if (blend == 0 /* setup */ || blend == 1 /* first */)
          this.setAttachment(skeleton, slot, slot.data.attachmentName, attachments);
      } else {
        var frameIndex;
        if (time >= frames[frames.length - 1])
          frameIndex = frames.length - 1;
        else
          frameIndex = spine2.Animation.binarySearch(frames, time) - 1;
        this.setAttachment(skeleton, slot, timeline.attachmentNames[frameIndex], attachments);
      }
      if (slot.attachmentState <= this.unkeyedState) slot.attachmentState = this.unkeyedState + _AnimationState.SETUP;
    }
    setAttachment(skeleton, slot, attachmentName, attachments) {
      slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(slot.data.index, attachmentName));
      if (attachments) slot.attachmentState = this.unkeyedState + _AnimationState.CURRENT;
    }
    applyRotateTimeline(timeline, skeleton, time, alpha, blend, timelinesRotation, i, firstFrame) {
      if (firstFrame) timelinesRotation[i] = 0;
      if (alpha == 1) {
        timeline.apply(skeleton, 0, time, null, 1, blend, 0 /* mixIn */);
        return;
      }
      let rotateTimeline = timeline;
      let frames = rotateTimeline.frames;
      let bone = skeleton.bones[rotateTimeline.boneIndex];
      if (!bone.active) return;
      let r1 = 0, r2 = 0;
      if (time < frames[0]) {
        switch (blend) {
          case 0 /* setup */:
            bone.rotation = bone.data.rotation;
          default:
            return;
          case 1 /* first */:
            r1 = bone.rotation;
            r2 = bone.data.rotation;
        }
      } else {
        r1 = blend == 0 /* setup */ ? bone.data.rotation : bone.rotation;
        if (time >= frames[frames.length - spine2.RotateTimeline.ENTRIES])
          r2 = bone.data.rotation + frames[frames.length + spine2.RotateTimeline.PREV_ROTATION];
        else {
          let frame = spine2.Animation.binarySearch(frames, time, spine2.RotateTimeline.ENTRIES);
          let prevRotation = frames[frame + spine2.RotateTimeline.PREV_ROTATION];
          let frameTime = frames[frame];
          let percent = rotateTimeline.getCurvePercent(
            (frame >> 1) - 1,
            1 - (time - frameTime) / (frames[frame + spine2.RotateTimeline.PREV_TIME] - frameTime)
          );
          r2 = frames[frame + spine2.RotateTimeline.ROTATION] - prevRotation;
          r2 -= (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360;
          r2 = prevRotation + r2 * percent + bone.data.rotation;
          r2 -= (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360;
        }
      }
      let total = 0, diff = r2 - r1;
      diff -= (16384 - (16384.499999999996 - diff / 360 | 0)) * 360;
      if (diff == 0) {
        total = timelinesRotation[i];
      } else {
        let lastTotal = 0, lastDiff = 0;
        if (firstFrame) {
          lastTotal = 0;
          lastDiff = diff;
        } else {
          lastTotal = timelinesRotation[i];
          lastDiff = timelinesRotation[i + 1];
        }
        let current = diff > 0, dir = lastTotal >= 0;
        if (spine2.MathUtils.signum(lastDiff) != spine2.MathUtils.signum(diff) && Math.abs(lastDiff) <= 90) {
          if (Math.abs(lastTotal) > 180) lastTotal += 360 * spine2.MathUtils.signum(lastTotal);
          dir = current;
        }
        total = diff + lastTotal - lastTotal % 360;
        if (dir != current) total += 360 * spine2.MathUtils.signum(lastTotal);
        timelinesRotation[i] = total;
      }
      timelinesRotation[i + 1] = diff;
      r1 += total * alpha;
      bone.rotation = r1 - (16384 - (16384.499999999996 - r1 / 360 | 0)) * 360;
    }
    queueEvents(entry, animationTime) {
      let animationStart = entry.animationStart, animationEnd = entry.animationEnd;
      let duration = animationEnd - animationStart;
      let trackLastWrapped = entry.trackLast % duration;
      let events = this.events;
      let i = 0, n = events.length;
      for (; i < n; i++) {
        let event = events[i];
        if (event.time < trackLastWrapped) break;
        if (event.time > animationEnd) continue;
        this.queue.event(entry, event);
      }
      let complete = false;
      if (entry.loop)
        complete = duration == 0 || trackLastWrapped > entry.trackTime % duration;
      else
        complete = animationTime >= animationEnd && entry.animationLast < animationEnd;
      if (complete) this.queue.complete(entry);
      for (; i < n; i++) {
        let event = events[i];
        if (event.time < animationStart) continue;
        this.queue.event(entry, events[i]);
      }
    }
    /** Removes all animations from all tracks, leaving skeletons in their current pose.
     *
     * It may be desired to use {@link AnimationState#setEmptyAnimation()} to mix the skeletons back to the setup pose,
     * rather than leaving them in their current pose. */
    clearTracks() {
      let oldDrainDisabled = this.queue.drainDisabled;
      this.queue.drainDisabled = true;
      for (let i = 0, n = this.tracks.length; i < n; i++)
        this.clearTrack(i);
      this.tracks.length = 0;
      this.queue.drainDisabled = oldDrainDisabled;
      this.queue.drain();
    }
    /** Removes all animations from the track, leaving skeletons in their current pose.
     *
     * It may be desired to use {@link AnimationState#setEmptyAnimation()} to mix the skeletons back to the setup pose,
     * rather than leaving them in their current pose. */
    clearTrack(trackIndex) {
      if (trackIndex >= this.tracks.length) return;
      let current = this.tracks[trackIndex];
      if (current == null) return;
      this.queue.end(current);
      this.disposeNext(current);
      let entry = current;
      while (true) {
        let from = entry.mixingFrom;
        if (from == null) break;
        this.queue.end(from);
        entry.mixingFrom = null;
        entry.mixingTo = null;
        entry = from;
      }
      this.tracks[current.trackIndex] = null;
      this.queue.drain();
    }
    setCurrent(index, current, interrupt) {
      let from = this.expandToIndex(index);
      this.tracks[index] = current;
      if (from != null) {
        if (interrupt) this.queue.interrupt(from);
        current.mixingFrom = from;
        from.mixingTo = current;
        current.mixTime = 0;
        if (from.mixingFrom != null && from.mixDuration > 0)
          current.interruptAlpha *= Math.min(1, from.mixTime / from.mixDuration);
        from.timelinesRotation.length = 0;
      }
      this.queue.start(current);
    }
    /** Sets an animation by name.
    	*
    	* {@link #setAnimationWith(}. */
    setAnimation(trackIndex, animationName, loop) {
      let animation = this.data.skeletonData.findAnimation(animationName);
      if (animation == null) throw new Error("Animation not found: " + animationName);
      return this.setAnimationWith(trackIndex, animation, loop);
    }
    /** Sets the current animation for a track, discarding any queued animations. If the formerly current track entry was never
     * applied to a skeleton, it is replaced (not mixed from).
     * @param loop If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its
     *           duration. In either case {@link TrackEntry#trackEnd} determines when the track is cleared.
     * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept
     *         after the {@link AnimationStateListener#dispose()} event occurs. */
    setAnimationWith(trackIndex, animation, loop) {
      if (animation == null) throw new Error("animation cannot be null.");
      let interrupt = true;
      let current = this.expandToIndex(trackIndex);
      if (current != null) {
        if (current.nextTrackLast == -1) {
          this.tracks[trackIndex] = current.mixingFrom;
          this.queue.interrupt(current);
          this.queue.end(current);
          this.disposeNext(current);
          current = current.mixingFrom;
          interrupt = false;
        } else
          this.disposeNext(current);
      }
      let entry = this.trackEntry(trackIndex, animation, loop, current);
      this.setCurrent(trackIndex, entry, interrupt);
      this.queue.drain();
      return entry;
    }
    /** Queues an animation by name.
     *
     * See {@link #addAnimationWith()}. */
    addAnimation(trackIndex, animationName, loop, delay) {
      let animation = this.data.skeletonData.findAnimation(animationName);
      if (animation == null) throw new Error("Animation not found: " + animationName);
      return this.addAnimationWith(trackIndex, animation, loop, delay);
    }
    /** Adds an animation to be played after the current or last queued animation for a track. If the track is empty, it is
     * equivalent to calling {@link #setAnimationWith()}.
     * @param delay If > 0, sets {@link TrackEntry#delay}. If <= 0, the delay set is the duration of the previous track entry
     *           minus any mix duration (from the {@link AnimationStateData}) plus the specified `delay` (ie the mix
     *           ends at (`delay` = 0) or before (`delay` < 0) the previous track entry duration). If the
     *           previous entry is looping, its next loop completion is used instead of its duration.
     * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept
     *         after the {@link AnimationStateListener#dispose()} event occurs. */
    addAnimationWith(trackIndex, animation, loop, delay) {
      if (animation == null) throw new Error("animation cannot be null.");
      let last = this.expandToIndex(trackIndex);
      if (last != null) {
        while (last.next != null)
          last = last.next;
      }
      let entry = this.trackEntry(trackIndex, animation, loop, last);
      if (last == null) {
        this.setCurrent(trackIndex, entry, true);
        this.queue.drain();
      } else {
        last.next = entry;
        if (delay <= 0) {
          let duration = last.animationEnd - last.animationStart;
          if (duration != 0) {
            if (last.loop)
              delay += duration * (1 + (last.trackTime / duration | 0));
            else
              delay += Math.max(duration, last.trackTime);
            delay -= this.data.getMix(last.animation, animation);
          } else
            delay = last.trackTime;
        }
      }
      entry.delay = delay;
      return entry;
    }
    /** Sets an empty animation for a track, discarding any queued animations, and sets the track entry's
     * {@link TrackEntry#mixduration}. An empty animation has no timelines and serves as a placeholder for mixing in or out.
     *
     * Mixing out is done by setting an empty animation with a mix duration using either {@link #setEmptyAnimation()},
     * {@link #setEmptyAnimations()}, or {@link #addEmptyAnimation()}. Mixing to an empty animation causes
     * the previous animation to be applied less and less over the mix duration. Properties keyed in the previous animation
     * transition to the value from lower tracks or to the setup pose value if no lower tracks key the property. A mix duration of
     * 0 still mixes out over one frame.
     *
     * Mixing in is done by first setting an empty animation, then adding an animation using
     * {@link #addAnimation()} and on the returned track entry, set the
     * {@link TrackEntry#setMixDuration()}. Mixing from an empty animation causes the new animation to be applied more and
     * more over the mix duration. Properties keyed in the new animation transition from the value from lower tracks or from the
     * setup pose value if no lower tracks key the property to the value keyed in the new animation. */
    setEmptyAnimation(trackIndex, mixDuration) {
      let entry = this.setAnimationWith(trackIndex, _AnimationState.emptyAnimation, false);
      entry.mixDuration = mixDuration;
      entry.trackEnd = mixDuration;
      return entry;
    }
    /** Adds an empty animation to be played after the current or last queued animation for a track, and sets the track entry's
     * {@link TrackEntry#mixDuration}. If the track is empty, it is equivalent to calling
     * {@link #setEmptyAnimation()}.
     *
     * See {@link #setEmptyAnimation()}.
     * @param delay If > 0, sets {@link TrackEntry#delay}. If <= 0, the delay set is the duration of the previous track entry
     *           minus any mix duration plus the specified `delay` (ie the mix ends at (`delay` = 0) or
     *           before (`delay` < 0) the previous track entry duration). If the previous entry is looping, its next
     *           loop completion is used instead of its duration.
     * @return A track entry to allow further customization of animation playback. References to the track entry must not be kept
     *         after the {@link AnimationStateListener#dispose()} event occurs. */
    addEmptyAnimation(trackIndex, mixDuration, delay) {
      if (delay <= 0) delay -= mixDuration;
      let entry = this.addAnimationWith(trackIndex, _AnimationState.emptyAnimation, false, delay);
      entry.mixDuration = mixDuration;
      entry.trackEnd = mixDuration;
      return entry;
    }
    /** Sets an empty animation for every track, discarding any queued animations, and mixes to it over the specified mix
    	* duration. */
    setEmptyAnimations(mixDuration) {
      let oldDrainDisabled = this.queue.drainDisabled;
      this.queue.drainDisabled = true;
      for (let i = 0, n = this.tracks.length; i < n; i++) {
        let current = this.tracks[i];
        if (current != null) this.setEmptyAnimation(current.trackIndex, mixDuration);
      }
      this.queue.drainDisabled = oldDrainDisabled;
      this.queue.drain();
    }
    expandToIndex(index) {
      if (index < this.tracks.length) return this.tracks[index];
      spine2.Utils.ensureArrayCapacity(this.tracks, index + 1, null);
      this.tracks.length = index + 1;
      return null;
    }
    /** @param last May be null. */
    trackEntry(trackIndex, animation, loop, last) {
      let entry = this.trackEntryPool.obtain();
      entry.trackIndex = trackIndex;
      entry.animation = animation;
      entry.loop = loop;
      entry.holdPrevious = false;
      entry.eventThreshold = 0;
      entry.attachmentThreshold = 0;
      entry.drawOrderThreshold = 0;
      entry.animationStart = 0;
      entry.animationEnd = animation.duration;
      entry.animationLast = -1;
      entry.nextAnimationLast = -1;
      entry.delay = 0;
      entry.trackTime = 0;
      entry.trackLast = -1;
      entry.nextTrackLast = -1;
      entry.trackEnd = Number.MAX_VALUE;
      entry.timeScale = 1;
      entry.alpha = 1;
      entry.interruptAlpha = 1;
      entry.mixTime = 0;
      entry.mixDuration = last == null ? 0 : this.data.getMix(last.animation, animation);
      entry.mixBlend = 2 /* replace */;
      return entry;
    }
    disposeNext(entry) {
      let next = entry.next;
      while (next != null) {
        this.queue.dispose(next);
        next = next.next;
      }
      entry.next = null;
    }
    _animationsChanged() {
      this.animationsChanged = false;
      this.propertyIDs.clear();
      for (let i = 0, n = this.tracks.length; i < n; i++) {
        let entry = this.tracks[i];
        if (entry == null) continue;
        while (entry.mixingFrom != null)
          entry = entry.mixingFrom;
        do {
          if (entry.mixingFrom == null || entry.mixBlend != 3 /* add */) this.computeHold(entry);
          entry = entry.mixingTo;
        } while (entry != null);
      }
    }
    computeHold(entry) {
      let to = entry.mixingTo;
      let timelines = entry.animation.timelines;
      let timelinesCount = entry.animation.timelines.length;
      let timelineMode = spine2.Utils.setArraySize(entry.timelineMode, timelinesCount);
      entry.timelineHoldMix.length = 0;
      let timelineDipMix = spine2.Utils.setArraySize(entry.timelineHoldMix, timelinesCount);
      let propertyIDs = this.propertyIDs;
      if (to != null && to.holdPrevious) {
        for (let i = 0; i < timelinesCount; i++) {
          timelineMode[i] = propertyIDs.add(timelines[i].getPropertyId()) ? _AnimationState.HOLD_FIRST : _AnimationState.HOLD_SUBSEQUENT;
        }
        return;
      }
      outer:
        for (let i = 0; i < timelinesCount; i++) {
          let timeline = timelines[i];
          let id = timeline.getPropertyId();
          if (!propertyIDs.add(id))
            timelineMode[i] = _AnimationState.SUBSEQUENT;
          else if (to == null || timeline instanceof spine2.AttachmentTimeline || timeline instanceof spine2.DrawOrderTimeline || timeline instanceof spine2.EventTimeline || !to.animation.hasTimeline(id)) {
            timelineMode[i] = _AnimationState.FIRST;
          } else {
            for (let next = to.mixingTo; next != null; next = next.mixingTo) {
              if (next.animation.hasTimeline(id)) continue;
              if (entry.mixDuration > 0) {
                timelineMode[i] = _AnimationState.HOLD_MIX;
                timelineDipMix[i] = next;
                continue outer;
              }
              break;
            }
            timelineMode[i] = _AnimationState.HOLD_FIRST;
          }
        }
    }
    /** Returns the track entry for the animation currently playing on the track, or null if no animation is currently playing. */
    getCurrent(trackIndex) {
      if (trackIndex >= this.tracks.length) return null;
      return this.tracks[trackIndex];
    }
    /** Adds a listener to receive events for all track entries. */
    addListener(listener) {
      if (listener == null) throw new Error("listener cannot be null.");
      this.listeners.push(listener);
    }
    /** Removes the listener added with {@link #addListener()}. */
    removeListener(listener) {
      let index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    }
    /** Removes all listeners added with {@link #addListener()}. */
    clearListeners() {
      this.listeners.length = 0;
    }
    /** Discards all listener notifications that have not yet been delivered. This can be useful to call from an
     * {@link AnimationStateListener} when it is known that further notifications that may have been already queued for delivery
     * are not wanted because new animations are being set. */
    clearListenerNotifications() {
      this.queue.clear();
    }
  };
  __publicField(_AnimationState, "emptyAnimation", new spine2.Animation("<empty>", [], 0));
  /** 1. A previously applied timeline has set this property.
   *
  	 * Result: Mix from the current pose to the timeline pose. */
  __publicField(_AnimationState, "SUBSEQUENT", 0);
  /** 1. This is the first timeline to set this property.
   * 2. The next track entry applied after this one does not have a timeline to set this property.
   *
   * Result: Mix from the setup pose to the timeline pose. */
  __publicField(_AnimationState, "FIRST", 1);
  /** 1) A previously applied timeline has set this property.<br>
  	 * 2) The next track entry to be applied does have a timeline to set this property.<br>
  	 * 3) The next track entry after that one does not have a timeline to set this property.<br>
  	 * Result: Mix from the current pose to the timeline pose, but do not mix out. This avoids "dipping" when crossfading
  	 * animations that key the same property. A subsequent timeline will set this property using a mix. */
  __publicField(_AnimationState, "HOLD_SUBSEQUENT", 2);
  /** 1) This is the first timeline to set this property.<br>
   * 2) The next track entry to be applied does have a timeline to set this property.<br>
   * 3) The next track entry after that one does not have a timeline to set this property.<br>
   * Result: Mix from the setup pose to the timeline pose, but do not mix out. This avoids "dipping" when crossfading animations
   * that key the same property. A subsequent timeline will set this property using a mix. */
  __publicField(_AnimationState, "HOLD_FIRST", 3);
  /** 1. This is the first timeline to set this property.
   * 2. The next track entry to be applied does have a timeline to set this property.
   * 3. The next track entry after that one does have a timeline to set this property.
   * 4. timelineHoldMix stores the first subsequent track entry that does not have a timeline to set this property.
   *
   * Result: The same as HOLD except the mix percentage from the timelineHoldMix track entry is used. This handles when more than
   * 2 track entries in a row have a timeline that sets the same property.
   *
   * Eg, A -> B -> C -> D where A, B, and C have a timeline setting same property, but D does not. When A is applied, to avoid
   * "dipping" A is not mixed out, however D (the first entry that doesn't set the property) mixing in is used to mix out A
   * (which affects B and C). Without using D to mix out, A would be applied fully until mixing completes, then snap into
   * place. */
  __publicField(_AnimationState, "HOLD_MIX", 4);
  __publicField(_AnimationState, "SETUP", 1);
  __publicField(_AnimationState, "CURRENT", 2);
  let AnimationState = _AnimationState;
  spine2.AnimationState = _AnimationState;
  class TrackEntry {
    constructor() {
      /** The animation to apply for this track entry. */
      __publicField(this, "animation");
      /** The animation queued to start after this animation, or null. `next` makes up a linked list. */
      __publicField(this, "next");
      /** The track entry for the previous animation when mixing from the previous animation to this animation, or null if no
       * mixing is currently occuring. When mixing from multiple animations, `mixingFrom` makes up a linked list. */
      __publicField(this, "mixingFrom");
      /** The track entry for the next animation when mixing from this animation to the next animation, or null if no mixing is
       * currently occuring. When mixing to multiple animations, `mixingTo` makes up a linked list. */
      __publicField(this, "mixingTo");
      /** The listener for events generated by this track entry, or null.
       *
       * A track entry returned from {@link AnimationState#setAnimation()} is already the current animation
       * for the track, so the track entry listener {@link AnimationStateListener#start()} will not be called. */
      __publicField(this, "listener");
      /** The index of the track where this track entry is either current or queued.
       *
       * See {@link AnimationState#getCurrent()}. */
      __publicField(this, "trackIndex");
      /** If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its
       * duration. */
      __publicField(this, "loop");
      /** If true, when mixing from the previous animation to this animation, the previous animation is applied as normal instead
       * of being mixed out.
       *
       * When mixing between animations that key the same property, if a lower track also keys that property then the value will
       * briefly dip toward the lower track value during the mix. This happens because the first animation mixes from 100% to 0%
       * while the second animation mixes from 0% to 100%. Setting `holdPrevious` to true applies the first animation
       * at 100% during the mix so the lower track value is overwritten. Such dipping does not occur on the lowest track which
       * keys the property, only when a higher track also keys the property.
       *
       * Snapping will occur if `holdPrevious` is true and this animation does not key all the same properties as the
       * previous animation. */
      __publicField(this, "holdPrevious");
      /** When the mix percentage ({@link #mixTime} / {@link #mixDuration}) is less than the
       * `eventThreshold`, event timelines are applied while this animation is being mixed out. Defaults to 0, so event
       * timelines are not applied while this animation is being mixed out. */
      __publicField(this, "eventThreshold");
      /** When the mix percentage ({@link #mixtime} / {@link #mixDuration}) is less than the
       * `attachmentThreshold`, attachment timelines are applied while this animation is being mixed out. Defaults to
       * 0, so attachment timelines are not applied while this animation is being mixed out. */
      __publicField(this, "attachmentThreshold");
      /** When the mix percentage ({@link #mixTime} / {@link #mixDuration}) is less than the
       * `drawOrderThreshold`, draw order timelines are applied while this animation is being mixed out. Defaults to 0,
       * so draw order timelines are not applied while this animation is being mixed out. */
      __publicField(this, "drawOrderThreshold");
      /** Seconds when this animation starts, both initially and after looping. Defaults to 0.
       *
       * When changing the `animationStart` time, it often makes sense to set {@link #animationLast} to the same
       * value to prevent timeline keys before the start time from triggering. */
      __publicField(this, "animationStart");
      /** Seconds for the last frame of this animation. Non-looping animations won't play past this time. Looping animations will
       * loop back to {@link #animationStart} at this time. Defaults to the animation {@link Animation#duration}. */
      __publicField(this, "animationEnd");
      /** The time in seconds this animation was last applied. Some timelines use this for one-time triggers. Eg, when this
       * animation is applied, event timelines will fire all events between the `animationLast` time (exclusive) and
       * `animationTime` (inclusive). Defaults to -1 to ensure triggers on frame 0 happen the first time this animation
       * is applied. */
      __publicField(this, "animationLast");
      __publicField(this, "nextAnimationLast");
      /** Seconds to postpone playing the animation. When this track entry is the current track entry, `delay`
       * postpones incrementing the {@link #trackTime}. When this track entry is queued, `delay` is the time from
       * the start of the previous animation to when this track entry will become the current track entry (ie when the previous
       * track entry {@link TrackEntry#trackTime} >= this track entry's `delay`).
       *
       * {@link #timeScale} affects the delay. */
      __publicField(this, "delay");
      /** Current time in seconds this track entry has been the current track entry. The track time determines
       * {@link #animationTime}. The track time can be set to start the animation at a time other than 0, without affecting
       * looping. */
      __publicField(this, "trackTime");
      __publicField(this, "trackLast");
      __publicField(this, "nextTrackLast");
      /** The track time in seconds when this animation will be removed from the track. Defaults to the highest possible float
       * value, meaning the animation will be applied until a new animation is set or the track is cleared. If the track end time
       * is reached, no other animations are queued for playback, and mixing from any previous animations is complete, then the
       * properties keyed by the animation are set to the setup pose and the track is cleared.
       *
       * It may be desired to use {@link AnimationState#addEmptyAnimation()} rather than have the animation
       * abruptly cease being applied. */
      __publicField(this, "trackEnd");
      /** Multiplier for the delta time when this track entry is updated, causing time for this animation to pass slower or
       * faster. Defaults to 1.
       *
       * {@link #mixTime} is not affected by track entry time scale, so {@link #mixDuration} may need to be adjusted to
       * match the animation speed.
       *
       * When using {@link AnimationState#addAnimation()} with a `delay` <= 0, note the
       * {@link #delay} is set using the mix duration from the {@link AnimationStateData}, assuming time scale to be 1. If
       * the time scale is not 1, the delay may need to be adjusted.
       *
       * See AnimationState {@link AnimationState#timeScale} for affecting all animations. */
      __publicField(this, "timeScale");
      /** Values < 1 mix this animation with the skeleton's current pose (usually the pose resulting from lower tracks). Defaults
       * to 1, which overwrites the skeleton's current pose with this animation.
       *
       * Typically track 0 is used to completely pose the skeleton, then alpha is used on higher tracks. It doesn't make sense to
       * use alpha on track 0 if the skeleton pose is from the last frame render. */
      __publicField(this, "alpha");
      /** Seconds from 0 to the {@link #getMixDuration()} when mixing from the previous animation to this animation. May be
       * slightly more than `mixDuration` when the mix is complete. */
      __publicField(this, "mixTime");
      /** Seconds for mixing from the previous animation to this animation. Defaults to the value provided by AnimationStateData
       * {@link AnimationStateData#getMix()} based on the animation before this animation (if any).
       *
       * A mix duration of 0 still mixes out over one frame to provide the track entry being mixed out a chance to revert the
       * properties it was animating.
       *
       * The `mixDuration` can be set manually rather than use the value from
       * {@link AnimationStateData#getMix()}. In that case, the `mixDuration` can be set for a new
       * track entry only before {@link AnimationState#update(float)} is first called.
       *
       * When using {@link AnimationState#addAnimation()} with a `delay` <= 0, note the
       * {@link #delay} is set using the mix duration from the {@link AnimationStateData}, not a mix duration set
       * afterward. */
      __publicField(this, "mixDuration");
      __publicField(this, "interruptAlpha");
      __publicField(this, "totalAlpha");
      /** Controls how properties keyed in the animation are mixed with lower tracks. Defaults to {@link MixBlend#replace}, which
       * replaces the values from the lower tracks with the animation values. {@link MixBlend#add} adds the animation values to
       * the values from the lower tracks.
       *
       * The `mixBlend` can be set for a new track entry only before {@link AnimationState#apply()} is first
       * called. */
      __publicField(this, "mixBlend", 2 /* replace */);
      __publicField(this, "timelineMode", new Array());
      __publicField(this, "timelineHoldMix", new Array());
      __publicField(this, "timelinesRotation", new Array());
    }
    reset() {
      this.next = null;
      this.mixingFrom = null;
      this.mixingTo = null;
      this.animation = null;
      this.listener = null;
      this.timelineMode.length = 0;
      this.timelineHoldMix.length = 0;
      this.timelinesRotation.length = 0;
    }
    /** Uses {@link #trackTime} to compute the `animationTime`, which is between {@link #animationStart}
     * and {@link #animationEnd}. When the `trackTime` is 0, the `animationTime` is equal to the
     * `animationStart` time. */
    getAnimationTime() {
      if (this.loop) {
        let duration = this.animationEnd - this.animationStart;
        if (duration == 0) return this.animationStart;
        return this.trackTime % duration + this.animationStart;
      }
      return Math.min(this.trackTime + this.animationStart, this.animationEnd);
    }
    setAnimationLast(animationLast) {
      this.animationLast = animationLast;
      this.nextAnimationLast = animationLast;
    }
    /** Returns true if at least one loop has been completed.
     *
     * See {@link AnimationStateListener#complete()}. */
    isComplete() {
      return this.trackTime >= this.animationEnd - this.animationStart;
    }
    /** Resets the rotation directions for mixing this entry's rotate timelines. This can be useful to avoid bones rotating the
     * long way around when using {@link #alpha} and starting animations on other tracks.
     *
     * Mixing with {@link MixBlend#replace} involves finding a rotation between two others, which has two possible solutions:
     * the short way or the long way around. The two rotations likely change over time, so which direction is the short or long
     * way also changes. If the short way was always chosen, bones would flip to the other side when that direction became the
     * long way. TrackEntry chooses the short way the first time it is applied and remembers that direction. */
    resetRotationDirections() {
      this.timelinesRotation.length = 0;
    }
  }
  spine2.TrackEntry = TrackEntry;
  class EventQueue {
    constructor(animState) {
      __publicField(this, "objects", []);
      __publicField(this, "drainDisabled", false);
      __publicField(this, "animState");
      this.animState = animState;
    }
    start(entry) {
      this.objects.push(0 /* start */);
      this.objects.push(entry);
      this.animState.animationsChanged = true;
    }
    interrupt(entry) {
      this.objects.push(1 /* interrupt */);
      this.objects.push(entry);
    }
    end(entry) {
      this.objects.push(2 /* end */);
      this.objects.push(entry);
      this.animState.animationsChanged = true;
    }
    dispose(entry) {
      this.objects.push(3 /* dispose */);
      this.objects.push(entry);
    }
    complete(entry) {
      this.objects.push(4 /* complete */);
      this.objects.push(entry);
    }
    event(entry, event) {
      this.objects.push(5 /* event */);
      this.objects.push(entry);
      this.objects.push(event);
    }
    drain() {
      if (this.drainDisabled) return;
      this.drainDisabled = true;
      let objects = this.objects;
      let listeners = this.animState.listeners;
      for (let i = 0; i < objects.length; i += 2) {
        let type = objects[i];
        let entry = objects[i + 1];
        switch (type) {
          case 0 /* start */:
            if (entry.listener != null && entry.listener.start) entry.listener.start(entry);
            for (let ii = 0; ii < listeners.length; ii++)
              if (listeners[ii].start) listeners[ii].start(entry);
            break;
          case 1 /* interrupt */:
            if (entry.listener != null && entry.listener.interrupt) entry.listener.interrupt(entry);
            for (let ii = 0; ii < listeners.length; ii++)
              if (listeners[ii].interrupt) listeners[ii].interrupt(entry);
            break;
          case 2 /* end */:
            if (entry.listener != null && entry.listener.end) entry.listener.end(entry);
            for (let ii = 0; ii < listeners.length; ii++)
              if (listeners[ii].end) listeners[ii].end(entry);
          // Fall through.
          case 3 /* dispose */:
            if (entry.listener != null && entry.listener.dispose) entry.listener.dispose(entry);
            for (let ii = 0; ii < listeners.length; ii++)
              if (listeners[ii].dispose) listeners[ii].dispose(entry);
            this.animState.trackEntryPool.free(entry);
            break;
          case 4 /* complete */:
            if (entry.listener != null && entry.listener.complete) entry.listener.complete(entry);
            for (let ii = 0; ii < listeners.length; ii++)
              if (listeners[ii].complete) listeners[ii].complete(entry);
            break;
          case 5 /* event */:
            let event = objects[i++ + 2];
            if (entry.listener != null && entry.listener.event) entry.listener.event(entry, event);
            for (let ii = 0; ii < listeners.length; ii++)
              if (listeners[ii].event) listeners[ii].event(entry, event);
            break;
        }
      }
      this.clear();
      this.drainDisabled = false;
    }
    clear() {
      this.objects.length = 0;
    }
  }
  spine2.EventQueue = EventQueue;
  let EventType;
  ((EventType2) => {
    EventType2[EventType2["start"] = 0] = "start";
    EventType2[EventType2["interrupt"] = 1] = "interrupt";
    EventType2[EventType2["end"] = 2] = "end";
    EventType2[EventType2["dispose"] = 3] = "dispose";
    EventType2[EventType2["complete"] = 4] = "complete";
    EventType2[EventType2["event"] = 5] = "event";
  })(EventType = spine2.EventType || (spine2.EventType = {}));
  class AnimationStateAdapter {
    start(entry) {
    }
    interrupt(entry) {
    }
    end(entry) {
    }
    dispose(entry) {
    }
    complete(entry) {
    }
    event(entry, event) {
    }
  }
  spine2.AnimationStateAdapter = AnimationStateAdapter;
})(spine || (spine = {}));
((spine2) => {
  class AnimationStateData {
    constructor(skeletonData) {
      /** The SkeletonData to look up animations when they are specified by name. */
      __publicField(this, "skeletonData");
      __publicField(this, "animationToMixTime", {});
      /** The mix duration to use when no mix duration has been defined between two animations. */
      __publicField(this, "defaultMix", 0);
      if (skeletonData == null) throw new Error("skeletonData cannot be null.");
      this.skeletonData = skeletonData;
    }
    /** Sets a mix duration by animation name.
     *
     * See {@link #setMixWith()}. */
    setMix(fromName, toName, duration) {
      let from = this.skeletonData.findAnimation(fromName);
      if (from == null) throw new Error("Animation not found: " + fromName);
      let to = this.skeletonData.findAnimation(toName);
      if (to == null) throw new Error("Animation not found: " + toName);
      this.setMixWith(from, to, duration);
    }
    /** Sets the mix duration when changing from the specified animation to the other.
     *
     * See {@link TrackEntry#mixDuration}. */
    setMixWith(from, to, duration) {
      if (from == null) throw new Error("from cannot be null.");
      if (to == null) throw new Error("to cannot be null.");
      let key = from.name + "." + to.name;
      this.animationToMixTime[key] = duration;
    }
    /** Returns the mix duration to use when changing from the specified animation to the other, or the {@link #defaultMix} if
    	* no mix duration has been set. */
    getMix(from, to) {
      let key = from.name + "." + to.name;
      let value = this.animationToMixTime[key];
      return value === void 0 ? this.defaultMix : value;
    }
  }
  spine2.AnimationStateData = AnimationStateData;
})(spine || (spine = {}));
((spine2) => {
  class AssetManager {
    constructor(textureLoader, pathPrefix = "") {
      __publicField(this, "pathPrefix");
      __publicField(this, "textureLoader");
      __publicField(this, "assets", {});
      __publicField(this, "errors", {});
      __publicField(this, "toLoad", 0);
      __publicField(this, "loaded", 0);
      __publicField(this, "rawDataUris", {});
      this.textureLoader = textureLoader;
      this.pathPrefix = pathPrefix;
    }
    downloadText(url, success, error) {
      let request = new XMLHttpRequest();
      request.overrideMimeType("text/html");
      if (this.rawDataUris[url]) url = this.rawDataUris[url];
      request.open("GET", url, true);
      request.onload = () => {
        if (request.status == 200) {
          success(request.responseText);
        } else {
          error(request.status, request.responseText);
        }
      };
      request.onerror = () => {
        error(request.status, request.responseText);
      };
      request.send();
    }
    downloadBinary(url, success, error) {
      let request = new XMLHttpRequest();
      if (this.rawDataUris[url]) url = this.rawDataUris[url];
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.onload = () => {
        if (request.status == 200) {
          success(new Uint8Array(request.response));
        } else {
          error(request.status, request.responseText);
        }
      };
      request.onerror = () => {
        error(request.status, request.responseText);
      };
      request.send();
    }
    setRawDataURI(path, data) {
      this.rawDataUris[this.pathPrefix + path] = data;
    }
    loadBinary(path, success = null, error = null) {
      path = this.pathPrefix + path;
      this.toLoad++;
      this.downloadBinary(path, (data) => {
        this.assets[path] = data;
        if (success) success(path, data);
        this.toLoad--;
        this.loaded++;
      }, (state, responseText) => {
        this.errors[path] = `Couldn't load binary ${path}: status ${status}, ${responseText}`;
        if (error) error(path, `Couldn't load binary ${path}: status ${status}, ${responseText}`);
        this.toLoad--;
        this.loaded++;
      });
    }
    loadText(path, success = null, error = null) {
      path = this.pathPrefix + path;
      this.toLoad++;
      this.downloadText(path, (data) => {
        this.assets[path] = data;
        if (success) success(path, data);
        this.toLoad--;
        this.loaded++;
      }, (state, responseText) => {
        this.errors[path] = `Couldn't load text ${path}: status ${status}, ${responseText}`;
        if (error) error(path, `Couldn't load text ${path}: status ${status}, ${responseText}`);
        this.toLoad--;
        this.loaded++;
      });
    }
    loadTexture(path, success = null, error = null) {
      path = this.pathPrefix + path;
      let storagePath = path;
      this.toLoad++;
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = (ev) => {
        let texture = this.textureLoader(img);
        this.assets[storagePath] = texture;
        this.toLoad--;
        this.loaded++;
        if (success) success(path, img);
      };
      img.onerror = (ev) => {
        this.errors[path] = `Couldn't load image ${path}`;
        this.toLoad--;
        this.loaded++;
        if (error) error(path, `Couldn't load image ${path}`);
      };
      if (this.rawDataUris[path]) path = this.rawDataUris[path];
      img.src = path;
    }
    loadTextureAtlas(path, success = null, error = null) {
      let parent = path.lastIndexOf("/") >= 0 ? path.substring(0, path.lastIndexOf("/")) : "";
      path = this.pathPrefix + path;
      this.toLoad++;
      this.downloadText(path, (atlasData) => {
        let pagesLoaded = { count: 0 };
        let atlasPages = new Array();
        try {
          let atlas = new spine2.TextureAtlas(atlasData, (path2) => {
            atlasPages.push(parent == "" ? path2 : parent + "/" + path2);
            let image = document.createElement("img");
            image.width = 16;
            image.height = 16;
            return new spine2.FakeTexture(image);
          });
        } catch (e) {
          let ex = e;
          this.errors[path] = `Couldn't load texture atlas ${path}: ${ex.message}`;
          if (error) error(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
          this.toLoad--;
          this.loaded++;
          return;
        }
        for (let atlasPage of atlasPages) {
          let pageLoadError = false;
          this.loadTexture(atlasPage, (imagePath, image) => {
            pagesLoaded.count++;
            if (pagesLoaded.count == atlasPages.length) {
              if (!pageLoadError) {
                try {
                  let atlas = new spine2.TextureAtlas(atlasData, (path2) => {
                    return this.get(parent == "" ? path2 : parent + "/" + path2);
                  });
                  this.assets[path] = atlas;
                  if (success) success(path, atlas);
                  this.toLoad--;
                  this.loaded++;
                } catch (e) {
                  let ex = e;
                  this.errors[path] = `Couldn't load texture atlas ${path}: ${ex.message}`;
                  if (error) error(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
                  this.toLoad--;
                  this.loaded++;
                }
              } else {
                this.errors[path] = `Couldn't load texture atlas page ${imagePath}} of atlas ${path}`;
                if (error) error(path, `Couldn't load texture atlas page ${imagePath} of atlas ${path}`);
                this.toLoad--;
                this.loaded++;
              }
            }
          }, (imagePath, errorMessage) => {
            pageLoadError = true;
            pagesLoaded.count++;
            if (pagesLoaded.count == atlasPages.length) {
              this.errors[path] = `Couldn't load texture atlas page ${imagePath}} of atlas ${path}`;
              if (error) error(path, `Couldn't load texture atlas page ${imagePath} of atlas ${path}`);
              this.toLoad--;
              this.loaded++;
            }
          });
        }
      }, (state, responseText) => {
        this.errors[path] = `Couldn't load texture atlas ${path}: status ${status}, ${responseText}`;
        if (error) error(path, `Couldn't load texture atlas ${path}: status ${status}, ${responseText}`);
        this.toLoad--;
        this.loaded++;
      });
    }
    get(path) {
      path = this.pathPrefix + path;
      return this.assets[path];
    }
    remove(path) {
      path = this.pathPrefix + path;
      let asset = this.assets[path];
      if (asset.dispose) asset.dispose();
      this.assets[path] = null;
    }
    removeAll() {
      for (let key in this.assets) {
        let asset = this.assets[key];
        if (asset.dispose) asset.dispose();
      }
      this.assets = {};
    }
    isLoadingComplete() {
      return this.toLoad == 0;
    }
    getToLoad() {
      return this.toLoad;
    }
    getLoaded() {
      return this.loaded;
    }
    dispose() {
      this.removeAll();
    }
    hasErrors() {
      return Object.keys(this.errors).length > 0;
    }
    getErrors() {
      return this.errors;
    }
  }
  spine2.AssetManager = AssetManager;
})(spine || (spine = {}));
((spine2) => {
  class AtlasAttachmentLoader {
    constructor(atlas) {
      __publicField(this, "atlas");
      this.atlas = atlas;
    }
    newRegionAttachment(skin, name, path) {
      let region = this.atlas.findRegion(path);
      if (region == null) throw new Error("Region not found in atlas: " + path + " (region attachment: " + name + ")");
      region.renderObject = region;
      let attachment = new spine2.RegionAttachment(name);
      attachment.setRegion(region);
      return attachment;
    }
    newMeshAttachment(skin, name, path) {
      let region = this.atlas.findRegion(path);
      if (region == null) throw new Error("Region not found in atlas: " + path + " (mesh attachment: " + name + ")");
      region.renderObject = region;
      let attachment = new spine2.MeshAttachment(name);
      attachment.region = region;
      return attachment;
    }
    newBoundingBoxAttachment(skin, name) {
      return new spine2.BoundingBoxAttachment(name);
    }
    newPathAttachment(skin, name) {
      return new spine2.PathAttachment(name);
    }
    newPointAttachment(skin, name) {
      return new spine2.PointAttachment(name);
    }
    newClippingAttachment(skin, name) {
      return new spine2.ClippingAttachment(name);
    }
  }
  spine2.AtlasAttachmentLoader = AtlasAttachmentLoader;
})(spine || (spine = {}));
((spine2) => {
  let BlendMode;
  ((BlendMode2) => {
    BlendMode2[BlendMode2["Normal"] = 0] = "Normal";
    BlendMode2[BlendMode2["Additive"] = 1] = "Additive";
    BlendMode2[BlendMode2["Multiply"] = 2] = "Multiply";
    BlendMode2[BlendMode2["Screen"] = 3] = "Screen";
  })(BlendMode = spine2.BlendMode || (spine2.BlendMode = {}));
})(spine || (spine = {}));
((spine2) => {
  class Bone {
    /** @param parent May be null. */
    constructor(data, skeleton, parent) {
      /** The bone's setup pose data. */
      __publicField(this, "data");
      /** The skeleton this bone belongs to. */
      __publicField(this, "skeleton");
      /** The parent bone, or null if this is the root bone. */
      __publicField(this, "parent");
      /** The immediate children of this bone. */
      __publicField(this, "children", new Array());
      /** The local x translation. */
      __publicField(this, "x", 0);
      /** The local y translation. */
      __publicField(this, "y", 0);
      /** The local rotation in degrees, counter clockwise. */
      __publicField(this, "rotation", 0);
      /** The local scaleX. */
      __publicField(this, "scaleX", 0);
      /** The local scaleY. */
      __publicField(this, "scaleY", 0);
      /** The local shearX. */
      __publicField(this, "shearX", 0);
      /** The local shearY. */
      __publicField(this, "shearY", 0);
      /** The applied local x translation. */
      __publicField(this, "ax", 0);
      /** The applied local y translation. */
      __publicField(this, "ay", 0);
      /** The applied local rotation in degrees, counter clockwise. */
      __publicField(this, "arotation", 0);
      /** The applied local scaleX. */
      __publicField(this, "ascaleX", 0);
      /** The applied local scaleY. */
      __publicField(this, "ascaleY", 0);
      /** The applied local shearX. */
      __publicField(this, "ashearX", 0);
      /** The applied local shearY. */
      __publicField(this, "ashearY", 0);
      /** If true, the applied transform matches the world transform. If false, the world transform has been modified since it was
      	* computed and {@link #updateAppliedTransform()} must be called before accessing the applied transform. */
      __publicField(this, "appliedValid", false);
      /** Part of the world transform matrix for the X axis. If changed, {@link #appliedValid} should be set to false. */
      __publicField(this, "a", 0);
      /** Part of the world transform matrix for the Y axis. If changed, {@link #appliedValid} should be set to false. */
      __publicField(this, "b", 0);
      /** Part of the world transform matrix for the X axis. If changed, {@link #appliedValid} should be set to false. */
      __publicField(this, "c", 0);
      /** Part of the world transform matrix for the Y axis. If changed, {@link #appliedValid} should be set to false. */
      __publicField(this, "d", 0);
      /** The world X position. If changed, {@link #appliedValid} should be set to false. */
      __publicField(this, "worldY", 0);
      /** The world Y position. If changed, {@link #appliedValid} should be set to false. */
      __publicField(this, "worldX", 0);
      __publicField(this, "sorted", false);
      __publicField(this, "active", false);
      if (data == null) throw new Error("data cannot be null.");
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      this.data = data;
      this.skeleton = skeleton;
      this.parent = parent;
      this.setToSetupPose();
    }
    /** Returns false when the bone has not been computed because {@link BoneData#skinRequired} is true and the
    	* {@link Skeleton#skin active skin} does not {@link Skin#bones contain} this bone. */
    isActive() {
      return this.active;
    }
    /** Same as {@link #updateWorldTransform()}. This method exists for Bone to implement {@link Updatable}. */
    update() {
      this.updateWorldTransformWith(this.x, this.y, this.rotation, this.scaleX, this.scaleY, this.shearX, this.shearY);
    }
    /** Computes the world transform using the parent bone and this bone's local transform.
     *
     * See {@link #updateWorldTransformWith()}. */
    updateWorldTransform() {
      this.updateWorldTransformWith(this.x, this.y, this.rotation, this.scaleX, this.scaleY, this.shearX, this.shearY);
    }
    /** Computes the world transform using the parent bone and the specified local transform. Child bones are not updated.
     *
     * See [World transforms](http://esotericsoftware.com/spine-runtime-skeletons#World-transforms) in the Spine
     * Runtimes Guide. */
    updateWorldTransformWith(x, y, rotation, scaleX, scaleY, shearX, shearY) {
      this.ax = x;
      this.ay = y;
      this.arotation = rotation;
      this.ascaleX = scaleX;
      this.ascaleY = scaleY;
      this.ashearX = shearX;
      this.ashearY = shearY;
      this.appliedValid = true;
      let parent = this.parent;
      if (parent == null) {
        let skeleton = this.skeleton;
        let rotationY = rotation + 90 + shearY;
        let sx = skeleton.scaleX;
        let sy = skeleton.scaleY;
        this.a = spine2.MathUtils.cosDeg(rotation + shearX) * scaleX * sx;
        this.b = spine2.MathUtils.cosDeg(rotationY) * scaleY * sx;
        this.c = spine2.MathUtils.sinDeg(rotation + shearX) * scaleX * sy;
        this.d = spine2.MathUtils.sinDeg(rotationY) * scaleY * sy;
        this.worldX = x * sx + skeleton.x;
        this.worldY = y * sy + skeleton.y;
        return;
      }
      let pa = parent.a, pb = parent.b, pc = parent.c, pd = parent.d;
      this.worldX = pa * x + pb * y + parent.worldX;
      this.worldY = pc * x + pd * y + parent.worldY;
      switch (this.data.transformMode) {
        case spine2.TransformMode.Normal: {
          let rotationY = rotation + 90 + shearY;
          let la = spine2.MathUtils.cosDeg(rotation + shearX) * scaleX;
          let lb = spine2.MathUtils.cosDeg(rotationY) * scaleY;
          let lc = spine2.MathUtils.sinDeg(rotation + shearX) * scaleX;
          let ld = spine2.MathUtils.sinDeg(rotationY) * scaleY;
          this.a = pa * la + pb * lc;
          this.b = pa * lb + pb * ld;
          this.c = pc * la + pd * lc;
          this.d = pc * lb + pd * ld;
          return;
        }
        case spine2.TransformMode.OnlyTranslation: {
          let rotationY = rotation + 90 + shearY;
          this.a = spine2.MathUtils.cosDeg(rotation + shearX) * scaleX;
          this.b = spine2.MathUtils.cosDeg(rotationY) * scaleY;
          this.c = spine2.MathUtils.sinDeg(rotation + shearX) * scaleX;
          this.d = spine2.MathUtils.sinDeg(rotationY) * scaleY;
          break;
        }
        case spine2.TransformMode.NoRotationOrReflection: {
          let s = pa * pa + pc * pc;
          let prx = 0;
          if (s > 1e-4) {
            s = Math.abs(pa * pd - pb * pc) / s;
            pa /= this.skeleton.scaleX;
            pc /= this.skeleton.scaleY;
            pb = pc * s;
            pd = pa * s;
            prx = Math.atan2(pc, pa) * spine2.MathUtils.radDeg;
          } else {
            pa = 0;
            pc = 0;
            prx = 90 - Math.atan2(pd, pb) * spine2.MathUtils.radDeg;
          }
          let rx = rotation + shearX - prx;
          let ry = rotation + shearY - prx + 90;
          let la = spine2.MathUtils.cosDeg(rx) * scaleX;
          let lb = spine2.MathUtils.cosDeg(ry) * scaleY;
          let lc = spine2.MathUtils.sinDeg(rx) * scaleX;
          let ld = spine2.MathUtils.sinDeg(ry) * scaleY;
          this.a = pa * la - pb * lc;
          this.b = pa * lb - pb * ld;
          this.c = pc * la + pd * lc;
          this.d = pc * lb + pd * ld;
          break;
        }
        case spine2.TransformMode.NoScale:
        case spine2.TransformMode.NoScaleOrReflection: {
          let cos = spine2.MathUtils.cosDeg(rotation);
          let sin = spine2.MathUtils.sinDeg(rotation);
          let za = (pa * cos + pb * sin) / this.skeleton.scaleX;
          let zc = (pc * cos + pd * sin) / this.skeleton.scaleY;
          let s = Math.sqrt(za * za + zc * zc);
          if (s > 1e-5) s = 1 / s;
          za *= s;
          zc *= s;
          s = Math.sqrt(za * za + zc * zc);
          if (this.data.transformMode == spine2.TransformMode.NoScale && pa * pd - pb * pc < 0 != (this.skeleton.scaleX < 0 != this.skeleton.scaleY < 0)) s = -s;
          let r = Math.PI / 2 + Math.atan2(zc, za);
          let zb = Math.cos(r) * s;
          let zd = Math.sin(r) * s;
          let la = spine2.MathUtils.cosDeg(shearX) * scaleX;
          let lb = spine2.MathUtils.cosDeg(90 + shearY) * scaleY;
          let lc = spine2.MathUtils.sinDeg(shearX) * scaleX;
          let ld = spine2.MathUtils.sinDeg(90 + shearY) * scaleY;
          this.a = za * la + zb * lc;
          this.b = za * lb + zb * ld;
          this.c = zc * la + zd * lc;
          this.d = zc * lb + zd * ld;
          break;
        }
      }
      this.a *= this.skeleton.scaleX;
      this.b *= this.skeleton.scaleX;
      this.c *= this.skeleton.scaleY;
      this.d *= this.skeleton.scaleY;
    }
    /** Sets this bone's local transform to the setup pose. */
    setToSetupPose() {
      let data = this.data;
      this.x = data.x;
      this.y = data.y;
      this.rotation = data.rotation;
      this.scaleX = data.scaleX;
      this.scaleY = data.scaleY;
      this.shearX = data.shearX;
      this.shearY = data.shearY;
    }
    /** The world rotation for the X axis, calculated using {@link #a} and {@link #c}. */
    getWorldRotationX() {
      return Math.atan2(this.c, this.a) * spine2.MathUtils.radDeg;
    }
    /** The world rotation for the Y axis, calculated using {@link #b} and {@link #d}. */
    getWorldRotationY() {
      return Math.atan2(this.d, this.b) * spine2.MathUtils.radDeg;
    }
    /** The magnitude (always positive) of the world scale X, calculated using {@link #a} and {@link #c}. */
    getWorldScaleX() {
      return Math.sqrt(this.a * this.a + this.c * this.c);
    }
    /** The magnitude (always positive) of the world scale Y, calculated using {@link #b} and {@link #d}. */
    getWorldScaleY() {
      return Math.sqrt(this.b * this.b + this.d * this.d);
    }
    /** Computes the applied transform values from the world transform. This allows the applied transform to be accessed after the
     * world transform has been modified (by a constraint, {@link #rotateWorld()}, etc).
     *
     * If {@link #updateWorldTransform()} has been called for a bone and {@link #appliedValid} is false, then
     * {@link #updateAppliedTransform()} must be called before accessing the applied transform.
     *
     * Some information is ambiguous in the world transform, such as -1,-1 scale versus 180 rotation. The applied transform after
     * calling this method is equivalent to the local tranform used to compute the world transform, but may not be identical. */
    updateAppliedTransform() {
      this.appliedValid = true;
      let parent = this.parent;
      if (parent == null) {
        this.ax = this.worldX;
        this.ay = this.worldY;
        this.arotation = Math.atan2(this.c, this.a) * spine2.MathUtils.radDeg;
        this.ascaleX = Math.sqrt(this.a * this.a + this.c * this.c);
        this.ascaleY = Math.sqrt(this.b * this.b + this.d * this.d);
        this.ashearX = 0;
        this.ashearY = Math.atan2(this.a * this.b + this.c * this.d, this.a * this.d - this.b * this.c) * spine2.MathUtils.radDeg;
        return;
      }
      let pa = parent.a, pb = parent.b, pc = parent.c, pd = parent.d;
      let pid = 1 / (pa * pd - pb * pc);
      let dx = this.worldX - parent.worldX, dy = this.worldY - parent.worldY;
      this.ax = dx * pd * pid - dy * pb * pid;
      this.ay = dy * pa * pid - dx * pc * pid;
      let ia = pid * pd;
      let id = pid * pa;
      let ib = pid * pb;
      let ic = pid * pc;
      let ra = ia * this.a - ib * this.c;
      let rb = ia * this.b - ib * this.d;
      let rc = id * this.c - ic * this.a;
      let rd = id * this.d - ic * this.b;
      this.ashearX = 0;
      this.ascaleX = Math.sqrt(ra * ra + rc * rc);
      if (this.ascaleX > 1e-4) {
        let det = ra * rd - rb * rc;
        this.ascaleY = det / this.ascaleX;
        this.ashearY = Math.atan2(ra * rb + rc * rd, det) * spine2.MathUtils.radDeg;
        this.arotation = Math.atan2(rc, ra) * spine2.MathUtils.radDeg;
      } else {
        this.ascaleX = 0;
        this.ascaleY = Math.sqrt(rb * rb + rd * rd);
        this.ashearY = 0;
        this.arotation = 90 - Math.atan2(rd, rb) * spine2.MathUtils.radDeg;
      }
    }
    /** Transforms a point from world coordinates to the bone's local coordinates. */
    worldToLocal(world) {
      let a = this.a, b = this.b, c = this.c, d = this.d;
      let invDet = 1 / (a * d - b * c);
      let x = world.x - this.worldX, y = world.y - this.worldY;
      world.x = x * d * invDet - y * b * invDet;
      world.y = y * a * invDet - x * c * invDet;
      return world;
    }
    /** Transforms a point from the bone's local coordinates to world coordinates. */
    localToWorld(local) {
      let x = local.x, y = local.y;
      local.x = x * this.a + y * this.b + this.worldX;
      local.y = x * this.c + y * this.d + this.worldY;
      return local;
    }
    /** Transforms a world rotation to a local rotation. */
    worldToLocalRotation(worldRotation) {
      let sin = spine2.MathUtils.sinDeg(worldRotation), cos = spine2.MathUtils.cosDeg(worldRotation);
      return Math.atan2(this.a * sin - this.c * cos, this.d * cos - this.b * sin) * spine2.MathUtils.radDeg + this.rotation - this.shearX;
    }
    /** Transforms a local rotation to a world rotation. */
    localToWorldRotation(localRotation) {
      localRotation -= this.rotation - this.shearX;
      let sin = spine2.MathUtils.sinDeg(localRotation), cos = spine2.MathUtils.cosDeg(localRotation);
      return Math.atan2(cos * this.c + sin * this.d, cos * this.a + sin * this.b) * spine2.MathUtils.radDeg;
    }
    /** Rotates the world transform the specified amount and sets {@link #appliedValid} to false.
     * {@link #updateWorldTransform()} will need to be called on any child bones, recursively, and any constraints reapplied. */
    rotateWorld(degrees) {
      let a = this.a, b = this.b, c = this.c, d = this.d;
      let cos = spine2.MathUtils.cosDeg(degrees), sin = spine2.MathUtils.sinDeg(degrees);
      this.a = cos * a - sin * c;
      this.b = cos * b - sin * d;
      this.c = sin * a + cos * c;
      this.d = sin * b + cos * d;
      this.appliedValid = false;
    }
  }
  spine2.Bone = Bone;
})(spine || (spine = {}));
((spine2) => {
  class BoneData {
    constructor(index, name, parent) {
      /** The index of the bone in {@link Skeleton#getBones()}. */
      __publicField(this, "index");
      /** The name of the bone, which is unique across all bones in the skeleton. */
      __publicField(this, "name");
      /** @returns May be null. */
      __publicField(this, "parent");
      /** The bone's length. */
      __publicField(this, "length");
      /** The local x translation. */
      __publicField(this, "x", 0);
      /** The local y translation. */
      __publicField(this, "y", 0);
      /** The local rotation. */
      __publicField(this, "rotation", 0);
      /** The local scaleX. */
      __publicField(this, "scaleX", 1);
      /** The local scaleY. */
      __publicField(this, "scaleY", 1);
      /** The local shearX. */
      __publicField(this, "shearX", 0);
      /** The local shearX. */
      __publicField(this, "shearY", 0);
      /** The transform mode for how parent world transforms affect this bone. */
      __publicField(this, "transformMode", 0 /* Normal */);
      /** When true, {@link Skeleton#updateWorldTransform()} only updates this bone if the {@link Skeleton#skin} contains this
      	* bone.
      	* @see Skin#bones */
      __publicField(this, "skinRequired", false);
      /** The color of the bone as it was in Spine. Available only when nonessential data was exported. Bones are not usually
       * rendered at runtime. */
      __publicField(this, "color", new spine2.Color());
      if (index < 0) throw new Error("index must be >= 0.");
      if (name == null) throw new Error("name cannot be null.");
      this.index = index;
      this.name = name;
      this.parent = parent;
    }
  }
  spine2.BoneData = BoneData;
  let TransformMode;
  ((TransformMode2) => {
    TransformMode2[TransformMode2["Normal"] = 0] = "Normal";
    TransformMode2[TransformMode2["OnlyTranslation"] = 1] = "OnlyTranslation";
    TransformMode2[TransformMode2["NoRotationOrReflection"] = 2] = "NoRotationOrReflection";
    TransformMode2[TransformMode2["NoScale"] = 3] = "NoScale";
    TransformMode2[TransformMode2["NoScaleOrReflection"] = 4] = "NoScaleOrReflection";
  })(TransformMode = spine2.TransformMode || (spine2.TransformMode = {}));
})(spine || (spine = {}));
((spine2) => {
  class ConstraintData {
    constructor(name, order, skinRequired) {
      __publicField(this, "name", name);
      __publicField(this, "order", order);
      __publicField(this, "skinRequired", skinRequired);
    }
  }
  spine2.ConstraintData = ConstraintData;
})(spine || (spine = {}));
((spine2) => {
  class Event {
    constructor(time, data) {
      __publicField(this, "data");
      __publicField(this, "intValue");
      __publicField(this, "floatValue");
      __publicField(this, "stringValue");
      __publicField(this, "time");
      __publicField(this, "volume");
      __publicField(this, "balance");
      if (data == null) throw new Error("data cannot be null.");
      this.time = time;
      this.data = data;
    }
  }
  spine2.Event = Event;
})(spine || (spine = {}));
((spine2) => {
  class EventData {
    constructor(name) {
      __publicField(this, "name");
      __publicField(this, "intValue");
      __publicField(this, "floatValue");
      __publicField(this, "stringValue");
      __publicField(this, "audioPath");
      __publicField(this, "volume");
      __publicField(this, "balance");
      this.name = name;
    }
  }
  spine2.EventData = EventData;
})(spine || (spine = {}));
((spine2) => {
  class IkConstraint {
    constructor(data, skeleton) {
      /** The IK constraint's setup pose data. */
      __publicField(this, "data");
      /** The bones that will be modified by this IK constraint. */
      __publicField(this, "bones");
      /** The bone that is the IK target. */
      __publicField(this, "target");
      /** Controls the bend direction of the IK bones, either 1 or -1. */
      __publicField(this, "bendDirection", 0);
      /** When true and only a single bone is being constrained, if the target is too close, the bone is scaled to reach it. */
      __publicField(this, "compress", false);
      /** When true, if the target is out of range, the parent bone is scaled to reach it. If more than one bone is being constrained
       * and the parent bone has local nonuniform scale, stretch is not applied. */
      __publicField(this, "stretch", false);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
      __publicField(this, "mix", 1);
      /** For two bone IK, the distance from the maximum reach of the bones that rotation will slow. */
      __publicField(this, "softness", 0);
      __publicField(this, "active", false);
      if (data == null) throw new Error("data cannot be null.");
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      this.data = data;
      this.mix = data.mix;
      this.softness = data.softness;
      this.bendDirection = data.bendDirection;
      this.compress = data.compress;
      this.stretch = data.stretch;
      this.bones = new Array();
      for (let i = 0; i < data.bones.length; i++)
        this.bones.push(skeleton.findBone(data.bones[i].name));
      this.target = skeleton.findBone(data.target.name);
    }
    isActive() {
      return this.active;
    }
    /** Applies the constraint to the constrained bones. */
    apply() {
      this.update();
    }
    update() {
      let target = this.target;
      let bones = this.bones;
      switch (bones.length) {
        case 1:
          this.apply1(bones[0], target.worldX, target.worldY, this.compress, this.stretch, this.data.uniform, this.mix);
          break;
        case 2:
          this.apply2(bones[0], bones[1], target.worldX, target.worldY, this.bendDirection, this.stretch, this.softness, this.mix);
          break;
      }
    }
    /** Applies 1 bone IK. The target is specified in the world coordinate system. */
    apply1(bone, targetX, targetY, compress, stretch, uniform, alpha) {
      if (!bone.appliedValid) bone.updateAppliedTransform();
      let p = bone.parent;
      let pa = p.a, pb = p.b, pc = p.c, pd = p.d;
      let rotationIK = -bone.ashearX - bone.arotation, tx = 0, ty = 0;
      switch (bone.data.transformMode) {
        case 1 /* OnlyTranslation */:
          tx = targetX - bone.worldX;
          ty = targetY - bone.worldY;
          break;
        case 2 /* NoRotationOrReflection */:
          let s = Math.abs(pa * pd - pb * pc) / (pa * pa + pc * pc);
          let sa = pa / bone.skeleton.scaleX;
          let sc = pc / bone.skeleton.scaleY;
          pb = -sc * s * bone.skeleton.scaleX;
          pd = sa * s * bone.skeleton.scaleY;
          rotationIK += Math.atan2(sc, sa) * spine2.MathUtils.radDeg;
        // Fall through
        default:
          let x = targetX - p.worldX, y = targetY - p.worldY;
          let d = pa * pd - pb * pc;
          tx = (x * pd - y * pb) / d - bone.ax;
          ty = (y * pa - x * pc) / d - bone.ay;
      }
      rotationIK += Math.atan2(ty, tx) * spine2.MathUtils.radDeg;
      if (bone.ascaleX < 0) rotationIK += 180;
      if (rotationIK > 180)
        rotationIK -= 360;
      else if (rotationIK < -180) rotationIK += 360;
      let sx = bone.ascaleX, sy = bone.ascaleY;
      if (compress || stretch) {
        switch (bone.data.transformMode) {
          case 3 /* NoScale */:
          case 4 /* NoScaleOrReflection */:
            tx = targetX - bone.worldX;
            ty = targetY - bone.worldY;
        }
        let b = bone.data.length * sx, dd = Math.sqrt(tx * tx + ty * ty);
        if (compress && dd < b || stretch && dd > b && b > 1e-4) {
          let s = (dd / b - 1) * alpha + 1;
          sx *= s;
          if (uniform) sy *= s;
        }
      }
      bone.updateWorldTransformWith(
        bone.ax,
        bone.ay,
        bone.arotation + rotationIK * alpha,
        sx,
        sy,
        bone.ashearX,
        bone.ashearY
      );
    }
    /** Applies 2 bone IK. The target is specified in the world coordinate system.
     * @param child A direct descendant of the parent bone. */
    apply2(parent, child, targetX, targetY, bendDir, stretch, softness, alpha) {
      if (alpha == 0) {
        child.updateWorldTransform();
        return;
      }
      if (!parent.appliedValid) parent.updateAppliedTransform();
      if (!child.appliedValid) child.updateAppliedTransform();
      let px = parent.ax, py = parent.ay, psx = parent.ascaleX, sx = psx, psy = parent.ascaleY, csx = child.ascaleX;
      let os1 = 0, os2 = 0, s2 = 0;
      if (psx < 0) {
        psx = -psx;
        os1 = 180;
        s2 = -1;
      } else {
        os1 = 0;
        s2 = 1;
      }
      if (psy < 0) {
        psy = -psy;
        s2 = -s2;
      }
      if (csx < 0) {
        csx = -csx;
        os2 = 180;
      } else
        os2 = 0;
      let cx = child.ax, cy = 0, cwx = 0, cwy = 0, a = parent.a, b = parent.b, c = parent.c, d = parent.d;
      let u = Math.abs(psx - psy) <= 1e-4;
      if (!u) {
        cy = 0;
        cwx = a * cx + parent.worldX;
        cwy = c * cx + parent.worldY;
      } else {
        cy = child.ay;
        cwx = a * cx + b * cy + parent.worldX;
        cwy = c * cx + d * cy + parent.worldY;
      }
      let pp = parent.parent;
      a = pp.a;
      b = pp.b;
      c = pp.c;
      d = pp.d;
      let id = 1 / (a * d - b * c), x = cwx - pp.worldX, y = cwy - pp.worldY;
      let dx = (x * d - y * b) * id - px, dy = (y * a - x * c) * id - py;
      let l1 = Math.sqrt(dx * dx + dy * dy), l2 = child.data.length * csx, a1, a2;
      if (l1 < 1e-4) {
        this.apply1(parent, targetX, targetY, false, stretch, false, alpha);
        child.updateWorldTransformWith(cx, cy, 0, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
        return;
      }
      x = targetX - pp.worldX;
      y = targetY - pp.worldY;
      let tx = (x * d - y * b) * id - px, ty = (y * a - x * c) * id - py;
      let dd = tx * tx + ty * ty;
      if (softness != 0) {
        softness *= psx * (csx + 1) / 2;
        let td = Math.sqrt(dd), sd = td - l1 - l2 * psx + softness;
        if (sd > 0) {
          let p = Math.min(1, sd / (softness * 2)) - 1;
          p = (sd - softness * (1 - p * p)) / td;
          tx -= p * tx;
          ty -= p * ty;
          dd = tx * tx + ty * ty;
        }
      }
      outer:
        if (u) {
          l2 *= psx;
          let cos = (dd - l1 * l1 - l2 * l2) / (2 * l1 * l2);
          if (cos < -1)
            cos = -1;
          else if (cos > 1) {
            cos = 1;
            if (stretch) sx *= (Math.sqrt(dd) / (l1 + l2) - 1) * alpha + 1;
          }
          a2 = Math.acos(cos) * bendDir;
          a = l1 + l2 * cos;
          b = l2 * Math.sin(a2);
          a1 = Math.atan2(ty * a - tx * b, tx * a + ty * b);
        } else {
          a = psx * l2;
          b = psy * l2;
          let aa = a * a, bb = b * b, ta = Math.atan2(ty, tx);
          c = bb * l1 * l1 + aa * dd - aa * bb;
          let c1 = -2 * bb * l1, c2 = bb - aa;
          d = c1 * c1 - 4 * c2 * c;
          if (d >= 0) {
            let q = Math.sqrt(d);
            if (c1 < 0) q = -q;
            q = -(c1 + q) / 2;
            let r0 = q / c2, r1 = c / q;
            let r = Math.abs(r0) < Math.abs(r1) ? r0 : r1;
            if (r * r <= dd) {
              y = Math.sqrt(dd - r * r) * bendDir;
              a1 = ta - Math.atan2(y, r);
              a2 = Math.atan2(y / psy, (r - l1) / psx);
              break outer;
            }
          }
          let minAngle = spine2.MathUtils.PI, minX = l1 - a, minDist = minX * minX, minY = 0;
          let maxAngle = 0, maxX = l1 + a, maxDist = maxX * maxX, maxY = 0;
          c = -a * l1 / (aa - bb);
          if (c >= -1 && c <= 1) {
            c = Math.acos(c);
            x = a * Math.cos(c) + l1;
            y = b * Math.sin(c);
            d = x * x + y * y;
            if (d < minDist) {
              minAngle = c;
              minDist = d;
              minX = x;
              minY = y;
            }
            if (d > maxDist) {
              maxAngle = c;
              maxDist = d;
              maxX = x;
              maxY = y;
            }
          }
          if (dd <= (minDist + maxDist) / 2) {
            a1 = ta - Math.atan2(minY * bendDir, minX);
            a2 = minAngle * bendDir;
          } else {
            a1 = ta - Math.atan2(maxY * bendDir, maxX);
            a2 = maxAngle * bendDir;
          }
        }
      let os = Math.atan2(cy, cx) * s2;
      let rotation = parent.arotation;
      a1 = (a1 - os) * spine2.MathUtils.radDeg + os1 - rotation;
      if (a1 > 180)
        a1 -= 360;
      else if (a1 < -180) a1 += 360;
      parent.updateWorldTransformWith(px, py, rotation + a1 * alpha, sx, parent.ascaleY, 0, 0);
      rotation = child.arotation;
      a2 = ((a2 + os) * spine2.MathUtils.radDeg - child.ashearX) * s2 + os2 - rotation;
      if (a2 > 180)
        a2 -= 360;
      else if (a2 < -180) a2 += 360;
      child.updateWorldTransformWith(cx, cy, rotation + a2 * alpha, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
    }
  }
  spine2.IkConstraint = IkConstraint;
})(spine || (spine = {}));
((spine2) => {
  class IkConstraintData extends spine2.ConstraintData {
    constructor(name) {
      super(name, 0, false);
      /** The bones that are constrained by this IK constraint. */
      __publicField(this, "bones", new Array());
      /** The bone that is the IK target. */
      __publicField(this, "target");
      /** Controls the bend direction of the IK bones, either 1 or -1. */
      __publicField(this, "bendDirection", 1);
      /** When true and only a single bone is being constrained, if the target is too close, the bone is scaled to reach it. */
      __publicField(this, "compress", false);
      /** When true, if the target is out of range, the parent bone is scaled to reach it. If more than one bone is being constrained
       * and the parent bone has local nonuniform scale, stretch is not applied. */
      __publicField(this, "stretch", false);
      /** When true, only a single bone is being constrained, and {@link #getCompress()} or {@link #getStretch()} is used, the bone
       * is scaled on both the X and Y axes. */
      __publicField(this, "uniform", false);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
      __publicField(this, "mix", 1);
      /** For two bone IK, the distance from the maximum reach of the bones that rotation will slow. */
      __publicField(this, "softness", 0);
    }
  }
  spine2.IkConstraintData = IkConstraintData;
})(spine || (spine = {}));
((spine2) => {
  const _PathConstraint = class _PathConstraint {
    constructor(data, skeleton) {
      /** The path constraint's setup pose data. */
      __publicField(this, "data");
      /** The bones that will be modified by this path constraint. */
      __publicField(this, "bones");
      /** The slot whose path attachment will be used to constrained the bones. */
      __publicField(this, "target");
      /** The position along the path. */
      __publicField(this, "position", 0);
      /** The spacing between bones. */
      __publicField(this, "spacing", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
      __publicField(this, "rotateMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
      __publicField(this, "translateMix", 0);
      __publicField(this, "spaces", new Array());
      __publicField(this, "positions", new Array());
      __publicField(this, "world", new Array());
      __publicField(this, "curves", new Array());
      __publicField(this, "lengths", new Array());
      __publicField(this, "segments", new Array());
      __publicField(this, "active", false);
      if (data == null) throw new Error("data cannot be null.");
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      this.data = data;
      this.bones = new Array();
      for (let i = 0, n = data.bones.length; i < n; i++)
        this.bones.push(skeleton.findBone(data.bones[i].name));
      this.target = skeleton.findSlot(data.target.name);
      this.position = data.position;
      this.spacing = data.spacing;
      this.rotateMix = data.rotateMix;
      this.translateMix = data.translateMix;
    }
    isActive() {
      return this.active;
    }
    /** Applies the constraint to the constrained bones. */
    apply() {
      this.update();
    }
    update() {
      let attachment = this.target.getAttachment();
      if (!(attachment instanceof spine2.PathAttachment)) return;
      let rotateMix = this.rotateMix, translateMix = this.translateMix;
      let translate = translateMix > 0, rotate = rotateMix > 0;
      if (!translate && !rotate) return;
      let data = this.data;
      let percentSpacing = data.spacingMode == spine2.SpacingMode.Percent;
      let rotateMode = data.rotateMode;
      let tangents = rotateMode == spine2.RotateMode.Tangent, scale = rotateMode == spine2.RotateMode.ChainScale;
      let boneCount = this.bones.length, spacesCount = tangents ? boneCount : boneCount + 1;
      let bones = this.bones;
      let spaces = spine2.Utils.setArraySize(this.spaces, spacesCount), lengths = null;
      let spacing = this.spacing;
      if (scale || !percentSpacing) {
        if (scale) lengths = spine2.Utils.setArraySize(this.lengths, boneCount);
        let lengthSpacing = data.spacingMode == spine2.SpacingMode.Length;
        for (let i = 0, n = spacesCount - 1; i < n; ) {
          let bone = bones[i];
          let setupLength = bone.data.length;
          if (setupLength < _PathConstraint.epsilon) {
            if (scale) lengths[i] = 0;
            spaces[++i] = 0;
          } else if (percentSpacing) {
            if (scale) {
              let x = setupLength * bone.a, y = setupLength * bone.c;
              let length = Math.sqrt(x * x + y * y);
              lengths[i] = length;
            }
            spaces[++i] = spacing;
          } else {
            let x = setupLength * bone.a, y = setupLength * bone.c;
            let length = Math.sqrt(x * x + y * y);
            if (scale) lengths[i] = length;
            spaces[++i] = (lengthSpacing ? setupLength + spacing : spacing) * length / setupLength;
          }
        }
      } else {
        for (let i = 1; i < spacesCount; i++)
          spaces[i] = spacing;
      }
      let positions = this.computeWorldPositions(
        attachment,
        spacesCount,
        tangents,
        data.positionMode == spine2.PositionMode.Percent,
        percentSpacing
      );
      let boneX = positions[0], boneY = positions[1], offsetRotation = data.offsetRotation;
      let tip = false;
      if (offsetRotation == 0)
        tip = rotateMode == spine2.RotateMode.Chain;
      else {
        tip = false;
        let p = this.target.bone;
        offsetRotation *= p.a * p.d - p.b * p.c > 0 ? spine2.MathUtils.degRad : -spine2.MathUtils.degRad;
      }
      for (let i = 0, p = 3; i < boneCount; i++, p += 3) {
        let bone = bones[i];
        bone.worldX += (boneX - bone.worldX) * translateMix;
        bone.worldY += (boneY - bone.worldY) * translateMix;
        let x = positions[p], y = positions[p + 1], dx = x - boneX, dy = y - boneY;
        if (scale) {
          let length = lengths[i];
          if (length != 0) {
            let s = (Math.sqrt(dx * dx + dy * dy) / length - 1) * rotateMix + 1;
            bone.a *= s;
            bone.c *= s;
          }
        }
        boneX = x;
        boneY = y;
        if (rotate) {
          let a = bone.a, b = bone.b, c = bone.c, d = bone.d, r = 0, cos = 0, sin = 0;
          if (tangents)
            r = positions[p - 1];
          else if (spaces[i + 1] == 0)
            r = positions[p + 2];
          else
            r = Math.atan2(dy, dx);
          r -= Math.atan2(c, a);
          if (tip) {
            cos = Math.cos(r);
            sin = Math.sin(r);
            let length = bone.data.length;
            boneX += (length * (cos * a - sin * c) - dx) * rotateMix;
            boneY += (length * (sin * a + cos * c) - dy) * rotateMix;
          } else {
            r += offsetRotation;
          }
          if (r > spine2.MathUtils.PI)
            r -= spine2.MathUtils.PI2;
          else if (r < -spine2.MathUtils.PI)
            r += spine2.MathUtils.PI2;
          r *= rotateMix;
          cos = Math.cos(r);
          sin = Math.sin(r);
          bone.a = cos * a - sin * c;
          bone.b = cos * b - sin * d;
          bone.c = sin * a + cos * c;
          bone.d = sin * b + cos * d;
        }
        bone.appliedValid = false;
      }
    }
    computeWorldPositions(path, spacesCount, tangents, percentPosition, percentSpacing) {
      let target = this.target;
      let position = this.position;
      let spaces = this.spaces, out = spine2.Utils.setArraySize(this.positions, spacesCount * 3 + 2), world = null;
      let closed2 = path.closed;
      let verticesLength = path.worldVerticesLength, curveCount = verticesLength / 6, prevCurve = _PathConstraint.NONE;
      if (!path.constantSpeed) {
        let lengths = path.lengths;
        curveCount -= closed2 ? 1 : 2;
        let pathLength2 = lengths[curveCount];
        if (percentPosition) position *= pathLength2;
        if (percentSpacing) {
          for (let i = 1; i < spacesCount; i++)
            spaces[i] *= pathLength2;
        }
        world = spine2.Utils.setArraySize(this.world, 8);
        for (let i = 0, o = 0, curve = 0; i < spacesCount; i++, o += 3) {
          let space = spaces[i];
          position += space;
          let p = position;
          if (closed2) {
            p %= pathLength2;
            if (p < 0) p += pathLength2;
            curve = 0;
          } else if (p < 0) {
            if (prevCurve != _PathConstraint.BEFORE) {
              prevCurve = _PathConstraint.BEFORE;
              path.computeWorldVertices(target, 2, 4, world, 0, 2);
            }
            this.addBeforePosition(p, world, 0, out, o);
            continue;
          } else if (p > pathLength2) {
            if (prevCurve != _PathConstraint.AFTER) {
              prevCurve = _PathConstraint.AFTER;
              path.computeWorldVertices(target, verticesLength - 6, 4, world, 0, 2);
            }
            this.addAfterPosition(p - pathLength2, world, 0, out, o);
            continue;
          }
          for (; ; curve++) {
            let length = lengths[curve];
            if (p > length) continue;
            if (curve == 0)
              p /= length;
            else {
              let prev = lengths[curve - 1];
              p = (p - prev) / (length - prev);
            }
            break;
          }
          if (curve != prevCurve) {
            prevCurve = curve;
            if (closed2 && curve == curveCount) {
              path.computeWorldVertices(target, verticesLength - 4, 4, world, 0, 2);
              path.computeWorldVertices(target, 0, 4, world, 4, 2);
            } else
              path.computeWorldVertices(target, curve * 6 + 2, 8, world, 0, 2);
          }
          this.addCurvePosition(
            p,
            world[0],
            world[1],
            world[2],
            world[3],
            world[4],
            world[5],
            world[6],
            world[7],
            out,
            o,
            tangents || i > 0 && space == 0
          );
        }
        return out;
      }
      if (closed2) {
        verticesLength += 2;
        world = spine2.Utils.setArraySize(this.world, verticesLength);
        path.computeWorldVertices(target, 2, verticesLength - 4, world, 0, 2);
        path.computeWorldVertices(target, 0, 2, world, verticesLength - 4, 2);
        world[verticesLength - 2] = world[0];
        world[verticesLength - 1] = world[1];
      } else {
        curveCount--;
        verticesLength -= 4;
        world = spine2.Utils.setArraySize(this.world, verticesLength);
        path.computeWorldVertices(target, 2, verticesLength, world, 0, 2);
      }
      let curves = spine2.Utils.setArraySize(this.curves, curveCount);
      let pathLength = 0;
      let x1 = world[0], y1 = world[1], cx1 = 0, cy1 = 0, cx2 = 0, cy2 = 0, x2 = 0, y2 = 0;
      let tmpx = 0, tmpy = 0, dddfx = 0, dddfy = 0, ddfx = 0, ddfy = 0, dfx = 0, dfy = 0;
      for (let i = 0, w = 2; i < curveCount; i++, w += 6) {
        cx1 = world[w];
        cy1 = world[w + 1];
        cx2 = world[w + 2];
        cy2 = world[w + 3];
        x2 = world[w + 4];
        y2 = world[w + 5];
        tmpx = (x1 - cx1 * 2 + cx2) * 0.1875;
        tmpy = (y1 - cy1 * 2 + cy2) * 0.1875;
        dddfx = ((cx1 - cx2) * 3 - x1 + x2) * 0.09375;
        dddfy = ((cy1 - cy2) * 3 - y1 + y2) * 0.09375;
        ddfx = tmpx * 2 + dddfx;
        ddfy = tmpy * 2 + dddfy;
        dfx = (cx1 - x1) * 0.75 + tmpx + dddfx * 0.16666667;
        dfy = (cy1 - y1) * 0.75 + tmpy + dddfy * 0.16666667;
        pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
        dfx += ddfx;
        dfy += ddfy;
        ddfx += dddfx;
        ddfy += dddfy;
        pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
        dfx += ddfx;
        dfy += ddfy;
        pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
        dfx += ddfx + dddfx;
        dfy += ddfy + dddfy;
        pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
        curves[i] = pathLength;
        x1 = x2;
        y1 = y2;
      }
      if (percentPosition)
        position *= pathLength;
      else
        position *= pathLength / path.lengths[curveCount - 1];
      if (percentSpacing) {
        for (let i = 1; i < spacesCount; i++)
          spaces[i] *= pathLength;
      }
      let segments = this.segments;
      let curveLength = 0;
      for (let i = 0, o = 0, curve = 0, segment = 0; i < spacesCount; i++, o += 3) {
        let space = spaces[i];
        position += space;
        let p = position;
        if (closed2) {
          p %= pathLength;
          if (p < 0) p += pathLength;
          curve = 0;
        } else if (p < 0) {
          this.addBeforePosition(p, world, 0, out, o);
          continue;
        } else if (p > pathLength) {
          this.addAfterPosition(p - pathLength, world, verticesLength - 4, out, o);
          continue;
        }
        for (; ; curve++) {
          let length = curves[curve];
          if (p > length) continue;
          if (curve == 0)
            p /= length;
          else {
            let prev = curves[curve - 1];
            p = (p - prev) / (length - prev);
          }
          break;
        }
        if (curve != prevCurve) {
          prevCurve = curve;
          let ii = curve * 6;
          x1 = world[ii];
          y1 = world[ii + 1];
          cx1 = world[ii + 2];
          cy1 = world[ii + 3];
          cx2 = world[ii + 4];
          cy2 = world[ii + 5];
          x2 = world[ii + 6];
          y2 = world[ii + 7];
          tmpx = (x1 - cx1 * 2 + cx2) * 0.03;
          tmpy = (y1 - cy1 * 2 + cy2) * 0.03;
          dddfx = ((cx1 - cx2) * 3 - x1 + x2) * 6e-3;
          dddfy = ((cy1 - cy2) * 3 - y1 + y2) * 6e-3;
          ddfx = tmpx * 2 + dddfx;
          ddfy = tmpy * 2 + dddfy;
          dfx = (cx1 - x1) * 0.3 + tmpx + dddfx * 0.16666667;
          dfy = (cy1 - y1) * 0.3 + tmpy + dddfy * 0.16666667;
          curveLength = Math.sqrt(dfx * dfx + dfy * dfy);
          segments[0] = curveLength;
          for (ii = 1; ii < 8; ii++) {
            dfx += ddfx;
            dfy += ddfy;
            ddfx += dddfx;
            ddfy += dddfy;
            curveLength += Math.sqrt(dfx * dfx + dfy * dfy);
            segments[ii] = curveLength;
          }
          dfx += ddfx;
          dfy += ddfy;
          curveLength += Math.sqrt(dfx * dfx + dfy * dfy);
          segments[8] = curveLength;
          dfx += ddfx + dddfx;
          dfy += ddfy + dddfy;
          curveLength += Math.sqrt(dfx * dfx + dfy * dfy);
          segments[9] = curveLength;
          segment = 0;
        }
        p *= curveLength;
        for (; ; segment++) {
          let length = segments[segment];
          if (p > length) continue;
          if (segment == 0)
            p /= length;
          else {
            let prev = segments[segment - 1];
            p = segment + (p - prev) / (length - prev);
          }
          break;
        }
        this.addCurvePosition(p * 0.1, x1, y1, cx1, cy1, cx2, cy2, x2, y2, out, o, tangents || i > 0 && space == 0);
      }
      return out;
    }
    addBeforePosition(p, temp, i, out, o) {
      let x1 = temp[i], y1 = temp[i + 1], dx = temp[i + 2] - x1, dy = temp[i + 3] - y1, r = Math.atan2(dy, dx);
      out[o] = x1 + p * Math.cos(r);
      out[o + 1] = y1 + p * Math.sin(r);
      out[o + 2] = r;
    }
    addAfterPosition(p, temp, i, out, o) {
      let x1 = temp[i + 2], y1 = temp[i + 3], dx = x1 - temp[i], dy = y1 - temp[i + 1], r = Math.atan2(dy, dx);
      out[o] = x1 + p * Math.cos(r);
      out[o + 1] = y1 + p * Math.sin(r);
      out[o + 2] = r;
    }
    addCurvePosition(p, x1, y1, cx1, cy1, cx2, cy2, x2, y2, out, o, tangents) {
      if (p == 0 || isNaN(p)) {
        out[o] = x1;
        out[o + 1] = y1;
        out[o + 2] = Math.atan2(cy1 - y1, cx1 - x1);
        return;
      }
      let tt = p * p, ttt = tt * p, u = 1 - p, uu = u * u, uuu = uu * u;
      let ut = u * p, ut3 = ut * 3, uut3 = u * ut3, utt3 = ut3 * p;
      let x = x1 * uuu + cx1 * uut3 + cx2 * utt3 + x2 * ttt, y = y1 * uuu + cy1 * uut3 + cy2 * utt3 + y2 * ttt;
      out[o] = x;
      out[o + 1] = y;
      if (tangents) {
        if (p < 1e-3)
          out[o + 2] = Math.atan2(cy1 - y1, cx1 - x1);
        else
          out[o + 2] = Math.atan2(y - (y1 * uu + cy1 * ut * 2 + cy2 * tt), x - (x1 * uu + cx1 * ut * 2 + cx2 * tt));
      }
    }
  };
  __publicField(_PathConstraint, "NONE", -1);
  __publicField(_PathConstraint, "BEFORE", -2);
  __publicField(_PathConstraint, "AFTER", -3);
  __publicField(_PathConstraint, "epsilon", 1e-5);
  let PathConstraint = _PathConstraint;
  spine2.PathConstraint = _PathConstraint;
})(spine || (spine = {}));
((spine2) => {
  class PathConstraintData extends spine2.ConstraintData {
    constructor(name) {
      super(name, 0, false);
      /** The bones that will be modified by this path constraint. */
      __publicField(this, "bones", new Array());
      /** The slot whose path attachment will be used to constrained the bones. */
      __publicField(this, "target");
      /** The mode for positioning the first bone on the path. */
      __publicField(this, "positionMode");
      /** The mode for positioning the bones after the first bone on the path. */
      __publicField(this, "spacingMode");
      /** The mode for adjusting the rotation of the bones. */
      __publicField(this, "rotateMode");
      /** An offset added to the constrained bone rotation. */
      __publicField(this, "offsetRotation");
      /** The position along the path. */
      __publicField(this, "position");
      /** The spacing between bones. */
      __publicField(this, "spacing");
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
      __publicField(this, "rotateMix");
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
      __publicField(this, "translateMix");
    }
  }
  spine2.PathConstraintData = PathConstraintData;
  let PositionMode;
  ((PositionMode2) => {
    PositionMode2[PositionMode2["Fixed"] = 0] = "Fixed";
    PositionMode2[PositionMode2["Percent"] = 1] = "Percent";
  })(PositionMode = spine2.PositionMode || (spine2.PositionMode = {}));
  let SpacingMode;
  ((SpacingMode2) => {
    SpacingMode2[SpacingMode2["Length"] = 0] = "Length";
    SpacingMode2[SpacingMode2["Fixed"] = 1] = "Fixed";
    SpacingMode2[SpacingMode2["Percent"] = 2] = "Percent";
  })(SpacingMode = spine2.SpacingMode || (spine2.SpacingMode = {}));
  let RotateMode;
  ((RotateMode2) => {
    RotateMode2[RotateMode2["Tangent"] = 0] = "Tangent";
    RotateMode2[RotateMode2["Chain"] = 1] = "Chain";
    RotateMode2[RotateMode2["ChainScale"] = 2] = "ChainScale";
  })(RotateMode = spine2.RotateMode || (spine2.RotateMode = {}));
})(spine || (spine = {}));
((spine2) => {
  class Assets {
    constructor(clientId) {
      __publicField(this, "clientId");
      __publicField(this, "toLoad", new Array());
      __publicField(this, "assets", {});
      __publicField(this, "textureLoader");
      this.clientId = clientId;
    }
    loaded() {
      let i = 0;
      for (let v in this.assets) i++;
      return i;
    }
  }
  class SharedAssetManager {
    constructor(pathPrefix = "") {
      __publicField(this, "pathPrefix");
      __publicField(this, "clientAssets", {});
      __publicField(this, "queuedAssets", {});
      __publicField(this, "rawAssets", {});
      __publicField(this, "errors", {});
      this.pathPrefix = pathPrefix;
    }
    queueAsset(clientId, textureLoader, path) {
      let clientAssets = this.clientAssets[clientId];
      if (clientAssets === null || clientAssets === void 0) {
        clientAssets = new Assets(clientId);
        this.clientAssets[clientId] = clientAssets;
      }
      if (textureLoader !== null) clientAssets.textureLoader = textureLoader;
      clientAssets.toLoad.push(path);
      if (this.queuedAssets[path] === path) {
        return false;
      } else {
        this.queuedAssets[path] = path;
        return true;
      }
    }
    loadText(clientId, path) {
      path = this.pathPrefix + path;
      if (!this.queueAsset(clientId, null, path)) return;
      let request = new XMLHttpRequest();
      request.overrideMimeType("text/html");
      request.onreadystatechange = () => {
        if (request.readyState == XMLHttpRequest.DONE) {
          if (request.status >= 200 && request.status < 300) {
            this.rawAssets[path] = request.responseText;
          } else {
            this.errors[path] = `Couldn't load text ${path}: status ${request.status}, ${request.responseText}`;
          }
        }
      };
      request.open("GET", path, true);
      request.send();
    }
    loadJson(clientId, path) {
      path = this.pathPrefix + path;
      if (!this.queueAsset(clientId, null, path)) return;
      let request = new XMLHttpRequest();
      request.overrideMimeType("text/html");
      request.onreadystatechange = () => {
        if (request.readyState == XMLHttpRequest.DONE) {
          if (request.status >= 200 && request.status < 300) {
            this.rawAssets[path] = JSON.parse(request.responseText);
          } else {
            this.errors[path] = `Couldn't load text ${path}: status ${request.status}, ${request.responseText}`;
          }
        }
      };
      request.open("GET", path, true);
      request.send();
    }
    loadTexture(clientId, textureLoader, path) {
      path = this.pathPrefix + path;
      if (!this.queueAsset(clientId, textureLoader, path)) return;
      let isBrowser = !!(typeof window !== "undefined" && typeof navigator !== "undefined" && window.document);
      let isWebWorker = !isBrowser && typeof importScripts !== "undefined";
      if (isWebWorker) {
        const options = { mode: "cors" };
        fetch(path, options).then((response) => {
          if (!response.ok) {
            this.errors[path] = "Couldn't load image " + path;
          }
          return response.blob();
        }).then((blob) => {
          return createImageBitmap(blob, {
            premultiplyAlpha: "none",
            colorSpaceConversion: "none"
          });
        }).then((bitmap) => {
          this.rawAssets[path] = bitmap;
        });
      } else {
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = (ev) => {
          this.rawAssets[path] = img;
        };
        img.onerror = (ev) => {
          this.errors[path] = `Couldn't load image ${path}`;
        };
        img.src = path;
      }
    }
    get(clientId, path) {
      path = this.pathPrefix + path;
      let clientAssets = this.clientAssets[clientId];
      if (clientAssets === null || clientAssets === void 0) return true;
      return clientAssets.assets[path];
    }
    updateClientAssets(clientAssets) {
      let isBrowser = !!(typeof window !== "undefined" && typeof navigator !== "undefined" && window.document);
      let isWebWorker = !isBrowser && typeof importScripts !== "undefined";
      for (let i = 0; i < clientAssets.toLoad.length; i++) {
        let path = clientAssets.toLoad[i];
        let asset = clientAssets.assets[path];
        if (asset === null || asset === void 0) {
          let rawAsset = this.rawAssets[path];
          if (rawAsset === null || rawAsset === void 0) continue;
          if (isWebWorker) {
            if (rawAsset instanceof ImageBitmap) {
              clientAssets.assets[path] = clientAssets.textureLoader(rawAsset);
            } else {
              clientAssets.assets[path] = rawAsset;
            }
          } else {
            if (rawAsset instanceof HTMLImageElement) {
              clientAssets.assets[path] = clientAssets.textureLoader(rawAsset);
            } else {
              clientAssets.assets[path] = rawAsset;
            }
          }
        }
      }
    }
    isLoadingComplete(clientId) {
      let clientAssets = this.clientAssets[clientId];
      if (clientAssets === null || clientAssets === void 0) return true;
      this.updateClientAssets(clientAssets);
      return clientAssets.toLoad.length == clientAssets.loaded();
    }
    /*remove (clientId: string, path: string) {
    			path = this.pathPrefix + path;
    			let asset = this.assets[path];
    			if ((<any>asset).dispose) (<any>asset).dispose();
    			this.assets[path] = null;
    		}
    
    		removeAll () {
    			for (let key in this.assets) {
    				let asset = this.assets[key];
    				if ((<any>asset).dispose) (<any>asset).dispose();
    			}
    			this.assets = {};
    		}*/
    dispose() {
    }
    hasErrors() {
      return Object.keys(this.errors).length > 0;
    }
    getErrors() {
      return this.errors;
    }
  }
  spine2.SharedAssetManager = SharedAssetManager;
})(spine || (spine = {}));
((spine2) => {
  class Skeleton {
    constructor(data) {
      /** The skeleton's setup pose data. */
      __publicField(this, "data");
      /** The skeleton's bones, sorted parent first. The root bone is always the first bone. */
      __publicField(this, "bones");
      /** The skeleton's slots. */
      __publicField(this, "slots");
      /** The skeleton's slots in the order they should be drawn. The returned array may be modified to change the draw order. */
      __publicField(this, "drawOrder");
      /** The skeleton's IK constraints. */
      __publicField(this, "ikConstraints");
      /** The skeleton's transform constraints. */
      __publicField(this, "transformConstraints");
      /** The skeleton's path constraints. */
      __publicField(this, "pathConstraints");
      /** The list of bones and constraints, sorted in the order they should be updated, as computed by {@link #updateCache()}. */
      __publicField(this, "_updateCache", new Array());
      __publicField(this, "updateCacheReset", new Array());
      /** The skeleton's current skin. May be null. */
      __publicField(this, "skin");
      /** The color to tint all the skeleton's attachments. */
      __publicField(this, "color");
      /** Returns the skeleton's time. This can be used for tracking, such as with Slot {@link Slot#attachmentTime}.
       * <p>
       * See {@link #update()}. */
      __publicField(this, "time", 0);
      /** Scales the entire skeleton on the X axis. This affects all bones, even if the bone's transform mode disallows scale
      	* inheritance. */
      __publicField(this, "scaleX", 1);
      /** Scales the entire skeleton on the Y axis. This affects all bones, even if the bone's transform mode disallows scale
      	* inheritance. */
      __publicField(this, "scaleY", 1);
      /** Sets the skeleton X position, which is added to the root bone worldX position. */
      __publicField(this, "x", 0);
      /** Sets the skeleton Y position, which is added to the root bone worldY position. */
      __publicField(this, "y", 0);
      if (data == null) throw new Error("data cannot be null.");
      this.data = data;
      this.bones = new Array();
      for (let i = 0; i < data.bones.length; i++) {
        let boneData = data.bones[i];
        let bone;
        if (boneData.parent == null)
          bone = new spine2.Bone(boneData, this, null);
        else {
          let parent = this.bones[boneData.parent.index];
          bone = new spine2.Bone(boneData, this, parent);
          parent.children.push(bone);
        }
        this.bones.push(bone);
      }
      this.slots = new Array();
      this.drawOrder = new Array();
      for (let i = 0; i < data.slots.length; i++) {
        let slotData = data.slots[i];
        let bone = this.bones[slotData.boneData.index];
        let slot = new spine2.Slot(slotData, bone);
        this.slots.push(slot);
        this.drawOrder.push(slot);
      }
      this.ikConstraints = new Array();
      for (let i = 0; i < data.ikConstraints.length; i++) {
        let ikConstraintData = data.ikConstraints[i];
        this.ikConstraints.push(new spine2.IkConstraint(ikConstraintData, this));
      }
      this.transformConstraints = new Array();
      for (let i = 0; i < data.transformConstraints.length; i++) {
        let transformConstraintData = data.transformConstraints[i];
        this.transformConstraints.push(new spine2.TransformConstraint(transformConstraintData, this));
      }
      this.pathConstraints = new Array();
      for (let i = 0; i < data.pathConstraints.length; i++) {
        let pathConstraintData = data.pathConstraints[i];
        this.pathConstraints.push(new spine2.PathConstraint(pathConstraintData, this));
      }
      this.color = new spine2.Color(1, 1, 1, 1);
      this.updateCache();
    }
    /** Caches information about bones and constraints. Must be called if the {@link #getSkin()} is modified or if bones,
     * constraints, or weighted path attachments are added or removed. */
    updateCache() {
      let updateCache = this._updateCache;
      updateCache.length = 0;
      this.updateCacheReset.length = 0;
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        bone.sorted = bone.data.skinRequired;
        bone.active = !bone.sorted;
      }
      if (this.skin != null) {
        let skinBones = this.skin.bones;
        for (let i = 0, n = this.skin.bones.length; i < n; i++) {
          let bone = this.bones[skinBones[i].index];
          do {
            bone.sorted = false;
            bone.active = true;
            bone = bone.parent;
          } while (bone != null);
        }
      }
      let ikConstraints = this.ikConstraints;
      let transformConstraints = this.transformConstraints;
      let pathConstraints = this.pathConstraints;
      let ikCount = ikConstraints.length, transformCount = transformConstraints.length, pathCount = pathConstraints.length;
      let constraintCount = ikCount + transformCount + pathCount;
      outer:
        for (let i = 0; i < constraintCount; i++) {
          for (let ii = 0; ii < ikCount; ii++) {
            let constraint = ikConstraints[ii];
            if (constraint.data.order == i) {
              this.sortIkConstraint(constraint);
              continue outer;
            }
          }
          for (let ii = 0; ii < transformCount; ii++) {
            let constraint = transformConstraints[ii];
            if (constraint.data.order == i) {
              this.sortTransformConstraint(constraint);
              continue outer;
            }
          }
          for (let ii = 0; ii < pathCount; ii++) {
            let constraint = pathConstraints[ii];
            if (constraint.data.order == i) {
              this.sortPathConstraint(constraint);
              continue outer;
            }
          }
        }
      for (let i = 0, n = bones.length; i < n; i++)
        this.sortBone(bones[i]);
    }
    sortIkConstraint(constraint) {
      constraint.active = constraint.target.isActive() && (!constraint.data.skinRequired || this.skin != null && spine2.Utils.contains(this.skin.constraints, constraint.data, true));
      if (!constraint.active) return;
      let target = constraint.target;
      this.sortBone(target);
      let constrained = constraint.bones;
      let parent = constrained[0];
      this.sortBone(parent);
      if (constrained.length > 1) {
        let child = constrained[constrained.length - 1];
        if (!(this._updateCache.indexOf(child) > -1)) this.updateCacheReset.push(child);
      }
      this._updateCache.push(constraint);
      this.sortReset(parent.children);
      constrained[constrained.length - 1].sorted = true;
    }
    sortPathConstraint(constraint) {
      constraint.active = constraint.target.bone.isActive() && (!constraint.data.skinRequired || this.skin != null && spine2.Utils.contains(this.skin.constraints, constraint.data, true));
      if (!constraint.active) return;
      let slot = constraint.target;
      let slotIndex = slot.data.index;
      let slotBone = slot.bone;
      if (this.skin != null) this.sortPathConstraintAttachment(this.skin, slotIndex, slotBone);
      if (this.data.defaultSkin != null && this.data.defaultSkin != this.skin)
        this.sortPathConstraintAttachment(this.data.defaultSkin, slotIndex, slotBone);
      for (let i = 0, n = this.data.skins.length; i < n; i++)
        this.sortPathConstraintAttachment(this.data.skins[i], slotIndex, slotBone);
      let attachment = slot.getAttachment();
      if (attachment instanceof spine2.PathAttachment) this.sortPathConstraintAttachmentWith(attachment, slotBone);
      let constrained = constraint.bones;
      let boneCount = constrained.length;
      for (let i = 0; i < boneCount; i++)
        this.sortBone(constrained[i]);
      this._updateCache.push(constraint);
      for (let i = 0; i < boneCount; i++)
        this.sortReset(constrained[i].children);
      for (let i = 0; i < boneCount; i++)
        constrained[i].sorted = true;
    }
    sortTransformConstraint(constraint) {
      constraint.active = constraint.target.isActive() && (!constraint.data.skinRequired || this.skin != null && spine2.Utils.contains(this.skin.constraints, constraint.data, true));
      if (!constraint.active) return;
      this.sortBone(constraint.target);
      let constrained = constraint.bones;
      let boneCount = constrained.length;
      if (constraint.data.local) {
        for (let i = 0; i < boneCount; i++) {
          let child = constrained[i];
          this.sortBone(child.parent);
          if (!(this._updateCache.indexOf(child) > -1)) this.updateCacheReset.push(child);
        }
      } else {
        for (let i = 0; i < boneCount; i++) {
          this.sortBone(constrained[i]);
        }
      }
      this._updateCache.push(constraint);
      for (let ii = 0; ii < boneCount; ii++)
        this.sortReset(constrained[ii].children);
      for (let ii = 0; ii < boneCount; ii++)
        constrained[ii].sorted = true;
    }
    sortPathConstraintAttachment(skin, slotIndex, slotBone) {
      let attachments = skin.attachments[slotIndex];
      if (!attachments) return;
      for (let key in attachments) {
        this.sortPathConstraintAttachmentWith(attachments[key], slotBone);
      }
    }
    sortPathConstraintAttachmentWith(attachment, slotBone) {
      if (!(attachment instanceof spine2.PathAttachment)) return;
      let pathBones = attachment.bones;
      if (pathBones == null)
        this.sortBone(slotBone);
      else {
        let bones = this.bones;
        let i = 0;
        while (i < pathBones.length) {
          let boneCount = pathBones[i++];
          for (let n = i + boneCount; i < n; i++) {
            let boneIndex = pathBones[i];
            this.sortBone(bones[boneIndex]);
          }
        }
      }
    }
    sortBone(bone) {
      if (bone.sorted) return;
      let parent = bone.parent;
      if (parent != null) this.sortBone(parent);
      bone.sorted = true;
      this._updateCache.push(bone);
    }
    sortReset(bones) {
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        if (!bone.active) continue;
        if (bone.sorted) this.sortReset(bone.children);
        bone.sorted = false;
      }
    }
    /** Updates the world transform for each bone and applies all constraints.
     *
     * See [World transforms](http://esotericsoftware.com/spine-runtime-skeletons#World-transforms) in the Spine
     * Runtimes Guide. */
    updateWorldTransform() {
      let updateCacheReset = this.updateCacheReset;
      for (let i = 0, n = updateCacheReset.length; i < n; i++) {
        let bone = updateCacheReset[i];
        bone.ax = bone.x;
        bone.ay = bone.y;
        bone.arotation = bone.rotation;
        bone.ascaleX = bone.scaleX;
        bone.ascaleY = bone.scaleY;
        bone.ashearX = bone.shearX;
        bone.ashearY = bone.shearY;
        bone.appliedValid = true;
      }
      let updateCache = this._updateCache;
      for (let i = 0, n = updateCache.length; i < n; i++)
        updateCache[i].update();
    }
    /** Sets the bones, constraints, and slots to their setup pose values. */
    setToSetupPose() {
      this.setBonesToSetupPose();
      this.setSlotsToSetupPose();
    }
    /** Sets the bones and constraints to their setup pose values. */
    setBonesToSetupPose() {
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++)
        bones[i].setToSetupPose();
      let ikConstraints = this.ikConstraints;
      for (let i = 0, n = ikConstraints.length; i < n; i++) {
        let constraint = ikConstraints[i];
        constraint.mix = constraint.data.mix;
        constraint.softness = constraint.data.softness;
        constraint.bendDirection = constraint.data.bendDirection;
        constraint.compress = constraint.data.compress;
        constraint.stretch = constraint.data.stretch;
      }
      let transformConstraints = this.transformConstraints;
      for (let i = 0, n = transformConstraints.length; i < n; i++) {
        let constraint = transformConstraints[i];
        let data = constraint.data;
        constraint.rotateMix = data.rotateMix;
        constraint.translateMix = data.translateMix;
        constraint.scaleMix = data.scaleMix;
        constraint.shearMix = data.shearMix;
      }
      let pathConstraints = this.pathConstraints;
      for (let i = 0, n = pathConstraints.length; i < n; i++) {
        let constraint = pathConstraints[i];
        let data = constraint.data;
        constraint.position = data.position;
        constraint.spacing = data.spacing;
        constraint.rotateMix = data.rotateMix;
        constraint.translateMix = data.translateMix;
      }
    }
    /** Sets the slots and draw order to their setup pose values. */
    setSlotsToSetupPose() {
      let slots = this.slots;
      spine2.Utils.arrayCopy(slots, 0, this.drawOrder, 0, slots.length);
      for (let i = 0, n = slots.length; i < n; i++)
        slots[i].setToSetupPose();
    }
    /** @returns May return null. */
    getRootBone() {
      if (this.bones.length == 0) return null;
      return this.bones[0];
    }
    /** @returns May be null. */
    findBone(boneName) {
      if (boneName == null) throw new Error("boneName cannot be null.");
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        if (bone.data.name == boneName) return bone;
      }
      return null;
    }
    /** @returns -1 if the bone was not found. */
    findBoneIndex(boneName) {
      if (boneName == null) throw new Error("boneName cannot be null.");
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++)
        if (bones[i].data.name == boneName) return i;
      return -1;
    }
    /** Finds a slot by comparing each slot's name. It is more efficient to cache the results of this method than to call it
     * repeatedly.
     * @returns May be null. */
    findSlot(slotName) {
      if (slotName == null) throw new Error("slotName cannot be null.");
      let slots = this.slots;
      for (let i = 0, n = slots.length; i < n; i++) {
        let slot = slots[i];
        if (slot.data.name == slotName) return slot;
      }
      return null;
    }
    /** @returns -1 if the bone was not found. */
    findSlotIndex(slotName) {
      if (slotName == null) throw new Error("slotName cannot be null.");
      let slots = this.slots;
      for (let i = 0, n = slots.length; i < n; i++)
        if (slots[i].data.name == slotName) return i;
      return -1;
    }
    /** Sets a skin by name.
     *
     * See {@link #setSkin()}. */
    setSkinByName(skinName) {
      let skin = this.data.findSkin(skinName);
      if (skin == null) throw new Error("Skin not found: " + skinName);
      this.setSkin(skin);
    }
    /** Sets the skin used to look up attachments before looking in the {@link SkeletonData#defaultSkin default skin}. If the
     * skin is changed, {@link #updateCache()} is called.
     *
     * Attachments from the new skin are attached if the corresponding attachment from the old skin was attached. If there was no
     * old skin, each slot's setup mode attachment is attached from the new skin.
     *
     * After changing the skin, the visible attachments can be reset to those attached in the setup pose by calling
     * {@link #setSlotsToSetupPose()}. Also, often {@link AnimationState#apply()} is called before the next time the
     * skeleton is rendered to allow any attachment keys in the current animation(s) to hide or show attachments from the new skin.
     * @param newSkin May be null. */
    setSkin(newSkin) {
      if (newSkin == this.skin) return;
      if (newSkin != null) {
        if (this.skin != null)
          newSkin.attachAll(this, this.skin);
        else {
          let slots = this.slots;
          for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            let name = slot.data.attachmentName;
            if (name != null) {
              let attachment = newSkin.getAttachment(i, name);
              if (attachment != null) slot.setAttachment(attachment);
            }
          }
        }
      }
      this.skin = newSkin;
      this.updateCache();
    }
    /** Finds an attachment by looking in the {@link #skin} and {@link SkeletonData#defaultSkin} using the slot name and attachment
     * name.
     *
     * See {@link #getAttachment()}.
     * @returns May be null. */
    getAttachmentByName(slotName, attachmentName) {
      return this.getAttachment(this.data.findSlotIndex(slotName), attachmentName);
    }
    /** Finds an attachment by looking in the {@link #skin} and {@link SkeletonData#defaultSkin} using the slot index and
     * attachment name. First the skin is checked and if the attachment was not found, the default skin is checked.
     *
     * See [Runtime skins](http://esotericsoftware.com/spine-runtime-skins) in the Spine Runtimes Guide.
     * @returns May be null. */
    getAttachment(slotIndex, attachmentName) {
      if (attachmentName == null) throw new Error("attachmentName cannot be null.");
      if (this.skin != null) {
        let attachment = this.skin.getAttachment(slotIndex, attachmentName);
        if (attachment != null) return attachment;
      }
      if (this.data.defaultSkin != null) return this.data.defaultSkin.getAttachment(slotIndex, attachmentName);
      return null;
    }
    /** A convenience method to set an attachment by finding the slot with {@link #findSlot()}, finding the attachment with
     * {@link #getAttachment()}, then setting the slot's {@link Slot#attachment}.
     * @param attachmentName May be null to clear the slot's attachment. */
    setAttachment(slotName, attachmentName) {
      if (slotName == null) throw new Error("slotName cannot be null.");
      let slots = this.slots;
      for (let i = 0, n = slots.length; i < n; i++) {
        let slot = slots[i];
        if (slot.data.name == slotName) {
          let attachment = null;
          if (attachmentName != null) {
            attachment = this.getAttachment(i, attachmentName);
            if (attachment == null)
              throw new Error("Attachment not found: " + attachmentName + ", for slot: " + slotName);
          }
          slot.setAttachment(attachment);
          return;
        }
      }
      throw new Error("Slot not found: " + slotName);
    }
    /** Finds an IK constraint by comparing each IK constraint's name. It is more efficient to cache the results of this method
     * than to call it repeatedly.
     * @return May be null. */
    findIkConstraint(constraintName) {
      if (constraintName == null) throw new Error("constraintName cannot be null.");
      let ikConstraints = this.ikConstraints;
      for (let i = 0, n = ikConstraints.length; i < n; i++) {
        let ikConstraint = ikConstraints[i];
        if (ikConstraint.data.name == constraintName) return ikConstraint;
      }
      return null;
    }
    /** Finds a transform constraint by comparing each transform constraint's name. It is more efficient to cache the results of
     * this method than to call it repeatedly.
     * @return May be null. */
    findTransformConstraint(constraintName) {
      if (constraintName == null) throw new Error("constraintName cannot be null.");
      let transformConstraints = this.transformConstraints;
      for (let i = 0, n = transformConstraints.length; i < n; i++) {
        let constraint = transformConstraints[i];
        if (constraint.data.name == constraintName) return constraint;
      }
      return null;
    }
    /** Finds a path constraint by comparing each path constraint's name. It is more efficient to cache the results of this method
     * than to call it repeatedly.
     * @return May be null. */
    findPathConstraint(constraintName) {
      if (constraintName == null) throw new Error("constraintName cannot be null.");
      let pathConstraints = this.pathConstraints;
      for (let i = 0, n = pathConstraints.length; i < n; i++) {
        let constraint = pathConstraints[i];
        if (constraint.data.name == constraintName) return constraint;
      }
      return null;
    }
    /** Returns the axis aligned bounding box (AABB) of the region and mesh attachments for the current pose.
     * @param offset An output value, the distance from the skeleton origin to the bottom left corner of the AABB.
     * @param size An output value, the width and height of the AABB.
     * @param temp Working memory to temporarily store attachments' computed world vertices. */
    getBounds(offset, size, temp = new Array(2)) {
      if (offset == null) throw new Error("offset cannot be null.");
      if (size == null) throw new Error("size cannot be null.");
      let drawOrder = this.drawOrder;
      let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
      for (let i = 0, n = drawOrder.length; i < n; i++) {
        let slot = drawOrder[i];
        if (!slot.bone.active) continue;
        let verticesLength = 0;
        let vertices = null;
        let attachment = slot.getAttachment();
        if (attachment instanceof spine2.RegionAttachment) {
          verticesLength = 8;
          vertices = spine2.Utils.setArraySize(temp, verticesLength, 0);
          attachment.computeWorldVertices(slot.bone, vertices, 0, 2);
        } else if (attachment instanceof spine2.MeshAttachment) {
          let mesh = attachment;
          verticesLength = mesh.worldVerticesLength;
          vertices = spine2.Utils.setArraySize(temp, verticesLength, 0);
          mesh.computeWorldVertices(slot, 0, verticesLength, vertices, 0, 2);
        }
        if (vertices != null) {
          for (let ii = 0, nn = vertices.length; ii < nn; ii += 2) {
            let x = vertices[ii], y = vertices[ii + 1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      offset.set(minX, minY);
      size.set(maxX - minX, maxY - minY);
    }
    /** Increments the skeleton's {@link #time}. */
    update(delta) {
      this.time += delta;
    }
  }
  spine2.Skeleton = Skeleton;
})(spine || (spine = {}));
((spine2) => {
  const _SkeletonBinary = class _SkeletonBinary {
    constructor(attachmentLoader) {
      /** Scales bone positions, image sizes, and translations as they are loaded. This allows different size images to be used at
       * runtime than were used in Spine.
       *
       * See [Scaling](http://esotericsoftware.com/spine-loading-skeleton-data#Scaling) in the Spine Runtimes Guide. */
      __publicField(this, "scale", 1);
      __publicField(this, "attachmentLoader");
      __publicField(this, "linkedMeshes", new Array());
      this.attachmentLoader = attachmentLoader;
    }
    readSkeletonData(binary) {
      let scale = this.scale;
      let skeletonData = new spine2.SkeletonData();
      skeletonData.name = "";
      let input = new BinaryInput(binary);
      skeletonData.hash = input.readString();
      skeletonData.version = input.readString();
      if ("3.8.75" == skeletonData.version)
        throw new Error("Unsupported skeleton data, please export with a newer version of Spine.");
      skeletonData.x = input.readFloat();
      skeletonData.y = input.readFloat();
      skeletonData.width = input.readFloat();
      skeletonData.height = input.readFloat();
      let nonessential = input.readBoolean();
      if (nonessential) {
        skeletonData.fps = input.readFloat();
        skeletonData.imagesPath = input.readString();
        skeletonData.audioPath = input.readString();
      }
      let n = 0;
      n = input.readInt(true);
      for (let i = 0; i < n; i++)
        input.strings.push(input.readString());
      n = input.readInt(true);
      for (let i = 0; i < n; i++) {
        let name = input.readString();
        let parent = i == 0 ? null : skeletonData.bones[input.readInt(true)];
        let data = new spine2.BoneData(i, name, parent);
        data.rotation = input.readFloat();
        data.x = input.readFloat() * scale;
        data.y = input.readFloat() * scale;
        data.scaleX = input.readFloat();
        data.scaleY = input.readFloat();
        data.shearX = input.readFloat();
        data.shearY = input.readFloat();
        data.length = input.readFloat() * scale;
        data.transformMode = _SkeletonBinary.TransformModeValues[input.readInt(true)];
        data.skinRequired = input.readBoolean();
        if (nonessential) spine2.Color.rgba8888ToColor(data.color, input.readInt32());
        skeletonData.bones.push(data);
      }
      n = input.readInt(true);
      for (let i = 0; i < n; i++) {
        let slotName = input.readString();
        let boneData = skeletonData.bones[input.readInt(true)];
        let data = new spine2.SlotData(i, slotName, boneData);
        spine2.Color.rgba8888ToColor(data.color, input.readInt32());
        let darkColor = input.readInt32();
        if (darkColor != -1) spine2.Color.rgb888ToColor(data.darkColor = new spine2.Color(), darkColor);
        data.attachmentName = input.readStringRef();
        data.blendMode = _SkeletonBinary.BlendModeValues[input.readInt(true)];
        skeletonData.slots.push(data);
      }
      n = input.readInt(true);
      for (let i = 0, nn; i < n; i++) {
        let data = new spine2.IkConstraintData(input.readString());
        data.order = input.readInt(true);
        data.skinRequired = input.readBoolean();
        nn = input.readInt(true);
        for (let ii = 0; ii < nn; ii++)
          data.bones.push(skeletonData.bones[input.readInt(true)]);
        data.target = skeletonData.bones[input.readInt(true)];
        data.mix = input.readFloat();
        data.softness = input.readFloat() * scale;
        data.bendDirection = input.readByte();
        data.compress = input.readBoolean();
        data.stretch = input.readBoolean();
        data.uniform = input.readBoolean();
        skeletonData.ikConstraints.push(data);
      }
      n = input.readInt(true);
      for (let i = 0, nn; i < n; i++) {
        let data = new spine2.TransformConstraintData(input.readString());
        data.order = input.readInt(true);
        data.skinRequired = input.readBoolean();
        nn = input.readInt(true);
        for (let ii = 0; ii < nn; ii++)
          data.bones.push(skeletonData.bones[input.readInt(true)]);
        data.target = skeletonData.bones[input.readInt(true)];
        data.local = input.readBoolean();
        data.relative = input.readBoolean();
        data.offsetRotation = input.readFloat();
        data.offsetX = input.readFloat() * scale;
        data.offsetY = input.readFloat() * scale;
        data.offsetScaleX = input.readFloat();
        data.offsetScaleY = input.readFloat();
        data.offsetShearY = input.readFloat();
        data.rotateMix = input.readFloat();
        data.translateMix = input.readFloat();
        data.scaleMix = input.readFloat();
        data.shearMix = input.readFloat();
        skeletonData.transformConstraints.push(data);
      }
      n = input.readInt(true);
      for (let i = 0, nn; i < n; i++) {
        let data = new spine2.PathConstraintData(input.readString());
        data.order = input.readInt(true);
        data.skinRequired = input.readBoolean();
        nn = input.readInt(true);
        for (let ii = 0; ii < nn; ii++)
          data.bones.push(skeletonData.bones[input.readInt(true)]);
        data.target = skeletonData.slots[input.readInt(true)];
        data.positionMode = _SkeletonBinary.PositionModeValues[input.readInt(true)];
        data.spacingMode = _SkeletonBinary.SpacingModeValues[input.readInt(true)];
        data.rotateMode = _SkeletonBinary.RotateModeValues[input.readInt(true)];
        data.offsetRotation = input.readFloat();
        data.position = input.readFloat();
        if (data.positionMode == 0 /* Fixed */) data.position *= scale;
        data.spacing = input.readFloat();
        if (data.spacingMode == 0 /* Length */ || data.spacingMode == 1 /* Fixed */) data.spacing *= scale;
        data.rotateMix = input.readFloat();
        data.translateMix = input.readFloat();
        skeletonData.pathConstraints.push(data);
      }
      let defaultSkin = this.readSkin(input, skeletonData, true, nonessential);
      if (defaultSkin != null) {
        skeletonData.defaultSkin = defaultSkin;
        skeletonData.skins.push(defaultSkin);
      }
      {
        let i = skeletonData.skins.length;
        spine2.Utils.setArraySize(skeletonData.skins, n = i + input.readInt(true));
        for (; i < n; i++)
          skeletonData.skins[i] = this.readSkin(input, skeletonData, false, nonessential);
      }
      n = this.linkedMeshes.length;
      for (let i = 0; i < n; i++) {
        let linkedMesh = this.linkedMeshes[i];
        let skin = linkedMesh.skin == null ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin);
        if (skin == null) throw new Error("Skin not found: " + linkedMesh.skin);
        let parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent);
        if (parent == null) throw new Error("Parent mesh not found: " + linkedMesh.parent);
        linkedMesh.mesh.deformAttachment = linkedMesh.inheritDeform ? parent : linkedMesh.mesh;
        linkedMesh.mesh.setParentMesh(parent);
        linkedMesh.mesh.updateUVs();
      }
      this.linkedMeshes.length = 0;
      n = input.readInt(true);
      for (let i = 0; i < n; i++) {
        let data = new spine2.EventData(input.readStringRef());
        data.intValue = input.readInt(false);
        data.floatValue = input.readFloat();
        data.stringValue = input.readString();
        data.audioPath = input.readString();
        if (data.audioPath != null) {
          data.volume = input.readFloat();
          data.balance = input.readFloat();
        }
        skeletonData.events.push(data);
      }
      n = input.readInt(true);
      for (let i = 0; i < n; i++)
        skeletonData.animations.push(this.readAnimation(input, input.readString(), skeletonData));
      return skeletonData;
    }
    readSkin(input, skeletonData, defaultSkin, nonessential) {
      let skin = null;
      let slotCount = 0;
      if (defaultSkin) {
        slotCount = input.readInt(true);
        if (slotCount == 0) return null;
        skin = new spine2.Skin("default");
      } else {
        skin = new spine2.Skin(input.readStringRef());
        skin.bones.length = input.readInt(true);
        for (let i = 0, n = skin.bones.length; i < n; i++)
          skin.bones[i] = skeletonData.bones[input.readInt(true)];
        for (let i = 0, n = input.readInt(true); i < n; i++)
          skin.constraints.push(skeletonData.ikConstraints[input.readInt(true)]);
        for (let i = 0, n = input.readInt(true); i < n; i++)
          skin.constraints.push(skeletonData.transformConstraints[input.readInt(true)]);
        for (let i = 0, n = input.readInt(true); i < n; i++)
          skin.constraints.push(skeletonData.pathConstraints[input.readInt(true)]);
        slotCount = input.readInt(true);
      }
      for (let i = 0; i < slotCount; i++) {
        let slotIndex = input.readInt(true);
        for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
          let name = input.readStringRef();
          let attachment = this.readAttachment(input, skeletonData, skin, slotIndex, name, nonessential);
          if (attachment != null) skin.setAttachment(slotIndex, name, attachment);
        }
      }
      return skin;
    }
    readAttachment(input, skeletonData, skin, slotIndex, attachmentName, nonessential) {
      let scale = this.scale;
      let name = input.readStringRef();
      if (name == null) name = attachmentName;
      let typeIndex = input.readByte();
      let type = _SkeletonBinary.AttachmentTypeValues[typeIndex];
      switch (type) {
        case spine2.AttachmentType.Region: {
          let path = input.readStringRef();
          let rotation = input.readFloat();
          let x = input.readFloat();
          let y = input.readFloat();
          let scaleX = input.readFloat();
          let scaleY = input.readFloat();
          let width = input.readFloat();
          let height = input.readFloat();
          let color = input.readInt32();
          if (path == null) path = name;
          let region = this.attachmentLoader.newRegionAttachment(skin, name, path);
          if (region == null) return null;
          region.path = path;
          region.x = x * scale;
          region.y = y * scale;
          region.scaleX = scaleX;
          region.scaleY = scaleY;
          region.rotation = rotation;
          region.width = width * scale;
          region.height = height * scale;
          spine2.Color.rgba8888ToColor(region.color, color);
          region.updateOffset();
          return region;
        }
        case spine2.AttachmentType.BoundingBox: {
          let vertexCount = input.readInt(true);
          let vertices = this.readVertices(input, vertexCount);
          let color = nonessential ? input.readInt32() : 0;
          let box = this.attachmentLoader.newBoundingBoxAttachment(skin, name);
          if (box == null) return null;
          box.worldVerticesLength = vertexCount << 1;
          box.vertices = vertices.vertices;
          box.bones = vertices.bones;
          if (nonessential) spine2.Color.rgba8888ToColor(box.color, color);
          return box;
        }
        case spine2.AttachmentType.Mesh: {
          let path = input.readStringRef();
          let color = input.readInt32();
          let vertexCount = input.readInt(true);
          let uvs = this.readFloatArray(input, vertexCount << 1, 1);
          let triangles = this.readShortArray(input);
          let vertices = this.readVertices(input, vertexCount);
          let hullLength = input.readInt(true);
          let edges = null;
          let width = 0, height = 0;
          if (nonessential) {
            edges = this.readShortArray(input);
            width = input.readFloat();
            height = input.readFloat();
          }
          if (path == null) path = name;
          let mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
          if (mesh == null) return null;
          mesh.path = path;
          spine2.Color.rgba8888ToColor(mesh.color, color);
          mesh.bones = vertices.bones;
          mesh.vertices = vertices.vertices;
          mesh.worldVerticesLength = vertexCount << 1;
          mesh.triangles = triangles;
          mesh.regionUVs = uvs;
          mesh.updateUVs();
          mesh.hullLength = hullLength << 1;
          if (nonessential) {
            mesh.edges = edges;
            mesh.width = width * scale;
            mesh.height = height * scale;
          }
          return mesh;
        }
        case spine2.AttachmentType.LinkedMesh: {
          let path = input.readStringRef();
          let color = input.readInt32();
          let skinName = input.readStringRef();
          let parent = input.readStringRef();
          let inheritDeform = input.readBoolean();
          let width = 0, height = 0;
          if (nonessential) {
            width = input.readFloat();
            height = input.readFloat();
          }
          if (path == null) path = name;
          let mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
          if (mesh == null) return null;
          mesh.path = path;
          spine2.Color.rgba8888ToColor(mesh.color, color);
          if (nonessential) {
            mesh.width = width * scale;
            mesh.height = height * scale;
          }
          this.linkedMeshes.push(new LinkedMesh(mesh, skinName, slotIndex, parent, inheritDeform));
          return mesh;
        }
        case spine2.AttachmentType.Path: {
          let closed2 = input.readBoolean();
          let constantSpeed = input.readBoolean();
          let vertexCount = input.readInt(true);
          let vertices = this.readVertices(input, vertexCount);
          let lengths = spine2.Utils.newArray(vertexCount / 3, 0);
          for (let i = 0, n = lengths.length; i < n; i++)
            lengths[i] = input.readFloat() * scale;
          let color = nonessential ? input.readInt32() : 0;
          let path = this.attachmentLoader.newPathAttachment(skin, name);
          if (path == null) return null;
          path.closed = closed2;
          path.constantSpeed = constantSpeed;
          path.worldVerticesLength = vertexCount << 1;
          path.vertices = vertices.vertices;
          path.bones = vertices.bones;
          path.lengths = lengths;
          if (nonessential) spine2.Color.rgba8888ToColor(path.color, color);
          return path;
        }
        case spine2.AttachmentType.Point: {
          let rotation = input.readFloat();
          let x = input.readFloat();
          let y = input.readFloat();
          let color = nonessential ? input.readInt32() : 0;
          let point = this.attachmentLoader.newPointAttachment(skin, name);
          if (point == null) return null;
          point.x = x * scale;
          point.y = y * scale;
          point.rotation = rotation;
          if (nonessential) spine2.Color.rgba8888ToColor(point.color, color);
          return point;
        }
        case spine2.AttachmentType.Clipping: {
          let endSlotIndex = input.readInt(true);
          let vertexCount = input.readInt(true);
          let vertices = this.readVertices(input, vertexCount);
          let color = nonessential ? input.readInt32() : 0;
          let clip = this.attachmentLoader.newClippingAttachment(skin, name);
          if (clip == null) return null;
          clip.endSlot = skeletonData.slots[endSlotIndex];
          clip.worldVerticesLength = vertexCount << 1;
          clip.vertices = vertices.vertices;
          clip.bones = vertices.bones;
          if (nonessential) spine2.Color.rgba8888ToColor(clip.color, color);
          return clip;
        }
      }
      return null;
    }
    readVertices(input, vertexCount) {
      let verticesLength = vertexCount << 1;
      let vertices = new Vertices();
      let scale = this.scale;
      if (!input.readBoolean()) {
        vertices.vertices = this.readFloatArray(input, verticesLength, scale);
        return vertices;
      }
      let weights = new Array();
      let bonesArray = new Array();
      for (let i = 0; i < vertexCount; i++) {
        let boneCount = input.readInt(true);
        bonesArray.push(boneCount);
        for (let ii = 0; ii < boneCount; ii++) {
          bonesArray.push(input.readInt(true));
          weights.push(input.readFloat() * scale);
          weights.push(input.readFloat() * scale);
          weights.push(input.readFloat());
        }
      }
      vertices.vertices = spine2.Utils.toFloatArray(weights);
      vertices.bones = bonesArray;
      return vertices;
    }
    readFloatArray(input, n, scale) {
      let array = new Array(n);
      if (scale == 1) {
        for (let i = 0; i < n; i++)
          array[i] = input.readFloat();
      } else {
        for (let i = 0; i < n; i++)
          array[i] = input.readFloat() * scale;
      }
      return array;
    }
    readShortArray(input) {
      let n = input.readInt(true);
      let array = new Array(n);
      for (let i = 0; i < n; i++)
        array[i] = input.readShort();
      return array;
    }
    readAnimation(input, name, skeletonData) {
      let timelines = new Array();
      let scale = this.scale;
      let duration = 0;
      let tempColor1 = new spine2.Color();
      let tempColor2 = new spine2.Color();
      for (let i = 0, n = input.readInt(true); i < n; i++) {
        let slotIndex = input.readInt(true);
        for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
          let timelineType = input.readByte();
          let frameCount = input.readInt(true);
          switch (timelineType) {
            case _SkeletonBinary.SLOT_ATTACHMENT: {
              let timeline = new spine2.AttachmentTimeline(frameCount);
              timeline.slotIndex = slotIndex;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++)
                timeline.setFrame(frameIndex, input.readFloat(), input.readStringRef());
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[frameCount - 1]);
              break;
            }
            case _SkeletonBinary.SLOT_COLOR: {
              let timeline = new spine2.ColorTimeline(frameCount);
              timeline.slotIndex = slotIndex;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                let time = input.readFloat();
                spine2.Color.rgba8888ToColor(tempColor1, input.readInt32());
                timeline.setFrame(frameIndex, time, tempColor1.r, tempColor1.g, tempColor1.b, tempColor1.a);
                if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.ColorTimeline.ENTRIES]);
              break;
            }
            case _SkeletonBinary.SLOT_TWO_COLOR: {
              let timeline = new spine2.TwoColorTimeline(frameCount);
              timeline.slotIndex = slotIndex;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                let time = input.readFloat();
                spine2.Color.rgba8888ToColor(tempColor1, input.readInt32());
                spine2.Color.rgb888ToColor(tempColor2, input.readInt32());
                timeline.setFrame(
                  frameIndex,
                  time,
                  tempColor1.r,
                  tempColor1.g,
                  tempColor1.b,
                  tempColor1.a,
                  tempColor2.r,
                  tempColor2.g,
                  tempColor2.b
                );
                if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.TwoColorTimeline.ENTRIES]);
              break;
            }
          }
        }
      }
      for (let i = 0, n = input.readInt(true); i < n; i++) {
        let boneIndex = input.readInt(true);
        for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
          let timelineType = input.readByte();
          let frameCount = input.readInt(true);
          switch (timelineType) {
            case _SkeletonBinary.BONE_ROTATE: {
              let timeline = new spine2.RotateTimeline(frameCount);
              timeline.boneIndex = boneIndex;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                timeline.setFrame(frameIndex, input.readFloat(), input.readFloat());
                if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.RotateTimeline.ENTRIES]);
              break;
            }
            case _SkeletonBinary.BONE_TRANSLATE:
            case _SkeletonBinary.BONE_SCALE:
            case _SkeletonBinary.BONE_SHEAR: {
              let timeline;
              let timelineScale = 1;
              if (timelineType == _SkeletonBinary.BONE_SCALE)
                timeline = new spine2.ScaleTimeline(frameCount);
              else if (timelineType == _SkeletonBinary.BONE_SHEAR)
                timeline = new spine2.ShearTimeline(frameCount);
              else {
                timeline = new spine2.TranslateTimeline(frameCount);
                timelineScale = scale;
              }
              timeline.boneIndex = boneIndex;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                timeline.setFrame(
                  frameIndex,
                  input.readFloat(),
                  input.readFloat() * timelineScale,
                  input.readFloat() * timelineScale
                );
                if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.TranslateTimeline.ENTRIES]);
              break;
            }
          }
        }
      }
      for (let i = 0, n = input.readInt(true); i < n; i++) {
        let index = input.readInt(true);
        let frameCount = input.readInt(true);
        let timeline = new spine2.IkConstraintTimeline(frameCount);
        timeline.ikConstraintIndex = index;
        for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
          timeline.setFrame(
            frameIndex,
            input.readFloat(),
            input.readFloat(),
            input.readFloat() * scale,
            input.readByte(),
            input.readBoolean(),
            input.readBoolean()
          );
          if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.IkConstraintTimeline.ENTRIES]);
      }
      for (let i = 0, n = input.readInt(true); i < n; i++) {
        let index = input.readInt(true);
        let frameCount = input.readInt(true);
        let timeline = new spine2.TransformConstraintTimeline(frameCount);
        timeline.transformConstraintIndex = index;
        for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
          timeline.setFrame(
            frameIndex,
            input.readFloat(),
            input.readFloat(),
            input.readFloat(),
            input.readFloat(),
            input.readFloat()
          );
          if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.TransformConstraintTimeline.ENTRIES]);
      }
      for (let i = 0, n = input.readInt(true); i < n; i++) {
        let index = input.readInt(true);
        let data = skeletonData.pathConstraints[index];
        for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
          let timelineType = input.readByte();
          let frameCount = input.readInt(true);
          switch (timelineType) {
            case _SkeletonBinary.PATH_POSITION:
            case _SkeletonBinary.PATH_SPACING: {
              let timeline;
              let timelineScale = 1;
              if (timelineType == _SkeletonBinary.PATH_SPACING) {
                timeline = new spine2.PathConstraintSpacingTimeline(frameCount);
                if (data.spacingMode == 0 /* Length */ || data.spacingMode == 1 /* Fixed */) timelineScale = scale;
              } else {
                timeline = new spine2.PathConstraintPositionTimeline(frameCount);
                if (data.positionMode == 0 /* Fixed */) timelineScale = scale;
              }
              timeline.pathConstraintIndex = index;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                timeline.setFrame(frameIndex, input.readFloat(), input.readFloat() * timelineScale);
                if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.PathConstraintPositionTimeline.ENTRIES]);
              break;
            }
            case _SkeletonBinary.PATH_MIX: {
              let timeline = new spine2.PathConstraintMixTimeline(frameCount);
              timeline.pathConstraintIndex = index;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
                timeline.setFrame(frameIndex, input.readFloat(), input.readFloat(), input.readFloat());
                if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(frameCount - 1) * spine2.PathConstraintMixTimeline.ENTRIES]);
              break;
            }
          }
        }
      }
      for (let i = 0, n = input.readInt(true); i < n; i++) {
        let skin = skeletonData.skins[input.readInt(true)];
        for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
          let slotIndex = input.readInt(true);
          for (let iii = 0, nnn = input.readInt(true); iii < nnn; iii++) {
            let attachment = skin.getAttachment(slotIndex, input.readStringRef());
            let weighted = attachment.bones != null;
            let vertices = attachment.vertices;
            let deformLength = weighted ? vertices.length / 3 * 2 : vertices.length;
            let frameCount = input.readInt(true);
            let timeline = new spine2.DeformTimeline(frameCount);
            timeline.slotIndex = slotIndex;
            timeline.attachment = attachment;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              let time = input.readFloat();
              let deform;
              let end = input.readInt(true);
              if (end == 0)
                deform = weighted ? spine2.Utils.newFloatArray(deformLength) : vertices;
              else {
                deform = spine2.Utils.newFloatArray(deformLength);
                let start = input.readInt(true);
                end += start;
                if (scale == 1) {
                  for (let v = start; v < end; v++)
                    deform[v] = input.readFloat();
                } else {
                  for (let v = start; v < end; v++)
                    deform[v] = input.readFloat() * scale;
                }
                if (!weighted) {
                  for (let v = 0, vn = deform.length; v < vn; v++)
                    deform[v] += vertices[v];
                }
              }
              timeline.setFrame(frameIndex, time, deform);
              if (frameIndex < frameCount - 1) this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[frameCount - 1]);
          }
        }
      }
      let drawOrderCount = input.readInt(true);
      if (drawOrderCount > 0) {
        let timeline = new spine2.DrawOrderTimeline(drawOrderCount);
        let slotCount = skeletonData.slots.length;
        for (let i = 0; i < drawOrderCount; i++) {
          let time = input.readFloat();
          let offsetCount = input.readInt(true);
          let drawOrder = spine2.Utils.newArray(slotCount, 0);
          for (let ii = slotCount - 1; ii >= 0; ii--)
            drawOrder[ii] = -1;
          let unchanged = spine2.Utils.newArray(slotCount - offsetCount, 0);
          let originalIndex = 0, unchangedIndex = 0;
          for (let ii = 0; ii < offsetCount; ii++) {
            let slotIndex = input.readInt(true);
            while (originalIndex != slotIndex)
              unchanged[unchangedIndex++] = originalIndex++;
            drawOrder[originalIndex + input.readInt(true)] = originalIndex++;
          }
          while (originalIndex < slotCount)
            unchanged[unchangedIndex++] = originalIndex++;
          for (let ii = slotCount - 1; ii >= 0; ii--)
            if (drawOrder[ii] == -1) drawOrder[ii] = unchanged[--unchangedIndex];
          timeline.setFrame(i, time, drawOrder);
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[drawOrderCount - 1]);
      }
      let eventCount = input.readInt(true);
      if (eventCount > 0) {
        let timeline = new spine2.EventTimeline(eventCount);
        for (let i = 0; i < eventCount; i++) {
          let time = input.readFloat();
          let eventData = skeletonData.events[input.readInt(true)];
          let event = new spine2.Event(time, eventData);
          event.intValue = input.readInt(false);
          event.floatValue = input.readFloat();
          event.stringValue = input.readBoolean() ? input.readString() : eventData.stringValue;
          if (event.data.audioPath != null) {
            event.volume = input.readFloat();
            event.balance = input.readFloat();
          }
          timeline.setFrame(i, event);
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[eventCount - 1]);
      }
      return new spine2.Animation(name, timelines, duration);
    }
    readCurve(input, frameIndex, timeline) {
      switch (input.readByte()) {
        case _SkeletonBinary.CURVE_STEPPED:
          timeline.setStepped(frameIndex);
          break;
        case _SkeletonBinary.CURVE_BEZIER:
          this.setCurve(timeline, frameIndex, input.readFloat(), input.readFloat(), input.readFloat(), input.readFloat());
          break;
      }
    }
    setCurve(timeline, frameIndex, cx1, cy1, cx2, cy2) {
      timeline.setCurve(frameIndex, cx1, cy1, cx2, cy2);
    }
  };
  __publicField(_SkeletonBinary, "AttachmentTypeValues", [
    0,
    1,
    2,
    3,
    4,
    5,
    6
    /*AttachmentType.Clipping*/
  ]);
  __publicField(_SkeletonBinary, "TransformModeValues", [0 /* Normal */, 1 /* OnlyTranslation */, 2 /* NoRotationOrReflection */, 3 /* NoScale */, 4 /* NoScaleOrReflection */]);
  __publicField(_SkeletonBinary, "PositionModeValues", [0 /* Fixed */, 1 /* Percent */]);
  __publicField(_SkeletonBinary, "SpacingModeValues", [0 /* Length */, 1 /* Fixed */, 2 /* Percent */]);
  __publicField(_SkeletonBinary, "RotateModeValues", [0 /* Tangent */, 1 /* Chain */, 2 /* ChainScale */]);
  __publicField(_SkeletonBinary, "BlendModeValues", [0 /* Normal */, 1 /* Additive */, 2 /* Multiply */, 3 /* Screen */]);
  __publicField(_SkeletonBinary, "BONE_ROTATE", 0);
  __publicField(_SkeletonBinary, "BONE_TRANSLATE", 1);
  __publicField(_SkeletonBinary, "BONE_SCALE", 2);
  __publicField(_SkeletonBinary, "BONE_SHEAR", 3);
  __publicField(_SkeletonBinary, "SLOT_ATTACHMENT", 0);
  __publicField(_SkeletonBinary, "SLOT_COLOR", 1);
  __publicField(_SkeletonBinary, "SLOT_TWO_COLOR", 2);
  __publicField(_SkeletonBinary, "PATH_POSITION", 0);
  __publicField(_SkeletonBinary, "PATH_SPACING", 1);
  __publicField(_SkeletonBinary, "PATH_MIX", 2);
  __publicField(_SkeletonBinary, "CURVE_LINEAR", 0);
  __publicField(_SkeletonBinary, "CURVE_STEPPED", 1);
  __publicField(_SkeletonBinary, "CURVE_BEZIER", 2);
  let SkeletonBinary = _SkeletonBinary;
  spine2.SkeletonBinary = _SkeletonBinary;
  class BinaryInput {
    constructor(data, strings = new Array(), index = 0, buffer = new DataView(data.buffer)) {
      __publicField(this, "strings", strings);
      __publicField(this, "index", index);
      __publicField(this, "buffer", buffer);
    }
    readByte() {
      return this.buffer.getInt8(this.index++);
    }
    readShort() {
      let value = this.buffer.getInt16(this.index);
      this.index += 2;
      return value;
    }
    readInt32() {
      let value = this.buffer.getInt32(this.index);
      this.index += 4;
      return value;
    }
    readInt(optimizePositive) {
      let b = this.readByte();
      let result = b & 127;
      if ((b & 128) != 0) {
        b = this.readByte();
        result |= (b & 127) << 7;
        if ((b & 128) != 0) {
          b = this.readByte();
          result |= (b & 127) << 14;
          if ((b & 128) != 0) {
            b = this.readByte();
            result |= (b & 127) << 21;
            if ((b & 128) != 0) {
              b = this.readByte();
              result |= (b & 127) << 28;
            }
          }
        }
      }
      return optimizePositive ? result : result >>> 1 ^ -(result & 1);
    }
    readStringRef() {
      let index = this.readInt(true);
      return index == 0 ? null : this.strings[index - 1];
    }
    readString() {
      let byteCount = this.readInt(true);
      switch (byteCount) {
        case 0:
          return null;
        case 1:
          return "";
      }
      byteCount--;
      let chars = "";
      let charCount = 0;
      for (let i = 0; i < byteCount; ) {
        let b = this.readByte();
        switch (b >> 4) {
          case 12:
          case 13:
            chars += String.fromCharCode((b & 31) << 6 | this.readByte() & 63);
            i += 2;
            break;
          case 14:
            chars += String.fromCharCode((b & 15) << 12 | (this.readByte() & 63) << 6 | this.readByte() & 63);
            i += 3;
            break;
          default:
            chars += String.fromCharCode(b);
            i++;
        }
      }
      return chars;
    }
    readFloat() {
      let value = this.buffer.getFloat32(this.index);
      this.index += 4;
      return value;
    }
    readBoolean() {
      return this.readByte() != 0;
    }
  }
  class LinkedMesh {
    constructor(mesh, skin, slotIndex, parent, inheritDeform) {
      __publicField(this, "parent");
      __publicField(this, "skin");
      __publicField(this, "slotIndex");
      __publicField(this, "mesh");
      __publicField(this, "inheritDeform");
      this.mesh = mesh;
      this.skin = skin;
      this.slotIndex = slotIndex;
      this.parent = parent;
      this.inheritDeform = inheritDeform;
    }
  }
  class Vertices {
    constructor(bones = null, vertices = null) {
      __publicField(this, "bones", bones);
      __publicField(this, "vertices", vertices);
    }
  }
})(spine || (spine = {}));
((spine2) => {
  class SkeletonBounds {
    constructor() {
      /** The left edge of the axis aligned bounding box. */
      __publicField(this, "minX", 0);
      /** The bottom edge of the axis aligned bounding box. */
      __publicField(this, "minY", 0);
      /** The right edge of the axis aligned bounding box. */
      __publicField(this, "maxX", 0);
      /** The top edge of the axis aligned bounding box. */
      __publicField(this, "maxY", 0);
      /** The visible bounding boxes. */
      __publicField(this, "boundingBoxes", new Array());
      /** The world vertices for the bounding box polygons. */
      __publicField(this, "polygons", new Array());
      __publicField(this, "polygonPool", new spine2.Pool(() => {
        return spine2.Utils.newFloatArray(16);
      }));
    }
    /** Clears any previous polygons, finds all visible bounding box attachments, and computes the world vertices for each bounding
     * box's polygon.
     * @param updateAabb If true, the axis aligned bounding box containing all the polygons is computed. If false, the
     *           SkeletonBounds AABB methods will always return true. */
    update(skeleton, updateAabb) {
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      let boundingBoxes = this.boundingBoxes;
      let polygons = this.polygons;
      let polygonPool = this.polygonPool;
      let slots = skeleton.slots;
      let slotCount = slots.length;
      boundingBoxes.length = 0;
      polygonPool.freeAll(polygons);
      polygons.length = 0;
      for (let i = 0; i < slotCount; i++) {
        let slot = slots[i];
        if (!slot.bone.active) continue;
        let attachment = slot.getAttachment();
        if (attachment instanceof spine2.BoundingBoxAttachment) {
          let boundingBox = attachment;
          boundingBoxes.push(boundingBox);
          let polygon = polygonPool.obtain();
          if (polygon.length != boundingBox.worldVerticesLength) {
            polygon = spine2.Utils.newFloatArray(boundingBox.worldVerticesLength);
          }
          polygons.push(polygon);
          boundingBox.computeWorldVertices(slot, 0, boundingBox.worldVerticesLength, polygon, 0, 2);
        }
      }
      if (updateAabb) {
        this.aabbCompute();
      } else {
        this.minX = Number.POSITIVE_INFINITY;
        this.minY = Number.POSITIVE_INFINITY;
        this.maxX = Number.NEGATIVE_INFINITY;
        this.maxY = Number.NEGATIVE_INFINITY;
      }
    }
    aabbCompute() {
      let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
      let polygons = this.polygons;
      for (let i = 0, n = polygons.length; i < n; i++) {
        let polygon = polygons[i];
        let vertices = polygon;
        for (let ii = 0, nn = polygon.length; ii < nn; ii += 2) {
          let x = vertices[ii];
          let y = vertices[ii + 1];
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      this.minX = minX;
      this.minY = minY;
      this.maxX = maxX;
      this.maxY = maxY;
    }
    /** Returns true if the axis aligned bounding box contains the point. */
    aabbContainsPoint(x, y) {
      return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }
    /** Returns true if the axis aligned bounding box intersects the line segment. */
    aabbIntersectsSegment(x1, y1, x2, y2) {
      let minX = this.minX;
      let minY = this.minY;
      let maxX = this.maxX;
      let maxY = this.maxY;
      if (x1 <= minX && x2 <= minX || y1 <= minY && y2 <= minY || x1 >= maxX && x2 >= maxX || y1 >= maxY && y2 >= maxY)
        return false;
      let m = (y2 - y1) / (x2 - x1);
      let y = m * (minX - x1) + y1;
      if (y > minY && y < maxY) return true;
      y = m * (maxX - x1) + y1;
      if (y > minY && y < maxY) return true;
      let x = (minY - y1) / m + x1;
      if (x > minX && x < maxX) return true;
      x = (maxY - y1) / m + x1;
      if (x > minX && x < maxX) return true;
      return false;
    }
    /** Returns true if the axis aligned bounding box intersects the axis aligned bounding box of the specified bounds. */
    aabbIntersectsSkeleton(bounds) {
      return this.minX < bounds.maxX && this.maxX > bounds.minX && this.minY < bounds.maxY && this.maxY > bounds.minY;
    }
    /** Returns the first bounding box attachment that contains the point, or null. When doing many checks, it is usually more
     * efficient to only call this method if {@link #aabbContainsPoint(float, float)} returns true. */
    containsPoint(x, y) {
      let polygons = this.polygons;
      for (let i = 0, n = polygons.length; i < n; i++)
        if (this.containsPointPolygon(polygons[i], x, y)) return this.boundingBoxes[i];
      return null;
    }
    /** Returns true if the polygon contains the point. */
    containsPointPolygon(polygon, x, y) {
      let vertices = polygon;
      let nn = polygon.length;
      let prevIndex = nn - 2;
      let inside = false;
      for (let ii = 0; ii < nn; ii += 2) {
        let vertexY = vertices[ii + 1];
        let prevY = vertices[prevIndex + 1];
        if (vertexY < y && prevY >= y || prevY < y && vertexY >= y) {
          let vertexX = vertices[ii];
          if (vertexX + (y - vertexY) / (prevY - vertexY) * (vertices[prevIndex] - vertexX) < x) inside = !inside;
        }
        prevIndex = ii;
      }
      return inside;
    }
    /** Returns the first bounding box attachment that contains any part of the line segment, or null. When doing many checks, it
     * is usually more efficient to only call this method if {@link #aabbIntersectsSegment()} returns
     * true. */
    intersectsSegment(x1, y1, x2, y2) {
      let polygons = this.polygons;
      for (let i = 0, n = polygons.length; i < n; i++)
        if (this.intersectsSegmentPolygon(polygons[i], x1, y1, x2, y2)) return this.boundingBoxes[i];
      return null;
    }
    /** Returns true if the polygon contains any part of the line segment. */
    intersectsSegmentPolygon(polygon, x1, y1, x2, y2) {
      let vertices = polygon;
      let nn = polygon.length;
      let width12 = x1 - x2, height12 = y1 - y2;
      let det1 = x1 * y2 - y1 * x2;
      let x3 = vertices[nn - 2], y3 = vertices[nn - 1];
      for (let ii = 0; ii < nn; ii += 2) {
        let x4 = vertices[ii], y4 = vertices[ii + 1];
        let det2 = x3 * y4 - y3 * x4;
        let width34 = x3 - x4, height34 = y3 - y4;
        let det3 = width12 * height34 - height12 * width34;
        let x = (det1 * width34 - width12 * det2) / det3;
        if ((x >= x3 && x <= x4 || x >= x4 && x <= x3) && (x >= x1 && x <= x2 || x >= x2 && x <= x1)) {
          let y = (det1 * height34 - height12 * det2) / det3;
          if ((y >= y3 && y <= y4 || y >= y4 && y <= y3) && (y >= y1 && y <= y2 || y >= y2 && y <= y1)) return true;
        }
        x3 = x4;
        y3 = y4;
      }
      return false;
    }
    /** Returns the polygon for the specified bounding box, or null. */
    getPolygon(boundingBox) {
      if (boundingBox == null) throw new Error("boundingBox cannot be null.");
      let index = this.boundingBoxes.indexOf(boundingBox);
      return index == -1 ? null : this.polygons[index];
    }
    /** The width of the axis aligned bounding box. */
    getWidth() {
      return this.maxX - this.minX;
    }
    /** The height of the axis aligned bounding box. */
    getHeight() {
      return this.maxY - this.minY;
    }
  }
  spine2.SkeletonBounds = SkeletonBounds;
})(spine || (spine = {}));
((spine2) => {
  class SkeletonClipping {
    constructor() {
      __publicField(this, "triangulator", new spine2.Triangulator());
      __publicField(this, "clippingPolygon", new Array());
      __publicField(this, "clipOutput", new Array());
      __publicField(this, "clippedVertices", new Array());
      __publicField(this, "clippedTriangles", new Array());
      __publicField(this, "scratch", new Array());
      __publicField(this, "clipAttachment");
      __publicField(this, "clippingPolygons");
    }
    clipStart(slot, clip) {
      if (this.clipAttachment != null) return 0;
      this.clipAttachment = clip;
      let n = clip.worldVerticesLength;
      let vertices = spine2.Utils.setArraySize(this.clippingPolygon, n);
      clip.computeWorldVertices(slot, 0, n, vertices, 0, 2);
      let clippingPolygon = this.clippingPolygon;
      SkeletonClipping.makeClockwise(clippingPolygon);
      let clippingPolygons = this.clippingPolygons = this.triangulator.decompose(clippingPolygon, this.triangulator.triangulate(clippingPolygon));
      for (let i = 0, n2 = clippingPolygons.length; i < n2; i++) {
        let polygon = clippingPolygons[i];
        SkeletonClipping.makeClockwise(polygon);
        polygon.push(polygon[0]);
        polygon.push(polygon[1]);
      }
      return clippingPolygons.length;
    }
    clipEndWithSlot(slot) {
      if (this.clipAttachment != null && this.clipAttachment.endSlot == slot.data) this.clipEnd();
    }
    clipEnd() {
      if (this.clipAttachment == null) return;
      this.clipAttachment = null;
      this.clippingPolygons = null;
      this.clippedVertices.length = 0;
      this.clippedTriangles.length = 0;
      this.clippingPolygon.length = 0;
    }
    isClipping() {
      return this.clipAttachment != null;
    }
    clipTriangles(vertices, verticesLength, triangles, trianglesLength, uvs, light, dark, twoColor) {
      let clipOutput = this.clipOutput, clippedVertices = this.clippedVertices;
      let clippedTriangles = this.clippedTriangles;
      let polygons = this.clippingPolygons;
      let polygonsCount = this.clippingPolygons.length;
      let vertexSize = twoColor ? 12 : 8;
      let index = 0;
      clippedVertices.length = 0;
      clippedTriangles.length = 0;
      outer:
        for (let i = 0; i < trianglesLength; i += 3) {
          let vertexOffset = triangles[i] << 1;
          let x1 = vertices[vertexOffset], y1 = vertices[vertexOffset + 1];
          let u1 = uvs[vertexOffset], v1 = uvs[vertexOffset + 1];
          vertexOffset = triangles[i + 1] << 1;
          let x2 = vertices[vertexOffset], y2 = vertices[vertexOffset + 1];
          let u2 = uvs[vertexOffset], v2 = uvs[vertexOffset + 1];
          vertexOffset = triangles[i + 2] << 1;
          let x3 = vertices[vertexOffset], y3 = vertices[vertexOffset + 1];
          let u3 = uvs[vertexOffset], v3 = uvs[vertexOffset + 1];
          for (let p = 0; p < polygonsCount; p++) {
            let s = clippedVertices.length;
            if (this.clip(x1, y1, x2, y2, x3, y3, polygons[p], clipOutput)) {
              let clipOutputLength = clipOutput.length;
              if (clipOutputLength == 0) continue;
              let d0 = y2 - y3, d1 = x3 - x2, d2 = x1 - x3, d4 = y3 - y1;
              let d = 1 / (d0 * d2 + d1 * (y1 - y3));
              let clipOutputCount = clipOutputLength >> 1;
              let clipOutputItems = this.clipOutput;
              let clippedVerticesItems = spine2.Utils.setArraySize(clippedVertices, s + clipOutputCount * vertexSize);
              for (let ii = 0; ii < clipOutputLength; ii += 2) {
                let x = clipOutputItems[ii], y = clipOutputItems[ii + 1];
                clippedVerticesItems[s] = x;
                clippedVerticesItems[s + 1] = y;
                clippedVerticesItems[s + 2] = light.r;
                clippedVerticesItems[s + 3] = light.g;
                clippedVerticesItems[s + 4] = light.b;
                clippedVerticesItems[s + 5] = light.a;
                let c0 = x - x3, c1 = y - y3;
                let a = (d0 * c0 + d1 * c1) * d;
                let b = (d4 * c0 + d2 * c1) * d;
                let c = 1 - a - b;
                clippedVerticesItems[s + 6] = u1 * a + u2 * b + u3 * c;
                clippedVerticesItems[s + 7] = v1 * a + v2 * b + v3 * c;
                if (twoColor) {
                  clippedVerticesItems[s + 8] = dark.r;
                  clippedVerticesItems[s + 9] = dark.g;
                  clippedVerticesItems[s + 10] = dark.b;
                  clippedVerticesItems[s + 11] = dark.a;
                }
                s += vertexSize;
              }
              s = clippedTriangles.length;
              let clippedTrianglesItems = spine2.Utils.setArraySize(clippedTriangles, s + 3 * (clipOutputCount - 2));
              clipOutputCount--;
              for (let ii = 1; ii < clipOutputCount; ii++) {
                clippedTrianglesItems[s] = index;
                clippedTrianglesItems[s + 1] = index + ii;
                clippedTrianglesItems[s + 2] = index + ii + 1;
                s += 3;
              }
              index += clipOutputCount + 1;
            } else {
              let clippedVerticesItems = spine2.Utils.setArraySize(clippedVertices, s + 3 * vertexSize);
              clippedVerticesItems[s] = x1;
              clippedVerticesItems[s + 1] = y1;
              clippedVerticesItems[s + 2] = light.r;
              clippedVerticesItems[s + 3] = light.g;
              clippedVerticesItems[s + 4] = light.b;
              clippedVerticesItems[s + 5] = light.a;
              if (!twoColor) {
                clippedVerticesItems[s + 6] = u1;
                clippedVerticesItems[s + 7] = v1;
                clippedVerticesItems[s + 8] = x2;
                clippedVerticesItems[s + 9] = y2;
                clippedVerticesItems[s + 10] = light.r;
                clippedVerticesItems[s + 11] = light.g;
                clippedVerticesItems[s + 12] = light.b;
                clippedVerticesItems[s + 13] = light.a;
                clippedVerticesItems[s + 14] = u2;
                clippedVerticesItems[s + 15] = v2;
                clippedVerticesItems[s + 16] = x3;
                clippedVerticesItems[s + 17] = y3;
                clippedVerticesItems[s + 18] = light.r;
                clippedVerticesItems[s + 19] = light.g;
                clippedVerticesItems[s + 20] = light.b;
                clippedVerticesItems[s + 21] = light.a;
                clippedVerticesItems[s + 22] = u3;
                clippedVerticesItems[s + 23] = v3;
              } else {
                clippedVerticesItems[s + 6] = u1;
                clippedVerticesItems[s + 7] = v1;
                clippedVerticesItems[s + 8] = dark.r;
                clippedVerticesItems[s + 9] = dark.g;
                clippedVerticesItems[s + 10] = dark.b;
                clippedVerticesItems[s + 11] = dark.a;
                clippedVerticesItems[s + 12] = x2;
                clippedVerticesItems[s + 13] = y2;
                clippedVerticesItems[s + 14] = light.r;
                clippedVerticesItems[s + 15] = light.g;
                clippedVerticesItems[s + 16] = light.b;
                clippedVerticesItems[s + 17] = light.a;
                clippedVerticesItems[s + 18] = u2;
                clippedVerticesItems[s + 19] = v2;
                clippedVerticesItems[s + 20] = dark.r;
                clippedVerticesItems[s + 21] = dark.g;
                clippedVerticesItems[s + 22] = dark.b;
                clippedVerticesItems[s + 23] = dark.a;
                clippedVerticesItems[s + 24] = x3;
                clippedVerticesItems[s + 25] = y3;
                clippedVerticesItems[s + 26] = light.r;
                clippedVerticesItems[s + 27] = light.g;
                clippedVerticesItems[s + 28] = light.b;
                clippedVerticesItems[s + 29] = light.a;
                clippedVerticesItems[s + 30] = u3;
                clippedVerticesItems[s + 31] = v3;
                clippedVerticesItems[s + 32] = dark.r;
                clippedVerticesItems[s + 33] = dark.g;
                clippedVerticesItems[s + 34] = dark.b;
                clippedVerticesItems[s + 35] = dark.a;
              }
              s = clippedTriangles.length;
              let clippedTrianglesItems = spine2.Utils.setArraySize(clippedTriangles, s + 3);
              clippedTrianglesItems[s] = index;
              clippedTrianglesItems[s + 1] = index + 1;
              clippedTrianglesItems[s + 2] = index + 2;
              index += 3;
              continue outer;
            }
          }
        }
    }
    /** Clips the input triangle against the convex, clockwise clipping area. If the triangle lies entirely within the clipping
     * area, false is returned. The clipping area must duplicate the first vertex at the end of the vertices list. */
    clip(x1, y1, x2, y2, x3, y3, clippingArea, output) {
      let originalOutput = output;
      let clipped = false;
      let input = null;
      if (clippingArea.length % 4 >= 2) {
        input = output;
        output = this.scratch;
      } else
        input = this.scratch;
      input.length = 0;
      input.push(x1);
      input.push(y1);
      input.push(x2);
      input.push(y2);
      input.push(x3);
      input.push(y3);
      input.push(x1);
      input.push(y1);
      output.length = 0;
      let clippingVertices = clippingArea;
      let clippingVerticesLast = clippingArea.length - 4;
      for (let i = 0; ; i += 2) {
        let edgeX = clippingVertices[i], edgeY = clippingVertices[i + 1];
        let edgeX2 = clippingVertices[i + 2], edgeY2 = clippingVertices[i + 3];
        let deltaX = edgeX - edgeX2, deltaY = edgeY - edgeY2;
        let inputVertices = input;
        let inputVerticesLength = input.length - 2, outputStart = output.length;
        for (let ii = 0; ii < inputVerticesLength; ii += 2) {
          let inputX = inputVertices[ii], inputY = inputVertices[ii + 1];
          let inputX2 = inputVertices[ii + 2], inputY2 = inputVertices[ii + 3];
          let side2 = deltaX * (inputY2 - edgeY2) - deltaY * (inputX2 - edgeX2) > 0;
          if (deltaX * (inputY - edgeY2) - deltaY * (inputX - edgeX2) > 0) {
            if (side2) {
              output.push(inputX2);
              output.push(inputY2);
              continue;
            }
            let c0 = inputY2 - inputY, c2 = inputX2 - inputX;
            let s = c0 * (edgeX2 - edgeX) - c2 * (edgeY2 - edgeY);
            if (Math.abs(s) > 1e-6) {
              let ua = (c2 * (edgeY - inputY) - c0 * (edgeX - inputX)) / s;
              output.push(edgeX + (edgeX2 - edgeX) * ua);
              output.push(edgeY + (edgeY2 - edgeY) * ua);
            } else {
              output.push(edgeX);
              output.push(edgeY);
            }
          } else if (side2) {
            let c0 = inputY2 - inputY, c2 = inputX2 - inputX;
            let s = c0 * (edgeX2 - edgeX) - c2 * (edgeY2 - edgeY);
            if (Math.abs(s) > 1e-6) {
              let ua = (c2 * (edgeY - inputY) - c0 * (edgeX - inputX)) / s;
              output.push(edgeX + (edgeX2 - edgeX) * ua);
              output.push(edgeY + (edgeY2 - edgeY) * ua);
            } else {
              output.push(edgeX);
              output.push(edgeY);
            }
            output.push(inputX2);
            output.push(inputY2);
          }
          clipped = true;
        }
        if (outputStart == output.length) {
          originalOutput.length = 0;
          return true;
        }
        output.push(output[0]);
        output.push(output[1]);
        if (i == clippingVerticesLast) break;
        let temp = output;
        output = input;
        output.length = 0;
        input = temp;
      }
      if (originalOutput != output) {
        originalOutput.length = 0;
        for (let i = 0, n = output.length - 2; i < n; i++)
          originalOutput[i] = output[i];
      } else
        originalOutput.length = originalOutput.length - 2;
      return clipped;
    }
    static makeClockwise(polygon) {
      let vertices = polygon;
      let verticeslength = polygon.length;
      let area = vertices[verticeslength - 2] * vertices[1] - vertices[0] * vertices[verticeslength - 1], p1x = 0, p1y = 0, p2x = 0, p2y = 0;
      for (let i = 0, n = verticeslength - 3; i < n; i += 2) {
        p1x = vertices[i];
        p1y = vertices[i + 1];
        p2x = vertices[i + 2];
        p2y = vertices[i + 3];
        area += p1x * p2y - p2x * p1y;
      }
      if (area < 0) return;
      for (let i = 0, lastX = verticeslength - 2, n = verticeslength >> 1; i < n; i += 2) {
        let x = vertices[i], y = vertices[i + 1];
        let other = lastX - i;
        vertices[i] = vertices[other];
        vertices[i + 1] = vertices[other + 1];
        vertices[other] = x;
        vertices[other + 1] = y;
      }
    }
  }
  spine2.SkeletonClipping = SkeletonClipping;
})(spine || (spine = {}));
((spine2) => {
  class SkeletonData {
    constructor() {
      /** The skeleton's name, which by default is the name of the skeleton data file, if possible. May be null. */
      __publicField(this, "name");
      /** The skeleton's bones, sorted parent first. The root bone is always the first bone. */
      __publicField(this, "bones", new Array());
      // Ordered parents first.
      /** The skeleton's slots. */
      __publicField(this, "slots", new Array());
      // Setup pose draw order.
      __publicField(this, "skins", new Array());
      /** The skeleton's default skin. By default this skin contains all attachments that were not in a skin in Spine.
       *
       * See {@link Skeleton#getAttachmentByName()}.
       * May be null. */
      __publicField(this, "defaultSkin");
      /** The skeleton's events. */
      __publicField(this, "events", new Array());
      /** The skeleton's animations. */
      __publicField(this, "animations", new Array());
      /** The skeleton's IK constraints. */
      __publicField(this, "ikConstraints", new Array());
      /** The skeleton's transform constraints. */
      __publicField(this, "transformConstraints", new Array());
      /** The skeleton's path constraints. */
      __publicField(this, "pathConstraints", new Array());
      /** The X coordinate of the skeleton's axis aligned bounding box in the setup pose. */
      __publicField(this, "x");
      /** The Y coordinate of the skeleton's axis aligned bounding box in the setup pose. */
      __publicField(this, "y");
      /** The width of the skeleton's axis aligned bounding box in the setup pose. */
      __publicField(this, "width");
      /** The height of the skeleton's axis aligned bounding box in the setup pose. */
      __publicField(this, "height");
      /** The Spine version used to export the skeleton data, or null. */
      __publicField(this, "version");
      /** The skeleton data hash. This value will change if any of the skeleton data has changed. May be null. */
      __publicField(this, "hash");
      // Nonessential
      /** The dopesheet FPS in Spine. Available only when nonessential data was exported. */
      __publicField(this, "fps", 0);
      /** The path to the images directory as defined in Spine. Available only when nonessential data was exported. May be null. */
      __publicField(this, "imagesPath");
      /** The path to the audio directory as defined in Spine. Available only when nonessential data was exported. May be null. */
      __publicField(this, "audioPath");
    }
    /** Finds a bone by comparing each bone's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findBone(boneName) {
      if (boneName == null) throw new Error("boneName cannot be null.");
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        if (bone.name == boneName) return bone;
      }
      return null;
    }
    findBoneIndex(boneName) {
      if (boneName == null) throw new Error("boneName cannot be null.");
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++)
        if (bones[i].name == boneName) return i;
      return -1;
    }
    /** Finds a slot by comparing each slot's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findSlot(slotName) {
      if (slotName == null) throw new Error("slotName cannot be null.");
      let slots = this.slots;
      for (let i = 0, n = slots.length; i < n; i++) {
        let slot = slots[i];
        if (slot.name == slotName) return slot;
      }
      return null;
    }
    findSlotIndex(slotName) {
      if (slotName == null) throw new Error("slotName cannot be null.");
      let slots = this.slots;
      for (let i = 0, n = slots.length; i < n; i++)
        if (slots[i].name == slotName) return i;
      return -1;
    }
    /** Finds a skin by comparing each skin's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findSkin(skinName) {
      if (skinName == null) throw new Error("skinName cannot be null.");
      let skins = this.skins;
      for (let i = 0, n = skins.length; i < n; i++) {
        let skin = skins[i];
        if (skin.name == skinName) return skin;
      }
      return null;
    }
    /** Finds an event by comparing each events's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findEvent(eventDataName) {
      if (eventDataName == null) throw new Error("eventDataName cannot be null.");
      let events = this.events;
      for (let i = 0, n = events.length; i < n; i++) {
        let event = events[i];
        if (event.name == eventDataName) return event;
      }
      return null;
    }
    /** Finds an animation by comparing each animation's name. It is more efficient to cache the results of this method than to
     * call it multiple times.
     * @returns May be null. */
    findAnimation(animationName) {
      if (animationName == null) throw new Error("animationName cannot be null.");
      let animations = this.animations;
      for (let i = 0, n = animations.length; i < n; i++) {
        let animation = animations[i];
        if (animation.name == animationName) return animation;
      }
      return null;
    }
    /** Finds an IK constraint by comparing each IK constraint's name. It is more efficient to cache the results of this method
     * than to call it multiple times.
     * @return May be null. */
    findIkConstraint(constraintName) {
      if (constraintName == null) throw new Error("constraintName cannot be null.");
      let ikConstraints = this.ikConstraints;
      for (let i = 0, n = ikConstraints.length; i < n; i++) {
        let constraint = ikConstraints[i];
        if (constraint.name == constraintName) return constraint;
      }
      return null;
    }
    /** Finds a transform constraint by comparing each transform constraint's name. It is more efficient to cache the results of
     * this method than to call it multiple times.
     * @return May be null. */
    findTransformConstraint(constraintName) {
      if (constraintName == null) throw new Error("constraintName cannot be null.");
      let transformConstraints = this.transformConstraints;
      for (let i = 0, n = transformConstraints.length; i < n; i++) {
        let constraint = transformConstraints[i];
        if (constraint.name == constraintName) return constraint;
      }
      return null;
    }
    /** Finds a path constraint by comparing each path constraint's name. It is more efficient to cache the results of this method
     * than to call it multiple times.
     * @return May be null. */
    findPathConstraint(constraintName) {
      if (constraintName == null) throw new Error("constraintName cannot be null.");
      let pathConstraints = this.pathConstraints;
      for (let i = 0, n = pathConstraints.length; i < n; i++) {
        let constraint = pathConstraints[i];
        if (constraint.name == constraintName) return constraint;
      }
      return null;
    }
    findPathConstraintIndex(pathConstraintName) {
      if (pathConstraintName == null) throw new Error("pathConstraintName cannot be null.");
      let pathConstraints = this.pathConstraints;
      for (let i = 0, n = pathConstraints.length; i < n; i++)
        if (pathConstraints[i].name == pathConstraintName) return i;
      return -1;
    }
  }
  spine2.SkeletonData = SkeletonData;
})(spine || (spine = {}));
((spine2) => {
  class SkeletonJson {
    constructor(attachmentLoader) {
      __publicField(this, "attachmentLoader");
      /** Scales bone positions, image sizes, and translations as they are loaded. This allows different size images to be used at
       * runtime than were used in Spine.
       *
       * See [Scaling](http://esotericsoftware.com/spine-loading-skeleton-data#Scaling) in the Spine Runtimes Guide. */
      __publicField(this, "scale", 1);
      __publicField(this, "linkedMeshes", new Array());
      this.attachmentLoader = attachmentLoader;
    }
    readSkeletonData(json) {
      let scale = this.scale;
      let skeletonData = new spine2.SkeletonData();
      let root = typeof json === "string" ? JSON.parse(json) : json;
      let skeletonMap = root.skeleton;
      if (skeletonMap != null) {
        skeletonData.hash = skeletonMap.hash;
        skeletonData.version = skeletonMap.spine;
        if ("3.8.75" == skeletonData.version)
          throw new Error("Unsupported skeleton data, please export with a newer version of Spine.");
        skeletonData.x = skeletonMap.x;
        skeletonData.y = skeletonMap.y;
        skeletonData.width = skeletonMap.width;
        skeletonData.height = skeletonMap.height;
        skeletonData.fps = skeletonMap.fps;
        skeletonData.imagesPath = skeletonMap.images;
      }
      if (root.bones) {
        for (let i = 0; i < root.bones.length; i++) {
          let boneMap = root.bones[i];
          let parent = null;
          let parentName = this.getValue(boneMap, "parent", null);
          if (parentName != null) {
            parent = skeletonData.findBone(parentName);
            if (parent == null) throw new Error("Parent bone not found: " + parentName);
          }
          let data = new spine2.BoneData(skeletonData.bones.length, boneMap.name, parent);
          data.length = this.getValue(boneMap, "length", 0) * scale;
          data.x = this.getValue(boneMap, "x", 0) * scale;
          data.y = this.getValue(boneMap, "y", 0) * scale;
          data.rotation = this.getValue(boneMap, "rotation", 0);
          data.scaleX = this.getValue(boneMap, "scaleX", 1);
          data.scaleY = this.getValue(boneMap, "scaleY", 1);
          data.shearX = this.getValue(boneMap, "shearX", 0);
          data.shearY = this.getValue(boneMap, "shearY", 0);
          data.transformMode = SkeletonJson.transformModeFromString(this.getValue(boneMap, "transform", "normal"));
          data.skinRequired = this.getValue(boneMap, "skin", false);
          skeletonData.bones.push(data);
        }
      }
      if (root.slots) {
        for (let i = 0; i < root.slots.length; i++) {
          let slotMap = root.slots[i];
          let slotName = slotMap.name;
          let boneName = slotMap.bone;
          let boneData = skeletonData.findBone(boneName);
          if (boneData == null) throw new Error("Slot bone not found: " + boneName);
          let data = new spine2.SlotData(skeletonData.slots.length, slotName, boneData);
          let color = this.getValue(slotMap, "color", null);
          if (color != null) data.color.setFromString(color);
          let dark = this.getValue(slotMap, "dark", null);
          if (dark != null) {
            data.darkColor = new spine2.Color(1, 1, 1, 1);
            data.darkColor.setFromString(dark);
          }
          data.attachmentName = this.getValue(slotMap, "attachment", null);
          data.blendMode = SkeletonJson.blendModeFromString(this.getValue(slotMap, "blend", "normal"));
          skeletonData.slots.push(data);
        }
      }
      if (root.ik) {
        for (let i = 0; i < root.ik.length; i++) {
          let constraintMap = root.ik[i];
          let data = new spine2.IkConstraintData(constraintMap.name);
          data.order = this.getValue(constraintMap, "order", 0);
          data.skinRequired = this.getValue(constraintMap, "skin", false);
          for (let j = 0; j < constraintMap.bones.length; j++) {
            let boneName = constraintMap.bones[j];
            let bone = skeletonData.findBone(boneName);
            if (bone == null) throw new Error("IK bone not found: " + boneName);
            data.bones.push(bone);
          }
          let targetName = constraintMap.target;
          data.target = skeletonData.findBone(targetName);
          if (data.target == null) throw new Error("IK target bone not found: " + targetName);
          data.mix = this.getValue(constraintMap, "mix", 1);
          data.softness = this.getValue(constraintMap, "softness", 0) * scale;
          data.bendDirection = this.getValue(constraintMap, "bendPositive", true) ? 1 : -1;
          data.compress = this.getValue(constraintMap, "compress", false);
          data.stretch = this.getValue(constraintMap, "stretch", false);
          data.uniform = this.getValue(constraintMap, "uniform", false);
          skeletonData.ikConstraints.push(data);
        }
      }
      if (root.transform) {
        for (let i = 0; i < root.transform.length; i++) {
          let constraintMap = root.transform[i];
          let data = new spine2.TransformConstraintData(constraintMap.name);
          data.order = this.getValue(constraintMap, "order", 0);
          data.skinRequired = this.getValue(constraintMap, "skin", false);
          for (let j = 0; j < constraintMap.bones.length; j++) {
            let boneName = constraintMap.bones[j];
            let bone = skeletonData.findBone(boneName);
            if (bone == null) throw new Error("Transform constraint bone not found: " + boneName);
            data.bones.push(bone);
          }
          let targetName = constraintMap.target;
          data.target = skeletonData.findBone(targetName);
          if (data.target == null) throw new Error("Transform constraint target bone not found: " + targetName);
          data.local = this.getValue(constraintMap, "local", false);
          data.relative = this.getValue(constraintMap, "relative", false);
          data.offsetRotation = this.getValue(constraintMap, "rotation", 0);
          data.offsetX = this.getValue(constraintMap, "x", 0) * scale;
          data.offsetY = this.getValue(constraintMap, "y", 0) * scale;
          data.offsetScaleX = this.getValue(constraintMap, "scaleX", 0);
          data.offsetScaleY = this.getValue(constraintMap, "scaleY", 0);
          data.offsetShearY = this.getValue(constraintMap, "shearY", 0);
          data.rotateMix = this.getValue(constraintMap, "rotateMix", 1);
          data.translateMix = this.getValue(constraintMap, "translateMix", 1);
          data.scaleMix = this.getValue(constraintMap, "scaleMix", 1);
          data.shearMix = this.getValue(constraintMap, "shearMix", 1);
          skeletonData.transformConstraints.push(data);
        }
      }
      if (root.path) {
        for (let i = 0; i < root.path.length; i++) {
          let constraintMap = root.path[i];
          let data = new spine2.PathConstraintData(constraintMap.name);
          data.order = this.getValue(constraintMap, "order", 0);
          data.skinRequired = this.getValue(constraintMap, "skin", false);
          for (let j = 0; j < constraintMap.bones.length; j++) {
            let boneName = constraintMap.bones[j];
            let bone = skeletonData.findBone(boneName);
            if (bone == null) throw new Error("Transform constraint bone not found: " + boneName);
            data.bones.push(bone);
          }
          let targetName = constraintMap.target;
          data.target = skeletonData.findSlot(targetName);
          if (data.target == null) throw new Error("Path target slot not found: " + targetName);
          data.positionMode = SkeletonJson.positionModeFromString(this.getValue(constraintMap, "positionMode", "percent"));
          data.spacingMode = SkeletonJson.spacingModeFromString(this.getValue(constraintMap, "spacingMode", "length"));
          data.rotateMode = SkeletonJson.rotateModeFromString(this.getValue(constraintMap, "rotateMode", "tangent"));
          data.offsetRotation = this.getValue(constraintMap, "rotation", 0);
          data.position = this.getValue(constraintMap, "position", 0);
          if (data.positionMode == 0 /* Fixed */) data.position *= scale;
          data.spacing = this.getValue(constraintMap, "spacing", 0);
          if (data.spacingMode == 0 /* Length */ || data.spacingMode == 1 /* Fixed */) data.spacing *= scale;
          data.rotateMix = this.getValue(constraintMap, "rotateMix", 1);
          data.translateMix = this.getValue(constraintMap, "translateMix", 1);
          skeletonData.pathConstraints.push(data);
        }
      }
      if (root.skins) {
        for (let i = 0; i < root.skins.length; i++) {
          let skinMap = root.skins[i];
          let skin = new spine2.Skin(skinMap.name);
          if (skinMap.bones) {
            for (let ii = 0; ii < skinMap.bones.length; ii++) {
              let bone = skeletonData.findBone(skinMap.bones[ii]);
              if (bone == null) throw new Error("Skin bone not found: " + skinMap.bones[i]);
              skin.bones.push(bone);
            }
          }
          if (skinMap.ik) {
            for (let ii = 0; ii < skinMap.ik.length; ii++) {
              let constraint = skeletonData.findIkConstraint(skinMap.ik[ii]);
              if (constraint == null) throw new Error("Skin IK constraint not found: " + skinMap.ik[i]);
              skin.constraints.push(constraint);
            }
          }
          if (skinMap.transform) {
            for (let ii = 0; ii < skinMap.transform.length; ii++) {
              let constraint = skeletonData.findTransformConstraint(skinMap.transform[ii]);
              if (constraint == null) throw new Error("Skin transform constraint not found: " + skinMap.transform[i]);
              skin.constraints.push(constraint);
            }
          }
          if (skinMap.path) {
            for (let ii = 0; ii < skinMap.path.length; ii++) {
              let constraint = skeletonData.findPathConstraint(skinMap.path[ii]);
              if (constraint == null) throw new Error("Skin path constraint not found: " + skinMap.path[i]);
              skin.constraints.push(constraint);
            }
          }
          for (let slotName in skinMap.attachments) {
            let slot = skeletonData.findSlot(slotName);
            if (slot == null) throw new Error("Slot not found: " + slotName);
            let slotMap = skinMap.attachments[slotName];
            for (let entryName in slotMap) {
              let attachment = this.readAttachment(slotMap[entryName], skin, slot.index, entryName, skeletonData);
              if (attachment != null) skin.setAttachment(slot.index, entryName, attachment);
            }
          }
          skeletonData.skins.push(skin);
          if (skin.name == "default") skeletonData.defaultSkin = skin;
        }
      }
      for (let i = 0, n = this.linkedMeshes.length; i < n; i++) {
        let linkedMesh = this.linkedMeshes[i];
        let skin = linkedMesh.skin == null ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin);
        if (skin == null) throw new Error("Skin not found: " + linkedMesh.skin);
        let parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent);
        if (parent == null) throw new Error("Parent mesh not found: " + linkedMesh.parent);
        linkedMesh.mesh.deformAttachment = linkedMesh.inheritDeform ? parent : linkedMesh.mesh;
        linkedMesh.mesh.setParentMesh(parent);
        linkedMesh.mesh.updateUVs();
      }
      this.linkedMeshes.length = 0;
      if (root.events) {
        for (let eventName in root.events) {
          let eventMap = root.events[eventName];
          let data = new spine2.EventData(eventName);
          data.intValue = this.getValue(eventMap, "int", 0);
          data.floatValue = this.getValue(eventMap, "float", 0);
          data.stringValue = this.getValue(eventMap, "string", "");
          data.audioPath = this.getValue(eventMap, "audio", null);
          if (data.audioPath != null) {
            data.volume = this.getValue(eventMap, "volume", 1);
            data.balance = this.getValue(eventMap, "balance", 0);
          }
          skeletonData.events.push(data);
        }
      }
      if (root.animations) {
        for (let animationName in root.animations) {
          let animationMap = root.animations[animationName];
          this.readAnimation(animationMap, animationName, skeletonData);
        }
      }
      return skeletonData;
    }
    readAttachment(map, skin, slotIndex, name, skeletonData) {
      let scale = this.scale;
      name = this.getValue(map, "name", name);
      let type = this.getValue(map, "type", "region");
      switch (type) {
        case "region": {
          let path = this.getValue(map, "path", name);
          let region = this.attachmentLoader.newRegionAttachment(skin, name, path);
          if (region == null) return null;
          region.path = path;
          region.x = this.getValue(map, "x", 0) * scale;
          region.y = this.getValue(map, "y", 0) * scale;
          region.scaleX = this.getValue(map, "scaleX", 1);
          region.scaleY = this.getValue(map, "scaleY", 1);
          region.rotation = this.getValue(map, "rotation", 0);
          region.width = map.width * scale;
          region.height = map.height * scale;
          let color = this.getValue(map, "color", null);
          if (color != null) region.color.setFromString(color);
          region.updateOffset();
          return region;
        }
        case "boundingbox": {
          let box = this.attachmentLoader.newBoundingBoxAttachment(skin, name);
          if (box == null) return null;
          this.readVertices(map, box, map.vertexCount << 1);
          let color = this.getValue(map, "color", null);
          if (color != null) box.color.setFromString(color);
          return box;
        }
        case "mesh":
        case "linkedmesh": {
          let path = this.getValue(map, "path", name);
          let mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
          if (mesh == null) return null;
          mesh.path = path;
          let color = this.getValue(map, "color", null);
          if (color != null) mesh.color.setFromString(color);
          mesh.width = this.getValue(map, "width", 0) * scale;
          mesh.height = this.getValue(map, "height", 0) * scale;
          let parent = this.getValue(map, "parent", null);
          if (parent != null) {
            this.linkedMeshes.push(new LinkedMesh(mesh, this.getValue(map, "skin", null), slotIndex, parent, this.getValue(map, "deform", true)));
            return mesh;
          }
          let uvs = map.uvs;
          this.readVertices(map, mesh, uvs.length);
          mesh.triangles = map.triangles;
          mesh.regionUVs = uvs;
          mesh.updateUVs();
          mesh.edges = this.getValue(map, "edges", null);
          mesh.hullLength = this.getValue(map, "hull", 0) * 2;
          return mesh;
        }
        case "path": {
          let path = this.attachmentLoader.newPathAttachment(skin, name);
          if (path == null) return null;
          path.closed = this.getValue(map, "closed", false);
          path.constantSpeed = this.getValue(map, "constantSpeed", true);
          let vertexCount = map.vertexCount;
          this.readVertices(map, path, vertexCount << 1);
          let lengths = spine2.Utils.newArray(vertexCount / 3, 0);
          for (let i = 0; i < map.lengths.length; i++)
            lengths[i] = map.lengths[i] * scale;
          path.lengths = lengths;
          let color = this.getValue(map, "color", null);
          if (color != null) path.color.setFromString(color);
          return path;
        }
        case "point": {
          let point = this.attachmentLoader.newPointAttachment(skin, name);
          if (point == null) return null;
          point.x = this.getValue(map, "x", 0) * scale;
          point.y = this.getValue(map, "y", 0) * scale;
          point.rotation = this.getValue(map, "rotation", 0);
          let color = this.getValue(map, "color", null);
          if (color != null) point.color.setFromString(color);
          return point;
        }
        case "clipping": {
          let clip = this.attachmentLoader.newClippingAttachment(skin, name);
          if (clip == null) return null;
          let end = this.getValue(map, "end", null);
          if (end != null) {
            let slot = skeletonData.findSlot(end);
            if (slot == null) throw new Error("Clipping end slot not found: " + end);
            clip.endSlot = slot;
          }
          let vertexCount = map.vertexCount;
          this.readVertices(map, clip, vertexCount << 1);
          let color = this.getValue(map, "color", null);
          if (color != null) clip.color.setFromString(color);
          return clip;
        }
      }
      return null;
    }
    readVertices(map, attachment, verticesLength) {
      let scale = this.scale;
      attachment.worldVerticesLength = verticesLength;
      let vertices = map.vertices;
      if (verticesLength == vertices.length) {
        let scaledVertices = spine2.Utils.toFloatArray(vertices);
        if (scale != 1) {
          for (let i = 0, n = vertices.length; i < n; i++)
            scaledVertices[i] *= scale;
        }
        attachment.vertices = scaledVertices;
        return;
      }
      let weights = new Array();
      let bones = new Array();
      for (let i = 0, n = vertices.length; i < n; ) {
        let boneCount = vertices[i++];
        bones.push(boneCount);
        for (let nn = i + boneCount * 4; i < nn; i += 4) {
          bones.push(vertices[i]);
          weights.push(vertices[i + 1] * scale);
          weights.push(vertices[i + 2] * scale);
          weights.push(vertices[i + 3]);
        }
      }
      attachment.bones = bones;
      attachment.vertices = spine2.Utils.toFloatArray(weights);
    }
    readAnimation(map, name, skeletonData) {
      let scale = this.scale;
      let timelines = new Array();
      let duration = 0;
      if (map.slots) {
        for (let slotName in map.slots) {
          let slotMap = map.slots[slotName];
          let slotIndex = skeletonData.findSlotIndex(slotName);
          if (slotIndex == -1) throw new Error("Slot not found: " + slotName);
          for (let timelineName in slotMap) {
            let timelineMap = slotMap[timelineName];
            if (timelineName == "attachment") {
              let timeline = new spine2.AttachmentTimeline(timelineMap.length);
              timeline.slotIndex = slotIndex;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                timeline.setFrame(frameIndex++, this.getValue(valueMap, "time", 0), valueMap.name);
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
            } else if (timelineName == "color") {
              let timeline = new spine2.ColorTimeline(timelineMap.length);
              timeline.slotIndex = slotIndex;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                let color = new spine2.Color();
                color.setFromString(valueMap.color);
                timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), color.r, color.g, color.b, color.a);
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * spine2.ColorTimeline.ENTRIES]);
            } else if (timelineName == "twoColor") {
              let timeline = new spine2.TwoColorTimeline(timelineMap.length);
              timeline.slotIndex = slotIndex;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                let light = new spine2.Color();
                let dark = new spine2.Color();
                light.setFromString(valueMap.light);
                dark.setFromString(valueMap.dark);
                timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), light.r, light.g, light.b, light.a, dark.r, dark.g, dark.b);
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * spine2.TwoColorTimeline.ENTRIES]);
            } else
              throw new Error("Invalid timeline type for a slot: " + timelineName + " (" + slotName + ")");
          }
        }
      }
      if (map.bones) {
        for (let boneName in map.bones) {
          let boneMap = map.bones[boneName];
          let boneIndex = skeletonData.findBoneIndex(boneName);
          if (boneIndex == -1) throw new Error("Bone not found: " + boneName);
          for (let timelineName in boneMap) {
            let timelineMap = boneMap[timelineName];
            if (timelineName === "rotate") {
              let timeline = new spine2.RotateTimeline(timelineMap.length);
              timeline.boneIndex = boneIndex;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), this.getValue(valueMap, "angle", 0));
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * spine2.RotateTimeline.ENTRIES]);
            } else if (timelineName === "translate" || timelineName === "scale" || timelineName === "shear") {
              let timeline = null;
              let timelineScale = 1, defaultValue = 0;
              if (timelineName === "scale") {
                timeline = new spine2.ScaleTimeline(timelineMap.length);
                defaultValue = 1;
              } else if (timelineName === "shear")
                timeline = new spine2.ShearTimeline(timelineMap.length);
              else {
                timeline = new spine2.TranslateTimeline(timelineMap.length);
                timelineScale = scale;
              }
              timeline.boneIndex = boneIndex;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                let x = this.getValue(valueMap, "x", defaultValue), y = this.getValue(valueMap, "y", defaultValue);
                timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), x * timelineScale, y * timelineScale);
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * spine2.TranslateTimeline.ENTRIES]);
            } else
              throw new Error("Invalid timeline type for a bone: " + timelineName + " (" + boneName + ")");
          }
        }
      }
      if (map.ik) {
        for (let constraintName in map.ik) {
          let constraintMap = map.ik[constraintName];
          let constraint = skeletonData.findIkConstraint(constraintName);
          let timeline = new spine2.IkConstraintTimeline(constraintMap.length);
          timeline.ikConstraintIndex = skeletonData.ikConstraints.indexOf(constraint);
          let frameIndex = 0;
          for (let i = 0; i < constraintMap.length; i++) {
            let valueMap = constraintMap[i];
            timeline.setFrame(
              frameIndex,
              this.getValue(valueMap, "time", 0),
              this.getValue(valueMap, "mix", 1),
              this.getValue(valueMap, "softness", 0) * scale,
              this.getValue(valueMap, "bendPositive", true) ? 1 : -1,
              this.getValue(valueMap, "compress", false),
              this.getValue(valueMap, "stretch", false)
            );
            this.readCurve(valueMap, timeline, frameIndex);
            frameIndex++;
          }
          timelines.push(timeline);
          duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * spine2.IkConstraintTimeline.ENTRIES]);
        }
      }
      if (map.transform) {
        for (let constraintName in map.transform) {
          let constraintMap = map.transform[constraintName];
          let constraint = skeletonData.findTransformConstraint(constraintName);
          let timeline = new spine2.TransformConstraintTimeline(constraintMap.length);
          timeline.transformConstraintIndex = skeletonData.transformConstraints.indexOf(constraint);
          let frameIndex = 0;
          for (let i = 0; i < constraintMap.length; i++) {
            let valueMap = constraintMap[i];
            timeline.setFrame(
              frameIndex,
              this.getValue(valueMap, "time", 0),
              this.getValue(valueMap, "rotateMix", 1),
              this.getValue(valueMap, "translateMix", 1),
              this.getValue(valueMap, "scaleMix", 1),
              this.getValue(valueMap, "shearMix", 1)
            );
            this.readCurve(valueMap, timeline, frameIndex);
            frameIndex++;
          }
          timelines.push(timeline);
          duration = Math.max(
            duration,
            timeline.frames[(timeline.getFrameCount() - 1) * spine2.TransformConstraintTimeline.ENTRIES]
          );
        }
      }
      if (map.path) {
        for (let constraintName in map.path) {
          let constraintMap = map.path[constraintName];
          let index = skeletonData.findPathConstraintIndex(constraintName);
          if (index == -1) throw new Error("Path constraint not found: " + constraintName);
          let data = skeletonData.pathConstraints[index];
          for (let timelineName in constraintMap) {
            let timelineMap = constraintMap[timelineName];
            if (timelineName === "position" || timelineName === "spacing") {
              let timeline = null;
              let timelineScale = 1;
              if (timelineName === "spacing") {
                timeline = new spine2.PathConstraintSpacingTimeline(timelineMap.length);
                if (data.spacingMode == 0 /* Length */ || data.spacingMode == 1 /* Fixed */) timelineScale = scale;
              } else {
                timeline = new spine2.PathConstraintPositionTimeline(timelineMap.length);
                if (data.positionMode == 0 /* Fixed */) timelineScale = scale;
              }
              timeline.pathConstraintIndex = index;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), this.getValue(valueMap, timelineName, 0) * timelineScale);
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(
                duration,
                timeline.frames[(timeline.getFrameCount() - 1) * spine2.PathConstraintPositionTimeline.ENTRIES]
              );
            } else if (timelineName === "mix") {
              let timeline = new spine2.PathConstraintMixTimeline(timelineMap.length);
              timeline.pathConstraintIndex = index;
              let frameIndex = 0;
              for (let i = 0; i < timelineMap.length; i++) {
                let valueMap = timelineMap[i];
                timeline.setFrame(
                  frameIndex,
                  this.getValue(valueMap, "time", 0),
                  this.getValue(valueMap, "rotateMix", 1),
                  this.getValue(valueMap, "translateMix", 1)
                );
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(
                duration,
                timeline.frames[(timeline.getFrameCount() - 1) * spine2.PathConstraintMixTimeline.ENTRIES]
              );
            }
          }
        }
      }
      if (map.deform) {
        for (let deformName in map.deform) {
          let deformMap = map.deform[deformName];
          let skin = skeletonData.findSkin(deformName);
          if (skin == null) throw new Error("Skin not found: " + deformName);
          for (let slotName in deformMap) {
            let slotMap = deformMap[slotName];
            let slotIndex = skeletonData.findSlotIndex(slotName);
            if (slotIndex == -1) throw new Error("Slot not found: " + slotMap.name);
            for (let timelineName in slotMap) {
              let timelineMap = slotMap[timelineName];
              let attachment = skin.getAttachment(slotIndex, timelineName);
              if (attachment == null) throw new Error("Deform attachment not found: " + timelineMap.name);
              let weighted = attachment.bones != null;
              let vertices = attachment.vertices;
              let deformLength = weighted ? vertices.length / 3 * 2 : vertices.length;
              let timeline = new spine2.DeformTimeline(timelineMap.length);
              timeline.slotIndex = slotIndex;
              timeline.attachment = attachment;
              let frameIndex = 0;
              for (let j = 0; j < timelineMap.length; j++) {
                let valueMap = timelineMap[j];
                let deform;
                let verticesValue = this.getValue(valueMap, "vertices", null);
                if (verticesValue == null)
                  deform = weighted ? spine2.Utils.newFloatArray(deformLength) : vertices;
                else {
                  deform = spine2.Utils.newFloatArray(deformLength);
                  let start = this.getValue(valueMap, "offset", 0);
                  spine2.Utils.arrayCopy(verticesValue, 0, deform, start, verticesValue.length);
                  if (scale != 1) {
                    for (let i = start, n = i + verticesValue.length; i < n; i++)
                      deform[i] *= scale;
                  }
                  if (!weighted) {
                    for (let i = 0; i < deformLength; i++)
                      deform[i] += vertices[i];
                  }
                }
                timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), deform);
                this.readCurve(valueMap, timeline, frameIndex);
                frameIndex++;
              }
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
            }
          }
        }
      }
      let drawOrderNode = map.drawOrder;
      if (drawOrderNode == null) drawOrderNode = map.draworder;
      if (drawOrderNode != null) {
        let timeline = new spine2.DrawOrderTimeline(drawOrderNode.length);
        let slotCount = skeletonData.slots.length;
        let frameIndex = 0;
        for (let j = 0; j < drawOrderNode.length; j++) {
          let drawOrderMap = drawOrderNode[j];
          let drawOrder = null;
          let offsets = this.getValue(drawOrderMap, "offsets", null);
          if (offsets != null) {
            drawOrder = spine2.Utils.newArray(slotCount, -1);
            let unchanged = spine2.Utils.newArray(slotCount - offsets.length, 0);
            let originalIndex = 0, unchangedIndex = 0;
            for (let i = 0; i < offsets.length; i++) {
              let offsetMap = offsets[i];
              let slotIndex = skeletonData.findSlotIndex(offsetMap.slot);
              if (slotIndex == -1) throw new Error("Slot not found: " + offsetMap.slot);
              while (originalIndex != slotIndex)
                unchanged[unchangedIndex++] = originalIndex++;
              drawOrder[originalIndex + offsetMap.offset] = originalIndex++;
            }
            while (originalIndex < slotCount)
              unchanged[unchangedIndex++] = originalIndex++;
            for (let i = slotCount - 1; i >= 0; i--)
              if (drawOrder[i] == -1) drawOrder[i] = unchanged[--unchangedIndex];
          }
          timeline.setFrame(frameIndex++, this.getValue(drawOrderMap, "time", 0), drawOrder);
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
      }
      if (map.events) {
        let timeline = new spine2.EventTimeline(map.events.length);
        let frameIndex = 0;
        for (let i = 0; i < map.events.length; i++) {
          let eventMap = map.events[i];
          let eventData = skeletonData.findEvent(eventMap.name);
          if (eventData == null) throw new Error("Event not found: " + eventMap.name);
          let event = new spine2.Event(spine2.Utils.toSinglePrecision(this.getValue(eventMap, "time", 0)), eventData);
          event.intValue = this.getValue(eventMap, "int", eventData.intValue);
          event.floatValue = this.getValue(eventMap, "float", eventData.floatValue);
          event.stringValue = this.getValue(eventMap, "string", eventData.stringValue);
          if (event.data.audioPath != null) {
            event.volume = this.getValue(eventMap, "volume", 1);
            event.balance = this.getValue(eventMap, "balance", 0);
          }
          timeline.setFrame(frameIndex++, event);
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
      }
      if (isNaN(duration)) {
        throw new Error("Error while parsing animation, duration is NaN");
      }
      skeletonData.animations.push(new spine2.Animation(name, timelines, duration));
    }
    readCurve(map, timeline, frameIndex) {
      if (!map.hasOwnProperty("curve")) return;
      if (map.curve == "stepped")
        timeline.setStepped(frameIndex);
      else {
        let curve = map.curve;
        timeline.setCurve(frameIndex, curve, this.getValue(map, "c2", 0), this.getValue(map, "c3", 1), this.getValue(map, "c4", 1));
      }
    }
    getValue(map, prop, defaultValue) {
      return map[prop] !== void 0 ? map[prop] : defaultValue;
    }
    static blendModeFromString(str) {
      str = str.toLowerCase();
      if (str == "normal") return 0 /* Normal */;
      if (str == "additive") return 1 /* Additive */;
      if (str == "multiply") return 2 /* Multiply */;
      if (str == "screen") return 3 /* Screen */;
      throw new Error(`Unknown blend mode: ${str}`);
    }
    static positionModeFromString(str) {
      str = str.toLowerCase();
      if (str == "fixed") return 0 /* Fixed */;
      if (str == "percent") return 1 /* Percent */;
      throw new Error(`Unknown position mode: ${str}`);
    }
    static spacingModeFromString(str) {
      str = str.toLowerCase();
      if (str == "length") return 0 /* Length */;
      if (str == "fixed") return 1 /* Fixed */;
      if (str == "percent") return 2 /* Percent */;
      throw new Error(`Unknown position mode: ${str}`);
    }
    static rotateModeFromString(str) {
      str = str.toLowerCase();
      if (str == "tangent") return 0 /* Tangent */;
      if (str == "chain") return 1 /* Chain */;
      if (str == "chainscale") return 2 /* ChainScale */;
      throw new Error(`Unknown rotate mode: ${str}`);
    }
    static transformModeFromString(str) {
      str = str.toLowerCase();
      if (str == "normal") return 0 /* Normal */;
      if (str == "onlytranslation") return 1 /* OnlyTranslation */;
      if (str == "norotationorreflection") return 2 /* NoRotationOrReflection */;
      if (str == "noscale") return 3 /* NoScale */;
      if (str == "noscaleorreflection") return 4 /* NoScaleOrReflection */;
      throw new Error(`Unknown transform mode: ${str}`);
    }
  }
  spine2.SkeletonJson = SkeletonJson;
  class LinkedMesh {
    constructor(mesh, skin, slotIndex, parent, inheritDeform) {
      __publicField(this, "parent");
      __publicField(this, "skin");
      __publicField(this, "slotIndex");
      __publicField(this, "mesh");
      __publicField(this, "inheritDeform");
      this.mesh = mesh;
      this.skin = skin;
      this.slotIndex = slotIndex;
      this.parent = parent;
      this.inheritDeform = inheritDeform;
    }
  }
})(spine || (spine = {}));
((spine2) => {
  class SkinEntry {
    constructor(slotIndex, name, attachment) {
      __publicField(this, "slotIndex", slotIndex);
      __publicField(this, "name", name);
      __publicField(this, "attachment", attachment);
    }
  }
  spine2.SkinEntry = SkinEntry;
  class Skin {
    constructor(name) {
      /** The skin's name, which is unique across all skins in the skeleton. */
      __publicField(this, "name");
      __publicField(this, "attachments", new Array());
      __publicField(this, "bones", Array());
      __publicField(this, "constraints", new Array());
      if (name == null) throw new Error("name cannot be null.");
      this.name = name;
    }
    /** Adds an attachment to the skin for the specified slot index and name. */
    setAttachment(slotIndex, name, attachment) {
      if (attachment == null) throw new Error("attachment cannot be null.");
      let attachments = this.attachments;
      if (slotIndex >= attachments.length) attachments.length = slotIndex + 1;
      if (!attachments[slotIndex]) attachments[slotIndex] = {};
      attachments[slotIndex][name] = attachment;
    }
    /** Adds all attachments, bones, and constraints from the specified skin to this skin. */
    addSkin(skin) {
      for (let i = 0; i < skin.bones.length; i++) {
        let bone = skin.bones[i];
        let contained = false;
        for (let j = 0; j < this.bones.length; j++) {
          if (this.bones[j] == bone) {
            contained = true;
            break;
          }
        }
        if (!contained) this.bones.push(bone);
      }
      for (let i = 0; i < skin.constraints.length; i++) {
        let constraint = skin.constraints[i];
        let contained = false;
        for (let j = 0; j < this.constraints.length; j++) {
          if (this.constraints[j] == constraint) {
            contained = true;
            break;
          }
        }
        if (!contained) this.constraints.push(constraint);
      }
      let attachments = skin.getAttachments();
      for (let i = 0; i < attachments.length; i++) {
        var attachment = attachments[i];
        this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
      }
    }
    /** Adds all bones and constraints and copies of all attachments from the specified skin to this skin. Mesh attachments are not
     * copied, instead a new linked mesh is created. The attachment copies can be modified without affecting the originals. */
    copySkin(skin) {
      for (let i = 0; i < skin.bones.length; i++) {
        let bone = skin.bones[i];
        let contained = false;
        for (let j = 0; j < this.bones.length; j++) {
          if (this.bones[j] == bone) {
            contained = true;
            break;
          }
        }
        if (!contained) this.bones.push(bone);
      }
      for (let i = 0; i < skin.constraints.length; i++) {
        let constraint = skin.constraints[i];
        let contained = false;
        for (let j = 0; j < this.constraints.length; j++) {
          if (this.constraints[j] == constraint) {
            contained = true;
            break;
          }
        }
        if (!contained) this.constraints.push(constraint);
      }
      let attachments = skin.getAttachments();
      for (let i = 0; i < attachments.length; i++) {
        var attachment = attachments[i];
        if (attachment.attachment == null) continue;
        if (attachment.attachment instanceof spine2.MeshAttachment) {
          attachment.attachment = attachment.attachment.newLinkedMesh();
          this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
        } else {
          attachment.attachment = attachment.attachment.copy();
          this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
        }
      }
    }
    /** Returns the attachment for the specified slot index and name, or null. */
    getAttachment(slotIndex, name) {
      let dictionary = this.attachments[slotIndex];
      return dictionary ? dictionary[name] : null;
    }
    /** Removes the attachment in the skin for the specified slot index and name, if any. */
    removeAttachment(slotIndex, name) {
      let dictionary = this.attachments[slotIndex];
      if (dictionary) dictionary[name] = null;
    }
    /** Returns all attachments in this skin. */
    getAttachments() {
      let entries = new Array();
      for (var i = 0; i < this.attachments.length; i++) {
        let slotAttachments = this.attachments[i];
        if (slotAttachments) {
          for (let name in slotAttachments) {
            let attachment = slotAttachments[name];
            if (attachment) entries.push(new SkinEntry(i, name, attachment));
          }
        }
      }
      return entries;
    }
    /** Returns all attachments in this skin for the specified slot index. */
    getAttachmentsForSlot(slotIndex, attachments) {
      let slotAttachments = this.attachments[slotIndex];
      if (slotAttachments) {
        for (let name in slotAttachments) {
          let attachment = slotAttachments[name];
          if (attachment) attachments.push(new SkinEntry(slotIndex, name, attachment));
        }
      }
    }
    /** Clears all attachments, bones, and constraints. */
    clear() {
      this.attachments.length = 0;
      this.bones.length = 0;
      this.constraints.length = 0;
    }
    /** Attach each attachment in this skin if the corresponding attachment in the old skin is currently attached. */
    attachAll(skeleton, oldSkin) {
      let slotIndex = 0;
      for (let i = 0; i < skeleton.slots.length; i++) {
        let slot = skeleton.slots[i];
        let slotAttachment = slot.getAttachment();
        if (slotAttachment && slotIndex < oldSkin.attachments.length) {
          let dictionary = oldSkin.attachments[slotIndex];
          for (let key in dictionary) {
            let skinAttachment = dictionary[key];
            if (slotAttachment == skinAttachment) {
              let attachment = this.getAttachment(slotIndex, key);
              if (attachment != null) slot.setAttachment(attachment);
              break;
            }
          }
        }
        slotIndex++;
      }
    }
  }
  spine2.Skin = Skin;
})(spine || (spine = {}));
((spine2) => {
  class Slot {
    constructor(data, bone) {
      /** The slot's setup pose data. */
      __publicField(this, "data");
      /** The bone this slot belongs to. */
      __publicField(this, "bone");
      /** The color used to tint the slot's attachment. If {@link #getDarkColor()} is set, this is used as the light color for two
       * color tinting. */
      __publicField(this, "color");
      /** The dark color used to tint the slot's attachment for two color tinting, or null if two color tinting is not used. The dark
       * color's alpha is not used. */
      __publicField(this, "darkColor");
      __publicField(this, "attachment");
      __publicField(this, "attachmentTime");
      __publicField(this, "attachmentState");
      /** Values to deform the slot's attachment. For an unweighted mesh, the entries are local positions for each vertex. For a
       * weighted mesh, the entries are an offset for each vertex which will be added to the mesh's local vertex positions.
       *
       * See {@link VertexAttachment#computeWorldVertices()} and {@link DeformTimeline}. */
      __publicField(this, "deform", new Array());
      if (data == null) throw new Error("data cannot be null.");
      if (bone == null) throw new Error("bone cannot be null.");
      this.data = data;
      this.bone = bone;
      this.color = new spine2.Color();
      this.darkColor = data.darkColor == null ? null : new spine2.Color();
      this.setToSetupPose();
    }
    /** The skeleton this slot belongs to. */
    getSkeleton() {
      return this.bone.skeleton;
    }
    /** The current attachment for the slot, or null if the slot has no attachment. */
    getAttachment() {
      return this.attachment;
    }
    /** Sets the slot's attachment and, if the attachment changed, resets {@link #attachmentTime} and clears {@link #deform}.
     * @param attachment May be null. */
    setAttachment(attachment) {
      if (this.attachment == attachment) return;
      this.attachment = attachment;
      this.attachmentTime = this.bone.skeleton.time;
      this.deform.length = 0;
    }
    setAttachmentTime(time) {
      this.attachmentTime = this.bone.skeleton.time - time;
    }
    /** The time that has elapsed since the last time the attachment was set or cleared. Relies on Skeleton
     * {@link Skeleton#time}. */
    getAttachmentTime() {
      return this.bone.skeleton.time - this.attachmentTime;
    }
    /** Sets this slot to the setup pose. */
    setToSetupPose() {
      this.color.setFromColor(this.data.color);
      if (this.darkColor != null) this.darkColor.setFromColor(this.data.darkColor);
      if (this.data.attachmentName == null)
        this.attachment = null;
      else {
        this.attachment = null;
        this.setAttachment(this.bone.skeleton.getAttachment(this.data.index, this.data.attachmentName));
      }
    }
  }
  spine2.Slot = Slot;
})(spine || (spine = {}));
((spine2) => {
  class SlotData {
    constructor(index, name, boneData) {
      /** The index of the slot in {@link Skeleton#getSlots()}. */
      __publicField(this, "index");
      /** The name of the slot, which is unique across all slots in the skeleton. */
      __publicField(this, "name");
      /** The bone this slot belongs to. */
      __publicField(this, "boneData");
      /** The color used to tint the slot's attachment. If {@link #getDarkColor()} is set, this is used as the light color for two
       * color tinting. */
      __publicField(this, "color", new spine2.Color(1, 1, 1, 1));
      /** The dark color used to tint the slot's attachment for two color tinting, or null if two color tinting is not used. The dark
       * color's alpha is not used. */
      __publicField(this, "darkColor");
      /** The name of the attachment that is visible for this slot in the setup pose, or null if no attachment is visible. */
      __publicField(this, "attachmentName");
      /** The blend mode for drawing the slot's attachment. */
      __publicField(this, "blendMode");
      if (index < 0) throw new Error("index must be >= 0.");
      if (name == null) throw new Error("name cannot be null.");
      if (boneData == null) throw new Error("boneData cannot be null.");
      this.index = index;
      this.name = name;
      this.boneData = boneData;
    }
  }
  spine2.SlotData = SlotData;
})(spine || (spine = {}));
((spine2) => {
  class Texture {
    constructor(image) {
      __publicField(this, "_image");
      this._image = image;
    }
    getImage() {
      return this._image;
    }
    static filterFromString(text) {
      switch (text.toLowerCase()) {
        case "nearest":
          return 9728 /* Nearest */;
        case "linear":
          return 9729 /* Linear */;
        case "mipmap":
          return 9987 /* MipMap */;
        case "mipmapnearestnearest":
          return 9984 /* MipMapNearestNearest */;
        case "mipmaplinearnearest":
          return 9985 /* MipMapLinearNearest */;
        case "mipmapnearestlinear":
          return 9986 /* MipMapNearestLinear */;
        case "mipmaplinearlinear":
          return 9987 /* MipMapLinearLinear */;
        default:
          throw new Error(`Unknown texture filter ${text}`);
      }
    }
    static wrapFromString(text) {
      switch (text.toLowerCase()) {
        case "mirroredtepeat":
          return 33648 /* MirroredRepeat */;
        case "clamptoedge":
          return 33071 /* ClampToEdge */;
        case "repeat":
          return 10497 /* Repeat */;
        default:
          throw new Error(`Unknown texture wrap ${text}`);
      }
    }
  }
  spine2.Texture = Texture;
  let TextureFilter;
  ((TextureFilter2) => {
    TextureFilter2[TextureFilter2["Nearest"] = 9728] = "Nearest";
    TextureFilter2[TextureFilter2["Linear"] = 9729] = "Linear";
    TextureFilter2[TextureFilter2["MipMap"] = 9987] = "MipMap";
    TextureFilter2[TextureFilter2["MipMapNearestNearest"] = 9984] = "MipMapNearestNearest";
    TextureFilter2[TextureFilter2["MipMapLinearNearest"] = 9985] = "MipMapLinearNearest";
    TextureFilter2[TextureFilter2["MipMapNearestLinear"] = 9986] = "MipMapNearestLinear";
    TextureFilter2[TextureFilter2["MipMapLinearLinear"] = 9987] = "MipMapLinearLinear";
  })(TextureFilter = spine2.TextureFilter || (spine2.TextureFilter = {}));
  let TextureWrap;
  ((TextureWrap2) => {
    TextureWrap2[TextureWrap2["MirroredRepeat"] = 33648] = "MirroredRepeat";
    TextureWrap2[TextureWrap2["ClampToEdge"] = 33071] = "ClampToEdge";
    TextureWrap2[TextureWrap2["Repeat"] = 10497] = "Repeat";
  })(TextureWrap = spine2.TextureWrap || (spine2.TextureWrap = {}));
  class TextureRegion {
    constructor() {
      __publicField(this, "renderObject");
      __publicField(this, "u", 0);
      __publicField(this, "v", 0);
      __publicField(this, "u2", 0);
      __publicField(this, "v2", 0);
      __publicField(this, "width", 0);
      __publicField(this, "height", 0);
      __publicField(this, "rotate", false);
      __publicField(this, "offsetX", 0);
      __publicField(this, "offsetY", 0);
      __publicField(this, "originalWidth", 0);
      __publicField(this, "originalHeight", 0);
    }
  }
  spine2.TextureRegion = TextureRegion;
  class FakeTexture extends Texture {
    setFilters(minFilter, magFilter) {
    }
    setWraps(uWrap, vWrap) {
    }
    dispose() {
    }
  }
  spine2.FakeTexture = FakeTexture;
})(spine || (spine = {}));
((spine2) => {
  class TextureAtlas {
    constructor(atlasText, textureLoader) {
      __publicField(this, "pages", new Array());
      __publicField(this, "regions", new Array());
      this.load(atlasText, textureLoader);
    }
    load(atlasText, textureLoader) {
      if (textureLoader == null)
        throw new Error("textureLoader cannot be null.");
      let reader = new TextureAtlasReader(atlasText);
      let tuple = new Array(4);
      let page = null;
      while (true) {
        let line = reader.readLine();
        if (line == null)
          break;
        line = line.trim();
        if (line.length == 0)
          page = null;
        else if (!page) {
          page = new TextureAtlasPage();
          page.name = line;
          if (reader.readTuple(tuple) == 2) {
            page.width = parseInt(tuple[0]);
            page.height = parseInt(tuple[1]);
            reader.readTuple(tuple);
          }
          reader.readTuple(tuple);
          page.minFilter = spine2.Texture.filterFromString(tuple[0]);
          page.magFilter = spine2.Texture.filterFromString(tuple[1]);
          let direction = reader.readValue();
          page.uWrap = 33071 /* ClampToEdge */;
          page.vWrap = 33071 /* ClampToEdge */;
          if (direction == "x")
            page.uWrap = 10497 /* Repeat */;
          else if (direction == "y")
            page.vWrap = 10497 /* Repeat */;
          else if (direction == "xy")
            page.uWrap = page.vWrap = 10497 /* Repeat */;
          page.texture = textureLoader(line);
          page.texture.setFilters(page.minFilter, page.magFilter);
          page.texture.setWraps(page.uWrap, page.vWrap);
          page.width = page.texture.getImage().width;
          page.height = page.texture.getImage().height;
          this.pages.push(page);
        } else {
          let region = new TextureAtlasRegion();
          region.name = line;
          region.page = page;
          let rotateValue = reader.readValue();
          if (rotateValue.toLocaleLowerCase() == "true") {
            region.degrees = 90;
          } else if (rotateValue.toLocaleLowerCase() == "false") {
            region.degrees = 0;
          } else {
            region.degrees = parseFloat(rotateValue);
          }
          region.rotate = region.degrees == 90;
          reader.readTuple(tuple);
          let x = parseInt(tuple[0]);
          let y = parseInt(tuple[1]);
          reader.readTuple(tuple);
          let width = parseInt(tuple[0]);
          let height = parseInt(tuple[1]);
          region.u = x / page.width;
          region.v = y / page.height;
          if (region.rotate) {
            region.u2 = (x + height) / page.width;
            region.v2 = (y + width) / page.height;
          } else {
            region.u2 = (x + width) / page.width;
            region.v2 = (y + height) / page.height;
          }
          region.x = x;
          region.y = y;
          region.width = Math.abs(width);
          region.height = Math.abs(height);
          if (reader.readTuple(tuple) == 4) {
            if (reader.readTuple(tuple) == 4) {
              reader.readTuple(tuple);
            }
          }
          region.originalWidth = parseInt(tuple[0]);
          region.originalHeight = parseInt(tuple[1]);
          reader.readTuple(tuple);
          region.offsetX = parseInt(tuple[0]);
          region.offsetY = parseInt(tuple[1]);
          region.index = parseInt(reader.readValue());
          region.texture = page.texture;
          this.regions.push(region);
        }
      }
    }
    findRegion(name) {
      for (let i = 0; i < this.regions.length; i++) {
        if (this.regions[i].name == name) {
          return this.regions[i];
        }
      }
      return null;
    }
    dispose() {
      for (let i = 0; i < this.pages.length; i++) {
        this.pages[i].texture.dispose();
      }
    }
  }
  spine2.TextureAtlas = TextureAtlas;
  class TextureAtlasReader {
    constructor(text) {
      __publicField(this, "lines");
      __publicField(this, "index", 0);
      this.lines = text.split(/\r\n|\r|\n/);
    }
    readLine() {
      if (this.index >= this.lines.length)
        return null;
      return this.lines[this.index++];
    }
    readValue() {
      let line = this.readLine();
      let colon = line.indexOf(":");
      if (colon == -1)
        throw new Error("Invalid line: " + line);
      return line.substring(colon + 1).trim();
    }
    readTuple(tuple) {
      let line = this.readLine();
      let colon = line.indexOf(":");
      if (colon == -1)
        throw new Error("Invalid line: " + line);
      let i = 0, lastMatch = colon + 1;
      for (; i < 3; i++) {
        let comma = line.indexOf(",", lastMatch);
        if (comma == -1) break;
        tuple[i] = line.substr(lastMatch, comma - lastMatch).trim();
        lastMatch = comma + 1;
      }
      tuple[i] = line.substring(lastMatch).trim();
      return i + 1;
    }
  }
  class TextureAtlasPage {
    constructor() {
      __publicField(this, "name");
      __publicField(this, "minFilter");
      __publicField(this, "magFilter");
      __publicField(this, "uWrap");
      __publicField(this, "vWrap");
      __publicField(this, "texture");
      __publicField(this, "width");
      __publicField(this, "height");
    }
  }
  spine2.TextureAtlasPage = TextureAtlasPage;
  class TextureAtlasRegion extends spine2.TextureRegion {
    constructor() {
      super(...arguments);
      __publicField(this, "page");
      __publicField(this, "name");
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "index");
      __publicField(this, "rotate");
      __publicField(this, "degrees");
      __publicField(this, "texture");
    }
  }
  spine2.TextureAtlasRegion = TextureAtlasRegion;
})(spine || (spine = {}));
((spine2) => {
  class TransformConstraint {
    constructor(data, skeleton) {
      /** The transform constraint's setup pose data. */
      __publicField(this, "data");
      /** The bones that will be modified by this transform constraint. */
      __publicField(this, "bones");
      /** The target bone whose world transform will be copied to the constrained bones. */
      __publicField(this, "target");
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
      __publicField(this, "rotateMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
      __publicField(this, "translateMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained scales. */
      __publicField(this, "scaleMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained scales. */
      __publicField(this, "shearMix", 0);
      __publicField(this, "temp", new spine2.Vector2());
      __publicField(this, "active", false);
      if (data == null) throw new Error("data cannot be null.");
      if (skeleton == null) throw new Error("skeleton cannot be null.");
      this.data = data;
      this.rotateMix = data.rotateMix;
      this.translateMix = data.translateMix;
      this.scaleMix = data.scaleMix;
      this.shearMix = data.shearMix;
      this.bones = new Array();
      for (let i = 0; i < data.bones.length; i++)
        this.bones.push(skeleton.findBone(data.bones[i].name));
      this.target = skeleton.findBone(data.target.name);
    }
    isActive() {
      return this.active;
    }
    /** Applies the constraint to the constrained bones. */
    apply() {
      this.update();
    }
    update() {
      if (this.data.local) {
        if (this.data.relative)
          this.applyRelativeLocal();
        else
          this.applyAbsoluteLocal();
      } else {
        if (this.data.relative)
          this.applyRelativeWorld();
        else
          this.applyAbsoluteWorld();
      }
    }
    applyAbsoluteWorld() {
      let rotateMix = this.rotateMix, translateMix = this.translateMix, scaleMix = this.scaleMix, shearMix = this.shearMix;
      let target = this.target;
      let ta = target.a, tb = target.b, tc = target.c, td = target.d;
      let degRadReflect = ta * td - tb * tc > 0 ? spine2.MathUtils.degRad : -spine2.MathUtils.degRad;
      let offsetRotation = this.data.offsetRotation * degRadReflect;
      let offsetShearY = this.data.offsetShearY * degRadReflect;
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        let modified = false;
        if (rotateMix != 0) {
          let a = bone.a, b = bone.b, c = bone.c, d = bone.d;
          let r = Math.atan2(tc, ta) - Math.atan2(c, a) + offsetRotation;
          if (r > spine2.MathUtils.PI)
            r -= spine2.MathUtils.PI2;
          else if (r < -spine2.MathUtils.PI)
            r += spine2.MathUtils.PI2;
          r *= rotateMix;
          let cos = Math.cos(r), sin = Math.sin(r);
          bone.a = cos * a - sin * c;
          bone.b = cos * b - sin * d;
          bone.c = sin * a + cos * c;
          bone.d = sin * b + cos * d;
          modified = true;
        }
        if (translateMix != 0) {
          let temp = this.temp;
          target.localToWorld(temp.set(this.data.offsetX, this.data.offsetY));
          bone.worldX += (temp.x - bone.worldX) * translateMix;
          bone.worldY += (temp.y - bone.worldY) * translateMix;
          modified = true;
        }
        if (scaleMix > 0) {
          let s = Math.sqrt(bone.a * bone.a + bone.c * bone.c);
          let ts = Math.sqrt(ta * ta + tc * tc);
          if (s > 1e-5) s = (s + (ts - s + this.data.offsetScaleX) * scaleMix) / s;
          bone.a *= s;
          bone.c *= s;
          s = Math.sqrt(bone.b * bone.b + bone.d * bone.d);
          ts = Math.sqrt(tb * tb + td * td);
          if (s > 1e-5) s = (s + (ts - s + this.data.offsetScaleY) * scaleMix) / s;
          bone.b *= s;
          bone.d *= s;
          modified = true;
        }
        if (shearMix > 0) {
          let b = bone.b, d = bone.d;
          let by = Math.atan2(d, b);
          let r = Math.atan2(td, tb) - Math.atan2(tc, ta) - (by - Math.atan2(bone.c, bone.a));
          if (r > spine2.MathUtils.PI)
            r -= spine2.MathUtils.PI2;
          else if (r < -spine2.MathUtils.PI)
            r += spine2.MathUtils.PI2;
          r = by + (r + offsetShearY) * shearMix;
          let s = Math.sqrt(b * b + d * d);
          bone.b = Math.cos(r) * s;
          bone.d = Math.sin(r) * s;
          modified = true;
        }
        if (modified) bone.appliedValid = false;
      }
    }
    applyRelativeWorld() {
      let rotateMix = this.rotateMix, translateMix = this.translateMix, scaleMix = this.scaleMix, shearMix = this.shearMix;
      let target = this.target;
      let ta = target.a, tb = target.b, tc = target.c, td = target.d;
      let degRadReflect = ta * td - tb * tc > 0 ? spine2.MathUtils.degRad : -spine2.MathUtils.degRad;
      let offsetRotation = this.data.offsetRotation * degRadReflect, offsetShearY = this.data.offsetShearY * degRadReflect;
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        let modified = false;
        if (rotateMix != 0) {
          let a = bone.a, b = bone.b, c = bone.c, d = bone.d;
          let r = Math.atan2(tc, ta) + offsetRotation;
          if (r > spine2.MathUtils.PI)
            r -= spine2.MathUtils.PI2;
          else if (r < -spine2.MathUtils.PI) r += spine2.MathUtils.PI2;
          r *= rotateMix;
          let cos = Math.cos(r), sin = Math.sin(r);
          bone.a = cos * a - sin * c;
          bone.b = cos * b - sin * d;
          bone.c = sin * a + cos * c;
          bone.d = sin * b + cos * d;
          modified = true;
        }
        if (translateMix != 0) {
          let temp = this.temp;
          target.localToWorld(temp.set(this.data.offsetX, this.data.offsetY));
          bone.worldX += temp.x * translateMix;
          bone.worldY += temp.y * translateMix;
          modified = true;
        }
        if (scaleMix > 0) {
          let s = (Math.sqrt(ta * ta + tc * tc) - 1 + this.data.offsetScaleX) * scaleMix + 1;
          bone.a *= s;
          bone.c *= s;
          s = (Math.sqrt(tb * tb + td * td) - 1 + this.data.offsetScaleY) * scaleMix + 1;
          bone.b *= s;
          bone.d *= s;
          modified = true;
        }
        if (shearMix > 0) {
          let r = Math.atan2(td, tb) - Math.atan2(tc, ta);
          if (r > spine2.MathUtils.PI)
            r -= spine2.MathUtils.PI2;
          else if (r < -spine2.MathUtils.PI) r += spine2.MathUtils.PI2;
          let b = bone.b, d = bone.d;
          r = Math.atan2(d, b) + (r - spine2.MathUtils.PI / 2 + offsetShearY) * shearMix;
          let s = Math.sqrt(b * b + d * d);
          bone.b = Math.cos(r) * s;
          bone.d = Math.sin(r) * s;
          modified = true;
        }
        if (modified) bone.appliedValid = false;
      }
    }
    applyAbsoluteLocal() {
      let rotateMix = this.rotateMix, translateMix = this.translateMix, scaleMix = this.scaleMix, shearMix = this.shearMix;
      let target = this.target;
      if (!target.appliedValid) target.updateAppliedTransform();
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        if (!bone.appliedValid) bone.updateAppliedTransform();
        let rotation = bone.arotation;
        if (rotateMix != 0) {
          let r = target.arotation - rotation + this.data.offsetRotation;
          r -= (16384 - (16384.499999999996 - r / 360 | 0)) * 360;
          rotation += r * rotateMix;
        }
        let x = bone.ax, y = bone.ay;
        if (translateMix != 0) {
          x += (target.ax - x + this.data.offsetX) * translateMix;
          y += (target.ay - y + this.data.offsetY) * translateMix;
        }
        let scaleX = bone.ascaleX, scaleY = bone.ascaleY;
        if (scaleMix != 0) {
          if (scaleX > 1e-5) scaleX = (scaleX + (target.ascaleX - scaleX + this.data.offsetScaleX) * scaleMix) / scaleX;
          if (scaleY > 1e-5) scaleY = (scaleY + (target.ascaleY - scaleY + this.data.offsetScaleY) * scaleMix) / scaleY;
        }
        let shearY = bone.ashearY;
        if (shearMix != 0) {
          let r = target.ashearY - shearY + this.data.offsetShearY;
          r -= (16384 - (16384.499999999996 - r / 360 | 0)) * 360;
          bone.shearY += r * shearMix;
        }
        bone.updateWorldTransformWith(x, y, rotation, scaleX, scaleY, bone.ashearX, shearY);
      }
    }
    applyRelativeLocal() {
      let rotateMix = this.rotateMix, translateMix = this.translateMix, scaleMix = this.scaleMix, shearMix = this.shearMix;
      let target = this.target;
      if (!target.appliedValid) target.updateAppliedTransform();
      let bones = this.bones;
      for (let i = 0, n = bones.length; i < n; i++) {
        let bone = bones[i];
        if (!bone.appliedValid) bone.updateAppliedTransform();
        let rotation = bone.arotation;
        if (rotateMix != 0) rotation += (target.arotation + this.data.offsetRotation) * rotateMix;
        let x = bone.ax, y = bone.ay;
        if (translateMix != 0) {
          x += (target.ax + this.data.offsetX) * translateMix;
          y += (target.ay + this.data.offsetY) * translateMix;
        }
        let scaleX = bone.ascaleX, scaleY = bone.ascaleY;
        if (scaleMix != 0) {
          if (scaleX > 1e-5) scaleX *= (target.ascaleX - 1 + this.data.offsetScaleX) * scaleMix + 1;
          if (scaleY > 1e-5) scaleY *= (target.ascaleY - 1 + this.data.offsetScaleY) * scaleMix + 1;
        }
        let shearY = bone.ashearY;
        if (shearMix != 0) shearY += (target.ashearY + this.data.offsetShearY) * shearMix;
        bone.updateWorldTransformWith(x, y, rotation, scaleX, scaleY, bone.ashearX, shearY);
      }
    }
  }
  spine2.TransformConstraint = TransformConstraint;
})(spine || (spine = {}));
((spine2) => {
  class TransformConstraintData extends spine2.ConstraintData {
    constructor(name) {
      super(name, 0, false);
      /** The bones that will be modified by this transform constraint. */
      __publicField(this, "bones", new Array());
      /** The target bone whose world transform will be copied to the constrained bones. */
      __publicField(this, "target");
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
      __publicField(this, "rotateMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
      __publicField(this, "translateMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained scales. */
      __publicField(this, "scaleMix", 0);
      /** A percentage (0-1) that controls the mix between the constrained and unconstrained shears. */
      __publicField(this, "shearMix", 0);
      /** An offset added to the constrained bone rotation. */
      __publicField(this, "offsetRotation", 0);
      /** An offset added to the constrained bone X translation. */
      __publicField(this, "offsetX", 0);
      /** An offset added to the constrained bone Y translation. */
      __publicField(this, "offsetY", 0);
      /** An offset added to the constrained bone scaleX. */
      __publicField(this, "offsetScaleX", 0);
      /** An offset added to the constrained bone scaleY. */
      __publicField(this, "offsetScaleY", 0);
      /** An offset added to the constrained bone shearY. */
      __publicField(this, "offsetShearY", 0);
      __publicField(this, "relative", false);
      __publicField(this, "local", false);
    }
  }
  spine2.TransformConstraintData = TransformConstraintData;
})(spine || (spine = {}));
((spine2) => {
  class Triangulator {
    constructor() {
      __publicField(this, "convexPolygons", new Array());
      __publicField(this, "convexPolygonsIndices", new Array());
      __publicField(this, "indicesArray", new Array());
      __publicField(this, "isConcaveArray", new Array());
      __publicField(this, "triangles", new Array());
      __publicField(this, "polygonPool", new spine2.Pool(() => {
        return new Array();
      }));
      __publicField(this, "polygonIndicesPool", new spine2.Pool(() => {
        return new Array();
      }));
    }
    triangulate(verticesArray) {
      let vertices = verticesArray;
      let vertexCount = verticesArray.length >> 1;
      let indices = this.indicesArray;
      indices.length = 0;
      for (let i = 0; i < vertexCount; i++)
        indices[i] = i;
      let isConcave = this.isConcaveArray;
      isConcave.length = 0;
      for (let i = 0, n = vertexCount; i < n; ++i)
        isConcave[i] = Triangulator.isConcave(i, vertexCount, vertices, indices);
      let triangles = this.triangles;
      triangles.length = 0;
      while (vertexCount > 3) {
        let previous = vertexCount - 1, i = 0, next = 1;
        while (true) {
          outer:
            if (!isConcave[i]) {
              let p1 = indices[previous] << 1, p2 = indices[i] << 1, p3 = indices[next] << 1;
              let p1x = vertices[p1], p1y = vertices[p1 + 1];
              let p2x = vertices[p2], p2y = vertices[p2 + 1];
              let p3x = vertices[p3], p3y = vertices[p3 + 1];
              for (let ii = (next + 1) % vertexCount; ii != previous; ii = (ii + 1) % vertexCount) {
                if (!isConcave[ii]) continue;
                let v = indices[ii] << 1;
                let vx = vertices[v], vy = vertices[v + 1];
                if (Triangulator.positiveArea(p3x, p3y, p1x, p1y, vx, vy)) {
                  if (Triangulator.positiveArea(p1x, p1y, p2x, p2y, vx, vy)) {
                    if (Triangulator.positiveArea(p2x, p2y, p3x, p3y, vx, vy)) break outer;
                  }
                }
              }
              break;
            }
          if (next == 0) {
            do {
              if (!isConcave[i]) break;
              i--;
            } while (i > 0);
            break;
          }
          previous = i;
          i = next;
          next = (next + 1) % vertexCount;
        }
        triangles.push(indices[(vertexCount + i - 1) % vertexCount]);
        triangles.push(indices[i]);
        triangles.push(indices[(i + 1) % vertexCount]);
        indices.splice(i, 1);
        isConcave.splice(i, 1);
        vertexCount--;
        let previousIndex = (vertexCount + i - 1) % vertexCount;
        let nextIndex = i == vertexCount ? 0 : i;
        isConcave[previousIndex] = Triangulator.isConcave(previousIndex, vertexCount, vertices, indices);
        isConcave[nextIndex] = Triangulator.isConcave(nextIndex, vertexCount, vertices, indices);
      }
      if (vertexCount == 3) {
        triangles.push(indices[2]);
        triangles.push(indices[0]);
        triangles.push(indices[1]);
      }
      return triangles;
    }
    decompose(verticesArray, triangles) {
      let vertices = verticesArray;
      let convexPolygons = this.convexPolygons;
      this.polygonPool.freeAll(convexPolygons);
      convexPolygons.length = 0;
      let convexPolygonsIndices = this.convexPolygonsIndices;
      this.polygonIndicesPool.freeAll(convexPolygonsIndices);
      convexPolygonsIndices.length = 0;
      let polygonIndices = this.polygonIndicesPool.obtain();
      polygonIndices.length = 0;
      let polygon = this.polygonPool.obtain();
      polygon.length = 0;
      let fanBaseIndex = -1, lastWinding = 0;
      for (let i = 0, n = triangles.length; i < n; i += 3) {
        let t1 = triangles[i] << 1, t2 = triangles[i + 1] << 1, t3 = triangles[i + 2] << 1;
        let x1 = vertices[t1], y1 = vertices[t1 + 1];
        let x2 = vertices[t2], y2 = vertices[t2 + 1];
        let x3 = vertices[t3], y3 = vertices[t3 + 1];
        let merged = false;
        if (fanBaseIndex == t1) {
          let o = polygon.length - 4;
          let winding1 = Triangulator.winding(polygon[o], polygon[o + 1], polygon[o + 2], polygon[o + 3], x3, y3);
          let winding2 = Triangulator.winding(x3, y3, polygon[0], polygon[1], polygon[2], polygon[3]);
          if (winding1 == lastWinding && winding2 == lastWinding) {
            polygon.push(x3);
            polygon.push(y3);
            polygonIndices.push(t3);
            merged = true;
          }
        }
        if (!merged) {
          if (polygon.length > 0) {
            convexPolygons.push(polygon);
            convexPolygonsIndices.push(polygonIndices);
          } else {
            this.polygonPool.free(polygon);
            this.polygonIndicesPool.free(polygonIndices);
          }
          polygon = this.polygonPool.obtain();
          polygon.length = 0;
          polygon.push(x1);
          polygon.push(y1);
          polygon.push(x2);
          polygon.push(y2);
          polygon.push(x3);
          polygon.push(y3);
          polygonIndices = this.polygonIndicesPool.obtain();
          polygonIndices.length = 0;
          polygonIndices.push(t1);
          polygonIndices.push(t2);
          polygonIndices.push(t3);
          lastWinding = Triangulator.winding(x1, y1, x2, y2, x3, y3);
          fanBaseIndex = t1;
        }
      }
      if (polygon.length > 0) {
        convexPolygons.push(polygon);
        convexPolygonsIndices.push(polygonIndices);
      }
      for (let i = 0, n = convexPolygons.length; i < n; i++) {
        polygonIndices = convexPolygonsIndices[i];
        if (polygonIndices.length == 0) continue;
        let firstIndex = polygonIndices[0];
        let lastIndex = polygonIndices[polygonIndices.length - 1];
        polygon = convexPolygons[i];
        let o = polygon.length - 4;
        let prevPrevX = polygon[o], prevPrevY = polygon[o + 1];
        let prevX = polygon[o + 2], prevY = polygon[o + 3];
        let firstX = polygon[0], firstY = polygon[1];
        let secondX = polygon[2], secondY = polygon[3];
        let winding = Triangulator.winding(prevPrevX, prevPrevY, prevX, prevY, firstX, firstY);
        for (let ii = 0; ii < n; ii++) {
          if (ii == i) continue;
          let otherIndices = convexPolygonsIndices[ii];
          if (otherIndices.length != 3) continue;
          let otherFirstIndex = otherIndices[0];
          let otherSecondIndex = otherIndices[1];
          let otherLastIndex = otherIndices[2];
          let otherPoly = convexPolygons[ii];
          let x3 = otherPoly[otherPoly.length - 2], y3 = otherPoly[otherPoly.length - 1];
          if (otherFirstIndex != firstIndex || otherSecondIndex != lastIndex) continue;
          let winding1 = Triangulator.winding(prevPrevX, prevPrevY, prevX, prevY, x3, y3);
          let winding2 = Triangulator.winding(x3, y3, firstX, firstY, secondX, secondY);
          if (winding1 == winding && winding2 == winding) {
            otherPoly.length = 0;
            otherIndices.length = 0;
            polygon.push(x3);
            polygon.push(y3);
            polygonIndices.push(otherLastIndex);
            prevPrevX = prevX;
            prevPrevY = prevY;
            prevX = x3;
            prevY = y3;
            ii = 0;
          }
        }
      }
      for (let i = convexPolygons.length - 1; i >= 0; i--) {
        polygon = convexPolygons[i];
        if (polygon.length == 0) {
          convexPolygons.splice(i, 1);
          this.polygonPool.free(polygon);
          polygonIndices = convexPolygonsIndices[i];
          convexPolygonsIndices.splice(i, 1);
          this.polygonIndicesPool.free(polygonIndices);
        }
      }
      return convexPolygons;
    }
    static isConcave(index, vertexCount, vertices, indices) {
      let previous = indices[(vertexCount + index - 1) % vertexCount] << 1;
      let current = indices[index] << 1;
      let next = indices[(index + 1) % vertexCount] << 1;
      return !this.positiveArea(
        vertices[previous],
        vertices[previous + 1],
        vertices[current],
        vertices[current + 1],
        vertices[next],
        vertices[next + 1]
      );
    }
    static positiveArea(p1x, p1y, p2x, p2y, p3x, p3y) {
      return p1x * (p3y - p2y) + p2x * (p1y - p3y) + p3x * (p2y - p1y) >= 0;
    }
    static winding(p1x, p1y, p2x, p2y, p3x, p3y) {
      let px = p2x - p1x, py = p2y - p1y;
      return p3x * py - p3y * px + px * p1y - p1x * py >= 0 ? 1 : -1;
    }
  }
  spine2.Triangulator = Triangulator;
})(spine || (spine = {}));
((spine2) => {
  class IntSet {
    constructor() {
      __publicField(this, "array", new Array());
    }
    add(value) {
      let contains = this.contains(value);
      this.array[value | 0] = value | 0;
      return !contains;
    }
    contains(value) {
      return this.array[value | 0] != void 0;
    }
    remove(value) {
      this.array[value | 0] = void 0;
    }
    clear() {
      this.array.length = 0;
    }
  }
  spine2.IntSet = IntSet;
  const _Color = class _Color {
    constructor(r = 0, g = 0, b = 0, a = 0) {
      __publicField(this, "r", r);
      __publicField(this, "g", g);
      __publicField(this, "b", b);
      __publicField(this, "a", a);
    }
    set(r, g, b, a) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
      this.clamp();
      return this;
    }
    setFromColor(c) {
      this.r = c.r;
      this.g = c.g;
      this.b = c.b;
      this.a = c.a;
      return this;
    }
    setFromString(hex) {
      hex = hex.charAt(0) == "#" ? hex.substr(1) : hex;
      this.r = parseInt(hex.substr(0, 2), 16) / 255;
      this.g = parseInt(hex.substr(2, 2), 16) / 255;
      this.b = parseInt(hex.substr(4, 2), 16) / 255;
      this.a = (hex.length != 8 ? 255 : parseInt(hex.substr(6, 2), 16)) / 255;
      return this;
    }
    add(r, g, b, a) {
      this.r += r;
      this.g += g;
      this.b += b;
      this.a += a;
      this.clamp();
      return this;
    }
    clamp() {
      if (this.r < 0) this.r = 0;
      else if (this.r > 1) this.r = 1;
      if (this.g < 0) this.g = 0;
      else if (this.g > 1) this.g = 1;
      if (this.b < 0) this.b = 0;
      else if (this.b > 1) this.b = 1;
      if (this.a < 0) this.a = 0;
      else if (this.a > 1) this.a = 1;
      return this;
    }
    static rgba8888ToColor(color, value) {
      color.r = ((value & 4278190080) >>> 24) / 255;
      color.g = ((value & 16711680) >>> 16) / 255;
      color.b = ((value & 65280) >>> 8) / 255;
      color.a = (value & 255) / 255;
    }
    static rgb888ToColor(color, value) {
      color.r = ((value & 16711680) >>> 16) / 255;
      color.g = ((value & 65280) >>> 8) / 255;
      color.b = (value & 255) / 255;
    }
  };
  __publicField(_Color, "WHITE", new _Color(1, 1, 1, 1));
  __publicField(_Color, "RED", new _Color(1, 0, 0, 1));
  __publicField(_Color, "GREEN", new _Color(0, 1, 0, 1));
  __publicField(_Color, "BLUE", new _Color(0, 0, 1, 1));
  __publicField(_Color, "MAGENTA", new _Color(1, 0, 1, 1));
  let Color = _Color;
  spine2.Color = _Color;
  const _MathUtils = class _MathUtils {
    static clamp(value, min, max) {
      if (value < min) return min;
      if (value > max) return max;
      return value;
    }
    static cosDeg(degrees) {
      return Math.cos(degrees * _MathUtils.degRad);
    }
    static sinDeg(degrees) {
      return Math.sin(degrees * _MathUtils.degRad);
    }
    static signum(value) {
      return value > 0 ? 1 : value < 0 ? -1 : 0;
    }
    static toInt(x) {
      return x > 0 ? Math.floor(x) : Math.ceil(x);
    }
    static cbrt(x) {
      let y = Math.pow(Math.abs(x), 1 / 3);
      return x < 0 ? -y : y;
    }
    static randomTriangular(min, max) {
      return _MathUtils.randomTriangularWith(min, max, (min + max) * 0.5);
    }
    static randomTriangularWith(min, max, mode) {
      let u = Math.random();
      let d = max - min;
      if (u <= (mode - min) / d) return min + Math.sqrt(u * d * (mode - min));
      return max - Math.sqrt((1 - u) * d * (max - mode));
    }
  };
  __publicField(_MathUtils, "PI", 3.1415927);
  __publicField(_MathUtils, "PI2", _MathUtils.PI * 2);
  __publicField(_MathUtils, "radiansToDegrees", 180 / _MathUtils.PI);
  __publicField(_MathUtils, "radDeg", _MathUtils.radiansToDegrees);
  __publicField(_MathUtils, "degreesToRadians", _MathUtils.PI / 180);
  __publicField(_MathUtils, "degRad", _MathUtils.degreesToRadians);
  let MathUtils = _MathUtils;
  spine2.MathUtils = _MathUtils;
  class Interpolation {
    apply(start, end, a) {
      return start + (end - start) * this.applyInternal(a);
    }
  }
  spine2.Interpolation = Interpolation;
  class Pow extends Interpolation {
    constructor(power) {
      super();
      __publicField(this, "power", 2);
      this.power = power;
    }
    applyInternal(a) {
      if (a <= 0.5) return Math.pow(a * 2, this.power) / 2;
      return Math.pow((a - 1) * 2, this.power) / (this.power % 2 == 0 ? -2 : 2) + 1;
    }
  }
  spine2.Pow = Pow;
  class PowOut extends Pow {
    constructor(power) {
      super(power);
    }
    applyInternal(a) {
      return Math.pow(a - 1, this.power) * (this.power % 2 == 0 ? -1 : 1) + 1;
    }
  }
  spine2.PowOut = PowOut;
  const _Utils = class _Utils {
    static arrayCopy(source, sourceStart, dest, destStart, numElements) {
      for (let i = sourceStart, j = destStart; i < sourceStart + numElements; i++, j++) {
        dest[j] = source[i];
      }
    }
    static setArraySize(array, size, value = 0) {
      let oldSize = array.length;
      if (oldSize == size) return array;
      array.length = size;
      if (oldSize < size) {
        for (let i = oldSize; i < size; i++) array[i] = value;
      }
      return array;
    }
    static ensureArrayCapacity(array, size, value = 0) {
      if (array.length >= size) return array;
      return _Utils.setArraySize(array, size, value);
    }
    static newArray(size, defaultValue) {
      let array = new Array(size);
      for (let i = 0; i < size; i++) array[i] = defaultValue;
      return array;
    }
    static newFloatArray(size) {
      if (_Utils.SUPPORTS_TYPED_ARRAYS) {
        return new Float32Array(size);
      } else {
        let array = new Array(size);
        for (let i = 0; i < array.length; i++) array[i] = 0;
        return array;
      }
    }
    static newShortArray(size) {
      if (_Utils.SUPPORTS_TYPED_ARRAYS) {
        return new Int16Array(size);
      } else {
        let array = new Array(size);
        for (let i = 0; i < array.length; i++) array[i] = 0;
        return array;
      }
    }
    static toFloatArray(array) {
      return _Utils.SUPPORTS_TYPED_ARRAYS ? new Float32Array(array) : array;
    }
    static toSinglePrecision(value) {
      return _Utils.SUPPORTS_TYPED_ARRAYS ? Math.fround(value) : value;
    }
    // This function is used to fix WebKit 602 specific issue described at http://esotericsoftware.com/forum/iOS-10-disappearing-graphics-10109
    static webkit602BugfixHelper(alpha, blend) {
    }
    static contains(array, element, identity = true) {
      for (var i = 0; i < array.length; i++) {
        if (array[i] == element) return true;
      }
      return false;
    }
  };
  __publicField(_Utils, "SUPPORTS_TYPED_ARRAYS", typeof Float32Array !== "undefined");
  let Utils = _Utils;
  spine2.Utils = _Utils;
  class DebugUtils {
    static logBones(skeleton) {
      for (let i = 0; i < skeleton.bones.length; i++) {
        let bone = skeleton.bones[i];
        console.log(bone.data.name + ", " + bone.a + ", " + bone.b + ", " + bone.c + ", " + bone.d + ", " + bone.worldX + ", " + bone.worldY);
      }
    }
  }
  spine2.DebugUtils = DebugUtils;
  class Pool {
    constructor(instantiator) {
      __publicField(this, "items", new Array());
      __publicField(this, "instantiator");
      this.instantiator = instantiator;
    }
    obtain() {
      return this.items.length > 0 ? this.items.pop() : this.instantiator();
    }
    free(item) {
      if (item.reset) item.reset();
      this.items.push(item);
    }
    freeAll(items) {
      for (let i = 0; i < items.length; i++) {
        this.free(items[i]);
      }
    }
    clear() {
      this.items.length = 0;
    }
  }
  spine2.Pool = Pool;
  class Vector2 {
    constructor(x = 0, y = 0) {
      __publicField(this, "x", x);
      __publicField(this, "y", y);
    }
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    length() {
      let x = this.x;
      let y = this.y;
      return Math.sqrt(x * x + y * y);
    }
    normalize() {
      let len = this.length();
      if (len != 0) {
        this.x /= len;
        this.y /= len;
      }
      return this;
    }
  }
  spine2.Vector2 = Vector2;
  class TimeKeeper {
    constructor() {
      __publicField(this, "maxDelta", 0.064);
      __publicField(this, "framesPerSecond", 0);
      __publicField(this, "delta", 0);
      __publicField(this, "totalTime", 0);
      __publicField(this, "lastTime", Date.now() / 1e3);
      __publicField(this, "frameCount", 0);
      __publicField(this, "frameTime", 0);
    }
    update() {
      let now = Date.now() / 1e3;
      this.delta = now - this.lastTime;
      this.frameTime += this.delta;
      this.totalTime += this.delta;
      if (this.delta > this.maxDelta) this.delta = this.maxDelta;
      this.lastTime = now;
      this.frameCount++;
      if (this.frameTime > 1) {
        this.framesPerSecond = this.frameCount / this.frameTime;
        this.frameTime = 0;
        this.frameCount = 0;
      }
    }
  }
  spine2.TimeKeeper = TimeKeeper;
  class WindowedMean {
    constructor(windowSize = 32) {
      __publicField(this, "values");
      __publicField(this, "addedValues", 0);
      __publicField(this, "lastValue", 0);
      __publicField(this, "mean", 0);
      __publicField(this, "dirty", true);
      this.values = new Array(windowSize);
    }
    hasEnoughData() {
      return this.addedValues >= this.values.length;
    }
    addValue(value) {
      if (this.addedValues < this.values.length)
        this.addedValues++;
      this.values[this.lastValue++] = value;
      if (this.lastValue > this.values.length - 1) this.lastValue = 0;
      this.dirty = true;
    }
    getMean() {
      if (this.hasEnoughData()) {
        if (this.dirty) {
          let mean = 0;
          for (let i = 0; i < this.values.length; i++) {
            mean += this.values[i];
          }
          this.mean = mean / this.values.length;
          this.dirty = false;
        }
        return this.mean;
      } else {
        return 0;
      }
    }
  }
  spine2.WindowedMean = WindowedMean;
})(spine || (spine = {}));
((spine2) => {
  class Attachment {
    constructor(name) {
      __publicField(this, "name");
      if (name == null) throw new Error("name cannot be null.");
      this.name = name;
    }
  }
  spine2.Attachment = Attachment;
  const _VertexAttachment = class _VertexAttachment extends Attachment {
    constructor(name) {
      super(name);
      /** The unique ID for this attachment. */
      __publicField(this, "id", (_VertexAttachment.nextID++ & 65535) << 11);
      /** The bones which affect the {@link #getVertices()}. The array entries are, for each vertex, the number of bones affecting
       * the vertex followed by that many bone indices, which is the index of the bone in {@link Skeleton#bones}. Will be null
       * if this attachment has no weights. */
      __publicField(this, "bones");
      /** The vertex positions in the bone's coordinate system. For a non-weighted attachment, the values are `x,y`
       * entries for each vertex. For a weighted attachment, the values are `x,y,weight` entries for each bone affecting
       * each vertex. */
      __publicField(this, "vertices");
      /** The maximum number of world vertex values that can be output by
       * {@link #computeWorldVertices()} using the `count` parameter. */
      __publicField(this, "worldVerticesLength", 0);
      /** Deform keys for the deform attachment are also applied to this attachment. May be null if no deform keys should be applied. */
      __publicField(this, "deformAttachment", this);
    }
    /** Transforms the attachment's local {@link vertices} to world coordinates. If the slot's {@link Slot#deform} is
     * not empty, it is used to deform the vertices.
     *
     * See [World transforms](http://esotericsoftware.com/spine-runtime-skeletons#World-transforms) in the Spine
     * Runtimes Guide.
     * @param start The index of the first {@link #vertices} value to transform. Each vertex has 2 values, x and y.
     * @param count The number of world vertex values to output. Must be <= {@link #worldVerticesLength} - `start`.
     * @param worldVertices The output world vertices. Must have a length >= `offset` + `count` *
     *           `stride` / 2.
     * @param offset The `worldVertices` index to begin writing values.
     * @param stride The number of `worldVertices` entries between the value pairs written. */
    computeWorldVertices(slot, start, count, worldVertices, offset, stride) {
      count = offset + (count >> 1) * stride;
      let skeleton = slot.bone.skeleton;
      let deformArray = slot.deform;
      let vertices = this.vertices;
      let bones = this.bones;
      if (bones == null) {
        if (deformArray.length > 0) vertices = deformArray;
        let bone = slot.bone;
        let x = bone.worldX;
        let y = bone.worldY;
        let a = bone.a, b = bone.b, c = bone.c, d = bone.d;
        for (let v2 = start, w = offset; w < count; v2 += 2, w += stride) {
          let vx = vertices[v2], vy = vertices[v2 + 1];
          worldVertices[w] = vx * a + vy * b + x;
          worldVertices[w + 1] = vx * c + vy * d + y;
        }
        return;
      }
      let v = 0, skip = 0;
      for (let i = 0; i < start; i += 2) {
        let n = bones[v];
        v += n + 1;
        skip += n;
      }
      let skeletonBones = skeleton.bones;
      if (deformArray.length == 0) {
        for (let w = offset, b = skip * 3; w < count; w += stride) {
          let wx = 0, wy = 0;
          let n = bones[v++];
          n += v;
          for (; v < n; v++, b += 3) {
            let bone = skeletonBones[bones[v]];
            let vx = vertices[b], vy = vertices[b + 1], weight = vertices[b + 2];
            wx += (vx * bone.a + vy * bone.b + bone.worldX) * weight;
            wy += (vx * bone.c + vy * bone.d + bone.worldY) * weight;
          }
          worldVertices[w] = wx;
          worldVertices[w + 1] = wy;
        }
      } else {
        let deform = deformArray;
        for (let w = offset, b = skip * 3, f = skip << 1; w < count; w += stride) {
          let wx = 0, wy = 0;
          let n = bones[v++];
          n += v;
          for (; v < n; v++, b += 3, f += 2) {
            let bone = skeletonBones[bones[v]];
            let vx = vertices[b] + deform[f], vy = vertices[b + 1] + deform[f + 1], weight = vertices[b + 2];
            wx += (vx * bone.a + vy * bone.b + bone.worldX) * weight;
            wy += (vx * bone.c + vy * bone.d + bone.worldY) * weight;
          }
          worldVertices[w] = wx;
          worldVertices[w + 1] = wy;
        }
      }
    }
    /** Does not copy id (generated) or name (set on construction). **/
    copyTo(attachment) {
      if (this.bones != null) {
        attachment.bones = new Array(this.bones.length);
        spine2.Utils.arrayCopy(this.bones, 0, attachment.bones, 0, this.bones.length);
      } else
        attachment.bones = null;
      if (this.vertices != null) {
        attachment.vertices = spine2.Utils.newFloatArray(this.vertices.length);
        spine2.Utils.arrayCopy(this.vertices, 0, attachment.vertices, 0, this.vertices.length);
      } else
        attachment.vertices = null;
      attachment.worldVerticesLength = this.worldVerticesLength;
      attachment.deformAttachment = this.deformAttachment;
    }
  };
  __publicField(_VertexAttachment, "nextID", 0);
  let VertexAttachment = _VertexAttachment;
  spine2.VertexAttachment = _VertexAttachment;
})(spine || (spine = {}));
((spine2) => {
  let AttachmentType;
  ((AttachmentType2) => {
    AttachmentType2[AttachmentType2["Region"] = 0] = "Region";
    AttachmentType2[AttachmentType2["BoundingBox"] = 1] = "BoundingBox";
    AttachmentType2[AttachmentType2["Mesh"] = 2] = "Mesh";
    AttachmentType2[AttachmentType2["LinkedMesh"] = 3] = "LinkedMesh";
    AttachmentType2[AttachmentType2["Path"] = 4] = "Path";
    AttachmentType2[AttachmentType2["Point"] = 5] = "Point";
    AttachmentType2[AttachmentType2["Clipping"] = 6] = "Clipping";
  })(AttachmentType = spine2.AttachmentType || (spine2.AttachmentType = {}));
})(spine || (spine = {}));
((spine2) => {
  class BoundingBoxAttachment extends spine2.VertexAttachment {
    constructor(name) {
      super(name);
      __publicField(this, "color", new spine2.Color(1, 1, 1, 1));
    }
    copy() {
      let copy = new BoundingBoxAttachment(this.name);
      this.copyTo(copy);
      copy.color.setFromColor(this.color);
      return copy;
    }
  }
  spine2.BoundingBoxAttachment = BoundingBoxAttachment;
})(spine || (spine = {}));
((spine2) => {
  class ClippingAttachment extends spine2.VertexAttachment {
    // ce3a3aff
    constructor(name) {
      super(name);
      /** Clipping is performed between the clipping polygon's slot and the end slot. Returns null if clipping is done until the end of
       * the skeleton's rendering. */
      __publicField(this, "endSlot");
      // Nonessential.
      /** The color of the clipping polygon as it was in Spine. Available only when nonessential data was exported. Clipping polygons
       * are not usually rendered at runtime. */
      __publicField(this, "color", new spine2.Color(0.2275, 0.2275, 0.8078, 1));
    }
    copy() {
      let copy = new ClippingAttachment(this.name);
      this.copyTo(copy);
      copy.endSlot = this.endSlot;
      copy.color.setFromColor(this.color);
      return copy;
    }
  }
  spine2.ClippingAttachment = ClippingAttachment;
})(spine || (spine = {}));
((spine2) => {
  class MeshAttachment extends spine2.VertexAttachment {
    constructor(name) {
      super(name);
      __publicField(this, "region");
      /** The name of the texture region for this attachment. */
      __publicField(this, "path");
      /** The UV pair for each vertex, normalized within the texture region. */
      __publicField(this, "regionUVs");
      /** The UV pair for each vertex, normalized within the entire texture.
       *
       * See {@link #updateUVs}. */
      __publicField(this, "uvs");
      /** Triplets of vertex indices which describe the mesh's triangulation. */
      __publicField(this, "triangles");
      /** The color to tint the mesh. */
      __publicField(this, "color", new spine2.Color(1, 1, 1, 1));
      /** The width of the mesh's image. Available only when nonessential data was exported. */
      __publicField(this, "width");
      /** The height of the mesh's image. Available only when nonessential data was exported. */
      __publicField(this, "height");
      /** The number of entries at the beginning of {@link #vertices} that make up the mesh hull. */
      __publicField(this, "hullLength");
      /** Vertex index pairs describing edges for controling triangulation. Mesh triangles will never cross edges. Only available if
       * nonessential data was exported. Triangulation is not performed at runtime. */
      __publicField(this, "edges");
      __publicField(this, "parentMesh");
      __publicField(this, "tempColor", new spine2.Color(0, 0, 0, 0));
    }
    /** Calculates {@link #uvs} using {@link #regionUVs} and the {@link #region}. Must be called after changing the region UVs or
     * region. */
    updateUVs() {
      let regionUVs = this.regionUVs;
      if (this.uvs == null || this.uvs.length != regionUVs.length) this.uvs = spine2.Utils.newFloatArray(regionUVs.length);
      let uvs = this.uvs;
      let n = this.uvs.length;
      let u = this.region.u, v = this.region.v, width = 0, height = 0;
      if (this.region instanceof spine2.TextureAtlasRegion) {
        let region = this.region;
        let textureWidth = region.texture.getImage().width, textureHeight = region.texture.getImage().height;
        switch (region.degrees) {
          case 90:
            u -= (region.originalHeight - region.offsetY - region.height) / textureWidth;
            v -= (region.originalWidth - region.offsetX - region.width) / textureHeight;
            width = region.originalHeight / textureWidth;
            height = region.originalWidth / textureHeight;
            for (let i = 0; i < n; i += 2) {
              uvs[i] = u + regionUVs[i + 1] * width;
              uvs[i + 1] = v + (1 - regionUVs[i]) * height;
            }
            return;
          case 180:
            u -= (region.originalWidth - region.offsetX - region.width) / textureWidth;
            v -= region.offsetY / textureHeight;
            width = region.originalWidth / textureWidth;
            height = region.originalHeight / textureHeight;
            for (let i = 0; i < n; i += 2) {
              uvs[i] = u + (1 - regionUVs[i]) * width;
              uvs[i + 1] = v + (1 - regionUVs[i + 1]) * height;
            }
            return;
          case 270:
            u -= region.offsetY / textureWidth;
            v -= region.offsetX / textureHeight;
            width = region.originalHeight / textureWidth;
            height = region.originalWidth / textureHeight;
            for (let i = 0; i < n; i += 2) {
              uvs[i] = u + (1 - regionUVs[i + 1]) * width;
              uvs[i + 1] = v + regionUVs[i] * height;
            }
            return;
        }
        u -= region.offsetX / textureWidth;
        v -= (region.originalHeight - region.offsetY - region.height) / textureHeight;
        width = region.originalWidth / textureWidth;
        height = region.originalHeight / textureHeight;
      } else if (this.region == null) {
        u = v = 0;
        width = height = 1;
      } else {
        width = this.region.u2 - u;
        height = this.region.v2 - v;
      }
      for (let i = 0; i < n; i += 2) {
        uvs[i] = u + regionUVs[i] * width;
        uvs[i + 1] = v + regionUVs[i + 1] * height;
      }
    }
    /** The parent mesh if this is a linked mesh, else null. A linked mesh shares the {@link #bones}, {@link #vertices},
     * {@link #regionUVs}, {@link #triangles}, {@link #hullLength}, {@link #edges}, {@link #width}, and {@link #height} with the
     * parent mesh, but may have a different {@link #name} or {@link #path} (and therefore a different texture). */
    getParentMesh() {
      return this.parentMesh;
    }
    /** @param parentMesh May be null. */
    setParentMesh(parentMesh) {
      this.parentMesh = parentMesh;
      if (parentMesh != null) {
        this.bones = parentMesh.bones;
        this.vertices = parentMesh.vertices;
        this.worldVerticesLength = parentMesh.worldVerticesLength;
        this.regionUVs = parentMesh.regionUVs;
        this.triangles = parentMesh.triangles;
        this.hullLength = parentMesh.hullLength;
        this.worldVerticesLength = parentMesh.worldVerticesLength;
      }
    }
    copy() {
      if (this.parentMesh != null) return this.newLinkedMesh();
      let copy = new MeshAttachment(this.name);
      copy.region = this.region;
      copy.path = this.path;
      copy.color.setFromColor(this.color);
      this.copyTo(copy);
      copy.regionUVs = new Array(this.regionUVs.length);
      spine2.Utils.arrayCopy(this.regionUVs, 0, copy.regionUVs, 0, this.regionUVs.length);
      copy.uvs = new Array(this.uvs.length);
      spine2.Utils.arrayCopy(this.uvs, 0, copy.uvs, 0, this.uvs.length);
      copy.triangles = new Array(this.triangles.length);
      spine2.Utils.arrayCopy(this.triangles, 0, copy.triangles, 0, this.triangles.length);
      copy.hullLength = this.hullLength;
      if (this.edges != null) {
        copy.edges = new Array(this.edges.length);
        spine2.Utils.arrayCopy(this.edges, 0, copy.edges, 0, this.edges.length);
      }
      copy.width = this.width;
      copy.height = this.height;
      return copy;
    }
    /** Returns a new mesh with the {@link #parentMesh} set to this mesh's parent mesh, if any, else to this mesh. **/
    newLinkedMesh() {
      let copy = new MeshAttachment(this.name);
      copy.region = this.region;
      copy.path = this.path;
      copy.color.setFromColor(this.color);
      copy.deformAttachment = this.deformAttachment;
      copy.setParentMesh(this.parentMesh != null ? this.parentMesh : this);
      copy.updateUVs();
      return copy;
    }
  }
  spine2.MeshAttachment = MeshAttachment;
})(spine || (spine = {}));
((spine2) => {
  class PathAttachment extends spine2.VertexAttachment {
    constructor(name) {
      super(name);
      /** The lengths along the path in the setup pose from the start of the path to the end of each Bezier curve. */
      __publicField(this, "lengths");
      /** If true, the start and end knots are connected. */
      __publicField(this, "closed", false);
      /** If true, additional calculations are performed to make calculating positions along the path more accurate. If false, fewer
       * calculations are performed but calculating positions along the path is less accurate. */
      __publicField(this, "constantSpeed", false);
      /** The color of the path as it was in Spine. Available only when nonessential data was exported. Paths are not usually
       * rendered at runtime. */
      __publicField(this, "color", new spine2.Color(1, 1, 1, 1));
    }
    copy() {
      let copy = new PathAttachment(this.name);
      this.copyTo(copy);
      copy.lengths = new Array(this.lengths.length);
      spine2.Utils.arrayCopy(this.lengths, 0, copy.lengths, 0, this.lengths.length);
      copy.closed = closed;
      copy.constantSpeed = this.constantSpeed;
      copy.color.setFromColor(this.color);
      return copy;
    }
  }
  spine2.PathAttachment = PathAttachment;
})(spine || (spine = {}));
((spine2) => {
  class PointAttachment extends spine2.VertexAttachment {
    constructor(name) {
      super(name);
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "rotation");
      /** The color of the point attachment as it was in Spine. Available only when nonessential data was exported. Point attachments
       * are not usually rendered at runtime. */
      __publicField(this, "color", new spine2.Color(0.38, 0.94, 0, 1));
    }
    computeWorldPosition(bone, point) {
      point.x = this.x * bone.a + this.y * bone.b + bone.worldX;
      point.y = this.x * bone.c + this.y * bone.d + bone.worldY;
      return point;
    }
    computeWorldRotation(bone) {
      let cos = spine2.MathUtils.cosDeg(this.rotation), sin = spine2.MathUtils.sinDeg(this.rotation);
      let x = cos * bone.a + sin * bone.b;
      let y = cos * bone.c + sin * bone.d;
      return Math.atan2(y, x) * spine2.MathUtils.radDeg;
    }
    copy() {
      let copy = new PointAttachment(this.name);
      copy.x = this.x;
      copy.y = this.y;
      copy.rotation = this.rotation;
      copy.color.setFromColor(this.color);
      return copy;
    }
  }
  spine2.PointAttachment = PointAttachment;
})(spine || (spine = {}));
((spine2) => {
  const _RegionAttachment = class _RegionAttachment extends spine2.Attachment {
    constructor(name) {
      super(name);
      /** The local x translation. */
      __publicField(this, "x", 0);
      /** The local y translation. */
      __publicField(this, "y", 0);
      /** The local scaleX. */
      __publicField(this, "scaleX", 1);
      /** The local scaleY. */
      __publicField(this, "scaleY", 1);
      /** The local rotation. */
      __publicField(this, "rotation", 0);
      /** The width of the region attachment in Spine. */
      __publicField(this, "width", 0);
      /** The height of the region attachment in Spine. */
      __publicField(this, "height", 0);
      /** The color to tint the region attachment. */
      __publicField(this, "color", new spine2.Color(1, 1, 1, 1));
      /** The name of the texture region for this attachment. */
      __publicField(this, "path");
      __publicField(this, "rendererObject");
      __publicField(this, "region");
      /** For each of the 4 vertices, a pair of <code>x,y</code> values that is the local position of the vertex.
       *
       * See {@link #updateOffset()}. */
      __publicField(this, "offset", spine2.Utils.newFloatArray(8));
      __publicField(this, "uvs", spine2.Utils.newFloatArray(8));
      __publicField(this, "tempColor", new spine2.Color(1, 1, 1, 1));
    }
    /** Calculates the {@link #offset} using the region settings. Must be called after changing region settings. */
    updateOffset() {
      let regionScaleX = this.width / this.region.originalWidth * this.scaleX;
      let regionScaleY = this.height / this.region.originalHeight * this.scaleY;
      let localX = -this.width / 2 * this.scaleX + this.region.offsetX * regionScaleX;
      let localY = -this.height / 2 * this.scaleY + this.region.offsetY * regionScaleY;
      let localX2 = localX + this.region.width * regionScaleX;
      let localY2 = localY + this.region.height * regionScaleY;
      let radians = this.rotation * Math.PI / 180;
      let cos = Math.cos(radians);
      let sin = Math.sin(radians);
      let localXCos = localX * cos + this.x;
      let localXSin = localX * sin;
      let localYCos = localY * cos + this.y;
      let localYSin = localY * sin;
      let localX2Cos = localX2 * cos + this.x;
      let localX2Sin = localX2 * sin;
      let localY2Cos = localY2 * cos + this.y;
      let localY2Sin = localY2 * sin;
      let offset = this.offset;
      offset[_RegionAttachment.OX1] = localXCos - localYSin;
      offset[_RegionAttachment.OY1] = localYCos + localXSin;
      offset[_RegionAttachment.OX2] = localXCos - localY2Sin;
      offset[_RegionAttachment.OY2] = localY2Cos + localXSin;
      offset[_RegionAttachment.OX3] = localX2Cos - localY2Sin;
      offset[_RegionAttachment.OY3] = localY2Cos + localX2Sin;
      offset[_RegionAttachment.OX4] = localX2Cos - localYSin;
      offset[_RegionAttachment.OY4] = localYCos + localX2Sin;
    }
    setRegion(region) {
      this.region = region;
      let uvs = this.uvs;
      if (region.rotate) {
        uvs[2] = region.u;
        uvs[3] = region.v2;
        uvs[4] = region.u;
        uvs[5] = region.v;
        uvs[6] = region.u2;
        uvs[7] = region.v;
        uvs[0] = region.u2;
        uvs[1] = region.v2;
      } else {
        uvs[0] = region.u;
        uvs[1] = region.v2;
        uvs[2] = region.u;
        uvs[3] = region.v;
        uvs[4] = region.u2;
        uvs[5] = region.v;
        uvs[6] = region.u2;
        uvs[7] = region.v2;
      }
    }
    /** Transforms the attachment's four vertices to world coordinates.
     *
     * See [World transforms](http://esotericsoftware.com/spine-runtime-skeletons#World-transforms) in the Spine
     * Runtimes Guide.
     * @param worldVertices The output world vertices. Must have a length >= `offset` + 8.
     * @param offset The `worldVertices` index to begin writing values.
     * @param stride The number of `worldVertices` entries between the value pairs written. */
    computeWorldVertices(bone, worldVertices, offset, stride) {
      let vertexOffset = this.offset;
      let x = bone.worldX, y = bone.worldY;
      let a = bone.a, b = bone.b, c = bone.c, d = bone.d;
      let offsetX = 0, offsetY = 0;
      offsetX = vertexOffset[_RegionAttachment.OX1];
      offsetY = vertexOffset[_RegionAttachment.OY1];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
      offset += stride;
      offsetX = vertexOffset[_RegionAttachment.OX2];
      offsetY = vertexOffset[_RegionAttachment.OY2];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
      offset += stride;
      offsetX = vertexOffset[_RegionAttachment.OX3];
      offsetY = vertexOffset[_RegionAttachment.OY3];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
      offset += stride;
      offsetX = vertexOffset[_RegionAttachment.OX4];
      offsetY = vertexOffset[_RegionAttachment.OY4];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
    }
    copy() {
      let copy = new _RegionAttachment(this.name);
      copy.region = this.region;
      copy.rendererObject = this.rendererObject;
      copy.path = this.path;
      copy.x = this.x;
      copy.y = this.y;
      copy.scaleX = this.scaleX;
      copy.scaleY = this.scaleY;
      copy.rotation = this.rotation;
      copy.width = this.width;
      copy.height = this.height;
      spine2.Utils.arrayCopy(this.uvs, 0, copy.uvs, 0, 8);
      spine2.Utils.arrayCopy(this.offset, 0, copy.offset, 0, 8);
      copy.color.setFromColor(this.color);
      return copy;
    }
  };
  __publicField(_RegionAttachment, "OX1", 0);
  __publicField(_RegionAttachment, "OY1", 1);
  __publicField(_RegionAttachment, "OX2", 2);
  __publicField(_RegionAttachment, "OY2", 3);
  __publicField(_RegionAttachment, "OX3", 4);
  __publicField(_RegionAttachment, "OY3", 5);
  __publicField(_RegionAttachment, "OX4", 6);
  __publicField(_RegionAttachment, "OY4", 7);
  __publicField(_RegionAttachment, "X1", 0);
  __publicField(_RegionAttachment, "Y1", 1);
  __publicField(_RegionAttachment, "C1R", 2);
  __publicField(_RegionAttachment, "C1G", 3);
  __publicField(_RegionAttachment, "C1B", 4);
  __publicField(_RegionAttachment, "C1A", 5);
  __publicField(_RegionAttachment, "U1", 6);
  __publicField(_RegionAttachment, "V1", 7);
  __publicField(_RegionAttachment, "X2", 8);
  __publicField(_RegionAttachment, "Y2", 9);
  __publicField(_RegionAttachment, "C2R", 10);
  __publicField(_RegionAttachment, "C2G", 11);
  __publicField(_RegionAttachment, "C2B", 12);
  __publicField(_RegionAttachment, "C2A", 13);
  __publicField(_RegionAttachment, "U2", 14);
  __publicField(_RegionAttachment, "V2", 15);
  __publicField(_RegionAttachment, "X3", 16);
  __publicField(_RegionAttachment, "Y3", 17);
  __publicField(_RegionAttachment, "C3R", 18);
  __publicField(_RegionAttachment, "C3G", 19);
  __publicField(_RegionAttachment, "C3B", 20);
  __publicField(_RegionAttachment, "C3A", 21);
  __publicField(_RegionAttachment, "U3", 22);
  __publicField(_RegionAttachment, "V3", 23);
  __publicField(_RegionAttachment, "X4", 24);
  __publicField(_RegionAttachment, "Y4", 25);
  __publicField(_RegionAttachment, "C4R", 26);
  __publicField(_RegionAttachment, "C4G", 27);
  __publicField(_RegionAttachment, "C4B", 28);
  __publicField(_RegionAttachment, "C4A", 29);
  __publicField(_RegionAttachment, "U4", 30);
  __publicField(_RegionAttachment, "V4", 31);
  let RegionAttachment = _RegionAttachment;
  spine2.RegionAttachment = _RegionAttachment;
})(spine || (spine = {}));
((spine2) => {
  class JitterEffect {
    constructor(jitterX, jitterY) {
      __publicField(this, "jitterX", 0);
      __publicField(this, "jitterY", 0);
      this.jitterX = jitterX;
      this.jitterY = jitterY;
    }
    begin(skeleton) {
    }
    transform(position, uv, light, dark) {
      position.x += spine2.MathUtils.randomTriangular(-this.jitterX, this.jitterY);
      position.y += spine2.MathUtils.randomTriangular(-this.jitterX, this.jitterY);
    }
    end() {
    }
  }
  spine2.JitterEffect = JitterEffect;
})(spine || (spine = {}));
((spine2) => {
  const _SwirlEffect = class _SwirlEffect {
    constructor(radius) {
      __publicField(this, "centerX", 0);
      __publicField(this, "centerY", 0);
      __publicField(this, "radius", 0);
      __publicField(this, "angle", 0);
      __publicField(this, "worldX", 0);
      __publicField(this, "worldY", 0);
      this.radius = radius;
    }
    begin(skeleton) {
      this.worldX = skeleton.x + this.centerX;
      this.worldY = skeleton.y + this.centerY;
    }
    transform(position, uv, light, dark) {
      let radAngle = this.angle * spine2.MathUtils.degreesToRadians;
      let x = position.x - this.worldX;
      let y = position.y - this.worldY;
      let dist = Math.sqrt(x * x + y * y);
      if (dist < this.radius) {
        let theta = _SwirlEffect.interpolation.apply(0, radAngle, (this.radius - dist) / this.radius);
        let cos = Math.cos(theta);
        let sin = Math.sin(theta);
        position.x = cos * x - sin * y + this.worldX;
        position.y = sin * x + cos * y + this.worldY;
      }
    }
    end() {
    }
  };
  __publicField(_SwirlEffect, "interpolation", new spine2.PowOut(2));
  let SwirlEffect = _SwirlEffect;
  spine2.SwirlEffect = _SwirlEffect;
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class AssetManager extends spine2.AssetManager {
      constructor(context, pathPrefix = "") {
        super((image) => {
          return new spine2.webgl.GLTexture(context, image);
        }, pathPrefix);
      }
    }
    webgl2.AssetManager = AssetManager;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class OrthoCamera {
      constructor(viewportWidth, viewportHeight) {
        __publicField(this, "position", new webgl2.Vector3(0, 0, 0));
        __publicField(this, "direction", new webgl2.Vector3(0, 0, -1));
        __publicField(this, "up", new webgl2.Vector3(0, 1, 0));
        __publicField(this, "near", 0);
        __publicField(this, "far", 100);
        __publicField(this, "zoom", 1);
        __publicField(this, "viewportWidth", 0);
        __publicField(this, "viewportHeight", 0);
        __publicField(this, "projectionView", new webgl2.Matrix4());
        __publicField(this, "inverseProjectionView", new webgl2.Matrix4());
        __publicField(this, "projection", new webgl2.Matrix4());
        __publicField(this, "view", new webgl2.Matrix4());
        __publicField(this, "tmp", new webgl2.Vector3());
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.update();
      }
      update() {
        let projection = this.projection;
        let view = this.view;
        let projectionView = this.projectionView;
        let inverseProjectionView = this.inverseProjectionView;
        let zoom = this.zoom, viewportWidth = this.viewportWidth, viewportHeight = this.viewportHeight;
        projection.ortho(
          zoom * (-viewportWidth / 2),
          zoom * (viewportWidth / 2),
          zoom * (-viewportHeight / 2),
          zoom * (viewportHeight / 2),
          this.near,
          this.far
        );
        view.lookAt(this.position, this.direction, this.up);
        projectionView.set(projection.values);
        projectionView.multiply(view);
        inverseProjectionView.set(projectionView.values).invert();
      }
      screenToWorld(screenCoords, screenWidth, screenHeight) {
        let x = screenCoords.x, y = screenHeight - screenCoords.y - 1;
        let tmp = this.tmp;
        tmp.x = 2 * x / screenWidth - 1;
        tmp.y = 2 * y / screenHeight - 1;
        tmp.z = 2 * screenCoords.z - 1;
        tmp.project(this.inverseProjectionView);
        screenCoords.set(tmp.x, tmp.y, tmp.z);
        return screenCoords;
      }
      setViewport(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
      }
    }
    webgl2.OrthoCamera = OrthoCamera;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    const _GLTexture = class _GLTexture extends spine2.Texture {
      constructor(context, image, useMipMaps = false) {
        super(image);
        __publicField(this, "context");
        __publicField(this, "texture", null);
        __publicField(this, "boundUnit", 0);
        __publicField(this, "useMipMaps", false);
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
        this.useMipMaps = useMipMaps;
        this.restore();
        this.context.addRestorable(this);
      }
      setFilters(minFilter, magFilter) {
        let gl = this.context.gl;
        this.bind();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, _GLTexture.validateMagFilter(magFilter));
      }
      static validateMagFilter(magFilter) {
        switch (magFilter) {
          case 9987 /* MipMap */:
          case 9987 /* MipMapLinearLinear */:
          case 9985 /* MipMapLinearNearest */:
          case 9986 /* MipMapNearestLinear */:
          case 9984 /* MipMapNearestNearest */:
            return 9729 /* Linear */;
          default:
            return magFilter;
        }
      }
      setWraps(uWrap, vWrap) {
        let gl = this.context.gl;
        this.bind();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, uWrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, vWrap);
      }
      update(useMipMaps) {
        let gl = this.context.gl;
        if (!this.texture) {
          this.texture = this.context.gl.createTexture();
        }
        this.bind();
        if (_GLTexture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL) gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, useMipMaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (useMipMaps) gl.generateMipmap(gl.TEXTURE_2D);
      }
      restore() {
        this.texture = null;
        this.update(this.useMipMaps);
      }
      bind(unit = 0) {
        let gl = this.context.gl;
        this.boundUnit = unit;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
      }
      unbind() {
        let gl = this.context.gl;
        gl.activeTexture(gl.TEXTURE0 + this.boundUnit);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      dispose() {
        this.context.removeRestorable(this);
        let gl = this.context.gl;
        gl.deleteTexture(this.texture);
      }
    };
    __publicField(_GLTexture, "DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL", false);
    let GLTexture = _GLTexture;
    webgl2.GLTexture = _GLTexture;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class Input {
      constructor(element) {
        __publicField(this, "element");
        __publicField(this, "lastX", 0);
        __publicField(this, "lastY", 0);
        __publicField(this, "buttonDown", false);
        __publicField(this, "currTouch", null);
        __publicField(this, "touchesPool", new spine2.Pool(() => {
          return new spine2.webgl.Touch(0, 0, 0);
        }));
        __publicField(this, "listeners", new Array());
        this.element = element;
        this.setupCallbacks(element);
      }
      setupCallbacks(element) {
        let mouseDown = (ev) => {
          if (ev instanceof MouseEvent) {
            let rect = element.getBoundingClientRect();
            let x = ev.clientX - rect.left;
            let y = ev.clientY - rect.top;
            let listeners = this.listeners;
            for (let i = 0; i < listeners.length; i++) {
              if (listeners[i].down) listeners[i].down(x, y);
            }
            this.lastX = x;
            this.lastY = y;
            this.buttonDown = true;
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
          }
        };
        let mouseMove = (ev) => {
          if (ev instanceof MouseEvent) {
            let rect = element.getBoundingClientRect();
            let x = ev.clientX - rect.left;
            let y = ev.clientY - rect.top;
            let listeners = this.listeners;
            for (let i = 0; i < listeners.length; i++) {
              if (this.buttonDown) {
                if (listeners[i].dragged) listeners[i].dragged(x, y);
              } else {
                if (listeners[i].moved) listeners[i].moved(x, y);
              }
            }
            this.lastX = x;
            this.lastY = y;
          }
        };
        let mouseUp = (ev) => {
          if (ev instanceof MouseEvent) {
            let rect = element.getBoundingClientRect();
            let x = ev.clientX - rect.left;
            let y = ev.clientY - rect.top;
            let listeners = this.listeners;
            for (let i = 0; i < listeners.length; i++) {
              if (listeners[i].up) listeners[i].up(x, y);
            }
            this.lastX = x;
            this.lastY = y;
            this.buttonDown = false;
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mouseup", mouseUp);
          }
        };
        element.addEventListener("mousedown", mouseDown, true);
        element.addEventListener("mousemove", mouseMove, true);
        element.addEventListener("mouseup", mouseUp, true);
        element.addEventListener("touchstart", (ev) => {
          if (this.currTouch != null) return;
          var touches = ev.changedTouches;
          for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            let rect = element.getBoundingClientRect();
            let x = touch.clientX - rect.left;
            let y = touch.clientY - rect.top;
            this.currTouch = this.touchesPool.obtain();
            this.currTouch.identifier = touch.identifier;
            this.currTouch.x = x;
            this.currTouch.y = y;
            break;
          }
          let listeners = this.listeners;
          for (let i2 = 0; i2 < listeners.length; i2++) {
            if (listeners[i2].down) listeners[i2].down(this.currTouch.x, this.currTouch.y);
          }
          this.lastX = this.currTouch.x;
          this.lastY = this.currTouch.y;
          this.buttonDown = true;
          ev.preventDefault();
        }, false);
        element.addEventListener("touchend", (ev) => {
          var touches = ev.changedTouches;
          for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (this.currTouch.identifier === touch.identifier) {
              let rect = element.getBoundingClientRect();
              let x = this.currTouch.x = touch.clientX - rect.left;
              let y = this.currTouch.y = touch.clientY - rect.top;
              this.touchesPool.free(this.currTouch);
              let listeners = this.listeners;
              for (let i2 = 0; i2 < listeners.length; i2++) {
                if (listeners[i2].up) listeners[i2].up(x, y);
              }
              this.lastX = x;
              this.lastY = y;
              this.buttonDown = false;
              this.currTouch = null;
              break;
            }
          }
          ev.preventDefault();
        }, false);
        element.addEventListener("touchcancel", (ev) => {
          var touches = ev.changedTouches;
          for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (this.currTouch.identifier === touch.identifier) {
              let rect = element.getBoundingClientRect();
              let x = this.currTouch.x = touch.clientX - rect.left;
              let y = this.currTouch.y = touch.clientY - rect.top;
              this.touchesPool.free(this.currTouch);
              let listeners = this.listeners;
              for (let i2 = 0; i2 < listeners.length; i2++) {
                if (listeners[i2].up) listeners[i2].up(x, y);
              }
              this.lastX = x;
              this.lastY = y;
              this.buttonDown = false;
              this.currTouch = null;
              break;
            }
          }
          ev.preventDefault();
        }, false);
        element.addEventListener("touchmove", (ev) => {
          if (this.currTouch == null) return;
          var touches = ev.changedTouches;
          for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            if (this.currTouch.identifier === touch.identifier) {
              let rect = element.getBoundingClientRect();
              let x = touch.clientX - rect.left;
              let y = touch.clientY - rect.top;
              let listeners = this.listeners;
              for (let i2 = 0; i2 < listeners.length; i2++) {
                if (listeners[i2].dragged) listeners[i2].dragged(x, y);
              }
              this.lastX = this.currTouch.x = x;
              this.lastY = this.currTouch.y = y;
              break;
            }
          }
          ev.preventDefault();
        }, false);
      }
      addListener(listener) {
        this.listeners.push(listener);
      }
      removeListener(listener) {
        let idx = this.listeners.indexOf(listener);
        if (idx > -1) {
          this.listeners.splice(idx, 1);
        }
      }
    }
    webgl2.Input = Input;
    class Touch {
      constructor(identifier, x, y) {
        __publicField(this, "identifier", identifier);
        __publicField(this, "x", x);
        __publicField(this, "y", y);
      }
    }
    webgl2.Touch = Touch;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    const _LoadingScreen = class _LoadingScreen {
      constructor(renderer) {
        __publicField(this, "renderer");
        __publicField(this, "logo", null);
        __publicField(this, "spinner", null);
        __publicField(this, "angle", 0);
        __publicField(this, "fadeOut", 0);
        __publicField(this, "timeKeeper", new spine2.TimeKeeper());
        __publicField(this, "backgroundColor", new spine2.Color(0.135, 0.135, 0.135, 1));
        __publicField(this, "tempColor", new spine2.Color());
        __publicField(this, "firstDraw", 0);
        this.renderer = renderer;
        this.timeKeeper.maxDelta = 9;
        if (_LoadingScreen.logoImg === null) {
          let isSafari = navigator.userAgent.indexOf("Safari") > -1;
          _LoadingScreen.logoImg = new Image();
          _LoadingScreen.logoImg.src = _LoadingScreen.SPINE_LOGO_DATA;
          if (!isSafari) _LoadingScreen.logoImg.crossOrigin = "anonymous";
          _LoadingScreen.logoImg.onload = (ev) => {
            _LoadingScreen.loaded++;
          };
          _LoadingScreen.spinnerImg = new Image();
          _LoadingScreen.spinnerImg.src = _LoadingScreen.SPINNER_DATA;
          if (!isSafari) _LoadingScreen.spinnerImg.crossOrigin = "anonymous";
          _LoadingScreen.spinnerImg.onload = (ev) => {
            _LoadingScreen.loaded++;
          };
        }
      }
      draw(complete = false) {
        if (complete && this.fadeOut > _LoadingScreen.FADE_SECONDS) return;
        this.timeKeeper.update();
        let a = Math.abs(Math.sin(this.timeKeeper.totalTime + 0.75));
        this.angle -= this.timeKeeper.delta / 1.4 * 360 * (1 + 1.5 * Math.pow(a, 5));
        let renderer = this.renderer;
        let canvas = renderer.canvas;
        let gl = renderer.context.gl;
        renderer.resize(webgl2.ResizeMode.Stretch);
        let oldX = renderer.camera.position.x, oldY = renderer.camera.position.y;
        renderer.camera.position.set(canvas.width / 2, canvas.height / 2, 0);
        renderer.camera.viewportWidth = canvas.width;
        renderer.camera.viewportHeight = canvas.height;
        if (!complete) {
          gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
          gl.clear(gl.COLOR_BUFFER_BIT);
          this.tempColor.a = 1;
        } else {
          this.fadeOut += this.timeKeeper.delta * (this.timeKeeper.totalTime < 1 ? 2 : 1);
          if (this.fadeOut > _LoadingScreen.FADE_SECONDS) {
            renderer.camera.position.set(oldX, oldY, 0);
            return;
          }
          a = 1 - this.fadeOut / _LoadingScreen.FADE_SECONDS;
          this.tempColor.setFromColor(this.backgroundColor);
          this.tempColor.a = 1 - (a - 1) * (a - 1);
          renderer.begin();
          renderer.quad(
            true,
            0,
            0,
            canvas.width,
            0,
            canvas.width,
            canvas.height,
            0,
            canvas.height,
            this.tempColor,
            this.tempColor,
            this.tempColor,
            this.tempColor
          );
          renderer.end();
        }
        this.tempColor.set(1, 1, 1, this.tempColor.a);
        if (_LoadingScreen.loaded != 2) return;
        if (this.logo === null) {
          this.logo = new webgl2.GLTexture(renderer.context, _LoadingScreen.logoImg);
          this.spinner = new webgl2.GLTexture(renderer.context, _LoadingScreen.spinnerImg);
        }
        this.logo.update(false);
        this.spinner.update(false);
        let logoWidth = this.logo.getImage().width;
        let logoHeight = this.logo.getImage().height;
        let spinnerWidth = this.spinner.getImage().width;
        let spinnerHeight = this.spinner.getImage().height;
        renderer.batcher.setBlendMode(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        renderer.begin();
        renderer.drawTexture(this.logo, (canvas.width - logoWidth) / 2, (canvas.height - logoHeight) / 2, logoWidth, logoHeight, this.tempColor);
        renderer.drawTextureRotated(this.spinner, (canvas.width - spinnerWidth) / 2, (canvas.height - spinnerHeight) / 2, spinnerWidth, spinnerHeight, spinnerWidth / 2, spinnerHeight / 2, this.angle, this.tempColor);
        renderer.end();
        renderer.camera.position.set(oldX, oldY, 0);
      }
    };
    __publicField(_LoadingScreen, "FADE_SECONDS", 1);
    __publicField(_LoadingScreen, "loaded", 0);
    __publicField(_LoadingScreen, "spinnerImg", null);
    __publicField(_LoadingScreen, "logoImg", null);
    __publicField(_LoadingScreen, "SPINNER_DATA", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKMAAACjCAYAAADmbK6AAAAACXBIWXMAAAsTAAALEwEAmpwYAAALB2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNS41IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTYtMDktMDhUMTQ6MjU6MTIrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTgtMTEtMTVUMTY6NDA6NTkrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE4LTExLTE1VDE2OjQwOjU5KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmZDhlNTljMC02NGJjLTIxNGQtODAyZi1jZDlhODJjM2ZjMGMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpmYmNmZWJlYS03MjY2LWE0NGQtOTI4NS0wOTJmNGNhYzk4ZWEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2UiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHRpZmY6T3JpZW50YXRpb249IjEiIHRpZmY6WFJlc29sdXRpb249IjcyMDAwMC8xMDAwMCIgdGlmZjpZUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOlJlc29sdXRpb25Vbml0PSIyIiBleGlmOkNvbG9yU3BhY2U9IjY1NTM1IiBleGlmOlBpeGVsWERpbWVuc2lvbj0iMjk3IiBleGlmOlBpeGVsWURpbWVuc2lvbj0iMjQyIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2UiIHN0RXZ0OndoZW49IjIwMTYtMDktMDhUMTQ6MjU6MTIrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1LjUgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiNThlMTlkNi0xYTRjLTQyNDEtODU0ZC01MDVlZjYxMjRhODQiIHN0RXZ0OndoZW49IjIwMTgtMTEtMTVUMTY6NDA6MjMrMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQ3YzYzYzIwLWJkYjgtYzM0YS1hYzMyLWQ5MDdjOWEyOTA0MCIgc3RFdnQ6d2hlbj0iMjAxOC0xMS0xNVQxNjo0MDo1OSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZmQ4ZTU5YzAtNjRiYy0yMTRkLTgwMmYtY2Q5YTgyYzNmYzBjIiBzdEV2dDp3aGVuPSIyMDE4LTExLTE1VDE2OjQwOjU5KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0N2M2M2MyMC1iZGI4LWMzNGEtYWMzMi1kOTA3YzlhMjkwNDAiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2OWRmZjljYy01YzFiLWE5NDctOTc3OS03ODgxZjM0ODk3MDMiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2UiLz4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+eG1wLmRpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2U8L3JkZjpsaT4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7qS4aQAAAKZElEQVR42u2de4xVxR3HP8dd3rQryPKo4dGNbtVAQRa1YB93E1tTS7VYqCBiSWhsqGltSx+0xD60tKBorYnNkkBtFUt9xJaGNGlty6EqRAK1KlalshK2C8tzpcIigpz+MbPr5e5y987dM2fv4/tJbjC7v3P2+JvPnTMzZ85MEEURQhQClUpB7gRBAECUYiYwH6gDqoEKoA1oBDYCy4OQJgB92R3yq2S5yRilWASs6CZ0DzA5CNmn/ObOOUpB7kQpRgNLcwj9AHCnMiYZfXIT0C/H2DlRSs0gyeiPaQ6xg4FapUwy+mKUY/wwpUwy+uK4Y/xhpUwy+mKfY3yTUiYZfdHiENsahBxRyiSjL5odYncpXZLRJ3sdYhuVLslYKDKqZpSMBXObVs0oGQumA6OaUTL6Iwg5CBzNMXy7MiYZffNCDjH7g5DdSpVk9M36mGKEZOwxq4Fj3cT8UmmSjEm0Gw8At2UJaQhCtilTeeRWM5EdkmVfOwCIUtQBE4AqILC1ZQuwPgjpSKryWwgy1gfZfjsQ886IKFY2xO9N0jOR69srDOAtzCyYFuCUSrcg6AOcBIYCY4C3gVeT+uNJyvg94GPAxzFjcDuBl4C/AP+UBwXBR4AaYDYwDvgr8Drwi1KScRnwXfut6wNcYT+7Ma97LgX+JRd6jfOAucAXgCvTfl4DvAuMtJVJ0cu41IoYWRHTGWM/1TZmq/2fF8nR14r4U2BQF7+LgMW2k7bY54X4Htr5EvD99s5SlriPArcAY+VGsh1YYDpwMzAgSwy2svhWscpYA/wkx9gKm5S5wBA5kgjnAJcDX7NNpVxcWAZMLUYZJwHDHeKrgXnAdWjZlSS4BLgVuMzRlxt9eeNTxsG2veFyy7gQWAR8Sq54byfeYDssAx3LqLabJldBytgMHMjjuPHAQvTOsU++aJtE/fI4dpevTqZPGV+2veN8+DTwIHCBr29hmVJhJXwA+GAex7cBjxZjm7EFWAL8DfeX39s7NPOy9PKEO7XAV+k8xJYLrcDPgL8Xo4xgJqIuA7bkeXw9ZsBVxMMMYEqex64FfuO7e++bTcAPgD8Bpx2PvRSYKIdi61DOs3edXImAV4Cv2zJsKnYZ24B/AJ+xteRrwAmHBF4mj2JhEnCRg4QnrYh3YZ5NH/J9gUmP5zXYtsdsW+Pl8vffkEex8I5D7HHgGeBhe0dLhKRlbMJM298NXI8Z68rGk8AGeRQLu4DHMGOL2dgJPA78AXguyQvsjScdrTYp2zBDPzfbXl7mmNc64B7MFCbRc/bbfPYHrs343WnbZHsG+BXwZ8y65JS6jOnfwPuBg8BnMQtxjsWsh/0IsNJ2fkR8bAHutbfhG2x7vp9tDzZiFs5/Non2YaHJ2N6OWQf8BxiBeRx4EDPZ9nm544WNVsLtwFWYJ2Wh/fmO3ryw3noHpiv6YyZ5NsuXROhrRypeAv7nfHQJvAOTjbclYuJ3pWcL6YL03rSQjEJIRiEZhZCMQjIKIRmFZBRCMgrJKIRkFJJRCMkoJKMQklFIRiEkoxCSUUhGISSjkIxCSEYhGYWQjEIyCiEZhWQUQjIKySiEZBSSUQjJKCSjEAVCJUAQmCWPoxSjgZuAaZgF348D+zD7ADYDe+2nGWgJQg52dVJvSzOLgqHdmU5ln2IYZou9861Do+x/j8Ss2z7AOrQJWBOEZtetKIrMmt5BEBClWAQsxW3b16OY/QHXA6uD0GzpG0VRPmt6i2KSMeyQrxpYgNl4dCJmV7NcOQEsCULu6ZCR+mAmZiOannAMuC0IWS0Zy0PGKMUCzFZug3p4ullsiJ5obzPOj+H6BgGrohR1KqrSx5bzqhhE7PCvXcY4BZqgoioL4iznunQZq2M8cZXKqSyIs5yr02WsiPHEaiyWSbMxxnNVpMvYFuOJj6mcyoI4y7ktXcbGGE/conIqC+Is58Z0GTfGdNIGzJijKH3W2/KOg43pMi4n//2F92P2KJ4ShCwMQvT4pRwajCFRELIQmGLLf3+ep9pj/TvjCcwI4E5gDp1H0VsxO7k3Zvy7PQjZnXl2DXqXhYydiFKMAcYD44CajH+HZIQfBdYCtwch+854HJh2wkqgFhgGHAaagpAjLhcqGctTxqxOpKgCRgNDMXuK7whCTqU7U9khz3ucAv59xomUe9FVhePGEfs5q1eaQiYKBskoJKMQklFIRiEko5CMQkhGIRmFkIxCMgohGYVkFEIyCskohGQUklEIySiEZBSSUQjJKCSjEJJRSEYhJKOQjEJIRiEZhZCMQjIKIRmFZBSijGXMvIZ+KpZEaF8qeygwHOjb2xdUWQBJqQL6ADOBi4GHMGuGH5Iv3hiG2SJtIWaV4mZgB/AadF6jvVxkvAKzv3UdMNX+bDJm9fx10PV+1qLHIl4P3GLzfh3QBLwKbAZ+DJwuFxkDm5CZmN0Vzsv4/TTMyviVwGOYnRZEPAwBZgDfAC5K+/lo+5kKXAjcBzwPnCz1NuP77LfxO12I2M7FNmFXE+++huVOPfDNDBEz25FzgHuBa4Bzk8x/0jJeCiwCFmP2BsnGh4BbgYFyKDZmZRExnTpbGcywHZySuk0PsbeAG4HZDt+2C6yMb8mjWHgXs+NFd5v09Ac+AYzC7An0EPBKqdSM1wDfBqY7Vvubk263lDhPYHamypVa4MvAHUCq2GvGgcB8YAEwKQ/5nwa33blEVrYDLwJXOhxzLvBJzDhkK/BCMdaMA4C5wF2Y4RrXv7UF+KO9tYh42A08msfoRxVwLfBDYGwxyliLGUMclMexL9rOy075EyvvAKuBlcCbeTa3Pl+MMk7GbP/qyiHg18BWueOFNnu3ymeP8X62h11dbDKm7K3a9Zv7e+BJOeOVRmCNvQO5cgmdt4AueBkH5zCE0FWHpQH4r3zxzlPAw3kcdxg4VmwybnaMfx1YAWxTpyURjtj24wpHuZ7C0yNanzL+FnjZIX4lsEGOJEorcDewKcf4vTb+ZLHJuAeYBxzvJm4/8CPg58AJ+ZE4BzBDNk93k//jwOeAN4qxNw1m5sdV9jZwtlvv48ADujX3GpFtUt0OhPZnJzN63wdtOW7xeSFJPJvehBnBv8/2ricAp2wb8UHgETRvsRDYCiy3IrbPCWi0Mt4BPOf7AoIoivycub5TR/rDmBkjs4Df2fbHJjlQcLwfuNyW13rMXILOkyQ2REUtI5jnnG+mNRFOF3Gh1dlavgozhHUMaLEFGJWImBVnbT4VlYwlSBCYL1iUYgGw6ixhDUHIwo4GmfIrGX3JGKWotj3KbM/cpwQh2yRjYfWmS5EFdD/54ytKk2RMgukxxQjJ2GMm5hAzPEoxRqmSjN6IUgwj9xkr45UxyeiTkQ6x45QuyeiT8x1ia5QuyeiTUaoZJWMxyqiaUTIWzG1aNaNkLJgOzJAoRZVSJhl9McIxfrRSJhl94fq241ClTDL6Yq9jvCYNS0ZvuEwGPopZmlhIRi+sIfeXxtYGIaeUMsnohSCkCViSQ+gezAtOwiW/mvzpkKz3ZnrPxCz1V4dZd6YC8+JSI2YNm+VWXE2ulYyiGPk/nslB8d6ayMkAAAAASUVORK5CYII=");
    __publicField(_LoadingScreen, "SPINE_LOGO_DATA", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKUAAABsCAYAAAALzHKmAAAACXBIWXMAAAsTAAALEwEAmpwYAAALB2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNS41IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTYtMDktMDhUMTQ6MjU6MTIrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTgtMTEtMTVUMTY6NDA6NTkrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE4LTExLTE1VDE2OjQwOjU5KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMTdhZGQ3Ni04OTZlLThlNGUtYmM5MS00ZjEyNjI1YjA3MjgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDplMTViNGE2ZS1hMDg3LWEzNDktODdhOS1mNDYzYjE2MzQ0Y2MiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2UiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHRpZmY6T3JpZW50YXRpb249IjEiIHRpZmY6WFJlc29sdXRpb249IjcyMDAwMC8xMDAwMCIgdGlmZjpZUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOlJlc29sdXRpb25Vbml0PSIyIiBleGlmOkNvbG9yU3BhY2U9IjY1NTM1IiBleGlmOlBpeGVsWERpbWVuc2lvbj0iMjk3IiBleGlmOlBpeGVsWURpbWVuc2lvbj0iMjQyIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2UiIHN0RXZ0OndoZW49IjIwMTYtMDktMDhUMTQ6MjU6MTIrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1LjUgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiNThlMTlkNi0xYTRjLTQyNDEtODU0ZC01MDVlZjYxMjRhODQiIHN0RXZ0OndoZW49IjIwMTgtMTEtMTVUMTY6NDA6MjMrMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjJlNjJiMWM2LWIxYzQtNDk0MC04MDMxLWU4ZDkyNTBmODJjNSIgc3RFdnQ6d2hlbj0iMjAxOC0xMS0xNVQxNjo0MDo1OSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MDE3YWRkNzYtODk2ZS04ZTRlLWJjOTEtNGYxMjYyNWIwNzI4IiBzdEV2dDp3aGVuPSIyMDE4LTExLTE1VDE2OjQwOjU5KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyZTYyYjFjNi1iMWM0LTQ5NDAtODAzMS1lOGQ5MjUwZjgyYzUiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2OWRmZjljYy01YzFiLWE5NDctOTc3OS03ODgxZjM0ODk3MDMiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2UiLz4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+eG1wLmRpZDowODMzNWIyYy04NzYyLWQzNGMtOTBhOS02ODJjYjJmYTQ2M2U8L3JkZjpsaT4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5ayrctAAATYUlEQVR42u2dfVQV553Hv88AXq5uAAlJ0CBem912jQh60kZ8y0tdC5soJnoaXzC4Tdz4cjya1GN206Zqsu3Jpm6yeM5uTG3iaYGoJNFdEY3GaFGD0p4mqS9AXpoV0OZFUOHS3usFuc/+Idde8M7M8zr3gsw5HOCZZ2aemecz39/LPPMMMLAMLDG2kIFzjqmFDiDZP6AkN3gf0gEob8x2kj4MCx2AMnbb1BcVld6IwJJ+0oYb2YTT/gYq6WPHJP3gmtA+Biztr1CSKLevLytprCkh7ctQkj4KsK590hiGlsbSOcVCR5I+BC7pA6BEAzQaq1DqhFFH3Vg16TSG4KHRgNPpyFd1XdIHAyrdCkhjADgaTSiJw/VIP1BSp6GhUQSOOgmlkzASxSqq2zpQB+ClGiGlUb65tAUZOmDUAa5u5XRSgajibVRCR3VCSRyoQwSBE/EvYy3YkYGESuwrpuAkDgPJCg4RhFVUNUkMw6hK6agDcFInoSQxAqNqWHVdD6fUhQqUsfiaVCN41IlOUBEx88JIJCCU8T+tttOR6pEFUgRQXoCVrydRAJJw/G+2jig6llN+p0wnsZpYXsAoxzGognYzryeagBRRR8L5t4iCRsvflDHnIopINcCpGkzlUOoCkqWcKABdlznXZa5lTK7Z/6zlvMeXXqdTCVWoI696ygZN0YZSp/KxQCijmiJgUp3gyQBpVy4Kq4gPqhpWlQrCCxgPeLz70wqmyqcksgELS5kKQEWCIBn1FEn7qFBKKgmnajCloZQtlwWSZR0PoCJBkJMDMnT4iSxlsQCmFJQidVUASQS3ZSlXadqhWDVkTCoLiDKw8t40XOU6oFQBJMtvkSBJ1ITLqKaOgIbVF+y9jd3/omAqVUtViigTTfMAyKqqKnxOlWZcFEzVZjrSb11gaodSRiVVAikCo4hKyjzpkh3No8tf1AUmrxnXCmW0gSSCcIqki4hipbTqGNU+IwuMqsAUfSLVoywezi46gGSFU8Sk86bBKOd1oJzrwuuEQLIbBU8sfiPC37DYhuW8pEfex3NcQBUqyVrO+7edeZdNIfFCSi22oZwdSkzUk1jAaQcrGMA0O34kUJXAaAYl0aSMkRQMjODxAArGct6onPf68CgLbGCkNv4r4axrp4wwUUc7CAnDdkzXJ14SNFHVEQFNRjHtbg7ZoMfuOlHGDiG9/DPCCDgLjDBROFgon50ZV6mQ1/YVzwmgSniJhFryAMpybB4TLjJLRqTOZPUbZYIrwmiqZYC02lboXOIV0C3qm5nVZQGSSCiuaETOe5PygEg4AbXyM1lhJIxqqiWYUQklUaiShMGc2gFpBbDdcXl9StHXka38KVZ/i8V35DXzZibcClIWtRS90ZQpJa/ysZhtHiBV+pk8imm2TjTFwxsQWIHL42PaRd4iroW0ksZLKAFv5MoKbyQQVZl1mShc5LxYOo4Fxt4KyZPysXMhrOrwqKWyHGa8wiCHVSXtzDaxgYSA36xDEk4V5lvGpxRVIZb8pZ0Z571x7My6Up9S17SBhMGvjASfocCUi0TkvOaZMJh11vSPGVSEcT0s1JYyKKnu1BABQOMloeJ9ssMCg53phoKUkVDQs2MMcvNSsZICwfYufPZVB+o/86HxbAAXP/ah9Z2LuPSnAK5wqB1PLlIkmGEBkzVbwKuWolkE6ddXeYeb2akfEfwRTRnZRf89/r84Bf81NB73WtDQ+VUHKocfw1ob35J3QAXrYApq8X94edBmvVUZS9si/Qbr/wacWXgeN/LCCAHAQ+sNhvqhOiQOcNucZMKwQXh42XCkM95AELjZRFNjRCAPSxSmAbXlKXlNOlF0wj2WoqKi5Hnz5mdTGiQA8OCDDx4T6aiNGzeOufnmm5MBoKysrHbfvn3tVhf40hX8MSked1u1LUhx+e1mXGBIz1znC77xxtaJhmFQwzDo3LmPHBdJ6ezZs2cqIVf3UVt7unH16tWNsB4gwpItsPKdlSfTZd4EZH1MKKJkEX8WLfqnlPXr1/8oNTV1QQ8QgsG2pqamX+TkZG+OtP/y8jcn5efnb+nq6vKmpg7NfeONrZOmT5++3uVyZYTvp76+vjg3d8IWs2vy2DDcsunvUDrIQLrZBT3fgXduO4ZnrEx1aWlpbkHBrM0AkJyclFVZWZl3990TngpvT1dXl7e29vRLU6dOLTcxmT3+P3Hi5NLMzMwlhmEkh7fH7/cfraqqemHevLknTMy10yZci/mO2rR5GzZs2JaamrogGAy2Xbx4cWtTU9OLXq93r2EYyR6P52kLdQQAxMXFJR05cvSRGTNmvOZyuTJ8Pl+d1+utCa0fPXr0kydOnHzSzFRu+RLNM09j7qc+vHY5iIbe7Wu7gt8t+wwbGG9YAEBV1eHvT516z0uh9vj9/tpQW7Ozc54rL39zkt1Dh6+/Pl/h8XieNgwjORAInGpqanqxvb19TzAYbHO73VPz8vK2vfXW29kKUnuOLIZitYWFryjlq1RXV890uVxjAWD37oqFo0Z5fjR2bNYvRozIWLFx48b7zpw5s8EmqgYA5OTkrA8EAud2767452HD0ueOGJHxxLp16x7w+Xx1AODxeB5buXLlCDOf9d2L8H7rd3jFfQSzv/MBpjx7BrP/4yzmP1qP76W8j6U7m3HJzpoEg8Fr5ePHj1/n8/nqtmx5fe6wYemPpKffNreysnJxaP2999672sqi/eEPJ5YkJiZmAcDhw1WP3nrrLQVjx2Ztysi4ffmqVSunBAKBU4ZhJE+bNu1VDj81qosRZfVjyU0CABk6dGgmAHR2djYVFRWdCl+3du1Pzo0bl7PZDPxwCHw+X11R0aOPLFy4sCa0vrj4P8+9++7+jaE6P/jBY3NYgrTft8P3s0Y0rPkcn5R9jRaGtNR159zdnieeeuqpulBZYeGCmsbGxtcBwO12jzFT3Iceejh55MiRTwBAQ0PDzwsKCqrDj1NSUuL98MMPX+hW3pHvvXdwqoK+1jELs3KlVGHmbZPVgUBHGwAkJCRklpSUjBW9MB988PvXwwKaa3UWLVpUEwgEzgFAamrqnWYppZ+Owt8eHoeCfdmY/vYYTH43B9/76Nt4tP5uLHlrDCbyntd77x0oPnDggLd3nbNnz9aG/i4vf3NipG1XrFgxKeRD7tq1a2+k4+Tn570fDAbbAOD222/P5uwTJ9/41BJ9izaOKXVQXFxcWVxc/IxhGMmzZj20+5NPPn21vLx8+9q1Pzlrd/xwpWxtbfWawev3+//kcrkyUlJSJpi1618z8cs4guRIx/mmG34Aky2i0+si1bC29VgX1s4e7Q+vl5aWNiJUmJ2dnVlRUTGiWxUpAISi8M7OzqaQ66O4r7UM4HDyxTEpn+XXv/5V2/Tp/1CYn/+PryQkJGSmp6cvXbVq1dLFixdX19TUbJ49++Fjsvm1L774oqYbSMtcpOk6YrqOuwND6S7W/dx///0l6CdLfBQVkntZuHDhqfnz58/84Q9XP5iZmbkgMTExa8iQIZOnTZs2+fPP/2/7HXd8Y63uNrR04vitgzAt0rqvOnAADgyCjbScOXNmAyGEAoBhGNd+E4Jrqrl//77KGwlK6hSY27Zta922bdtWANsrKiomT5iQ+y+JiYlZaWlp83bs2LlvzpzZx0X3PXz48Nyr/utV3zLS8vgn+Onr3wK9ZRDuI93X7wpFW9Nl7J51GpsQpY+4jxuX8yqsHy9SxMAH5p1KCfGAq3R/BQUF1cuXLy8KOfKjRo3KipDQ7bGkpKQkmbXrpptuGg0AXq+33uyglRfQdtsxPJ15HJOL6pE/4xS+m3AY373jt3j59F/gtzn369oUUrXedQn5a3lYnR7n5fP5rvmdW7ZsyXKYHW1fVjMcbqjyLyjs2PF2W0dHx1nWHdx117cfz8vLS+q9r4MHD82Ji4tLAoDm5uY6WM/6gHMBdJZ+jfN7LqAVzn0cqceyb9871X/NZ9433+6GjCXwoqWUvJ1hCUFjY9O/19XVLSssLOwR+R469JsHQsnjy5cvtyHSY6swNRo8ePCdpaVl5WVlZbmhstLS0gnjx49fBVx9vPfssz/eEaFN17VrrQee34zDA59OwIrWKdjsvwf/uysL90TYhjKCyzPvOH3++efPtrS0bO+OxOedOHFyaaR9VldXz2hsbHpRQf9R8E05I8RFvNM+oY1Pavpik8vlykxJSSl85ZVNz7z00svvB4NBEhcXlxwG5OlJkyZuh/mLUSGTVzd48OA7Z84s+OX5883nuvd97Znz0aNH/u3gwYPeCBexRwDzq7/HXYvS8VrvE5mSjO8DOGzRCT0nc+oOTnp3bASzHrFD16xZs2HTpk1ZiYmJWR6P5+lLl1qXBAKBU6H1brd7Snh1sD2rjqqJNxw6sOzkobSqquoFv99/NHShhwwZMjkEZEtLy/Zly5YtMrubwzv40KFDL3/00UfPdXV1eV0uV0YIyEAgcK6iYtcTs2bN2m+iCD3KvuyAN1LDr1D8xSSwuFYW3p7m5mavHRQXLlxoM1FdunPnjtbly5cXNTQ0/DwYDLYZhpHsdrunhH6Aq4MyPv744yWM6kwZ1VFr7tDub7P/HR8lBIAUFRWlRBi2Fn6DXXec0CghAKisrFxcWLjgOABSVlY2MQRG92M+rhfHGnKxZmQiFgAgXRTeLzuwf+Vn+O//aUErg2ljnemMdZQOBUBLSkrGpqXdkhQCPz8/7wjYBveKjBLinenN1nIAoCpHnvNOEGD2zo0RATKrdbZvPJaXvzk5BOXevXsfnz9/Xg3jednlYsnEJAz5hhvuPRdwsfUKuhhUHzYdZjWvJAuwlBE8ltHoVnDa3UDCUKp8omM3QwPrdlb7sVuHSD5luLns/ttquhIzGCP6eMe9aD/uRTtnMAfoeSXCDkie9rGabuX+qFOPGSMFHdREgVjA6w0N7xt2PLNWUCur8ZwHnu8kYWTbFfiS4zHY3wX/nFr8llEZRGG0U1Fq4xebKR+PD6kN1mg80bEC1Awyq1dCbUG0UEpWv9sUrCcz8OOkePR4Xp79N7jr5J8RsIFSdo5yW//SQkV5VZIKmmKhaDxeEkKr90/AYM5Z1NIOFtuX4ktLS08TQhZRSklpaWkt+N+tNl28XfhjOJS+LtSf/DMuC4Aoo5i8QFKbDIFTSfbIT7M4Ah2WYEck+FH9Zh/AN+EVU6RtBuo3B2PQ1tGYlZYAT3sXvljXgMqdzWiTMN0qfEuegEVHlC38eq1IR7BOJgAOIKEATqt9mKWw7CJuFZPx83x+xA5Klq8+iAIJsL8kZrdOGso4zo5gnQhV9qsOVuMheYbYs3yvmmc9lagn+iUGarMPVsW0y5FSAUXXYuLjBXZMBLdhmU02UtBjFQzx+ps850EtoLfzpbnVgUN5VOQxWdVR9MtmUiki1Skhq3wiTIBkgRMCKR/CWM6bV+W581kHL7DkMXk+1sQKJK9VcWQEEq/5FjXhIsGF7Ddt7MDhufAqTBYFlHzuWORLYpRBSXnNtowvKaWULDN42W3D+hkNMOQhAfNEN8/stay5U5nv3/AGPLI5TFa/kgrUlb05uW7gOEF1UqWWdhOk8kS9Ks0uT3BDGbbn8Sl54VTla1qZZ542Sy9xnGkgcAAkOoMukQBT1L+TMfci7gGvOecxsSzmXTaYYTk/nuvODSVLmchH5cH5t+hMuyyjuFmdedFXGyij/waoiXhlHlOyHgsMbY5q9G3le/LOu83ywSHRNBXLY1GRtA9vwMPaqU59wVZFG6DoWkkppajS8XyHW8V3t4lEekP09VS7kTp2Ebmsvyli0kWyBSqsyHVlcYIAyviWsmASThhVBjY84wtZ9suaK5RJy4iaaNa8pVKVNINSRi11gSkSheu4o82UkAVmnhymKIgi0TnA/8hRNPKmqqHkVUsnwBR91Meqjiocd5ZASgQKFT4nT1DDA6TUdSOaymXAFEkniZp7FSOBdAU9LOkVqgBQp4BkLieKgLUqkzXvVuDx7EMEQl35URHoIAmODMAqFJIZyjjNKqriE8a8yXynAxsIdgRrp/KabxkYow6kjFKIqqjKZDnhvAFELYNO8w3Jjuc15yLmmjWoUQZlnIT5UgGmjGqyjLtUrXy6oGRRTl2QivqwrJaJG2KZ5DQvsKwmmccHZVVD2fSSLmXk6XxRSHgVU5U6iqqnFJSyYKqAU+QGiJVAh2oClUdhqeLjSgOpSjFkTbwOVRXNGEDB9aCSwFIFHa3DFZBRfi1Q6gBTFk4Rs63zGijrFIg/ylRt7lW3m6kOUagQqiJ5orFONKJtHR0ok/vUAaPKOrbRt2owZZVTJmhRDaKOYW26I1st06yoBFKmk4jD61UCShSfq1OdpTLgUDW6R8t87rqcfZ1BlMr6uq6Vjhf2owGvozDKmG9dyiQCeTSAiwXVdNIP1A2uls7QkYhW/fgzVgIeXVOe6ISFOnSOjjn+uuHsK5F2NM1hLG/jSGfpjoSdjLSJg7Cp7FjaR7ZzXEGcinBJDF8DnZ1Ho7wPrYNadHdINGCLdVMdrU6nMdimqHYgiaF2kn4IXJ8FMJY6iPRxsPqTksbc55ZJP2vHgOnuYwD2tU4k/eycaT891g0F5YDZ7qfQ3SidTAZgG4By4FwHgBtYBpYbZ/l/2EJnC9N0gaQAAAAASUVORK5CYII=");
    let LoadingScreen = _LoadingScreen;
    webgl2.LoadingScreen = _LoadingScreen;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    webgl2.M00 = 0;
    webgl2.M01 = 4;
    webgl2.M02 = 8;
    webgl2.M03 = 12;
    webgl2.M10 = 1;
    webgl2.M11 = 5;
    webgl2.M12 = 9;
    webgl2.M13 = 13;
    webgl2.M20 = 2;
    webgl2.M21 = 6;
    webgl2.M22 = 10;
    webgl2.M23 = 14;
    webgl2.M30 = 3;
    webgl2.M31 = 7;
    webgl2.M32 = 11;
    webgl2.M33 = 15;
    const _Matrix4 = class _Matrix4 {
      constructor() {
        __publicField(this, "temp", new Float32Array(16));
        __publicField(this, "values", new Float32Array(16));
        let v = this.values;
        v[webgl2.M00] = 1;
        v[webgl2.M11] = 1;
        v[webgl2.M22] = 1;
        v[webgl2.M33] = 1;
      }
      set(values) {
        this.values.set(values);
        return this;
      }
      transpose() {
        let t = this.temp;
        let v = this.values;
        t[webgl2.M00] = v[webgl2.M00];
        t[webgl2.M01] = v[webgl2.M10];
        t[webgl2.M02] = v[webgl2.M20];
        t[webgl2.M03] = v[webgl2.M30];
        t[webgl2.M10] = v[webgl2.M01];
        t[webgl2.M11] = v[webgl2.M11];
        t[webgl2.M12] = v[webgl2.M21];
        t[webgl2.M13] = v[webgl2.M31];
        t[webgl2.M20] = v[webgl2.M02];
        t[webgl2.M21] = v[webgl2.M12];
        t[webgl2.M22] = v[webgl2.M22];
        t[webgl2.M23] = v[webgl2.M32];
        t[webgl2.M30] = v[webgl2.M03];
        t[webgl2.M31] = v[webgl2.M13];
        t[webgl2.M32] = v[webgl2.M23];
        t[webgl2.M33] = v[webgl2.M33];
        return this.set(t);
      }
      identity() {
        let v = this.values;
        v[webgl2.M00] = 1;
        v[webgl2.M01] = 0;
        v[webgl2.M02] = 0;
        v[webgl2.M03] = 0;
        v[webgl2.M10] = 0;
        v[webgl2.M11] = 1;
        v[webgl2.M12] = 0;
        v[webgl2.M13] = 0;
        v[webgl2.M20] = 0;
        v[webgl2.M21] = 0;
        v[webgl2.M22] = 1;
        v[webgl2.M23] = 0;
        v[webgl2.M30] = 0;
        v[webgl2.M31] = 0;
        v[webgl2.M32] = 0;
        v[webgl2.M33] = 1;
        return this;
      }
      invert() {
        let v = this.values;
        let t = this.temp;
        let l_det = v[webgl2.M30] * v[webgl2.M21] * v[webgl2.M12] * v[webgl2.M03] - v[webgl2.M20] * v[webgl2.M31] * v[webgl2.M12] * v[webgl2.M03] - v[webgl2.M30] * v[webgl2.M11] * v[webgl2.M22] * v[webgl2.M03] + v[webgl2.M10] * v[webgl2.M31] * v[webgl2.M22] * v[webgl2.M03] + v[webgl2.M20] * v[webgl2.M11] * v[webgl2.M32] * v[webgl2.M03] - v[webgl2.M10] * v[webgl2.M21] * v[webgl2.M32] * v[webgl2.M03] - v[webgl2.M30] * v[webgl2.M21] * v[webgl2.M02] * v[webgl2.M13] + v[webgl2.M20] * v[webgl2.M31] * v[webgl2.M02] * v[webgl2.M13] + v[webgl2.M30] * v[webgl2.M01] * v[webgl2.M22] * v[webgl2.M13] - v[webgl2.M00] * v[webgl2.M31] * v[webgl2.M22] * v[webgl2.M13] - v[webgl2.M20] * v[webgl2.M01] * v[webgl2.M32] * v[webgl2.M13] + v[webgl2.M00] * v[webgl2.M21] * v[webgl2.M32] * v[webgl2.M13] + v[webgl2.M30] * v[webgl2.M11] * v[webgl2.M02] * v[webgl2.M23] - v[webgl2.M10] * v[webgl2.M31] * v[webgl2.M02] * v[webgl2.M23] - v[webgl2.M30] * v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M23] + v[webgl2.M00] * v[webgl2.M31] * v[webgl2.M12] * v[webgl2.M23] + v[webgl2.M10] * v[webgl2.M01] * v[webgl2.M32] * v[webgl2.M23] - v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M32] * v[webgl2.M23] - v[webgl2.M20] * v[webgl2.M11] * v[webgl2.M02] * v[webgl2.M33] + v[webgl2.M10] * v[webgl2.M21] * v[webgl2.M02] * v[webgl2.M33] + v[webgl2.M20] * v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M33] - v[webgl2.M00] * v[webgl2.M21] * v[webgl2.M12] * v[webgl2.M33] - v[webgl2.M10] * v[webgl2.M01] * v[webgl2.M22] * v[webgl2.M33] + v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M22] * v[webgl2.M33];
        if (l_det == 0) throw new Error("non-invertible matrix");
        let inv_det = 1 / l_det;
        t[webgl2.M00] = v[webgl2.M12] * v[webgl2.M23] * v[webgl2.M31] - v[webgl2.M13] * v[webgl2.M22] * v[webgl2.M31] + v[webgl2.M13] * v[webgl2.M21] * v[webgl2.M32] - v[webgl2.M11] * v[webgl2.M23] * v[webgl2.M32] - v[webgl2.M12] * v[webgl2.M21] * v[webgl2.M33] + v[webgl2.M11] * v[webgl2.M22] * v[webgl2.M33];
        t[webgl2.M01] = v[webgl2.M03] * v[webgl2.M22] * v[webgl2.M31] - v[webgl2.M02] * v[webgl2.M23] * v[webgl2.M31] - v[webgl2.M03] * v[webgl2.M21] * v[webgl2.M32] + v[webgl2.M01] * v[webgl2.M23] * v[webgl2.M32] + v[webgl2.M02] * v[webgl2.M21] * v[webgl2.M33] - v[webgl2.M01] * v[webgl2.M22] * v[webgl2.M33];
        t[webgl2.M02] = v[webgl2.M02] * v[webgl2.M13] * v[webgl2.M31] - v[webgl2.M03] * v[webgl2.M12] * v[webgl2.M31] + v[webgl2.M03] * v[webgl2.M11] * v[webgl2.M32] - v[webgl2.M01] * v[webgl2.M13] * v[webgl2.M32] - v[webgl2.M02] * v[webgl2.M11] * v[webgl2.M33] + v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M33];
        t[webgl2.M03] = v[webgl2.M03] * v[webgl2.M12] * v[webgl2.M21] - v[webgl2.M02] * v[webgl2.M13] * v[webgl2.M21] - v[webgl2.M03] * v[webgl2.M11] * v[webgl2.M22] + v[webgl2.M01] * v[webgl2.M13] * v[webgl2.M22] + v[webgl2.M02] * v[webgl2.M11] * v[webgl2.M23] - v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M23];
        t[webgl2.M10] = v[webgl2.M13] * v[webgl2.M22] * v[webgl2.M30] - v[webgl2.M12] * v[webgl2.M23] * v[webgl2.M30] - v[webgl2.M13] * v[webgl2.M20] * v[webgl2.M32] + v[webgl2.M10] * v[webgl2.M23] * v[webgl2.M32] + v[webgl2.M12] * v[webgl2.M20] * v[webgl2.M33] - v[webgl2.M10] * v[webgl2.M22] * v[webgl2.M33];
        t[webgl2.M11] = v[webgl2.M02] * v[webgl2.M23] * v[webgl2.M30] - v[webgl2.M03] * v[webgl2.M22] * v[webgl2.M30] + v[webgl2.M03] * v[webgl2.M20] * v[webgl2.M32] - v[webgl2.M00] * v[webgl2.M23] * v[webgl2.M32] - v[webgl2.M02] * v[webgl2.M20] * v[webgl2.M33] + v[webgl2.M00] * v[webgl2.M22] * v[webgl2.M33];
        t[webgl2.M12] = v[webgl2.M03] * v[webgl2.M12] * v[webgl2.M30] - v[webgl2.M02] * v[webgl2.M13] * v[webgl2.M30] - v[webgl2.M03] * v[webgl2.M10] * v[webgl2.M32] + v[webgl2.M00] * v[webgl2.M13] * v[webgl2.M32] + v[webgl2.M02] * v[webgl2.M10] * v[webgl2.M33] - v[webgl2.M00] * v[webgl2.M12] * v[webgl2.M33];
        t[webgl2.M13] = v[webgl2.M02] * v[webgl2.M13] * v[webgl2.M20] - v[webgl2.M03] * v[webgl2.M12] * v[webgl2.M20] + v[webgl2.M03] * v[webgl2.M10] * v[webgl2.M22] - v[webgl2.M00] * v[webgl2.M13] * v[webgl2.M22] - v[webgl2.M02] * v[webgl2.M10] * v[webgl2.M23] + v[webgl2.M00] * v[webgl2.M12] * v[webgl2.M23];
        t[webgl2.M20] = v[webgl2.M11] * v[webgl2.M23] * v[webgl2.M30] - v[webgl2.M13] * v[webgl2.M21] * v[webgl2.M30] + v[webgl2.M13] * v[webgl2.M20] * v[webgl2.M31] - v[webgl2.M10] * v[webgl2.M23] * v[webgl2.M31] - v[webgl2.M11] * v[webgl2.M20] * v[webgl2.M33] + v[webgl2.M10] * v[webgl2.M21] * v[webgl2.M33];
        t[webgl2.M21] = v[webgl2.M03] * v[webgl2.M21] * v[webgl2.M30] - v[webgl2.M01] * v[webgl2.M23] * v[webgl2.M30] - v[webgl2.M03] * v[webgl2.M20] * v[webgl2.M31] + v[webgl2.M00] * v[webgl2.M23] * v[webgl2.M31] + v[webgl2.M01] * v[webgl2.M20] * v[webgl2.M33] - v[webgl2.M00] * v[webgl2.M21] * v[webgl2.M33];
        t[webgl2.M22] = v[webgl2.M01] * v[webgl2.M13] * v[webgl2.M30] - v[webgl2.M03] * v[webgl2.M11] * v[webgl2.M30] + v[webgl2.M03] * v[webgl2.M10] * v[webgl2.M31] - v[webgl2.M00] * v[webgl2.M13] * v[webgl2.M31] - v[webgl2.M01] * v[webgl2.M10] * v[webgl2.M33] + v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M33];
        t[webgl2.M23] = v[webgl2.M03] * v[webgl2.M11] * v[webgl2.M20] - v[webgl2.M01] * v[webgl2.M13] * v[webgl2.M20] - v[webgl2.M03] * v[webgl2.M10] * v[webgl2.M21] + v[webgl2.M00] * v[webgl2.M13] * v[webgl2.M21] + v[webgl2.M01] * v[webgl2.M10] * v[webgl2.M23] - v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M23];
        t[webgl2.M30] = v[webgl2.M12] * v[webgl2.M21] * v[webgl2.M30] - v[webgl2.M11] * v[webgl2.M22] * v[webgl2.M30] - v[webgl2.M12] * v[webgl2.M20] * v[webgl2.M31] + v[webgl2.M10] * v[webgl2.M22] * v[webgl2.M31] + v[webgl2.M11] * v[webgl2.M20] * v[webgl2.M32] - v[webgl2.M10] * v[webgl2.M21] * v[webgl2.M32];
        t[webgl2.M31] = v[webgl2.M01] * v[webgl2.M22] * v[webgl2.M30] - v[webgl2.M02] * v[webgl2.M21] * v[webgl2.M30] + v[webgl2.M02] * v[webgl2.M20] * v[webgl2.M31] - v[webgl2.M00] * v[webgl2.M22] * v[webgl2.M31] - v[webgl2.M01] * v[webgl2.M20] * v[webgl2.M32] + v[webgl2.M00] * v[webgl2.M21] * v[webgl2.M32];
        t[webgl2.M32] = v[webgl2.M02] * v[webgl2.M11] * v[webgl2.M30] - v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M30] - v[webgl2.M02] * v[webgl2.M10] * v[webgl2.M31] + v[webgl2.M00] * v[webgl2.M12] * v[webgl2.M31] + v[webgl2.M01] * v[webgl2.M10] * v[webgl2.M32] - v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M32];
        t[webgl2.M33] = v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M20] - v[webgl2.M02] * v[webgl2.M11] * v[webgl2.M20] + v[webgl2.M02] * v[webgl2.M10] * v[webgl2.M21] - v[webgl2.M00] * v[webgl2.M12] * v[webgl2.M21] - v[webgl2.M01] * v[webgl2.M10] * v[webgl2.M22] + v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M22];
        v[webgl2.M00] = t[webgl2.M00] * inv_det;
        v[webgl2.M01] = t[webgl2.M01] * inv_det;
        v[webgl2.M02] = t[webgl2.M02] * inv_det;
        v[webgl2.M03] = t[webgl2.M03] * inv_det;
        v[webgl2.M10] = t[webgl2.M10] * inv_det;
        v[webgl2.M11] = t[webgl2.M11] * inv_det;
        v[webgl2.M12] = t[webgl2.M12] * inv_det;
        v[webgl2.M13] = t[webgl2.M13] * inv_det;
        v[webgl2.M20] = t[webgl2.M20] * inv_det;
        v[webgl2.M21] = t[webgl2.M21] * inv_det;
        v[webgl2.M22] = t[webgl2.M22] * inv_det;
        v[webgl2.M23] = t[webgl2.M23] * inv_det;
        v[webgl2.M30] = t[webgl2.M30] * inv_det;
        v[webgl2.M31] = t[webgl2.M31] * inv_det;
        v[webgl2.M32] = t[webgl2.M32] * inv_det;
        v[webgl2.M33] = t[webgl2.M33] * inv_det;
        return this;
      }
      determinant() {
        let v = this.values;
        return v[webgl2.M30] * v[webgl2.M21] * v[webgl2.M12] * v[webgl2.M03] - v[webgl2.M20] * v[webgl2.M31] * v[webgl2.M12] * v[webgl2.M03] - v[webgl2.M30] * v[webgl2.M11] * v[webgl2.M22] * v[webgl2.M03] + v[webgl2.M10] * v[webgl2.M31] * v[webgl2.M22] * v[webgl2.M03] + v[webgl2.M20] * v[webgl2.M11] * v[webgl2.M32] * v[webgl2.M03] - v[webgl2.M10] * v[webgl2.M21] * v[webgl2.M32] * v[webgl2.M03] - v[webgl2.M30] * v[webgl2.M21] * v[webgl2.M02] * v[webgl2.M13] + v[webgl2.M20] * v[webgl2.M31] * v[webgl2.M02] * v[webgl2.M13] + v[webgl2.M30] * v[webgl2.M01] * v[webgl2.M22] * v[webgl2.M13] - v[webgl2.M00] * v[webgl2.M31] * v[webgl2.M22] * v[webgl2.M13] - v[webgl2.M20] * v[webgl2.M01] * v[webgl2.M32] * v[webgl2.M13] + v[webgl2.M00] * v[webgl2.M21] * v[webgl2.M32] * v[webgl2.M13] + v[webgl2.M30] * v[webgl2.M11] * v[webgl2.M02] * v[webgl2.M23] - v[webgl2.M10] * v[webgl2.M31] * v[webgl2.M02] * v[webgl2.M23] - v[webgl2.M30] * v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M23] + v[webgl2.M00] * v[webgl2.M31] * v[webgl2.M12] * v[webgl2.M23] + v[webgl2.M10] * v[webgl2.M01] * v[webgl2.M32] * v[webgl2.M23] - v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M32] * v[webgl2.M23] - v[webgl2.M20] * v[webgl2.M11] * v[webgl2.M02] * v[webgl2.M33] + v[webgl2.M10] * v[webgl2.M21] * v[webgl2.M02] * v[webgl2.M33] + v[webgl2.M20] * v[webgl2.M01] * v[webgl2.M12] * v[webgl2.M33] - v[webgl2.M00] * v[webgl2.M21] * v[webgl2.M12] * v[webgl2.M33] - v[webgl2.M10] * v[webgl2.M01] * v[webgl2.M22] * v[webgl2.M33] + v[webgl2.M00] * v[webgl2.M11] * v[webgl2.M22] * v[webgl2.M33];
      }
      translate(x, y, z) {
        let v = this.values;
        v[webgl2.M03] += x;
        v[webgl2.M13] += y;
        v[webgl2.M23] += z;
        return this;
      }
      copy() {
        return new _Matrix4().set(this.values);
      }
      projection(near, far, fovy, aspectRatio) {
        this.identity();
        let l_fd = 1 / Math.tan(fovy * (Math.PI / 180) / 2);
        let l_a1 = (far + near) / (near - far);
        let l_a2 = 2 * far * near / (near - far);
        let v = this.values;
        v[webgl2.M00] = l_fd / aspectRatio;
        v[webgl2.M10] = 0;
        v[webgl2.M20] = 0;
        v[webgl2.M30] = 0;
        v[webgl2.M01] = 0;
        v[webgl2.M11] = l_fd;
        v[webgl2.M21] = 0;
        v[webgl2.M31] = 0;
        v[webgl2.M02] = 0;
        v[webgl2.M12] = 0;
        v[webgl2.M22] = l_a1;
        v[webgl2.M32] = -1;
        v[webgl2.M03] = 0;
        v[webgl2.M13] = 0;
        v[webgl2.M23] = l_a2;
        v[webgl2.M33] = 0;
        return this;
      }
      ortho2d(x, y, width, height) {
        return this.ortho(x, x + width, y, y + height, 0, 1);
      }
      ortho(left, right, bottom, top, near, far) {
        this.identity();
        let x_orth = 2 / (right - left);
        let y_orth = 2 / (top - bottom);
        let z_orth = -2 / (far - near);
        let tx = -(right + left) / (right - left);
        let ty = -(top + bottom) / (top - bottom);
        let tz = -(far + near) / (far - near);
        let v = this.values;
        v[webgl2.M00] = x_orth;
        v[webgl2.M10] = 0;
        v[webgl2.M20] = 0;
        v[webgl2.M30] = 0;
        v[webgl2.M01] = 0;
        v[webgl2.M11] = y_orth;
        v[webgl2.M21] = 0;
        v[webgl2.M31] = 0;
        v[webgl2.M02] = 0;
        v[webgl2.M12] = 0;
        v[webgl2.M22] = z_orth;
        v[webgl2.M32] = 0;
        v[webgl2.M03] = tx;
        v[webgl2.M13] = ty;
        v[webgl2.M23] = tz;
        v[webgl2.M33] = 1;
        return this;
      }
      multiply(matrix) {
        let t = this.temp;
        let v = this.values;
        let m = matrix.values;
        t[webgl2.M00] = v[webgl2.M00] * m[webgl2.M00] + v[webgl2.M01] * m[webgl2.M10] + v[webgl2.M02] * m[webgl2.M20] + v[webgl2.M03] * m[webgl2.M30];
        t[webgl2.M01] = v[webgl2.M00] * m[webgl2.M01] + v[webgl2.M01] * m[webgl2.M11] + v[webgl2.M02] * m[webgl2.M21] + v[webgl2.M03] * m[webgl2.M31];
        t[webgl2.M02] = v[webgl2.M00] * m[webgl2.M02] + v[webgl2.M01] * m[webgl2.M12] + v[webgl2.M02] * m[webgl2.M22] + v[webgl2.M03] * m[webgl2.M32];
        t[webgl2.M03] = v[webgl2.M00] * m[webgl2.M03] + v[webgl2.M01] * m[webgl2.M13] + v[webgl2.M02] * m[webgl2.M23] + v[webgl2.M03] * m[webgl2.M33];
        t[webgl2.M10] = v[webgl2.M10] * m[webgl2.M00] + v[webgl2.M11] * m[webgl2.M10] + v[webgl2.M12] * m[webgl2.M20] + v[webgl2.M13] * m[webgl2.M30];
        t[webgl2.M11] = v[webgl2.M10] * m[webgl2.M01] + v[webgl2.M11] * m[webgl2.M11] + v[webgl2.M12] * m[webgl2.M21] + v[webgl2.M13] * m[webgl2.M31];
        t[webgl2.M12] = v[webgl2.M10] * m[webgl2.M02] + v[webgl2.M11] * m[webgl2.M12] + v[webgl2.M12] * m[webgl2.M22] + v[webgl2.M13] * m[webgl2.M32];
        t[webgl2.M13] = v[webgl2.M10] * m[webgl2.M03] + v[webgl2.M11] * m[webgl2.M13] + v[webgl2.M12] * m[webgl2.M23] + v[webgl2.M13] * m[webgl2.M33];
        t[webgl2.M20] = v[webgl2.M20] * m[webgl2.M00] + v[webgl2.M21] * m[webgl2.M10] + v[webgl2.M22] * m[webgl2.M20] + v[webgl2.M23] * m[webgl2.M30];
        t[webgl2.M21] = v[webgl2.M20] * m[webgl2.M01] + v[webgl2.M21] * m[webgl2.M11] + v[webgl2.M22] * m[webgl2.M21] + v[webgl2.M23] * m[webgl2.M31];
        t[webgl2.M22] = v[webgl2.M20] * m[webgl2.M02] + v[webgl2.M21] * m[webgl2.M12] + v[webgl2.M22] * m[webgl2.M22] + v[webgl2.M23] * m[webgl2.M32];
        t[webgl2.M23] = v[webgl2.M20] * m[webgl2.M03] + v[webgl2.M21] * m[webgl2.M13] + v[webgl2.M22] * m[webgl2.M23] + v[webgl2.M23] * m[webgl2.M33];
        t[webgl2.M30] = v[webgl2.M30] * m[webgl2.M00] + v[webgl2.M31] * m[webgl2.M10] + v[webgl2.M32] * m[webgl2.M20] + v[webgl2.M33] * m[webgl2.M30];
        t[webgl2.M31] = v[webgl2.M30] * m[webgl2.M01] + v[webgl2.M31] * m[webgl2.M11] + v[webgl2.M32] * m[webgl2.M21] + v[webgl2.M33] * m[webgl2.M31];
        t[webgl2.M32] = v[webgl2.M30] * m[webgl2.M02] + v[webgl2.M31] * m[webgl2.M12] + v[webgl2.M32] * m[webgl2.M22] + v[webgl2.M33] * m[webgl2.M32];
        t[webgl2.M33] = v[webgl2.M30] * m[webgl2.M03] + v[webgl2.M31] * m[webgl2.M13] + v[webgl2.M32] * m[webgl2.M23] + v[webgl2.M33] * m[webgl2.M33];
        return this.set(this.temp);
      }
      multiplyLeft(matrix) {
        let t = this.temp;
        let v = this.values;
        let m = matrix.values;
        t[webgl2.M00] = m[webgl2.M00] * v[webgl2.M00] + m[webgl2.M01] * v[webgl2.M10] + m[webgl2.M02] * v[webgl2.M20] + m[webgl2.M03] * v[webgl2.M30];
        t[webgl2.M01] = m[webgl2.M00] * v[webgl2.M01] + m[webgl2.M01] * v[webgl2.M11] + m[webgl2.M02] * v[webgl2.M21] + m[webgl2.M03] * v[webgl2.M31];
        t[webgl2.M02] = m[webgl2.M00] * v[webgl2.M02] + m[webgl2.M01] * v[webgl2.M12] + m[webgl2.M02] * v[webgl2.M22] + m[webgl2.M03] * v[webgl2.M32];
        t[webgl2.M03] = m[webgl2.M00] * v[webgl2.M03] + m[webgl2.M01] * v[webgl2.M13] + m[webgl2.M02] * v[webgl2.M23] + m[webgl2.M03] * v[webgl2.M33];
        t[webgl2.M10] = m[webgl2.M10] * v[webgl2.M00] + m[webgl2.M11] * v[webgl2.M10] + m[webgl2.M12] * v[webgl2.M20] + m[webgl2.M13] * v[webgl2.M30];
        t[webgl2.M11] = m[webgl2.M10] * v[webgl2.M01] + m[webgl2.M11] * v[webgl2.M11] + m[webgl2.M12] * v[webgl2.M21] + m[webgl2.M13] * v[webgl2.M31];
        t[webgl2.M12] = m[webgl2.M10] * v[webgl2.M02] + m[webgl2.M11] * v[webgl2.M12] + m[webgl2.M12] * v[webgl2.M22] + m[webgl2.M13] * v[webgl2.M32];
        t[webgl2.M13] = m[webgl2.M10] * v[webgl2.M03] + m[webgl2.M11] * v[webgl2.M13] + m[webgl2.M12] * v[webgl2.M23] + m[webgl2.M13] * v[webgl2.M33];
        t[webgl2.M20] = m[webgl2.M20] * v[webgl2.M00] + m[webgl2.M21] * v[webgl2.M10] + m[webgl2.M22] * v[webgl2.M20] + m[webgl2.M23] * v[webgl2.M30];
        t[webgl2.M21] = m[webgl2.M20] * v[webgl2.M01] + m[webgl2.M21] * v[webgl2.M11] + m[webgl2.M22] * v[webgl2.M21] + m[webgl2.M23] * v[webgl2.M31];
        t[webgl2.M22] = m[webgl2.M20] * v[webgl2.M02] + m[webgl2.M21] * v[webgl2.M12] + m[webgl2.M22] * v[webgl2.M22] + m[webgl2.M23] * v[webgl2.M32];
        t[webgl2.M23] = m[webgl2.M20] * v[webgl2.M03] + m[webgl2.M21] * v[webgl2.M13] + m[webgl2.M22] * v[webgl2.M23] + m[webgl2.M23] * v[webgl2.M33];
        t[webgl2.M30] = m[webgl2.M30] * v[webgl2.M00] + m[webgl2.M31] * v[webgl2.M10] + m[webgl2.M32] * v[webgl2.M20] + m[webgl2.M33] * v[webgl2.M30];
        t[webgl2.M31] = m[webgl2.M30] * v[webgl2.M01] + m[webgl2.M31] * v[webgl2.M11] + m[webgl2.M32] * v[webgl2.M21] + m[webgl2.M33] * v[webgl2.M31];
        t[webgl2.M32] = m[webgl2.M30] * v[webgl2.M02] + m[webgl2.M31] * v[webgl2.M12] + m[webgl2.M32] * v[webgl2.M22] + m[webgl2.M33] * v[webgl2.M32];
        t[webgl2.M33] = m[webgl2.M30] * v[webgl2.M03] + m[webgl2.M31] * v[webgl2.M13] + m[webgl2.M32] * v[webgl2.M23] + m[webgl2.M33] * v[webgl2.M33];
        return this.set(this.temp);
      }
      lookAt(position, direction, up) {
        _Matrix4.initTemps();
        let xAxis = _Matrix4.xAxis, yAxis = _Matrix4.yAxis, zAxis = _Matrix4.zAxis;
        zAxis.setFrom(direction).normalize();
        xAxis.setFrom(direction).normalize();
        xAxis.cross(up).normalize();
        yAxis.setFrom(xAxis).cross(zAxis).normalize();
        this.identity();
        let val = this.values;
        val[webgl2.M00] = xAxis.x;
        val[webgl2.M01] = xAxis.y;
        val[webgl2.M02] = xAxis.z;
        val[webgl2.M10] = yAxis.x;
        val[webgl2.M11] = yAxis.y;
        val[webgl2.M12] = yAxis.z;
        val[webgl2.M20] = -zAxis.x;
        val[webgl2.M21] = -zAxis.y;
        val[webgl2.M22] = -zAxis.z;
        _Matrix4.tmpMatrix.identity();
        _Matrix4.tmpMatrix.values[webgl2.M03] = -position.x;
        _Matrix4.tmpMatrix.values[webgl2.M13] = -position.y;
        _Matrix4.tmpMatrix.values[webgl2.M23] = -position.z;
        this.multiply(_Matrix4.tmpMatrix);
        return this;
      }
      static initTemps() {
        if (_Matrix4.xAxis === null) _Matrix4.xAxis = new webgl2.Vector3();
        if (_Matrix4.yAxis === null) _Matrix4.yAxis = new webgl2.Vector3();
        if (_Matrix4.zAxis === null) _Matrix4.zAxis = new webgl2.Vector3();
      }
    };
    __publicField(_Matrix4, "xAxis", null);
    __publicField(_Matrix4, "yAxis", null);
    __publicField(_Matrix4, "zAxis", null);
    __publicField(_Matrix4, "tmpMatrix", new _Matrix4());
    let Matrix4 = _Matrix4;
    webgl2.Matrix4 = _Matrix4;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class Mesh {
      constructor(context, attributes, maxVertices, maxIndices) {
        __publicField(this, "attributes", attributes);
        __publicField(this, "context");
        __publicField(this, "vertices");
        __publicField(this, "verticesBuffer");
        __publicField(this, "verticesLength", 0);
        __publicField(this, "dirtyVertices", false);
        __publicField(this, "indices");
        __publicField(this, "indicesBuffer");
        __publicField(this, "indicesLength", 0);
        __publicField(this, "dirtyIndices", false);
        __publicField(this, "elementsPerVertex", 0);
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
        this.elementsPerVertex = 0;
        for (let i = 0; i < attributes.length; i++) {
          this.elementsPerVertex += attributes[i].numElements;
        }
        this.vertices = new Float32Array(maxVertices * this.elementsPerVertex);
        this.indices = new Uint16Array(maxIndices);
        this.context.addRestorable(this);
      }
      getAttributes() {
        return this.attributes;
      }
      maxVertices() {
        return this.vertices.length / this.elementsPerVertex;
      }
      numVertices() {
        return this.verticesLength / this.elementsPerVertex;
      }
      setVerticesLength(length) {
        this.dirtyVertices = true;
        this.verticesLength = length;
      }
      getVertices() {
        return this.vertices;
      }
      maxIndices() {
        return this.indices.length;
      }
      numIndices() {
        return this.indicesLength;
      }
      setIndicesLength(length) {
        this.dirtyIndices = true;
        this.indicesLength = length;
      }
      getIndices() {
        return this.indices;
      }
      getVertexSizeInFloats() {
        let size = 0;
        for (var i = 0; i < this.attributes.length; i++) {
          let attribute = this.attributes[i];
          size += attribute.numElements;
        }
        return size;
      }
      setVertices(vertices) {
        this.dirtyVertices = true;
        if (vertices.length > this.vertices.length) throw Error("Mesh can't store more than " + this.maxVertices() + " vertices");
        this.vertices.set(vertices, 0);
        this.verticesLength = vertices.length;
      }
      setIndices(indices) {
        this.dirtyIndices = true;
        if (indices.length > this.indices.length) throw Error("Mesh can't store more than " + this.maxIndices() + " indices");
        this.indices.set(indices, 0);
        this.indicesLength = indices.length;
      }
      draw(shader, primitiveType) {
        this.drawWithOffset(shader, primitiveType, 0, this.indicesLength > 0 ? this.indicesLength : this.verticesLength / this.elementsPerVertex);
      }
      drawWithOffset(shader, primitiveType, offset, count) {
        let gl = this.context.gl;
        if (this.dirtyVertices || this.dirtyIndices) this.update();
        this.bind(shader);
        if (this.indicesLength > 0) {
          gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset * 2);
        } else {
          gl.drawArrays(primitiveType, offset, count);
        }
        this.unbind(shader);
      }
      bind(shader) {
        let gl = this.context.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        let offset = 0;
        for (let i = 0; i < this.attributes.length; i++) {
          let attrib = this.attributes[i];
          let location = shader.getAttributeLocation(attrib.name);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, attrib.numElements, gl.FLOAT, false, this.elementsPerVertex * 4, offset * 4);
          offset += attrib.numElements;
        }
        if (this.indicesLength > 0) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
      }
      unbind(shader) {
        let gl = this.context.gl;
        for (let i = 0; i < this.attributes.length; i++) {
          let attrib = this.attributes[i];
          let location = shader.getAttributeLocation(attrib.name);
          gl.disableVertexAttribArray(location);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        if (this.indicesLength > 0) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      }
      update() {
        let gl = this.context.gl;
        if (this.dirtyVertices) {
          if (!this.verticesBuffer) {
            this.verticesBuffer = gl.createBuffer();
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, this.vertices.subarray(0, this.verticesLength), gl.DYNAMIC_DRAW);
          this.dirtyVertices = false;
        }
        if (this.dirtyIndices) {
          if (!this.indicesBuffer) {
            this.indicesBuffer = gl.createBuffer();
          }
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices.subarray(0, this.indicesLength), gl.DYNAMIC_DRAW);
          this.dirtyIndices = false;
        }
      }
      restore() {
        this.verticesBuffer = null;
        this.indicesBuffer = null;
        this.update();
      }
      dispose() {
        this.context.removeRestorable(this);
        let gl = this.context.gl;
        gl.deleteBuffer(this.verticesBuffer);
        gl.deleteBuffer(this.indicesBuffer);
      }
    }
    webgl2.Mesh = Mesh;
    class VertexAttribute {
      constructor(name, type, numElements) {
        __publicField(this, "name", name);
        __publicField(this, "type", type);
        __publicField(this, "numElements", numElements);
      }
    }
    webgl2.VertexAttribute = VertexAttribute;
    class Position2Attribute extends VertexAttribute {
      constructor() {
        super(webgl2.Shader.POSITION, 0 /* Float */, 2);
      }
    }
    webgl2.Position2Attribute = Position2Attribute;
    class Position3Attribute extends VertexAttribute {
      constructor() {
        super(webgl2.Shader.POSITION, 0 /* Float */, 3);
      }
    }
    webgl2.Position3Attribute = Position3Attribute;
    class TexCoordAttribute extends VertexAttribute {
      constructor(unit = 0) {
        super(webgl2.Shader.TEXCOORDS + (unit == 0 ? "" : unit), 0 /* Float */, 2);
      }
    }
    webgl2.TexCoordAttribute = TexCoordAttribute;
    class ColorAttribute extends VertexAttribute {
      constructor() {
        super(webgl2.Shader.COLOR, 0 /* Float */, 4);
      }
    }
    webgl2.ColorAttribute = ColorAttribute;
    class Color2Attribute extends VertexAttribute {
      constructor() {
        super(webgl2.Shader.COLOR2, 0 /* Float */, 4);
      }
    }
    webgl2.Color2Attribute = Color2Attribute;
    let VertexAttributeType;
    ((VertexAttributeType2) => {
      VertexAttributeType2[VertexAttributeType2["Float"] = 0] = "Float";
    })(VertexAttributeType = webgl2.VertexAttributeType || (webgl2.VertexAttributeType = {}));
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class PolygonBatcher {
      constructor(context, twoColorTint = true, maxVertices = 10920) {
        __publicField(this, "context");
        __publicField(this, "drawCalls");
        __publicField(this, "isDrawing", false);
        __publicField(this, "mesh");
        __publicField(this, "shader", null);
        __publicField(this, "lastTexture", null);
        __publicField(this, "verticesLength", 0);
        __publicField(this, "indicesLength", 0);
        __publicField(this, "srcBlend");
        __publicField(this, "dstBlend");
        if (maxVertices > 10920) throw new Error("Can't have more than 10920 triangles per batch: " + maxVertices);
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
        let attributes = twoColorTint ? [new webgl2.Position2Attribute(), new webgl2.ColorAttribute(), new webgl2.TexCoordAttribute(), new webgl2.Color2Attribute()] : [new webgl2.Position2Attribute(), new webgl2.ColorAttribute(), new webgl2.TexCoordAttribute()];
        this.mesh = new webgl2.Mesh(context, attributes, maxVertices, maxVertices * 3);
        this.srcBlend = this.context.gl.SRC_ALPHA;
        this.dstBlend = this.context.gl.ONE_MINUS_SRC_ALPHA;
      }
      begin(shader) {
        let gl = this.context.gl;
        if (this.isDrawing) throw new Error("PolygonBatch is already drawing. Call PolygonBatch.end() before calling PolygonBatch.begin()");
        this.drawCalls = 0;
        this.shader = shader;
        this.lastTexture = null;
        this.isDrawing = true;
        gl.enable(gl.BLEND);
        gl.blendFunc(this.srcBlend, this.dstBlend);
      }
      setBlendMode(srcBlend, dstBlend) {
        let gl = this.context.gl;
        this.srcBlend = srcBlend;
        this.dstBlend = dstBlend;
        if (this.isDrawing) {
          this.flush();
          gl.blendFunc(this.srcBlend, this.dstBlend);
        }
      }
      draw(texture, vertices, indices) {
        if (texture != this.lastTexture) {
          this.flush();
          this.lastTexture = texture;
        } else if (this.verticesLength + vertices.length > this.mesh.getVertices().length || this.indicesLength + indices.length > this.mesh.getIndices().length) {
          this.flush();
        }
        let indexStart = this.mesh.numVertices();
        this.mesh.getVertices().set(vertices, this.verticesLength);
        this.verticesLength += vertices.length;
        this.mesh.setVerticesLength(this.verticesLength);
        let indicesArray = this.mesh.getIndices();
        for (let i = this.indicesLength, j = 0; j < indices.length; i++, j++)
          indicesArray[i] = indices[j] + indexStart;
        this.indicesLength += indices.length;
        this.mesh.setIndicesLength(this.indicesLength);
      }
      flush() {
        let gl = this.context.gl;
        if (this.verticesLength == 0) return;
        this.lastTexture.bind();
        this.mesh.draw(this.shader, gl.TRIANGLES);
        this.verticesLength = 0;
        this.indicesLength = 0;
        this.mesh.setVerticesLength(0);
        this.mesh.setIndicesLength(0);
        this.drawCalls++;
      }
      end() {
        let gl = this.context.gl;
        if (!this.isDrawing) throw new Error("PolygonBatch is not drawing. Call PolygonBatch.begin() before calling PolygonBatch.end()");
        if (this.verticesLength > 0 || this.indicesLength > 0) this.flush();
        this.shader = null;
        this.lastTexture = null;
        this.isDrawing = false;
        gl.disable(gl.BLEND);
      }
      getDrawCalls() {
        return this.drawCalls;
      }
      dispose() {
        this.mesh.dispose();
      }
    }
    webgl2.PolygonBatcher = PolygonBatcher;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class SceneRenderer {
      constructor(canvas, context, twoColorTint = true) {
        __publicField(this, "context");
        __publicField(this, "canvas");
        __publicField(this, "camera");
        __publicField(this, "batcher");
        __publicField(this, "twoColorTint", false);
        __publicField(this, "batcherShader");
        __publicField(this, "shapes");
        __publicField(this, "shapesShader");
        __publicField(this, "activeRenderer", null);
        __publicField(this, "skeletonRenderer");
        __publicField(this, "skeletonDebugRenderer");
        __publicField(this, "QUAD", [
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0
        ]);
        __publicField(this, "QUAD_TRIANGLES", [0, 1, 2, 2, 3, 0]);
        __publicField(this, "WHITE", new spine2.Color(1, 1, 1, 1));
        this.canvas = canvas;
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
        this.twoColorTint = twoColorTint;
        this.camera = new webgl2.OrthoCamera(canvas.width, canvas.height);
        this.batcherShader = twoColorTint ? webgl2.Shader.newTwoColoredTextured(this.context) : webgl2.Shader.newColoredTextured(this.context);
        this.batcher = new webgl2.PolygonBatcher(this.context, twoColorTint);
        this.shapesShader = webgl2.Shader.newColored(this.context);
        this.shapes = new webgl2.ShapeRenderer(this.context);
        this.skeletonRenderer = new webgl2.SkeletonRenderer(this.context, twoColorTint);
        this.skeletonDebugRenderer = new webgl2.SkeletonDebugRenderer(this.context);
      }
      begin() {
        this.camera.update();
        this.enableRenderer(this.batcher);
      }
      drawSkeleton(skeleton, premultipliedAlpha = false, slotRangeStart = -1, slotRangeEnd = -1) {
        this.enableRenderer(this.batcher);
        this.skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
        this.skeletonRenderer.draw(this.batcher, skeleton, slotRangeStart, slotRangeEnd);
      }
      drawSkeletonDebug(skeleton, premultipliedAlpha = false, ignoredBones = null) {
        this.enableRenderer(this.shapes);
        this.skeletonDebugRenderer.premultipliedAlpha = premultipliedAlpha;
        this.skeletonDebugRenderer.draw(this.shapes, skeleton, ignoredBones);
      }
      drawTexture(texture, x, y, width, height, color = null) {
        this.enableRenderer(this.batcher);
        if (color === null) color = this.WHITE;
        let quad = this.QUAD;
        var i = 0;
        quad[i++] = x;
        quad[i++] = y;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 0;
        quad[i++] = 1;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x + width;
        quad[i++] = y;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 1;
        quad[i++] = 1;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x + width;
        quad[i++] = y + height;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 1;
        quad[i++] = 0;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x;
        quad[i++] = y + height;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 0;
        quad[i++] = 0;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        this.batcher.draw(texture, quad, this.QUAD_TRIANGLES);
      }
      drawTextureUV(texture, x, y, width, height, u, v, u2, v2, color = null) {
        this.enableRenderer(this.batcher);
        if (color === null) color = this.WHITE;
        let quad = this.QUAD;
        var i = 0;
        quad[i++] = x;
        quad[i++] = y;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = u;
        quad[i++] = v;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x + width;
        quad[i++] = y;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = u2;
        quad[i++] = v;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x + width;
        quad[i++] = y + height;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = u2;
        quad[i++] = v2;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x;
        quad[i++] = y + height;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = u;
        quad[i++] = v2;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        this.batcher.draw(texture, quad, this.QUAD_TRIANGLES);
      }
      drawTextureRotated(texture, x, y, width, height, pivotX, pivotY, angle, color = null, premultipliedAlpha = false) {
        this.enableRenderer(this.batcher);
        if (color === null) color = this.WHITE;
        let quad = this.QUAD;
        let worldOriginX = x + pivotX;
        let worldOriginY = y + pivotY;
        let fx = -pivotX;
        let fy = -pivotY;
        let fx2 = width - pivotX;
        let fy2 = height - pivotY;
        let p1x = fx;
        let p1y = fy;
        let p2x = fx;
        let p2y = fy2;
        let p3x = fx2;
        let p3y = fy2;
        let p4x = fx2;
        let p4y = fy;
        let x1 = 0;
        let y1 = 0;
        let x2 = 0;
        let y2 = 0;
        let x3 = 0;
        let y3 = 0;
        let x4 = 0;
        let y4 = 0;
        if (angle != 0) {
          let cos = spine2.MathUtils.cosDeg(angle);
          let sin = spine2.MathUtils.sinDeg(angle);
          x1 = cos * p1x - sin * p1y;
          y1 = sin * p1x + cos * p1y;
          x4 = cos * p2x - sin * p2y;
          y4 = sin * p2x + cos * p2y;
          x3 = cos * p3x - sin * p3y;
          y3 = sin * p3x + cos * p3y;
          x2 = x3 + (x1 - x4);
          y2 = y3 + (y1 - y4);
        } else {
          x1 = p1x;
          y1 = p1y;
          x4 = p2x;
          y4 = p2y;
          x3 = p3x;
          y3 = p3y;
          x2 = p4x;
          y2 = p4y;
        }
        x1 += worldOriginX;
        y1 += worldOriginY;
        x2 += worldOriginX;
        y2 += worldOriginY;
        x3 += worldOriginX;
        y3 += worldOriginY;
        x4 += worldOriginX;
        y4 += worldOriginY;
        var i = 0;
        quad[i++] = x1;
        quad[i++] = y1;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 0;
        quad[i++] = 1;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x2;
        quad[i++] = y2;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 1;
        quad[i++] = 1;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x3;
        quad[i++] = y3;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 1;
        quad[i++] = 0;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x4;
        quad[i++] = y4;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = 0;
        quad[i++] = 0;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        this.batcher.draw(texture, quad, this.QUAD_TRIANGLES);
      }
      drawRegion(region, x, y, width, height, color = null, premultipliedAlpha = false) {
        this.enableRenderer(this.batcher);
        if (color === null) color = this.WHITE;
        let quad = this.QUAD;
        var i = 0;
        quad[i++] = x;
        quad[i++] = y;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = region.u;
        quad[i++] = region.v2;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x + width;
        quad[i++] = y;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = region.u2;
        quad[i++] = region.v2;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x + width;
        quad[i++] = y + height;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = region.u2;
        quad[i++] = region.v;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        quad[i++] = x;
        quad[i++] = y + height;
        quad[i++] = color.r;
        quad[i++] = color.g;
        quad[i++] = color.b;
        quad[i++] = color.a;
        quad[i++] = region.u;
        quad[i++] = region.v;
        if (this.twoColorTint) {
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
          quad[i++] = 0;
        }
        this.batcher.draw(region.texture, quad, this.QUAD_TRIANGLES);
      }
      line(x, y, x2, y2, color = null, color2 = null) {
        this.enableRenderer(this.shapes);
        this.shapes.line(x, y, x2, y2, color);
      }
      triangle(filled, x, y, x2, y2, x3, y3, color = null, color2 = null, color3 = null) {
        this.enableRenderer(this.shapes);
        this.shapes.triangle(filled, x, y, x2, y2, x3, y3, color, color2, color3);
      }
      quad(filled, x, y, x2, y2, x3, y3, x4, y4, color = null, color2 = null, color3 = null, color4 = null) {
        this.enableRenderer(this.shapes);
        this.shapes.quad(filled, x, y, x2, y2, x3, y3, x4, y4, color, color2, color3, color4);
      }
      rect(filled, x, y, width, height, color = null) {
        this.enableRenderer(this.shapes);
        this.shapes.rect(filled, x, y, width, height, color);
      }
      rectLine(filled, x1, y1, x2, y2, width, color = null) {
        this.enableRenderer(this.shapes);
        this.shapes.rectLine(filled, x1, y1, x2, y2, width, color);
      }
      polygon(polygonVertices, offset, count, color = null) {
        this.enableRenderer(this.shapes);
        this.shapes.polygon(polygonVertices, offset, count, color);
      }
      circle(filled, x, y, radius, color = null, segments = 0) {
        this.enableRenderer(this.shapes);
        this.shapes.circle(filled, x, y, radius, color, segments);
      }
      curve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, segments, color = null) {
        this.enableRenderer(this.shapes);
        this.shapes.curve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, segments, color);
      }
      end() {
        if (this.activeRenderer === this.batcher) this.batcher.end();
        else if (this.activeRenderer === this.shapes) this.shapes.end();
        this.activeRenderer = null;
      }
      resize(resizeMode) {
        let canvas = this.canvas;
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        if (canvas.width != w || canvas.height != h) {
          canvas.width = w;
          canvas.height = h;
        }
        this.context.gl.viewport(0, 0, canvas.width, canvas.height);
        if (resizeMode === 0 /* Stretch */) {
        } else if (resizeMode === 1 /* Expand */) {
          this.camera.setViewport(w, h);
        } else if (resizeMode === 2 /* Fit */) {
          let sourceWidth = canvas.width, sourceHeight = canvas.height;
          let targetWidth = this.camera.viewportWidth, targetHeight = this.camera.viewportHeight;
          let targetRatio = targetHeight / targetWidth;
          let sourceRatio = sourceHeight / sourceWidth;
          let scale = targetRatio < sourceRatio ? targetWidth / sourceWidth : targetHeight / sourceHeight;
          this.camera.viewportWidth = sourceWidth * scale;
          this.camera.viewportHeight = sourceHeight * scale;
        }
        this.camera.update();
      }
      enableRenderer(renderer) {
        if (this.activeRenderer === renderer) return;
        this.end();
        if (renderer instanceof webgl2.PolygonBatcher) {
          this.batcherShader.bind();
          this.batcherShader.setUniform4x4f(webgl2.Shader.MVP_MATRIX, this.camera.projectionView.values);
          this.batcherShader.setUniformi("u_texture", 0);
          this.batcher.begin(this.batcherShader);
          this.activeRenderer = this.batcher;
        } else if (renderer instanceof webgl2.ShapeRenderer) {
          this.shapesShader.bind();
          this.shapesShader.setUniform4x4f(webgl2.Shader.MVP_MATRIX, this.camera.projectionView.values);
          this.shapes.begin(this.shapesShader);
          this.activeRenderer = this.shapes;
        } else {
          this.activeRenderer = this.skeletonDebugRenderer;
        }
      }
      dispose() {
        this.batcher.dispose();
        this.batcherShader.dispose();
        this.shapes.dispose();
        this.shapesShader.dispose();
        this.skeletonDebugRenderer.dispose();
      }
    }
    webgl2.SceneRenderer = SceneRenderer;
    let ResizeMode;
    ((ResizeMode2) => {
      ResizeMode2[ResizeMode2["Stretch"] = 0] = "Stretch";
      ResizeMode2[ResizeMode2["Expand"] = 1] = "Expand";
      ResizeMode2[ResizeMode2["Fit"] = 2] = "Fit";
    })(ResizeMode = webgl2.ResizeMode || (webgl2.ResizeMode = {}));
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    const _Shader = class _Shader {
      constructor(context, vertexShader, fragmentShader) {
        __publicField(this, "vertexShader", vertexShader);
        __publicField(this, "fragmentShader", fragmentShader);
        __publicField(this, "context");
        __publicField(this, "vs", null);
        __publicField(this, "vsSource");
        __publicField(this, "fs", null);
        __publicField(this, "fsSource");
        __publicField(this, "program", null);
        __publicField(this, "tmp2x2", new Float32Array(2 * 2));
        __publicField(this, "tmp3x3", new Float32Array(3 * 3));
        __publicField(this, "tmp4x4", new Float32Array(4 * 4));
        this.vsSource = vertexShader;
        this.fsSource = fragmentShader;
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
        this.context.addRestorable(this);
        this.compile();
      }
      getProgram() {
        return this.program;
      }
      getVertexShader() {
        return this.vertexShader;
      }
      getFragmentShader() {
        return this.fragmentShader;
      }
      getVertexShaderSource() {
        return this.vsSource;
      }
      getFragmentSource() {
        return this.fsSource;
      }
      compile() {
        let gl = this.context.gl;
        try {
          this.vs = this.compileShader(gl.VERTEX_SHADER, this.vertexShader);
          this.fs = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader);
          this.program = this.compileProgram(this.vs, this.fs);
        } catch (e) {
          this.dispose();
          throw e;
        }
      }
      compileShader(type, source) {
        let gl = this.context.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          let error = "Couldn't compile shader: " + gl.getShaderInfoLog(shader);
          gl.deleteShader(shader);
          if (!gl.isContextLost()) throw new Error(error);
        }
        return shader;
      }
      compileProgram(vs, fs) {
        let gl = this.context.gl;
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          let error = "Couldn't compile shader program: " + gl.getProgramInfoLog(program);
          gl.deleteProgram(program);
          if (!gl.isContextLost()) throw new Error(error);
        }
        return program;
      }
      restore() {
        this.compile();
      }
      bind() {
        this.context.gl.useProgram(this.program);
      }
      unbind() {
        this.context.gl.useProgram(null);
      }
      setUniformi(uniform, value) {
        this.context.gl.uniform1i(this.getUniformLocation(uniform), value);
      }
      setUniformf(uniform, value) {
        this.context.gl.uniform1f(this.getUniformLocation(uniform), value);
      }
      setUniform2f(uniform, value, value2) {
        this.context.gl.uniform2f(this.getUniformLocation(uniform), value, value2);
      }
      setUniform3f(uniform, value, value2, value3) {
        this.context.gl.uniform3f(this.getUniformLocation(uniform), value, value2, value3);
      }
      setUniform4f(uniform, value, value2, value3, value4) {
        this.context.gl.uniform4f(this.getUniformLocation(uniform), value, value2, value3, value4);
      }
      setUniform2x2f(uniform, value) {
        let gl = this.context.gl;
        this.tmp2x2.set(value);
        gl.uniformMatrix2fv(this.getUniformLocation(uniform), false, this.tmp2x2);
      }
      setUniform3x3f(uniform, value) {
        let gl = this.context.gl;
        this.tmp3x3.set(value);
        gl.uniformMatrix3fv(this.getUniformLocation(uniform), false, this.tmp3x3);
      }
      setUniform4x4f(uniform, value) {
        let gl = this.context.gl;
        this.tmp4x4.set(value);
        gl.uniformMatrix4fv(this.getUniformLocation(uniform), false, this.tmp4x4);
      }
      getUniformLocation(uniform) {
        let gl = this.context.gl;
        let location = gl.getUniformLocation(this.program, uniform);
        if (!location && !gl.isContextLost()) throw new Error(`Couldn't find location for uniform ${uniform}`);
        return location;
      }
      getAttributeLocation(attribute) {
        let gl = this.context.gl;
        let location = gl.getAttribLocation(this.program, attribute);
        if (location == -1 && !gl.isContextLost()) throw new Error(`Couldn't find location for attribute ${attribute}`);
        return location;
      }
      dispose() {
        this.context.removeRestorable(this);
        let gl = this.context.gl;
        if (this.vs) {
          gl.deleteShader(this.vs);
          this.vs = null;
        }
        if (this.fs) {
          gl.deleteShader(this.fs);
          this.fs = null;
        }
        if (this.program) {
          gl.deleteProgram(this.program);
          this.program = null;
        }
      }
      static newColoredTextured(context) {
        let vs = `
				attribute vec4 ${_Shader.POSITION};
				attribute vec4 ${_Shader.COLOR};
				attribute vec2 ${_Shader.TEXCOORDS};
				uniform mat4 ${_Shader.MVP_MATRIX};
				varying vec4 v_color;
				varying vec2 v_texCoords;

				void main () {
					v_color = ${_Shader.COLOR};
					v_texCoords = ${_Shader.TEXCOORDS};
					gl_Position = ${_Shader.MVP_MATRIX} * ${_Shader.POSITION};
				}
			`;
        let fs = `
				#ifdef GL_ES
					#define LOWP lowp
					precision mediump float;
				#else
					#define LOWP
				#endif
				varying LOWP vec4 v_color;
				varying vec2 v_texCoords;
				uniform sampler2D u_texture;

				void main () {
					gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
				}
			`;
        return new _Shader(context, vs, fs);
      }
      static newTwoColoredTextured(context) {
        let vs = `
				attribute vec4 ${_Shader.POSITION};
				attribute vec4 ${_Shader.COLOR};
				attribute vec4 ${_Shader.COLOR2};
				attribute vec2 ${_Shader.TEXCOORDS};
				uniform mat4 ${_Shader.MVP_MATRIX};
				varying vec4 v_light;
				varying vec4 v_dark;
				varying vec2 v_texCoords;

				void main () {
					v_light = ${_Shader.COLOR};
					v_dark = ${_Shader.COLOR2};
					v_texCoords = ${_Shader.TEXCOORDS};
					gl_Position = ${_Shader.MVP_MATRIX} * ${_Shader.POSITION};
				}
			`;
        let fs = `
				#ifdef GL_ES
					#define LOWP lowp
					precision mediump float;
				#else
					#define LOWP
				#endif
				varying LOWP vec4 v_light;
				varying LOWP vec4 v_dark;
				varying vec2 v_texCoords;
				uniform sampler2D u_texture;

				void main () {
					vec4 texColor = texture2D(u_texture, v_texCoords);
					gl_FragColor.a = texColor.a * v_light.a;
					gl_FragColor.rgb = ((texColor.a - 1.0) * v_dark.a + 1.0 - texColor.rgb) * v_dark.rgb + texColor.rgb * v_light.rgb;
				}
			`;
        return new _Shader(context, vs, fs);
      }
      static newColored(context) {
        let vs = `
				attribute vec4 ${_Shader.POSITION};
				attribute vec4 ${_Shader.COLOR};
				uniform mat4 ${_Shader.MVP_MATRIX};
				varying vec4 v_color;

				void main () {
					v_color = ${_Shader.COLOR};
					gl_Position = ${_Shader.MVP_MATRIX} * ${_Shader.POSITION};
				}
			`;
        let fs = `
				#ifdef GL_ES
					#define LOWP lowp
					precision mediump float;
				#else
					#define LOWP
				#endif
				varying LOWP vec4 v_color;

				void main () {
					gl_FragColor = v_color;
				}
			`;
        return new _Shader(context, vs, fs);
      }
    };
    __publicField(_Shader, "MVP_MATRIX", "u_projTrans");
    __publicField(_Shader, "POSITION", "a_position");
    __publicField(_Shader, "COLOR", "a_color");
    __publicField(_Shader, "COLOR2", "a_color2");
    __publicField(_Shader, "TEXCOORDS", "a_texCoords");
    __publicField(_Shader, "SAMPLER", "u_texture");
    let Shader = _Shader;
    webgl2.Shader = _Shader;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class ShapeRenderer {
      constructor(context, maxVertices = 10920) {
        __publicField(this, "context");
        __publicField(this, "isDrawing", false);
        __publicField(this, "mesh");
        __publicField(this, "shapeType", 4 /* Filled */);
        __publicField(this, "color", new spine2.Color(1, 1, 1, 1));
        __publicField(this, "shader");
        __publicField(this, "vertexIndex", 0);
        __publicField(this, "tmp", new spine2.Vector2());
        __publicField(this, "srcBlend");
        __publicField(this, "dstBlend");
        if (maxVertices > 10920) throw new Error("Can't have more than 10920 triangles per batch: " + maxVertices);
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
        this.mesh = new webgl2.Mesh(context, [new webgl2.Position2Attribute(), new webgl2.ColorAttribute()], maxVertices, 0);
        this.srcBlend = this.context.gl.SRC_ALPHA;
        this.dstBlend = this.context.gl.ONE_MINUS_SRC_ALPHA;
      }
      begin(shader) {
        if (this.isDrawing) throw new Error("ShapeRenderer.begin() has already been called");
        this.shader = shader;
        this.vertexIndex = 0;
        this.isDrawing = true;
        let gl = this.context.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(this.srcBlend, this.dstBlend);
      }
      setBlendMode(srcBlend, dstBlend) {
        let gl = this.context.gl;
        this.srcBlend = srcBlend;
        this.dstBlend = dstBlend;
        if (this.isDrawing) {
          this.flush();
          gl.blendFunc(this.srcBlend, this.dstBlend);
        }
      }
      setColor(color) {
        this.color.setFromColor(color);
      }
      setColorWith(r, g, b, a) {
        this.color.set(r, g, b, a);
      }
      point(x, y, color = null) {
        this.check(0 /* Point */, 1);
        if (color === null) color = this.color;
        this.vertex(x, y, color);
      }
      line(x, y, x2, y2, color = null) {
        this.check(1 /* Line */, 2);
        let vertices = this.mesh.getVertices();
        let idx = this.vertexIndex;
        if (color === null) color = this.color;
        this.vertex(x, y, color);
        this.vertex(x2, y2, color);
      }
      triangle(filled, x, y, x2, y2, x3, y3, color = null, color2 = null, color3 = null) {
        this.check(filled ? 4 /* Filled */ : 1 /* Line */, 3);
        let vertices = this.mesh.getVertices();
        let idx = this.vertexIndex;
        if (color === null) color = this.color;
        if (color2 === null) color2 = this.color;
        if (color3 === null) color3 = this.color;
        if (filled) {
          this.vertex(x, y, color);
          this.vertex(x2, y2, color2);
          this.vertex(x3, y3, color3);
        } else {
          this.vertex(x, y, color);
          this.vertex(x2, y2, color2);
          this.vertex(x2, y2, color);
          this.vertex(x3, y3, color2);
          this.vertex(x3, y3, color);
          this.vertex(x, y, color2);
        }
      }
      quad(filled, x, y, x2, y2, x3, y3, x4, y4, color = null, color2 = null, color3 = null, color4 = null) {
        this.check(filled ? 4 /* Filled */ : 1 /* Line */, 3);
        let vertices = this.mesh.getVertices();
        let idx = this.vertexIndex;
        if (color === null) color = this.color;
        if (color2 === null) color2 = this.color;
        if (color3 === null) color3 = this.color;
        if (color4 === null) color4 = this.color;
        if (filled) {
          this.vertex(x, y, color);
          this.vertex(x2, y2, color2);
          this.vertex(x3, y3, color3);
          this.vertex(x3, y3, color3);
          this.vertex(x4, y4, color4);
          this.vertex(x, y, color);
        } else {
          this.vertex(x, y, color);
          this.vertex(x2, y2, color2);
          this.vertex(x2, y2, color2);
          this.vertex(x3, y3, color3);
          this.vertex(x3, y3, color3);
          this.vertex(x4, y4, color4);
          this.vertex(x4, y4, color4);
          this.vertex(x, y, color);
        }
      }
      rect(filled, x, y, width, height, color = null) {
        this.quad(filled, x, y, x + width, y, x + width, y + height, x, y + height, color, color, color, color);
      }
      rectLine(filled, x1, y1, x2, y2, width, color = null) {
        this.check(filled ? 4 /* Filled */ : 1 /* Line */, 8);
        if (color === null) color = this.color;
        let t = this.tmp.set(y2 - y1, x1 - x2);
        t.normalize();
        width *= 0.5;
        let tx = t.x * width;
        let ty = t.y * width;
        if (!filled) {
          this.vertex(x1 + tx, y1 + ty, color);
          this.vertex(x1 - tx, y1 - ty, color);
          this.vertex(x2 + tx, y2 + ty, color);
          this.vertex(x2 - tx, y2 - ty, color);
          this.vertex(x2 + tx, y2 + ty, color);
          this.vertex(x1 + tx, y1 + ty, color);
          this.vertex(x2 - tx, y2 - ty, color);
          this.vertex(x1 - tx, y1 - ty, color);
        } else {
          this.vertex(x1 + tx, y1 + ty, color);
          this.vertex(x1 - tx, y1 - ty, color);
          this.vertex(x2 + tx, y2 + ty, color);
          this.vertex(x2 - tx, y2 - ty, color);
          this.vertex(x2 + tx, y2 + ty, color);
          this.vertex(x1 - tx, y1 - ty, color);
        }
      }
      x(x, y, size) {
        this.line(x - size, y - size, x + size, y + size);
        this.line(x - size, y + size, x + size, y - size);
      }
      polygon(polygonVertices, offset, count, color = null) {
        if (count < 3) throw new Error("Polygon must contain at least 3 vertices");
        this.check(1 /* Line */, count * 2);
        if (color === null) color = this.color;
        let vertices = this.mesh.getVertices();
        let idx = this.vertexIndex;
        offset <<= 1;
        count <<= 1;
        let firstX = polygonVertices[offset];
        let firstY = polygonVertices[offset + 1];
        let last = offset + count;
        for (let i = offset, n = offset + count - 2; i < n; i += 2) {
          let x1 = polygonVertices[i];
          let y1 = polygonVertices[i + 1];
          let x2 = 0;
          let y2 = 0;
          if (i + 2 >= last) {
            x2 = firstX;
            y2 = firstY;
          } else {
            x2 = polygonVertices[i + 2];
            y2 = polygonVertices[i + 3];
          }
          this.vertex(x1, y1, color);
          this.vertex(x2, y2, color);
        }
      }
      circle(filled, x, y, radius, color = null, segments = 0) {
        if (segments === 0) segments = Math.max(1, 6 * spine2.MathUtils.cbrt(radius) | 0);
        if (segments <= 0) throw new Error("segments must be > 0.");
        if (color === null) color = this.color;
        let angle = 2 * spine2.MathUtils.PI / segments;
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let cx = radius, cy = 0;
        if (!filled) {
          this.check(1 /* Line */, segments * 2 + 2);
          for (let i = 0; i < segments; i++) {
            this.vertex(x + cx, y + cy, color);
            let temp2 = cx;
            cx = cos * cx - sin * cy;
            cy = sin * temp2 + cos * cy;
            this.vertex(x + cx, y + cy, color);
          }
          this.vertex(x + cx, y + cy, color);
        } else {
          this.check(4 /* Filled */, segments * 3 + 3);
          segments--;
          for (let i = 0; i < segments; i++) {
            this.vertex(x, y, color);
            this.vertex(x + cx, y + cy, color);
            let temp2 = cx;
            cx = cos * cx - sin * cy;
            cy = sin * temp2 + cos * cy;
            this.vertex(x + cx, y + cy, color);
          }
          this.vertex(x, y, color);
          this.vertex(x + cx, y + cy, color);
        }
        let temp = cx;
        cx = radius;
        cy = 0;
        this.vertex(x + cx, y + cy, color);
      }
      curve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, segments, color = null) {
        this.check(1 /* Line */, segments * 2 + 2);
        if (color === null) color = this.color;
        let subdiv_step = 1 / segments;
        let subdiv_step2 = subdiv_step * subdiv_step;
        let subdiv_step3 = subdiv_step * subdiv_step * subdiv_step;
        let pre1 = 3 * subdiv_step;
        let pre2 = 3 * subdiv_step2;
        let pre4 = 6 * subdiv_step2;
        let pre5 = 6 * subdiv_step3;
        let tmp1x = x1 - cx1 * 2 + cx2;
        let tmp1y = y1 - cy1 * 2 + cy2;
        let tmp2x = (cx1 - cx2) * 3 - x1 + x2;
        let tmp2y = (cy1 - cy2) * 3 - y1 + y2;
        let fx = x1;
        let fy = y1;
        let dfx = (cx1 - x1) * pre1 + tmp1x * pre2 + tmp2x * subdiv_step3;
        let dfy = (cy1 - y1) * pre1 + tmp1y * pre2 + tmp2y * subdiv_step3;
        let ddfx = tmp1x * pre4 + tmp2x * pre5;
        let ddfy = tmp1y * pre4 + tmp2y * pre5;
        let dddfx = tmp2x * pre5;
        let dddfy = tmp2y * pre5;
        while (segments-- > 0) {
          this.vertex(fx, fy, color);
          fx += dfx;
          fy += dfy;
          dfx += ddfx;
          dfy += ddfy;
          ddfx += dddfx;
          ddfy += dddfy;
          this.vertex(fx, fy, color);
        }
        this.vertex(fx, fy, color);
        this.vertex(x2, y2, color);
      }
      vertex(x, y, color) {
        let idx = this.vertexIndex;
        let vertices = this.mesh.getVertices();
        vertices[idx++] = x;
        vertices[idx++] = y;
        vertices[idx++] = color.r;
        vertices[idx++] = color.g;
        vertices[idx++] = color.b;
        vertices[idx++] = color.a;
        this.vertexIndex = idx;
      }
      end() {
        if (!this.isDrawing) throw new Error("ShapeRenderer.begin() has not been called");
        this.flush();
        this.context.gl.disable(this.context.gl.BLEND);
        this.isDrawing = false;
      }
      flush() {
        if (this.vertexIndex == 0) return;
        this.mesh.setVerticesLength(this.vertexIndex);
        this.mesh.draw(this.shader, this.shapeType);
        this.vertexIndex = 0;
      }
      check(shapeType, numVertices) {
        if (!this.isDrawing) throw new Error("ShapeRenderer.begin() has not been called");
        if (this.shapeType == shapeType) {
          if (this.mesh.maxVertices() - this.mesh.numVertices() < numVertices) this.flush();
          else return;
        } else {
          this.flush();
          this.shapeType = shapeType;
        }
      }
      dispose() {
        this.mesh.dispose();
      }
    }
    webgl2.ShapeRenderer = ShapeRenderer;
    let ShapeType;
    ((ShapeType2) => {
      ShapeType2[ShapeType2["Point"] = 0] = "Point";
      ShapeType2[ShapeType2["Line"] = 1] = "Line";
      ShapeType2[ShapeType2["Filled"] = 4] = "Filled";
    })(ShapeType = webgl2.ShapeType || (webgl2.ShapeType = {}));
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    const _SkeletonDebugRenderer = class _SkeletonDebugRenderer {
      constructor(context) {
        __publicField(this, "boneLineColor", new spine2.Color(1, 0, 0, 1));
        __publicField(this, "boneOriginColor", new spine2.Color(0, 1, 0, 1));
        __publicField(this, "attachmentLineColor", new spine2.Color(0, 0, 1, 0.5));
        __publicField(this, "triangleLineColor", new spine2.Color(1, 0.64, 0, 0.5));
        __publicField(this, "pathColor", new spine2.Color().setFromString("FF7F00"));
        __publicField(this, "clipColor", new spine2.Color(0.8, 0, 0, 2));
        __publicField(this, "aabbColor", new spine2.Color(0, 1, 0, 0.5));
        __publicField(this, "drawBones", true);
        __publicField(this, "drawRegionAttachments", true);
        __publicField(this, "drawBoundingBoxes", true);
        __publicField(this, "drawMeshHull", true);
        __publicField(this, "drawMeshTriangles", true);
        __publicField(this, "drawPaths", true);
        __publicField(this, "drawSkeletonXY", false);
        __publicField(this, "drawClipping", true);
        __publicField(this, "premultipliedAlpha", false);
        __publicField(this, "scale", 1);
        __publicField(this, "boneWidth", 2);
        __publicField(this, "context");
        __publicField(this, "bounds", new spine2.SkeletonBounds());
        __publicField(this, "temp", new Array());
        __publicField(this, "vertices", spine2.Utils.newFloatArray(2 * 1024));
        this.context = context instanceof webgl2.ManagedWebGLRenderingContext ? context : new webgl2.ManagedWebGLRenderingContext(context);
      }
      draw(shapes, skeleton, ignoredBones = null) {
        let skeletonX = skeleton.x;
        let skeletonY = skeleton.y;
        let gl = this.context.gl;
        let srcFunc = this.premultipliedAlpha ? gl.ONE : gl.SRC_ALPHA;
        shapes.setBlendMode(srcFunc, gl.ONE_MINUS_SRC_ALPHA);
        let bones = skeleton.bones;
        if (this.drawBones) {
          shapes.setColor(this.boneLineColor);
          for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            if (ignoredBones && ignoredBones.indexOf(bone.data.name) > -1) continue;
            if (bone.parent == null) continue;
            let x = skeletonX + bone.data.length * bone.a + bone.worldX;
            let y = skeletonY + bone.data.length * bone.c + bone.worldY;
            shapes.rectLine(true, skeletonX + bone.worldX, skeletonY + bone.worldY, x, y, this.boneWidth * this.scale);
          }
          if (this.drawSkeletonXY) shapes.x(skeletonX, skeletonY, 4 * this.scale);
        }
        if (this.drawRegionAttachments) {
          shapes.setColor(this.attachmentLineColor);
          let slots = skeleton.slots;
          for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            let attachment = slot.getAttachment();
            if (attachment instanceof spine2.RegionAttachment) {
              let regionAttachment = attachment;
              let vertices = this.vertices;
              regionAttachment.computeWorldVertices(slot.bone, vertices, 0, 2);
              shapes.line(vertices[0], vertices[1], vertices[2], vertices[3]);
              shapes.line(vertices[2], vertices[3], vertices[4], vertices[5]);
              shapes.line(vertices[4], vertices[5], vertices[6], vertices[7]);
              shapes.line(vertices[6], vertices[7], vertices[0], vertices[1]);
            }
          }
        }
        if (this.drawMeshHull || this.drawMeshTriangles) {
          let slots = skeleton.slots;
          for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            if (!slot.bone.active) continue;
            let attachment = slot.getAttachment();
            if (!(attachment instanceof spine2.MeshAttachment)) continue;
            let mesh = attachment;
            let vertices = this.vertices;
            mesh.computeWorldVertices(slot, 0, mesh.worldVerticesLength, vertices, 0, 2);
            let triangles = mesh.triangles;
            let hullLength = mesh.hullLength;
            if (this.drawMeshTriangles) {
              shapes.setColor(this.triangleLineColor);
              for (let ii = 0, nn = triangles.length; ii < nn; ii += 3) {
                let v1 = triangles[ii] * 2, v2 = triangles[ii + 1] * 2, v3 = triangles[ii + 2] * 2;
                shapes.triangle(
                  false,
                  vertices[v1],
                  vertices[v1 + 1],
                  //
                  vertices[v2],
                  vertices[v2 + 1],
                  //
                  vertices[v3],
                  vertices[v3 + 1]
                  //
                );
              }
            }
            if (this.drawMeshHull && hullLength > 0) {
              shapes.setColor(this.attachmentLineColor);
              hullLength = (hullLength >> 1) * 2;
              let lastX = vertices[hullLength - 2], lastY = vertices[hullLength - 1];
              for (let ii = 0, nn = hullLength; ii < nn; ii += 2) {
                let x = vertices[ii], y = vertices[ii + 1];
                shapes.line(x, y, lastX, lastY);
                lastX = x;
                lastY = y;
              }
            }
          }
        }
        if (this.drawBoundingBoxes) {
          let bounds = this.bounds;
          bounds.update(skeleton, true);
          shapes.setColor(this.aabbColor);
          shapes.rect(false, bounds.minX, bounds.minY, bounds.getWidth(), bounds.getHeight());
          let polygons = bounds.polygons;
          let boxes = bounds.boundingBoxes;
          for (let i = 0, n = polygons.length; i < n; i++) {
            let polygon = polygons[i];
            shapes.setColor(boxes[i].color);
            shapes.polygon(polygon, 0, polygon.length);
          }
        }
        if (this.drawPaths) {
          let slots = skeleton.slots;
          for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            if (!slot.bone.active) continue;
            let attachment = slot.getAttachment();
            if (!(attachment instanceof spine2.PathAttachment)) continue;
            let path = attachment;
            let nn = path.worldVerticesLength;
            let world = this.temp = spine2.Utils.setArraySize(this.temp, nn, 0);
            path.computeWorldVertices(slot, 0, nn, world, 0, 2);
            let color = this.pathColor;
            let x1 = world[2], y1 = world[3], x2 = 0, y2 = 0;
            if (path.closed) {
              shapes.setColor(color);
              let cx1 = world[0], cy1 = world[1], cx2 = world[nn - 2], cy2 = world[nn - 1];
              x2 = world[nn - 4];
              y2 = world[nn - 3];
              shapes.curve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, 32);
              shapes.setColor(_SkeletonDebugRenderer.LIGHT_GRAY);
              shapes.line(x1, y1, cx1, cy1);
              shapes.line(x2, y2, cx2, cy2);
            }
            nn -= 4;
            for (let ii = 4; ii < nn; ii += 6) {
              let cx1 = world[ii], cy1 = world[ii + 1], cx2 = world[ii + 2], cy2 = world[ii + 3];
              x2 = world[ii + 4];
              y2 = world[ii + 5];
              shapes.setColor(color);
              shapes.curve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, 32);
              shapes.setColor(_SkeletonDebugRenderer.LIGHT_GRAY);
              shapes.line(x1, y1, cx1, cy1);
              shapes.line(x2, y2, cx2, cy2);
              x1 = x2;
              y1 = y2;
            }
          }
        }
        if (this.drawBones) {
          shapes.setColor(this.boneOriginColor);
          for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            if (ignoredBones && ignoredBones.indexOf(bone.data.name) > -1) continue;
            shapes.circle(true, skeletonX + bone.worldX, skeletonY + bone.worldY, 3 * this.scale, _SkeletonDebugRenderer.GREEN, 8);
          }
        }
        if (this.drawClipping) {
          let slots = skeleton.slots;
          shapes.setColor(this.clipColor);
          for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            if (!slot.bone.active) continue;
            let attachment = slot.getAttachment();
            if (!(attachment instanceof spine2.ClippingAttachment)) continue;
            let clip = attachment;
            let nn = clip.worldVerticesLength;
            let world = this.temp = spine2.Utils.setArraySize(this.temp, nn, 0);
            clip.computeWorldVertices(slot, 0, nn, world, 0, 2);
            for (let i2 = 0, n2 = world.length; i2 < n2; i2 += 2) {
              let x = world[i2];
              let y = world[i2 + 1];
              let x2 = world[(i2 + 2) % world.length];
              let y2 = world[(i2 + 3) % world.length];
              shapes.line(x, y, x2, y2);
            }
          }
        }
      }
      dispose() {
      }
    };
    __publicField(_SkeletonDebugRenderer, "LIGHT_GRAY", new spine2.Color(192 / 255, 192 / 255, 192 / 255, 1));
    __publicField(_SkeletonDebugRenderer, "GREEN", new spine2.Color(0, 1, 0, 1));
    let SkeletonDebugRenderer = _SkeletonDebugRenderer;
    webgl2.SkeletonDebugRenderer = _SkeletonDebugRenderer;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class Renderable {
      constructor(vertices, numVertices, numFloats) {
        __publicField(this, "vertices", vertices);
        __publicField(this, "numVertices", numVertices);
        __publicField(this, "numFloats", numFloats);
      }
    }
    ;
    const _SkeletonRenderer = class _SkeletonRenderer {
      constructor(context, twoColorTint = true) {
        __publicField(this, "premultipliedAlpha", false);
        __publicField(this, "vertexEffect", null);
        __publicField(this, "tempColor", new spine2.Color());
        __publicField(this, "tempColor2", new spine2.Color());
        __publicField(this, "vertices");
        __publicField(this, "vertexSize", 2 + 2 + 4);
        __publicField(this, "twoColorTint", false);
        __publicField(this, "renderable", new Renderable(null, 0, 0));
        __publicField(this, "clipper", new spine2.SkeletonClipping());
        __publicField(this, "temp", new spine2.Vector2());
        __publicField(this, "temp2", new spine2.Vector2());
        __publicField(this, "temp3", new spine2.Color());
        __publicField(this, "temp4", new spine2.Color());
        this.twoColorTint = twoColorTint;
        if (twoColorTint)
          this.vertexSize += 4;
        this.vertices = spine2.Utils.newFloatArray(this.vertexSize * 1024);
      }
      draw(batcher, skeleton, slotRangeStart = -1, slotRangeEnd = -1) {
        let clipper = this.clipper;
        let premultipliedAlpha = this.premultipliedAlpha;
        let twoColorTint = this.twoColorTint;
        let blendMode = null;
        let tempPos = this.temp;
        let tempUv = this.temp2;
        let tempLight = this.temp3;
        let tempDark = this.temp4;
        let renderable = this.renderable;
        let uvs = null;
        let triangles = null;
        let drawOrder = skeleton.drawOrder;
        let attachmentColor = null;
        let skeletonColor = skeleton.color;
        let vertexSize = twoColorTint ? 12 : 8;
        let inRange = false;
        if (slotRangeStart == -1) inRange = true;
        for (let i = 0, n = drawOrder.length; i < n; i++) {
          let clippedVertexSize = clipper.isClipping() ? 2 : vertexSize;
          let slot = drawOrder[i];
          if (!slot.bone.active) {
            clipper.clipEndWithSlot(slot);
            continue;
          }
          if (slotRangeStart >= 0 && slotRangeStart == slot.data.index) {
            inRange = true;
          }
          if (!inRange) {
            clipper.clipEndWithSlot(slot);
            continue;
          }
          if (slotRangeEnd >= 0 && slotRangeEnd == slot.data.index) {
            inRange = false;
          }
          let attachment = slot.getAttachment();
          let texture = null;
          if (attachment instanceof spine2.RegionAttachment) {
            let region = attachment;
            renderable.vertices = this.vertices;
            renderable.numVertices = 4;
            renderable.numFloats = clippedVertexSize << 2;
            region.computeWorldVertices(slot.bone, renderable.vertices, 0, clippedVertexSize);
            triangles = _SkeletonRenderer.QUAD_TRIANGLES;
            uvs = region.uvs;
            texture = region.region.renderObject.texture;
            attachmentColor = region.color;
          } else if (attachment instanceof spine2.MeshAttachment) {
            let mesh = attachment;
            renderable.vertices = this.vertices;
            renderable.numVertices = mesh.worldVerticesLength >> 1;
            renderable.numFloats = renderable.numVertices * clippedVertexSize;
            if (renderable.numFloats > renderable.vertices.length) {
              renderable.vertices = this.vertices = spine2.Utils.newFloatArray(renderable.numFloats);
            }
            mesh.computeWorldVertices(slot, 0, mesh.worldVerticesLength, renderable.vertices, 0, clippedVertexSize);
            triangles = mesh.triangles;
            texture = mesh.region.renderObject.texture;
            uvs = mesh.uvs;
            attachmentColor = mesh.color;
          } else if (attachment instanceof spine2.ClippingAttachment) {
            let clip = attachment;
            clipper.clipStart(slot, clip);
            continue;
          } else {
            clipper.clipEndWithSlot(slot);
            continue;
          }
          if (texture != null) {
            let slotColor = slot.color;
            let finalColor = this.tempColor;
            finalColor.r = skeletonColor.r * slotColor.r * attachmentColor.r;
            finalColor.g = skeletonColor.g * slotColor.g * attachmentColor.g;
            finalColor.b = skeletonColor.b * slotColor.b * attachmentColor.b;
            finalColor.a = skeletonColor.a * slotColor.a * attachmentColor.a;
            if (premultipliedAlpha) {
              finalColor.r *= finalColor.a;
              finalColor.g *= finalColor.a;
              finalColor.b *= finalColor.a;
            }
            let darkColor = this.tempColor2;
            if (slot.darkColor == null)
              darkColor.set(0, 0, 0, 1);
            else {
              if (premultipliedAlpha) {
                darkColor.r = slot.darkColor.r * finalColor.a;
                darkColor.g = slot.darkColor.g * finalColor.a;
                darkColor.b = slot.darkColor.b * finalColor.a;
              } else {
                darkColor.setFromColor(slot.darkColor);
              }
              darkColor.a = premultipliedAlpha ? 1 : 0;
            }
            let slotBlendMode = slot.data.blendMode;
            if (slotBlendMode != blendMode) {
              blendMode = slotBlendMode;
              batcher.setBlendMode(webgl2.WebGLBlendModeConverter.getSourceGLBlendMode(blendMode, premultipliedAlpha), webgl2.WebGLBlendModeConverter.getDestGLBlendMode(blendMode));
            }
            if (clipper.isClipping()) {
              clipper.clipTriangles(renderable.vertices, renderable.numFloats, triangles, triangles.length, uvs, finalColor, darkColor, twoColorTint);
              let clippedVertices = new Float32Array(clipper.clippedVertices);
              let clippedTriangles = clipper.clippedTriangles;
              if (this.vertexEffect != null) {
                let vertexEffect = this.vertexEffect;
                let verts = clippedVertices;
                if (!twoColorTint) {
                  for (let v = 0, n2 = clippedVertices.length; v < n2; v += vertexSize) {
                    tempPos.x = verts[v];
                    tempPos.y = verts[v + 1];
                    tempLight.set(verts[v + 2], verts[v + 3], verts[v + 4], verts[v + 5]);
                    tempUv.x = verts[v + 6];
                    tempUv.y = verts[v + 7];
                    tempDark.set(0, 0, 0, 0);
                    vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                    verts[v] = tempPos.x;
                    verts[v + 1] = tempPos.y;
                    verts[v + 2] = tempLight.r;
                    verts[v + 3] = tempLight.g;
                    verts[v + 4] = tempLight.b;
                    verts[v + 5] = tempLight.a;
                    verts[v + 6] = tempUv.x;
                    verts[v + 7] = tempUv.y;
                  }
                } else {
                  for (let v = 0, n2 = clippedVertices.length; v < n2; v += vertexSize) {
                    tempPos.x = verts[v];
                    tempPos.y = verts[v + 1];
                    tempLight.set(verts[v + 2], verts[v + 3], verts[v + 4], verts[v + 5]);
                    tempUv.x = verts[v + 6];
                    tempUv.y = verts[v + 7];
                    tempDark.set(verts[v + 8], verts[v + 9], verts[v + 10], verts[v + 11]);
                    vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                    verts[v] = tempPos.x;
                    verts[v + 1] = tempPos.y;
                    verts[v + 2] = tempLight.r;
                    verts[v + 3] = tempLight.g;
                    verts[v + 4] = tempLight.b;
                    verts[v + 5] = tempLight.a;
                    verts[v + 6] = tempUv.x;
                    verts[v + 7] = tempUv.y;
                    verts[v + 8] = tempDark.r;
                    verts[v + 9] = tempDark.g;
                    verts[v + 10] = tempDark.b;
                    verts[v + 11] = tempDark.a;
                  }
                }
              }
              batcher.draw(texture, clippedVertices, clippedTriangles);
            } else {
              let verts = renderable.vertices;
              if (this.vertexEffect != null) {
                let vertexEffect = this.vertexEffect;
                if (!twoColorTint) {
                  for (let v = 0, u = 0, n2 = renderable.numFloats; v < n2; v += vertexSize, u += 2) {
                    tempPos.x = verts[v];
                    tempPos.y = verts[v + 1];
                    tempUv.x = uvs[u];
                    tempUv.y = uvs[u + 1];
                    tempLight.setFromColor(finalColor);
                    tempDark.set(0, 0, 0, 0);
                    vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                    verts[v] = tempPos.x;
                    verts[v + 1] = tempPos.y;
                    verts[v + 2] = tempLight.r;
                    verts[v + 3] = tempLight.g;
                    verts[v + 4] = tempLight.b;
                    verts[v + 5] = tempLight.a;
                    verts[v + 6] = tempUv.x;
                    verts[v + 7] = tempUv.y;
                  }
                } else {
                  for (let v = 0, u = 0, n2 = renderable.numFloats; v < n2; v += vertexSize, u += 2) {
                    tempPos.x = verts[v];
                    tempPos.y = verts[v + 1];
                    tempUv.x = uvs[u];
                    tempUv.y = uvs[u + 1];
                    tempLight.setFromColor(finalColor);
                    tempDark.setFromColor(darkColor);
                    vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                    verts[v] = tempPos.x;
                    verts[v + 1] = tempPos.y;
                    verts[v + 2] = tempLight.r;
                    verts[v + 3] = tempLight.g;
                    verts[v + 4] = tempLight.b;
                    verts[v + 5] = tempLight.a;
                    verts[v + 6] = tempUv.x;
                    verts[v + 7] = tempUv.y;
                    verts[v + 8] = tempDark.r;
                    verts[v + 9] = tempDark.g;
                    verts[v + 10] = tempDark.b;
                    verts[v + 11] = tempDark.a;
                  }
                }
              } else {
                if (!twoColorTint) {
                  for (let v = 2, u = 0, n2 = renderable.numFloats; v < n2; v += vertexSize, u += 2) {
                    verts[v] = finalColor.r;
                    verts[v + 1] = finalColor.g;
                    verts[v + 2] = finalColor.b;
                    verts[v + 3] = finalColor.a;
                    verts[v + 4] = uvs[u];
                    verts[v + 5] = uvs[u + 1];
                  }
                } else {
                  for (let v = 2, u = 0, n2 = renderable.numFloats; v < n2; v += vertexSize, u += 2) {
                    verts[v] = finalColor.r;
                    verts[v + 1] = finalColor.g;
                    verts[v + 2] = finalColor.b;
                    verts[v + 3] = finalColor.a;
                    verts[v + 4] = uvs[u];
                    verts[v + 5] = uvs[u + 1];
                    verts[v + 6] = darkColor.r;
                    verts[v + 7] = darkColor.g;
                    verts[v + 8] = darkColor.b;
                    verts[v + 9] = darkColor.a;
                  }
                }
              }
              let view = renderable.vertices.subarray(0, renderable.numFloats);
              batcher.draw(texture, view, triangles);
            }
          }
          clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
      }
    };
    __publicField(_SkeletonRenderer, "QUAD_TRIANGLES", [0, 1, 2, 2, 3, 0]);
    let SkeletonRenderer = _SkeletonRenderer;
    webgl2.SkeletonRenderer = _SkeletonRenderer;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class Vector3 {
      constructor(x = 0, y = 0, z = 0) {
        __publicField(this, "x", 0);
        __publicField(this, "y", 0);
        __publicField(this, "z", 0);
        this.x = x;
        this.y = y;
        this.z = z;
      }
      setFrom(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
      }
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
      }
      add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
      }
      sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
      }
      scale(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
      }
      normalize() {
        let len = this.length();
        if (len == 0) return this;
        len = 1 / len;
        this.x *= len;
        this.y *= len;
        this.z *= len;
        return this;
      }
      cross(v) {
        return this.set(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
      }
      multiply(matrix) {
        let l_mat = matrix.values;
        return this.set(
          this.x * l_mat[webgl2.M00] + this.y * l_mat[webgl2.M01] + this.z * l_mat[webgl2.M02] + l_mat[webgl2.M03],
          this.x * l_mat[webgl2.M10] + this.y * l_mat[webgl2.M11] + this.z * l_mat[webgl2.M12] + l_mat[webgl2.M13],
          this.x * l_mat[webgl2.M20] + this.y * l_mat[webgl2.M21] + this.z * l_mat[webgl2.M22] + l_mat[webgl2.M23]
        );
      }
      project(matrix) {
        let l_mat = matrix.values;
        let l_w = 1 / (this.x * l_mat[webgl2.M30] + this.y * l_mat[webgl2.M31] + this.z * l_mat[webgl2.M32] + l_mat[webgl2.M33]);
        return this.set(
          (this.x * l_mat[webgl2.M00] + this.y * l_mat[webgl2.M01] + this.z * l_mat[webgl2.M02] + l_mat[webgl2.M03]) * l_w,
          (this.x * l_mat[webgl2.M10] + this.y * l_mat[webgl2.M11] + this.z * l_mat[webgl2.M12] + l_mat[webgl2.M13]) * l_w,
          (this.x * l_mat[webgl2.M20] + this.y * l_mat[webgl2.M21] + this.z * l_mat[webgl2.M22] + l_mat[webgl2.M23]) * l_w
        );
      }
      dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
      }
      length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      }
      distance(v) {
        let a = v.x - this.x;
        let b = v.y - this.y;
        let c = v.z - this.z;
        return Math.sqrt(a * a + b * b + c * c);
      }
    }
    webgl2.Vector3 = Vector3;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
((spine2) => {
  let webgl;
  ((webgl2) => {
    class ManagedWebGLRenderingContext {
      constructor(canvasOrContext, contextConfig = { alpha: "true" }) {
        __publicField(this, "canvas");
        __publicField(this, "gl");
        __publicField(this, "restorables", new Array());
        if (!(canvasOrContext instanceof WebGLRenderingContext || canvasOrContext instanceof WebGL2RenderingContext)) {
          this.setupCanvas(canvasOrContext, contextConfig);
        } else {
          this.gl = canvasOrContext;
          this.canvas = this.gl.canvas;
        }
      }
      setupCanvas(canvas, contextConfig) {
        this.gl = canvas.getContext("webgl2", contextConfig) || canvas.getContext("webgl", contextConfig);
        this.canvas = canvas;
        canvas.addEventListener("webglcontextlost", (e) => {
          let event = e;
          if (e) {
            e.preventDefault();
          }
        });
        canvas.addEventListener("webglcontextrestored", (e) => {
          for (let i = 0, n = this.restorables.length; i < n; i++) {
            this.restorables[i].restore();
          }
        });
      }
      addRestorable(restorable) {
        this.restorables.push(restorable);
      }
      removeRestorable(restorable) {
        let index = this.restorables.indexOf(restorable);
        if (index > -1) this.restorables.splice(index, 1);
      }
    }
    webgl2.ManagedWebGLRenderingContext = ManagedWebGLRenderingContext;
    const _WebGLBlendModeConverter = class _WebGLBlendModeConverter {
      static getDestGLBlendMode(blendMode) {
        switch (blendMode) {
          case 0 /* Normal */:
            return _WebGLBlendModeConverter.ONE_MINUS_SRC_ALPHA;
          case 1 /* Additive */:
            return _WebGLBlendModeConverter.ONE;
          case 2 /* Multiply */:
            return _WebGLBlendModeConverter.ONE_MINUS_SRC_ALPHA;
          case 3 /* Screen */:
            return _WebGLBlendModeConverter.ONE_MINUS_SRC_ALPHA;
          default:
            throw new Error("Unknown blend mode: " + blendMode);
        }
      }
      static getSourceGLBlendMode(blendMode, premultipliedAlpha = false) {
        switch (blendMode) {
          case 0 /* Normal */:
            return premultipliedAlpha ? _WebGLBlendModeConverter.ONE : _WebGLBlendModeConverter.SRC_ALPHA;
          case 1 /* Additive */:
            return premultipliedAlpha ? _WebGLBlendModeConverter.ONE : _WebGLBlendModeConverter.SRC_ALPHA;
          case 2 /* Multiply */:
            return _WebGLBlendModeConverter.DST_COLOR;
          case 3 /* Screen */:
            return _WebGLBlendModeConverter.ONE;
          default:
            throw new Error("Unknown blend mode: " + blendMode);
        }
      }
    };
    __publicField(_WebGLBlendModeConverter, "ZERO", 0);
    __publicField(_WebGLBlendModeConverter, "ONE", 1);
    __publicField(_WebGLBlendModeConverter, "SRC_COLOR", 768);
    __publicField(_WebGLBlendModeConverter, "ONE_MINUS_SRC_COLOR", 769);
    __publicField(_WebGLBlendModeConverter, "SRC_ALPHA", 770);
    __publicField(_WebGLBlendModeConverter, "ONE_MINUS_SRC_ALPHA", 771);
    __publicField(_WebGLBlendModeConverter, "DST_ALPHA", 772);
    __publicField(_WebGLBlendModeConverter, "ONE_MINUS_DST_ALPHA", 773);
    __publicField(_WebGLBlendModeConverter, "DST_COLOR", 774);
    let WebGLBlendModeConverter = _WebGLBlendModeConverter;
    webgl2.WebGLBlendModeConverter = _WebGLBlendModeConverter;
  })(webgl = spine2.webgl || (spine2.webgl = {}));
})(spine || (spine = {}));
var spineNS = spine;
export {
  spineNS as spine
};
