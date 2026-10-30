// build/.concat-3.8.ts
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
    /** The animation's name, which is unique across all animations in the skeleton. */
    name;
    timelines;
    timelineIds;
    /** The duration of the animation in seconds, which is the highest time of all keys in the timeline. */
    duration;
    constructor(name, timelines, duration) {
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
  class CurveTimeline {
    static LINEAR = 0;
    static STEPPED = 1;
    static BEZIER = 2;
    static BEZIER_SIZE = 10 * 2 - 1;
    curves;
    constructor(frameCount) {
      if (frameCount <= 0) throw new Error("frameCount must be > 0: " + frameCount);
      this.curves = spine2.Utils.newFloatArray((frameCount - 1) * CurveTimeline.BEZIER_SIZE);
    }
    /** The number of key frames for this timeline. */
    getFrameCount() {
      return this.curves.length / CurveTimeline.BEZIER_SIZE + 1;
    }
    /** Sets the specified key frame to linear interpolation. */
    setLinear(frameIndex) {
      this.curves[frameIndex * CurveTimeline.BEZIER_SIZE] = CurveTimeline.LINEAR;
    }
    /** Sets the specified key frame to stepped interpolation. */
    setStepped(frameIndex) {
      this.curves[frameIndex * CurveTimeline.BEZIER_SIZE] = CurveTimeline.STEPPED;
    }
    /** Returns the interpolation type for the specified key frame.
     * @returns Linear is 0, stepped is 1, Bezier is 2. */
    getCurveType(frameIndex) {
      let index = frameIndex * CurveTimeline.BEZIER_SIZE;
      if (index == this.curves.length) return CurveTimeline.LINEAR;
      let type = this.curves[index];
      if (type == CurveTimeline.LINEAR) return CurveTimeline.LINEAR;
      if (type == CurveTimeline.STEPPED) return CurveTimeline.STEPPED;
      return CurveTimeline.BEZIER;
    }
    /** Sets the specified key frame to Bezier interpolation. `cx1` and `cx2` are from 0 to 1,
     * representing the percent of time between the two key frames. `cy1` and `cy2` are the percent of the
     * difference between the key frame's values. */
    setCurve(frameIndex, cx1, cy1, cx2, cy2) {
      let tmpx = (-cx1 * 2 + cx2) * 0.03, tmpy = (-cy1 * 2 + cy2) * 0.03;
      let dddfx = ((cx1 - cx2) * 3 + 1) * 6e-3, dddfy = ((cy1 - cy2) * 3 + 1) * 6e-3;
      let ddfx = tmpx * 2 + dddfx, ddfy = tmpy * 2 + dddfy;
      let dfx = cx1 * 0.3 + tmpx + dddfx * 0.16666667, dfy = cy1 * 0.3 + tmpy + dddfy * 0.16666667;
      let i = frameIndex * CurveTimeline.BEZIER_SIZE;
      let curves = this.curves;
      curves[i++] = CurveTimeline.BEZIER;
      let x = dfx, y = dfy;
      for (let n = i + CurveTimeline.BEZIER_SIZE - 1; i < n; i += 2) {
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
      let i = frameIndex * CurveTimeline.BEZIER_SIZE;
      let type = curves[i];
      if (type == CurveTimeline.LINEAR) return percent;
      if (type == CurveTimeline.STEPPED) return 0;
      i++;
      let x = 0;
      for (let start = i, n = i + CurveTimeline.BEZIER_SIZE - 1; i < n; i += 2) {
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
  }
  spine2.CurveTimeline = CurveTimeline;
  class RotateTimeline extends CurveTimeline {
    static ENTRIES = 2;
    static PREV_TIME = -2;
    static PREV_ROTATION = -1;
    static ROTATION = 1;
    /** The index of the bone in {@link Skeleton#bones} that will be changed. */
    boneIndex;
    /** The time in seconds and rotation in degrees for each key frame. */
    frames;
    // time, degrees, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount << 1);
    }
    getPropertyId() {
      return (0 /* rotate */ << 24) + this.boneIndex;
    }
    /** Sets the time and angle of the specified keyframe. */
    setFrame(frameIndex, time, degrees) {
      frameIndex <<= 1;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + RotateTimeline.ROTATION] = degrees;
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
      if (time >= frames[frames.length - RotateTimeline.ENTRIES]) {
        let r2 = frames[frames.length + RotateTimeline.PREV_ROTATION];
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
      let frame = Animation.binarySearch(frames, time, RotateTimeline.ENTRIES);
      let prevRotation = frames[frame + RotateTimeline.PREV_ROTATION];
      let frameTime = frames[frame];
      let percent = this.getCurvePercent(
        (frame >> 1) - 1,
        1 - (time - frameTime) / (frames[frame + RotateTimeline.PREV_TIME] - frameTime)
      );
      let r = frames[frame + RotateTimeline.ROTATION] - prevRotation;
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
  }
  spine2.RotateTimeline = RotateTimeline;
  class TranslateTimeline extends CurveTimeline {
    static ENTRIES = 3;
    static PREV_TIME = -3;
    static PREV_X = -2;
    static PREV_Y = -1;
    static X = 1;
    static Y = 2;
    /** The index of the bone in {@link Skeleton#bones} that will be changed. */
    boneIndex;
    /** The time in seconds, x, and y values for each key frame. */
    frames;
    // time, x, y, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * TranslateTimeline.ENTRIES);
    }
    getPropertyId() {
      return (1 /* translate */ << 24) + this.boneIndex;
    }
    /** Sets the time in seconds, x, and y values for the specified key frame. */
    setFrame(frameIndex, time, x, y) {
      frameIndex *= TranslateTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + TranslateTimeline.X] = x;
      this.frames[frameIndex + TranslateTimeline.Y] = y;
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
      if (time >= frames[frames.length - TranslateTimeline.ENTRIES]) {
        x = frames[frames.length + TranslateTimeline.PREV_X];
        y = frames[frames.length + TranslateTimeline.PREV_Y];
      } else {
        let frame = Animation.binarySearch(frames, time, TranslateTimeline.ENTRIES);
        x = frames[frame + TranslateTimeline.PREV_X];
        y = frames[frame + TranslateTimeline.PREV_Y];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / TranslateTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + TranslateTimeline.PREV_TIME] - frameTime)
        );
        x += (frames[frame + TranslateTimeline.X] - x) * percent;
        y += (frames[frame + TranslateTimeline.Y] - y) * percent;
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
  }
  spine2.TranslateTimeline = TranslateTimeline;
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
  class ColorTimeline extends CurveTimeline {
    static ENTRIES = 5;
    static PREV_TIME = -5;
    static PREV_R = -4;
    static PREV_G = -3;
    static PREV_B = -2;
    static PREV_A = -1;
    static R = 1;
    static G = 2;
    static B = 3;
    static A = 4;
    /** The index of the slot in {@link Skeleton#slots} that will be changed. */
    slotIndex;
    /** The time in seconds, red, green, blue, and alpha values for each key frame. */
    frames;
    // time, r, g, b, a, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * ColorTimeline.ENTRIES);
    }
    getPropertyId() {
      return (5 /* color */ << 24) + this.slotIndex;
    }
    /** Sets the time in seconds, red, green, blue, and alpha for the specified key frame. */
    setFrame(frameIndex, time, r, g, b, a) {
      frameIndex *= ColorTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + ColorTimeline.R] = r;
      this.frames[frameIndex + ColorTimeline.G] = g;
      this.frames[frameIndex + ColorTimeline.B] = b;
      this.frames[frameIndex + ColorTimeline.A] = a;
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
      if (time >= frames[frames.length - ColorTimeline.ENTRIES]) {
        let i = frames.length;
        r = frames[i + ColorTimeline.PREV_R];
        g = frames[i + ColorTimeline.PREV_G];
        b = frames[i + ColorTimeline.PREV_B];
        a = frames[i + ColorTimeline.PREV_A];
      } else {
        let frame = Animation.binarySearch(frames, time, ColorTimeline.ENTRIES);
        r = frames[frame + ColorTimeline.PREV_R];
        g = frames[frame + ColorTimeline.PREV_G];
        b = frames[frame + ColorTimeline.PREV_B];
        a = frames[frame + ColorTimeline.PREV_A];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / ColorTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + ColorTimeline.PREV_TIME] - frameTime)
        );
        r += (frames[frame + ColorTimeline.R] - r) * percent;
        g += (frames[frame + ColorTimeline.G] - g) * percent;
        b += (frames[frame + ColorTimeline.B] - b) * percent;
        a += (frames[frame + ColorTimeline.A] - a) * percent;
      }
      if (alpha == 1)
        slot.color.set(r, g, b, a);
      else {
        let color = slot.color;
        if (blend == 0 /* setup */) color.setFromColor(slot.data.color);
        color.add((r - color.r) * alpha, (g - color.g) * alpha, (b - color.b) * alpha, (a - color.a) * alpha);
      }
    }
  }
  spine2.ColorTimeline = ColorTimeline;
  class TwoColorTimeline extends CurveTimeline {
    static ENTRIES = 8;
    static PREV_TIME = -8;
    static PREV_R = -7;
    static PREV_G = -6;
    static PREV_B = -5;
    static PREV_A = -4;
    static PREV_R2 = -3;
    static PREV_G2 = -2;
    static PREV_B2 = -1;
    static R = 1;
    static G = 2;
    static B = 3;
    static A = 4;
    static R2 = 5;
    static G2 = 6;
    static B2 = 7;
    /** The index of the slot in {@link Skeleton#slots()} that will be changed. The {@link Slot#darkColor()} must not be
     * null. */
    slotIndex;
    /** The time in seconds, red, green, blue, and alpha values of the color, red, green, blue of the dark color, for each key frame. */
    frames;
    // time, r, g, b, a, r2, g2, b2, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * TwoColorTimeline.ENTRIES);
    }
    getPropertyId() {
      return (14 /* twoColor */ << 24) + this.slotIndex;
    }
    /** Sets the time in seconds, light, and dark colors for the specified key frame. */
    setFrame(frameIndex, time, r, g, b, a, r2, g2, b2) {
      frameIndex *= TwoColorTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + TwoColorTimeline.R] = r;
      this.frames[frameIndex + TwoColorTimeline.G] = g;
      this.frames[frameIndex + TwoColorTimeline.B] = b;
      this.frames[frameIndex + TwoColorTimeline.A] = a;
      this.frames[frameIndex + TwoColorTimeline.R2] = r2;
      this.frames[frameIndex + TwoColorTimeline.G2] = g2;
      this.frames[frameIndex + TwoColorTimeline.B2] = b2;
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
      if (time >= frames[frames.length - TwoColorTimeline.ENTRIES]) {
        let i = frames.length;
        r = frames[i + TwoColorTimeline.PREV_R];
        g = frames[i + TwoColorTimeline.PREV_G];
        b = frames[i + TwoColorTimeline.PREV_B];
        a = frames[i + TwoColorTimeline.PREV_A];
        r2 = frames[i + TwoColorTimeline.PREV_R2];
        g2 = frames[i + TwoColorTimeline.PREV_G2];
        b2 = frames[i + TwoColorTimeline.PREV_B2];
      } else {
        let frame = Animation.binarySearch(frames, time, TwoColorTimeline.ENTRIES);
        r = frames[frame + TwoColorTimeline.PREV_R];
        g = frames[frame + TwoColorTimeline.PREV_G];
        b = frames[frame + TwoColorTimeline.PREV_B];
        a = frames[frame + TwoColorTimeline.PREV_A];
        r2 = frames[frame + TwoColorTimeline.PREV_R2];
        g2 = frames[frame + TwoColorTimeline.PREV_G2];
        b2 = frames[frame + TwoColorTimeline.PREV_B2];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / TwoColorTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + TwoColorTimeline.PREV_TIME] - frameTime)
        );
        r += (frames[frame + TwoColorTimeline.R] - r) * percent;
        g += (frames[frame + TwoColorTimeline.G] - g) * percent;
        b += (frames[frame + TwoColorTimeline.B] - b) * percent;
        a += (frames[frame + TwoColorTimeline.A] - a) * percent;
        r2 += (frames[frame + TwoColorTimeline.R2] - r2) * percent;
        g2 += (frames[frame + TwoColorTimeline.G2] - g2) * percent;
        b2 += (frames[frame + TwoColorTimeline.B2] - b2) * percent;
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
  }
  spine2.TwoColorTimeline = TwoColorTimeline;
  class AttachmentTimeline {
    /** The index of the slot in {@link Skeleton#slots} that will be changed. */
    slotIndex;
    /** The time in seconds for each key frame. */
    frames;
    // time, ...
    /** The attachment name for each key frame. May contain null values to clear the attachment. */
    attachmentNames;
    constructor(frameCount) {
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
    /** The index of the slot in {@link Skeleton#getSlots()} that will be changed. */
    slotIndex;
    /** The attachment that will be deformed. */
    attachment;
    /** The time in seconds for each key frame. */
    frames;
    // time, ...
    /** The vertices for each key frame. */
    frameVertices;
    constructor(frameCount) {
      super(frameCount);
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
    /** The time in seconds for each key frame. */
    frames;
    // time, ...
    /** The event for each key frame. */
    events;
    constructor(frameCount) {
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
    /** The time in seconds for each key frame. */
    frames;
    // time, ...
    /** The draw order for each key frame. See {@link #setFrame(int, float, int[])}. */
    drawOrders;
    constructor(frameCount) {
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
  class IkConstraintTimeline extends CurveTimeline {
    static ENTRIES = 6;
    static PREV_TIME = -6;
    static PREV_MIX = -5;
    static PREV_SOFTNESS = -4;
    static PREV_BEND_DIRECTION = -3;
    static PREV_COMPRESS = -2;
    static PREV_STRETCH = -1;
    static MIX = 1;
    static SOFTNESS = 2;
    static BEND_DIRECTION = 3;
    static COMPRESS = 4;
    static STRETCH = 5;
    /** The index of the IK constraint slot in {@link Skeleton#ikConstraints} that will be changed. */
    ikConstraintIndex;
    /** The time in seconds, mix, softness, bend direction, compress, and stretch for each key frame. */
    frames;
    // time, mix, softness, bendDirection, compress, stretch, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * IkConstraintTimeline.ENTRIES);
    }
    getPropertyId() {
      return (9 /* ikConstraint */ << 24) + this.ikConstraintIndex;
    }
    /** Sets the time in seconds, mix, softness, bend direction, compress, and stretch for the specified key frame. */
    setFrame(frameIndex, time, mix, softness, bendDirection, compress, stretch) {
      frameIndex *= IkConstraintTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + IkConstraintTimeline.MIX] = mix;
      this.frames[frameIndex + IkConstraintTimeline.SOFTNESS] = softness;
      this.frames[frameIndex + IkConstraintTimeline.BEND_DIRECTION] = bendDirection;
      this.frames[frameIndex + IkConstraintTimeline.COMPRESS] = compress ? 1 : 0;
      this.frames[frameIndex + IkConstraintTimeline.STRETCH] = stretch ? 1 : 0;
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
      if (time >= frames[frames.length - IkConstraintTimeline.ENTRIES]) {
        if (blend == 0 /* setup */) {
          constraint.mix = constraint.data.mix + (frames[frames.length + IkConstraintTimeline.PREV_MIX] - constraint.data.mix) * alpha;
          constraint.softness = constraint.data.softness + (frames[frames.length + IkConstraintTimeline.PREV_SOFTNESS] - constraint.data.softness) * alpha;
          if (direction == 1 /* mixOut */) {
            constraint.bendDirection = constraint.data.bendDirection;
            constraint.compress = constraint.data.compress;
            constraint.stretch = constraint.data.stretch;
          } else {
            constraint.bendDirection = frames[frames.length + IkConstraintTimeline.PREV_BEND_DIRECTION];
            constraint.compress = frames[frames.length + IkConstraintTimeline.PREV_COMPRESS] != 0;
            constraint.stretch = frames[frames.length + IkConstraintTimeline.PREV_STRETCH] != 0;
          }
        } else {
          constraint.mix += (frames[frames.length + IkConstraintTimeline.PREV_MIX] - constraint.mix) * alpha;
          constraint.softness += (frames[frames.length + IkConstraintTimeline.PREV_SOFTNESS] - constraint.softness) * alpha;
          if (direction == 0 /* mixIn */) {
            constraint.bendDirection = frames[frames.length + IkConstraintTimeline.PREV_BEND_DIRECTION];
            constraint.compress = frames[frames.length + IkConstraintTimeline.PREV_COMPRESS] != 0;
            constraint.stretch = frames[frames.length + IkConstraintTimeline.PREV_STRETCH] != 0;
          }
        }
        return;
      }
      let frame = Animation.binarySearch(frames, time, IkConstraintTimeline.ENTRIES);
      let mix = frames[frame + IkConstraintTimeline.PREV_MIX];
      let softness = frames[frame + IkConstraintTimeline.PREV_SOFTNESS];
      let frameTime = frames[frame];
      let percent = this.getCurvePercent(
        frame / IkConstraintTimeline.ENTRIES - 1,
        1 - (time - frameTime) / (frames[frame + IkConstraintTimeline.PREV_TIME] - frameTime)
      );
      if (blend == 0 /* setup */) {
        constraint.mix = constraint.data.mix + (mix + (frames[frame + IkConstraintTimeline.MIX] - mix) * percent - constraint.data.mix) * alpha;
        constraint.softness = constraint.data.softness + (softness + (frames[frame + IkConstraintTimeline.SOFTNESS] - softness) * percent - constraint.data.softness) * alpha;
        if (direction == 1 /* mixOut */) {
          constraint.bendDirection = constraint.data.bendDirection;
          constraint.compress = constraint.data.compress;
          constraint.stretch = constraint.data.stretch;
        } else {
          constraint.bendDirection = frames[frame + IkConstraintTimeline.PREV_BEND_DIRECTION];
          constraint.compress = frames[frame + IkConstraintTimeline.PREV_COMPRESS] != 0;
          constraint.stretch = frames[frame + IkConstraintTimeline.PREV_STRETCH] != 0;
        }
      } else {
        constraint.mix += (mix + (frames[frame + IkConstraintTimeline.MIX] - mix) * percent - constraint.mix) * alpha;
        constraint.softness += (softness + (frames[frame + IkConstraintTimeline.SOFTNESS] - softness) * percent - constraint.softness) * alpha;
        if (direction == 0 /* mixIn */) {
          constraint.bendDirection = frames[frame + IkConstraintTimeline.PREV_BEND_DIRECTION];
          constraint.compress = frames[frame + IkConstraintTimeline.PREV_COMPRESS] != 0;
          constraint.stretch = frames[frame + IkConstraintTimeline.PREV_STRETCH] != 0;
        }
      }
    }
  }
  spine2.IkConstraintTimeline = IkConstraintTimeline;
  class TransformConstraintTimeline extends CurveTimeline {
    static ENTRIES = 5;
    static PREV_TIME = -5;
    static PREV_ROTATE = -4;
    static PREV_TRANSLATE = -3;
    static PREV_SCALE = -2;
    static PREV_SHEAR = -1;
    static ROTATE = 1;
    static TRANSLATE = 2;
    static SCALE = 3;
    static SHEAR = 4;
    /** The index of the transform constraint slot in {@link Skeleton#transformConstraints} that will be changed. */
    transformConstraintIndex;
    /** The time in seconds, rotate mix, translate mix, scale mix, and shear mix for each key frame. */
    frames;
    // time, rotate mix, translate mix, scale mix, shear mix, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * TransformConstraintTimeline.ENTRIES);
    }
    getPropertyId() {
      return (10 /* transformConstraint */ << 24) + this.transformConstraintIndex;
    }
    /** The time in seconds, rotate mix, translate mix, scale mix, and shear mix for the specified key frame. */
    setFrame(frameIndex, time, rotateMix, translateMix, scaleMix, shearMix) {
      frameIndex *= TransformConstraintTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + TransformConstraintTimeline.ROTATE] = rotateMix;
      this.frames[frameIndex + TransformConstraintTimeline.TRANSLATE] = translateMix;
      this.frames[frameIndex + TransformConstraintTimeline.SCALE] = scaleMix;
      this.frames[frameIndex + TransformConstraintTimeline.SHEAR] = shearMix;
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
      if (time >= frames[frames.length - TransformConstraintTimeline.ENTRIES]) {
        let i = frames.length;
        rotate = frames[i + TransformConstraintTimeline.PREV_ROTATE];
        translate = frames[i + TransformConstraintTimeline.PREV_TRANSLATE];
        scale = frames[i + TransformConstraintTimeline.PREV_SCALE];
        shear = frames[i + TransformConstraintTimeline.PREV_SHEAR];
      } else {
        let frame = Animation.binarySearch(frames, time, TransformConstraintTimeline.ENTRIES);
        rotate = frames[frame + TransformConstraintTimeline.PREV_ROTATE];
        translate = frames[frame + TransformConstraintTimeline.PREV_TRANSLATE];
        scale = frames[frame + TransformConstraintTimeline.PREV_SCALE];
        shear = frames[frame + TransformConstraintTimeline.PREV_SHEAR];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / TransformConstraintTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + TransformConstraintTimeline.PREV_TIME] - frameTime)
        );
        rotate += (frames[frame + TransformConstraintTimeline.ROTATE] - rotate) * percent;
        translate += (frames[frame + TransformConstraintTimeline.TRANSLATE] - translate) * percent;
        scale += (frames[frame + TransformConstraintTimeline.SCALE] - scale) * percent;
        shear += (frames[frame + TransformConstraintTimeline.SHEAR] - shear) * percent;
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
  }
  spine2.TransformConstraintTimeline = TransformConstraintTimeline;
  class PathConstraintPositionTimeline extends CurveTimeline {
    static ENTRIES = 2;
    static PREV_TIME = -2;
    static PREV_VALUE = -1;
    static VALUE = 1;
    /** The index of the path constraint slot in {@link Skeleton#pathConstraints} that will be changed. */
    pathConstraintIndex;
    /** The time in seconds and path constraint position for each key frame. */
    frames;
    // time, position, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * PathConstraintPositionTimeline.ENTRIES);
    }
    getPropertyId() {
      return (11 /* pathConstraintPosition */ << 24) + this.pathConstraintIndex;
    }
    /** Sets the time in seconds and path constraint position for the specified key frame. */
    setFrame(frameIndex, time, value) {
      frameIndex *= PathConstraintPositionTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + PathConstraintPositionTimeline.VALUE] = value;
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
      if (time >= frames[frames.length - PathConstraintPositionTimeline.ENTRIES])
        position = frames[frames.length + PathConstraintPositionTimeline.PREV_VALUE];
      else {
        let frame = Animation.binarySearch(frames, time, PathConstraintPositionTimeline.ENTRIES);
        position = frames[frame + PathConstraintPositionTimeline.PREV_VALUE];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / PathConstraintPositionTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + PathConstraintPositionTimeline.PREV_TIME] - frameTime)
        );
        position += (frames[frame + PathConstraintPositionTimeline.VALUE] - position) * percent;
      }
      if (blend == 0 /* setup */)
        constraint.position = constraint.data.position + (position - constraint.data.position) * alpha;
      else
        constraint.position += (position - constraint.position) * alpha;
    }
  }
  spine2.PathConstraintPositionTimeline = PathConstraintPositionTimeline;
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
  class PathConstraintMixTimeline extends CurveTimeline {
    static ENTRIES = 3;
    static PREV_TIME = -3;
    static PREV_ROTATE = -2;
    static PREV_TRANSLATE = -1;
    static ROTATE = 1;
    static TRANSLATE = 2;
    /** The index of the path constraint slot in {@link Skeleton#getPathConstraints()} that will be changed. */
    pathConstraintIndex;
    /** The time in seconds, rotate mix, and translate mix for each key frame. */
    frames;
    // time, rotate mix, translate mix, ...
    constructor(frameCount) {
      super(frameCount);
      this.frames = spine2.Utils.newFloatArray(frameCount * PathConstraintMixTimeline.ENTRIES);
    }
    getPropertyId() {
      return (13 /* pathConstraintMix */ << 24) + this.pathConstraintIndex;
    }
    /** The time in seconds, rotate mix, and translate mix for the specified key frame. */
    setFrame(frameIndex, time, rotateMix, translateMix) {
      frameIndex *= PathConstraintMixTimeline.ENTRIES;
      this.frames[frameIndex] = time;
      this.frames[frameIndex + PathConstraintMixTimeline.ROTATE] = rotateMix;
      this.frames[frameIndex + PathConstraintMixTimeline.TRANSLATE] = translateMix;
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
      if (time >= frames[frames.length - PathConstraintMixTimeline.ENTRIES]) {
        rotate = frames[frames.length + PathConstraintMixTimeline.PREV_ROTATE];
        translate = frames[frames.length + PathConstraintMixTimeline.PREV_TRANSLATE];
      } else {
        let frame = Animation.binarySearch(frames, time, PathConstraintMixTimeline.ENTRIES);
        rotate = frames[frame + PathConstraintMixTimeline.PREV_ROTATE];
        translate = frames[frame + PathConstraintMixTimeline.PREV_TRANSLATE];
        let frameTime = frames[frame];
        let percent = this.getCurvePercent(
          frame / PathConstraintMixTimeline.ENTRIES - 1,
          1 - (time - frameTime) / (frames[frame + PathConstraintMixTimeline.PREV_TIME] - frameTime)
        );
        rotate += (frames[frame + PathConstraintMixTimeline.ROTATE] - rotate) * percent;
        translate += (frames[frame + PathConstraintMixTimeline.TRANSLATE] - translate) * percent;
      }
      if (blend == 0 /* setup */) {
        constraint.rotateMix = constraint.data.rotateMix + (rotate - constraint.data.rotateMix) * alpha;
        constraint.translateMix = constraint.data.translateMix + (translate - constraint.data.translateMix) * alpha;
      } else {
        constraint.rotateMix += (rotate - constraint.rotateMix) * alpha;
        constraint.translateMix += (translate - constraint.translateMix) * alpha;
      }
    }
  }
  spine2.PathConstraintMixTimeline = PathConstraintMixTimeline;
})(spine || (spine = {}));
((spine2) => {
  class AnimationState {
    static emptyAnimation = new spine2.Animation("<empty>", [], 0);
    /** 1. A previously applied timeline has set this property.
     *
    	 * Result: Mix from the current pose to the timeline pose. */
    static SUBSEQUENT = 0;
    /** 1. This is the first timeline to set this property.
     * 2. The next track entry applied after this one does not have a timeline to set this property.
     *
     * Result: Mix from the setup pose to the timeline pose. */
    static FIRST = 1;
    /** 1) A previously applied timeline has set this property.<br>
    	 * 2) The next track entry to be applied does have a timeline to set this property.<br>
    	 * 3) The next track entry after that one does not have a timeline to set this property.<br>
    	 * Result: Mix from the current pose to the timeline pose, but do not mix out. This avoids "dipping" when crossfading
    	 * animations that key the same property. A subsequent timeline will set this property using a mix. */
    static HOLD_SUBSEQUENT = 2;
    /** 1) This is the first timeline to set this property.<br>
     * 2) The next track entry to be applied does have a timeline to set this property.<br>
     * 3) The next track entry after that one does not have a timeline to set this property.<br>
     * Result: Mix from the setup pose to the timeline pose, but do not mix out. This avoids "dipping" when crossfading animations
     * that key the same property. A subsequent timeline will set this property using a mix. */
    static HOLD_FIRST = 3;
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
    static HOLD_MIX = 4;
    static SETUP = 1;
    static CURRENT = 2;
    /** The AnimationStateData to look up mix durations. */
    data;
    /** The list of tracks that currently have animations, which may contain null entries. */
    tracks = new Array();
    /** Multiplier for the delta time when the animation state is updated, causing time for all animations and mixes to play slower
     * or faster. Defaults to 1.
     *
     * See TrackEntry {@link TrackEntry#timeScale} for affecting a single animation. */
    timeScale = 1;
    unkeyedState = 0;
    events = new Array();
    listeners = new Array();
    queue = new EventQueue(this);
    propertyIDs = new spine2.IntSet();
    animationsChanged = false;
    trackEntryPool = new spine2.Pool(() => new TrackEntry());
    constructor(data) {
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
            let timelineBlend = timelineMode[ii] == AnimationState.SUBSEQUENT ? blend : 0 /* setup */;
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
      var setupState = this.unkeyedState + AnimationState.SETUP;
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
            case AnimationState.SUBSEQUENT:
              if (!drawOrder && timeline instanceof spine2.DrawOrderTimeline) continue;
              timelineBlend = blend;
              alpha = alphaMix;
              break;
            case AnimationState.FIRST:
              timelineBlend = 0 /* setup */;
              alpha = alphaMix;
              break;
            case AnimationState.HOLD_SUBSEQUENT:
              timelineBlend = blend;
              alpha = alphaHold;
              break;
            case AnimationState.HOLD_FIRST:
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
      if (slot.attachmentState <= this.unkeyedState) slot.attachmentState = this.unkeyedState + AnimationState.SETUP;
    }
    setAttachment(skeleton, slot, attachmentName, attachments) {
      slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(slot.data.index, attachmentName));
      if (attachments) slot.attachmentState = this.unkeyedState + AnimationState.CURRENT;
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
      let entry = this.setAnimationWith(trackIndex, AnimationState.emptyAnimation, false);
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
      let entry = this.addAnimationWith(trackIndex, AnimationState.emptyAnimation, false, delay);
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
          timelineMode[i] = propertyIDs.add(timelines[i].getPropertyId()) ? AnimationState.HOLD_FIRST : AnimationState.HOLD_SUBSEQUENT;
        }
        return;
      }
      outer:
        for (let i = 0; i < timelinesCount; i++) {
          let timeline = timelines[i];
          let id = timeline.getPropertyId();
          if (!propertyIDs.add(id))
            timelineMode[i] = AnimationState.SUBSEQUENT;
          else if (to == null || timeline instanceof spine2.AttachmentTimeline || timeline instanceof spine2.DrawOrderTimeline || timeline instanceof spine2.EventTimeline || !to.animation.hasTimeline(id)) {
            timelineMode[i] = AnimationState.FIRST;
          } else {
            for (let next = to.mixingTo; next != null; next = next.mixingTo) {
              if (next.animation.hasTimeline(id)) continue;
              if (entry.mixDuration > 0) {
                timelineMode[i] = AnimationState.HOLD_MIX;
                timelineDipMix[i] = next;
                continue outer;
              }
              break;
            }
            timelineMode[i] = AnimationState.HOLD_FIRST;
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
  }
  spine2.AnimationState = AnimationState;
  class TrackEntry {
    /** The animation to apply for this track entry. */
    animation;
    /** The animation queued to start after this animation, or null. `next` makes up a linked list. */
    next;
    /** The track entry for the previous animation when mixing from the previous animation to this animation, or null if no
     * mixing is currently occuring. When mixing from multiple animations, `mixingFrom` makes up a linked list. */
    mixingFrom;
    /** The track entry for the next animation when mixing from this animation to the next animation, or null if no mixing is
     * currently occuring. When mixing to multiple animations, `mixingTo` makes up a linked list. */
    mixingTo;
    /** The listener for events generated by this track entry, or null.
     *
     * A track entry returned from {@link AnimationState#setAnimation()} is already the current animation
     * for the track, so the track entry listener {@link AnimationStateListener#start()} will not be called. */
    listener;
    /** The index of the track where this track entry is either current or queued.
     *
     * See {@link AnimationState#getCurrent()}. */
    trackIndex;
    /** If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its
     * duration. */
    loop;
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
    holdPrevious;
    /** When the mix percentage ({@link #mixTime} / {@link #mixDuration}) is less than the
     * `eventThreshold`, event timelines are applied while this animation is being mixed out. Defaults to 0, so event
     * timelines are not applied while this animation is being mixed out. */
    eventThreshold;
    /** When the mix percentage ({@link #mixtime} / {@link #mixDuration}) is less than the
     * `attachmentThreshold`, attachment timelines are applied while this animation is being mixed out. Defaults to
     * 0, so attachment timelines are not applied while this animation is being mixed out. */
    attachmentThreshold;
    /** When the mix percentage ({@link #mixTime} / {@link #mixDuration}) is less than the
     * `drawOrderThreshold`, draw order timelines are applied while this animation is being mixed out. Defaults to 0,
     * so draw order timelines are not applied while this animation is being mixed out. */
    drawOrderThreshold;
    /** Seconds when this animation starts, both initially and after looping. Defaults to 0.
     *
     * When changing the `animationStart` time, it often makes sense to set {@link #animationLast} to the same
     * value to prevent timeline keys before the start time from triggering. */
    animationStart;
    /** Seconds for the last frame of this animation. Non-looping animations won't play past this time. Looping animations will
     * loop back to {@link #animationStart} at this time. Defaults to the animation {@link Animation#duration}. */
    animationEnd;
    /** The time in seconds this animation was last applied. Some timelines use this for one-time triggers. Eg, when this
     * animation is applied, event timelines will fire all events between the `animationLast` time (exclusive) and
     * `animationTime` (inclusive). Defaults to -1 to ensure triggers on frame 0 happen the first time this animation
     * is applied. */
    animationLast;
    nextAnimationLast;
    /** Seconds to postpone playing the animation. When this track entry is the current track entry, `delay`
     * postpones incrementing the {@link #trackTime}. When this track entry is queued, `delay` is the time from
     * the start of the previous animation to when this track entry will become the current track entry (ie when the previous
     * track entry {@link TrackEntry#trackTime} >= this track entry's `delay`).
     *
     * {@link #timeScale} affects the delay. */
    delay;
    /** Current time in seconds this track entry has been the current track entry. The track time determines
     * {@link #animationTime}. The track time can be set to start the animation at a time other than 0, without affecting
     * looping. */
    trackTime;
    trackLast;
    nextTrackLast;
    /** The track time in seconds when this animation will be removed from the track. Defaults to the highest possible float
     * value, meaning the animation will be applied until a new animation is set or the track is cleared. If the track end time
     * is reached, no other animations are queued for playback, and mixing from any previous animations is complete, then the
     * properties keyed by the animation are set to the setup pose and the track is cleared.
     *
     * It may be desired to use {@link AnimationState#addEmptyAnimation()} rather than have the animation
     * abruptly cease being applied. */
    trackEnd;
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
    timeScale;
    /** Values < 1 mix this animation with the skeleton's current pose (usually the pose resulting from lower tracks). Defaults
     * to 1, which overwrites the skeleton's current pose with this animation.
     *
     * Typically track 0 is used to completely pose the skeleton, then alpha is used on higher tracks. It doesn't make sense to
     * use alpha on track 0 if the skeleton pose is from the last frame render. */
    alpha;
    /** Seconds from 0 to the {@link #getMixDuration()} when mixing from the previous animation to this animation. May be
     * slightly more than `mixDuration` when the mix is complete. */
    mixTime;
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
    mixDuration;
    interruptAlpha;
    totalAlpha;
    /** Controls how properties keyed in the animation are mixed with lower tracks. Defaults to {@link MixBlend#replace}, which
     * replaces the values from the lower tracks with the animation values. {@link MixBlend#add} adds the animation values to
     * the values from the lower tracks.
     *
     * The `mixBlend` can be set for a new track entry only before {@link AnimationState#apply()} is first
     * called. */
    mixBlend = 2 /* replace */;
    timelineMode = new Array();
    timelineHoldMix = new Array();
    timelinesRotation = new Array();
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
    objects = [];
    drainDisabled = false;
    animState;
    constructor(animState) {
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
    /** The SkeletonData to look up animations when they are specified by name. */
    skeletonData;
    animationToMixTime = {};
    /** The mix duration to use when no mix duration has been defined between two animations. */
    defaultMix = 0;
    constructor(skeletonData) {
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
    pathPrefix;
    textureLoader;
    assets = {};
    errors = {};
    toLoad = 0;
    loaded = 0;
    rawDataUris = {};
    constructor(textureLoader, pathPrefix = "") {
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
    atlas;
    constructor(atlas) {
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
    /** The bone's setup pose data. */
    data;
    /** The skeleton this bone belongs to. */
    skeleton;
    /** The parent bone, or null if this is the root bone. */
    parent;
    /** The immediate children of this bone. */
    children = new Array();
    /** The local x translation. */
    x = 0;
    /** The local y translation. */
    y = 0;
    /** The local rotation in degrees, counter clockwise. */
    rotation = 0;
    /** The local scaleX. */
    scaleX = 0;
    /** The local scaleY. */
    scaleY = 0;
    /** The local shearX. */
    shearX = 0;
    /** The local shearY. */
    shearY = 0;
    /** The applied local x translation. */
    ax = 0;
    /** The applied local y translation. */
    ay = 0;
    /** The applied local rotation in degrees, counter clockwise. */
    arotation = 0;
    /** The applied local scaleX. */
    ascaleX = 0;
    /** The applied local scaleY. */
    ascaleY = 0;
    /** The applied local shearX. */
    ashearX = 0;
    /** The applied local shearY. */
    ashearY = 0;
    /** If true, the applied transform matches the world transform. If false, the world transform has been modified since it was
    	* computed and {@link #updateAppliedTransform()} must be called before accessing the applied transform. */
    appliedValid = false;
    /** Part of the world transform matrix for the X axis. If changed, {@link #appliedValid} should be set to false. */
    a = 0;
    /** Part of the world transform matrix for the Y axis. If changed, {@link #appliedValid} should be set to false. */
    b = 0;
    /** Part of the world transform matrix for the X axis. If changed, {@link #appliedValid} should be set to false. */
    c = 0;
    /** Part of the world transform matrix for the Y axis. If changed, {@link #appliedValid} should be set to false. */
    d = 0;
    /** The world X position. If changed, {@link #appliedValid} should be set to false. */
    worldY = 0;
    /** The world Y position. If changed, {@link #appliedValid} should be set to false. */
    worldX = 0;
    sorted = false;
    active = false;
    /** @param parent May be null. */
    constructor(data, skeleton, parent) {
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
    /** The index of the bone in {@link Skeleton#getBones()}. */
    index;
    /** The name of the bone, which is unique across all bones in the skeleton. */
    name;
    /** @returns May be null. */
    parent;
    /** The bone's length. */
    length;
    /** The local x translation. */
    x = 0;
    /** The local y translation. */
    y = 0;
    /** The local rotation. */
    rotation = 0;
    /** The local scaleX. */
    scaleX = 1;
    /** The local scaleY. */
    scaleY = 1;
    /** The local shearX. */
    shearX = 0;
    /** The local shearX. */
    shearY = 0;
    /** The transform mode for how parent world transforms affect this bone. */
    transformMode = 0 /* Normal */;
    /** When true, {@link Skeleton#updateWorldTransform()} only updates this bone if the {@link Skeleton#skin} contains this
    	* bone.
    	* @see Skin#bones */
    skinRequired = false;
    /** The color of the bone as it was in Spine. Available only when nonessential data was exported. Bones are not usually
     * rendered at runtime. */
    color = new spine2.Color();
    constructor(index, name, parent) {
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
      this.name = name;
      this.order = order;
      this.skinRequired = skinRequired;
    }
    name;
    order;
    skinRequired;
  }
  spine2.ConstraintData = ConstraintData;
})(spine || (spine = {}));
((spine2) => {
  class Event {
    data;
    intValue;
    floatValue;
    stringValue;
    time;
    volume;
    balance;
    constructor(time, data) {
      if (data == null) throw new Error("data cannot be null.");
      this.time = time;
      this.data = data;
    }
  }
  spine2.Event = Event;
})(spine || (spine = {}));
((spine2) => {
  class EventData {
    name;
    intValue;
    floatValue;
    stringValue;
    audioPath;
    volume;
    balance;
    constructor(name) {
      this.name = name;
    }
  }
  spine2.EventData = EventData;
})(spine || (spine = {}));
((spine2) => {
  class IkConstraint {
    /** The IK constraint's setup pose data. */
    data;
    /** The bones that will be modified by this IK constraint. */
    bones;
    /** The bone that is the IK target. */
    target;
    /** Controls the bend direction of the IK bones, either 1 or -1. */
    bendDirection = 0;
    /** When true and only a single bone is being constrained, if the target is too close, the bone is scaled to reach it. */
    compress = false;
    /** When true, if the target is out of range, the parent bone is scaled to reach it. If more than one bone is being constrained
     * and the parent bone has local nonuniform scale, stretch is not applied. */
    stretch = false;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
    mix = 1;
    /** For two bone IK, the distance from the maximum reach of the bones that rotation will slow. */
    softness = 0;
    active = false;
    constructor(data, skeleton) {
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
    /** The bones that are constrained by this IK constraint. */
    bones = new Array();
    /** The bone that is the IK target. */
    target;
    /** Controls the bend direction of the IK bones, either 1 or -1. */
    bendDirection = 1;
    /** When true and only a single bone is being constrained, if the target is too close, the bone is scaled to reach it. */
    compress = false;
    /** When true, if the target is out of range, the parent bone is scaled to reach it. If more than one bone is being constrained
     * and the parent bone has local nonuniform scale, stretch is not applied. */
    stretch = false;
    /** When true, only a single bone is being constrained, and {@link #getCompress()} or {@link #getStretch()} is used, the bone
     * is scaled on both the X and Y axes. */
    uniform = false;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
    mix = 1;
    /** For two bone IK, the distance from the maximum reach of the bones that rotation will slow. */
    softness = 0;
    constructor(name) {
      super(name, 0, false);
    }
  }
  spine2.IkConstraintData = IkConstraintData;
})(spine || (spine = {}));
((spine2) => {
  class PathConstraint {
    static NONE = -1;
    static BEFORE = -2;
    static AFTER = -3;
    static epsilon = 1e-5;
    /** The path constraint's setup pose data. */
    data;
    /** The bones that will be modified by this path constraint. */
    bones;
    /** The slot whose path attachment will be used to constrained the bones. */
    target;
    /** The position along the path. */
    position = 0;
    /** The spacing between bones. */
    spacing = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
    rotateMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
    translateMix = 0;
    spaces = new Array();
    positions = new Array();
    world = new Array();
    curves = new Array();
    lengths = new Array();
    segments = new Array();
    active = false;
    constructor(data, skeleton) {
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
          if (setupLength < PathConstraint.epsilon) {
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
      let verticesLength = path.worldVerticesLength, curveCount = verticesLength / 6, prevCurve = PathConstraint.NONE;
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
            if (prevCurve != PathConstraint.BEFORE) {
              prevCurve = PathConstraint.BEFORE;
              path.computeWorldVertices(target, 2, 4, world, 0, 2);
            }
            this.addBeforePosition(p, world, 0, out, o);
            continue;
          } else if (p > pathLength2) {
            if (prevCurve != PathConstraint.AFTER) {
              prevCurve = PathConstraint.AFTER;
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
  }
  spine2.PathConstraint = PathConstraint;
})(spine || (spine = {}));
((spine2) => {
  class PathConstraintData extends spine2.ConstraintData {
    /** The bones that will be modified by this path constraint. */
    bones = new Array();
    /** The slot whose path attachment will be used to constrained the bones. */
    target;
    /** The mode for positioning the first bone on the path. */
    positionMode;
    /** The mode for positioning the bones after the first bone on the path. */
    spacingMode;
    /** The mode for adjusting the rotation of the bones. */
    rotateMode;
    /** An offset added to the constrained bone rotation. */
    offsetRotation;
    /** The position along the path. */
    position;
    /** The spacing between bones. */
    spacing;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
    rotateMix;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
    translateMix;
    constructor(name) {
      super(name, 0, false);
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
    clientId;
    toLoad = new Array();
    assets = {};
    textureLoader;
    constructor(clientId) {
      this.clientId = clientId;
    }
    loaded() {
      let i = 0;
      for (let v in this.assets) i++;
      return i;
    }
  }
  class SharedAssetManager {
    pathPrefix;
    clientAssets = {};
    queuedAssets = {};
    rawAssets = {};
    errors = {};
    constructor(pathPrefix = "") {
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
    /** The skeleton's setup pose data. */
    data;
    /** The skeleton's bones, sorted parent first. The root bone is always the first bone. */
    bones;
    /** The skeleton's slots. */
    slots;
    /** The skeleton's slots in the order they should be drawn. The returned array may be modified to change the draw order. */
    drawOrder;
    /** The skeleton's IK constraints. */
    ikConstraints;
    /** The skeleton's transform constraints. */
    transformConstraints;
    /** The skeleton's path constraints. */
    pathConstraints;
    /** The list of bones and constraints, sorted in the order they should be updated, as computed by {@link #updateCache()}. */
    _updateCache = new Array();
    updateCacheReset = new Array();
    /** The skeleton's current skin. May be null. */
    skin;
    /** The color to tint all the skeleton's attachments. */
    color;
    /** Returns the skeleton's time. This can be used for tracking, such as with Slot {@link Slot#attachmentTime}.
     * <p>
     * See {@link #update()}. */
    time = 0;
    /** Scales the entire skeleton on the X axis. This affects all bones, even if the bone's transform mode disallows scale
    	* inheritance. */
    scaleX = 1;
    /** Scales the entire skeleton on the Y axis. This affects all bones, even if the bone's transform mode disallows scale
    	* inheritance. */
    scaleY = 1;
    /** Sets the skeleton X position, which is added to the root bone worldX position. */
    x = 0;
    /** Sets the skeleton Y position, which is added to the root bone worldY position. */
    y = 0;
    constructor(data) {
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
  class SkeletonBinary {
    static AttachmentTypeValues = [
      0,
      1,
      2,
      3,
      4,
      5,
      6
      /*AttachmentType.Clipping*/
    ];
    static TransformModeValues = [0 /* Normal */, 1 /* OnlyTranslation */, 2 /* NoRotationOrReflection */, 3 /* NoScale */, 4 /* NoScaleOrReflection */];
    static PositionModeValues = [0 /* Fixed */, 1 /* Percent */];
    static SpacingModeValues = [0 /* Length */, 1 /* Fixed */, 2 /* Percent */];
    static RotateModeValues = [0 /* Tangent */, 1 /* Chain */, 2 /* ChainScale */];
    static BlendModeValues = [0 /* Normal */, 1 /* Additive */, 2 /* Multiply */, 3 /* Screen */];
    static BONE_ROTATE = 0;
    static BONE_TRANSLATE = 1;
    static BONE_SCALE = 2;
    static BONE_SHEAR = 3;
    static SLOT_ATTACHMENT = 0;
    static SLOT_COLOR = 1;
    static SLOT_TWO_COLOR = 2;
    static PATH_POSITION = 0;
    static PATH_SPACING = 1;
    static PATH_MIX = 2;
    static CURVE_LINEAR = 0;
    static CURVE_STEPPED = 1;
    static CURVE_BEZIER = 2;
    /** Scales bone positions, image sizes, and translations as they are loaded. This allows different size images to be used at
     * runtime than were used in Spine.
     *
     * See [Scaling](http://esotericsoftware.com/spine-loading-skeleton-data#Scaling) in the Spine Runtimes Guide. */
    scale = 1;
    attachmentLoader;
    linkedMeshes = new Array();
    constructor(attachmentLoader) {
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
        data.transformMode = SkeletonBinary.TransformModeValues[input.readInt(true)];
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
        data.blendMode = SkeletonBinary.BlendModeValues[input.readInt(true)];
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
        data.positionMode = SkeletonBinary.PositionModeValues[input.readInt(true)];
        data.spacingMode = SkeletonBinary.SpacingModeValues[input.readInt(true)];
        data.rotateMode = SkeletonBinary.RotateModeValues[input.readInt(true)];
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
      let type = SkeletonBinary.AttachmentTypeValues[typeIndex];
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
            case SkeletonBinary.SLOT_ATTACHMENT: {
              let timeline = new spine2.AttachmentTimeline(frameCount);
              timeline.slotIndex = slotIndex;
              for (let frameIndex = 0; frameIndex < frameCount; frameIndex++)
                timeline.setFrame(frameIndex, input.readFloat(), input.readStringRef());
              timelines.push(timeline);
              duration = Math.max(duration, timeline.frames[frameCount - 1]);
              break;
            }
            case SkeletonBinary.SLOT_COLOR: {
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
            case SkeletonBinary.SLOT_TWO_COLOR: {
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
            case SkeletonBinary.BONE_ROTATE: {
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
            case SkeletonBinary.BONE_TRANSLATE:
            case SkeletonBinary.BONE_SCALE:
            case SkeletonBinary.BONE_SHEAR: {
              let timeline;
              let timelineScale = 1;
              if (timelineType == SkeletonBinary.BONE_SCALE)
                timeline = new spine2.ScaleTimeline(frameCount);
              else if (timelineType == SkeletonBinary.BONE_SHEAR)
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
            case SkeletonBinary.PATH_POSITION:
            case SkeletonBinary.PATH_SPACING: {
              let timeline;
              let timelineScale = 1;
              if (timelineType == SkeletonBinary.PATH_SPACING) {
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
            case SkeletonBinary.PATH_MIX: {
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
        case SkeletonBinary.CURVE_STEPPED:
          timeline.setStepped(frameIndex);
          break;
        case SkeletonBinary.CURVE_BEZIER:
          this.setCurve(timeline, frameIndex, input.readFloat(), input.readFloat(), input.readFloat(), input.readFloat());
          break;
      }
    }
    setCurve(timeline, frameIndex, cx1, cy1, cx2, cy2) {
      timeline.setCurve(frameIndex, cx1, cy1, cx2, cy2);
    }
  }
  spine2.SkeletonBinary = SkeletonBinary;
  class BinaryInput {
    constructor(data, strings = new Array(), index = 0, buffer = new DataView(data.buffer)) {
      this.strings = strings;
      this.index = index;
      this.buffer = buffer;
    }
    strings;
    index;
    buffer;
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
    parent;
    skin;
    slotIndex;
    mesh;
    inheritDeform;
    constructor(mesh, skin, slotIndex, parent, inheritDeform) {
      this.mesh = mesh;
      this.skin = skin;
      this.slotIndex = slotIndex;
      this.parent = parent;
      this.inheritDeform = inheritDeform;
    }
  }
  class Vertices {
    constructor(bones = null, vertices = null) {
      this.bones = bones;
      this.vertices = vertices;
    }
    bones;
    vertices;
  }
})(spine || (spine = {}));
((spine2) => {
  class SkeletonBounds {
    /** The left edge of the axis aligned bounding box. */
    minX = 0;
    /** The bottom edge of the axis aligned bounding box. */
    minY = 0;
    /** The right edge of the axis aligned bounding box. */
    maxX = 0;
    /** The top edge of the axis aligned bounding box. */
    maxY = 0;
    /** The visible bounding boxes. */
    boundingBoxes = new Array();
    /** The world vertices for the bounding box polygons. */
    polygons = new Array();
    polygonPool = new spine2.Pool(() => {
      return spine2.Utils.newFloatArray(16);
    });
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
    triangulator = new spine2.Triangulator();
    clippingPolygon = new Array();
    clipOutput = new Array();
    clippedVertices = new Array();
    clippedTriangles = new Array();
    scratch = new Array();
    clipAttachment;
    clippingPolygons;
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
    /** The skeleton's name, which by default is the name of the skeleton data file, if possible. May be null. */
    name;
    /** The skeleton's bones, sorted parent first. The root bone is always the first bone. */
    bones = new Array();
    // Ordered parents first.
    /** The skeleton's slots. */
    slots = new Array();
    // Setup pose draw order.
    skins = new Array();
    /** The skeleton's default skin. By default this skin contains all attachments that were not in a skin in Spine.
     *
     * See {@link Skeleton#getAttachmentByName()}.
     * May be null. */
    defaultSkin;
    /** The skeleton's events. */
    events = new Array();
    /** The skeleton's animations. */
    animations = new Array();
    /** The skeleton's IK constraints. */
    ikConstraints = new Array();
    /** The skeleton's transform constraints. */
    transformConstraints = new Array();
    /** The skeleton's path constraints. */
    pathConstraints = new Array();
    /** The X coordinate of the skeleton's axis aligned bounding box in the setup pose. */
    x;
    /** The Y coordinate of the skeleton's axis aligned bounding box in the setup pose. */
    y;
    /** The width of the skeleton's axis aligned bounding box in the setup pose. */
    width;
    /** The height of the skeleton's axis aligned bounding box in the setup pose. */
    height;
    /** The Spine version used to export the skeleton data, or null. */
    version;
    /** The skeleton data hash. This value will change if any of the skeleton data has changed. May be null. */
    hash;
    // Nonessential
    /** The dopesheet FPS in Spine. Available only when nonessential data was exported. */
    fps = 0;
    /** The path to the images directory as defined in Spine. Available only when nonessential data was exported. May be null. */
    imagesPath;
    /** The path to the audio directory as defined in Spine. Available only when nonessential data was exported. May be null. */
    audioPath;
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
    attachmentLoader;
    /** Scales bone positions, image sizes, and translations as they are loaded. This allows different size images to be used at
     * runtime than were used in Spine.
     *
     * See [Scaling](http://esotericsoftware.com/spine-loading-skeleton-data#Scaling) in the Spine Runtimes Guide. */
    scale = 1;
    linkedMeshes = new Array();
    constructor(attachmentLoader) {
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
    parent;
    skin;
    slotIndex;
    mesh;
    inheritDeform;
    constructor(mesh, skin, slotIndex, parent, inheritDeform) {
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
      this.slotIndex = slotIndex;
      this.name = name;
      this.attachment = attachment;
    }
    slotIndex;
    name;
    attachment;
  }
  spine2.SkinEntry = SkinEntry;
  class Skin {
    /** The skin's name, which is unique across all skins in the skeleton. */
    name;
    attachments = new Array();
    bones = Array();
    constraints = new Array();
    constructor(name) {
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
    /** The slot's setup pose data. */
    data;
    /** The bone this slot belongs to. */
    bone;
    /** The color used to tint the slot's attachment. If {@link #getDarkColor()} is set, this is used as the light color for two
     * color tinting. */
    color;
    /** The dark color used to tint the slot's attachment for two color tinting, or null if two color tinting is not used. The dark
     * color's alpha is not used. */
    darkColor;
    attachment;
    attachmentTime;
    attachmentState;
    /** Values to deform the slot's attachment. For an unweighted mesh, the entries are local positions for each vertex. For a
     * weighted mesh, the entries are an offset for each vertex which will be added to the mesh's local vertex positions.
     *
     * See {@link VertexAttachment#computeWorldVertices()} and {@link DeformTimeline}. */
    deform = new Array();
    constructor(data, bone) {
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
    /** The index of the slot in {@link Skeleton#getSlots()}. */
    index;
    /** The name of the slot, which is unique across all slots in the skeleton. */
    name;
    /** The bone this slot belongs to. */
    boneData;
    /** The color used to tint the slot's attachment. If {@link #getDarkColor()} is set, this is used as the light color for two
     * color tinting. */
    color = new spine2.Color(1, 1, 1, 1);
    /** The dark color used to tint the slot's attachment for two color tinting, or null if two color tinting is not used. The dark
     * color's alpha is not used. */
    darkColor;
    /** The name of the attachment that is visible for this slot in the setup pose, or null if no attachment is visible. */
    attachmentName;
    /** The blend mode for drawing the slot's attachment. */
    blendMode;
    constructor(index, name, boneData) {
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
    _image;
    constructor(image) {
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
    renderObject;
    u = 0;
    v = 0;
    u2 = 0;
    v2 = 0;
    width = 0;
    height = 0;
    rotate = false;
    offsetX = 0;
    offsetY = 0;
    originalWidth = 0;
    originalHeight = 0;
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
    pages = new Array();
    regions = new Array();
    constructor(atlasText, textureLoader) {
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
    lines;
    index = 0;
    constructor(text) {
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
    name;
    minFilter;
    magFilter;
    uWrap;
    vWrap;
    texture;
    width;
    height;
  }
  spine2.TextureAtlasPage = TextureAtlasPage;
  class TextureAtlasRegion extends spine2.TextureRegion {
    page;
    name;
    x;
    y;
    index;
    rotate;
    degrees;
    texture;
  }
  spine2.TextureAtlasRegion = TextureAtlasRegion;
})(spine || (spine = {}));
((spine2) => {
  class TransformConstraint {
    /** The transform constraint's setup pose data. */
    data;
    /** The bones that will be modified by this transform constraint. */
    bones;
    /** The target bone whose world transform will be copied to the constrained bones. */
    target;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
    rotateMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
    translateMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained scales. */
    scaleMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained scales. */
    shearMix = 0;
    temp = new spine2.Vector2();
    active = false;
    constructor(data, skeleton) {
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
    /** The bones that will be modified by this transform constraint. */
    bones = new Array();
    /** The target bone whose world transform will be copied to the constrained bones. */
    target;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
    rotateMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
    translateMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained scales. */
    scaleMix = 0;
    /** A percentage (0-1) that controls the mix between the constrained and unconstrained shears. */
    shearMix = 0;
    /** An offset added to the constrained bone rotation. */
    offsetRotation = 0;
    /** An offset added to the constrained bone X translation. */
    offsetX = 0;
    /** An offset added to the constrained bone Y translation. */
    offsetY = 0;
    /** An offset added to the constrained bone scaleX. */
    offsetScaleX = 0;
    /** An offset added to the constrained bone scaleY. */
    offsetScaleY = 0;
    /** An offset added to the constrained bone shearY. */
    offsetShearY = 0;
    relative = false;
    local = false;
    constructor(name) {
      super(name, 0, false);
    }
  }
  spine2.TransformConstraintData = TransformConstraintData;
})(spine || (spine = {}));
((spine2) => {
  class Triangulator {
    convexPolygons = new Array();
    convexPolygonsIndices = new Array();
    indicesArray = new Array();
    isConcaveArray = new Array();
    triangles = new Array();
    polygonPool = new spine2.Pool(() => {
      return new Array();
    });
    polygonIndicesPool = new spine2.Pool(() => {
      return new Array();
    });
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
    array = new Array();
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
  class Color {
    constructor(r = 0, g = 0, b = 0, a = 0) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
    r;
    g;
    b;
    a;
    static WHITE = new Color(1, 1, 1, 1);
    static RED = new Color(1, 0, 0, 1);
    static GREEN = new Color(0, 1, 0, 1);
    static BLUE = new Color(0, 0, 1, 1);
    static MAGENTA = new Color(1, 0, 1, 1);
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
  }
  spine2.Color = Color;
  class MathUtils {
    static PI = 3.1415927;
    static PI2 = MathUtils.PI * 2;
    static radiansToDegrees = 180 / MathUtils.PI;
    static radDeg = MathUtils.radiansToDegrees;
    static degreesToRadians = MathUtils.PI / 180;
    static degRad = MathUtils.degreesToRadians;
    static clamp(value, min, max) {
      if (value < min) return min;
      if (value > max) return max;
      return value;
    }
    static cosDeg(degrees) {
      return Math.cos(degrees * MathUtils.degRad);
    }
    static sinDeg(degrees) {
      return Math.sin(degrees * MathUtils.degRad);
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
      return MathUtils.randomTriangularWith(min, max, (min + max) * 0.5);
    }
    static randomTriangularWith(min, max, mode) {
      let u = Math.random();
      let d = max - min;
      if (u <= (mode - min) / d) return min + Math.sqrt(u * d * (mode - min));
      return max - Math.sqrt((1 - u) * d * (max - mode));
    }
  }
  spine2.MathUtils = MathUtils;
  class Interpolation {
    apply(start, end, a) {
      return start + (end - start) * this.applyInternal(a);
    }
  }
  spine2.Interpolation = Interpolation;
  class Pow extends Interpolation {
    power = 2;
    constructor(power) {
      super();
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
  class Utils {
    static SUPPORTS_TYPED_ARRAYS = typeof Float32Array !== "undefined";
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
      return Utils.setArraySize(array, size, value);
    }
    static newArray(size, defaultValue) {
      let array = new Array(size);
      for (let i = 0; i < size; i++) array[i] = defaultValue;
      return array;
    }
    static newFloatArray(size) {
      if (Utils.SUPPORTS_TYPED_ARRAYS) {
        return new Float32Array(size);
      } else {
        let array = new Array(size);
        for (let i = 0; i < array.length; i++) array[i] = 0;
        return array;
      }
    }
    static newShortArray(size) {
      if (Utils.SUPPORTS_TYPED_ARRAYS) {
        return new Int16Array(size);
      } else {
        let array = new Array(size);
        for (let i = 0; i < array.length; i++) array[i] = 0;
        return array;
      }
    }
    static toFloatArray(array) {
      return Utils.SUPPORTS_TYPED_ARRAYS ? new Float32Array(array) : array;
    }
    static toSinglePrecision(value) {
      return Utils.SUPPORTS_TYPED_ARRAYS ? Math.fround(value) : value;
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
  }
  spine2.Utils = Utils;
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
    items = new Array();
    instantiator;
    constructor(instantiator) {
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
      this.x = x;
      this.y = y;
    }
    x;
    y;
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
    maxDelta = 0.064;
    framesPerSecond = 0;
    delta = 0;
    totalTime = 0;
    lastTime = Date.now() / 1e3;
    frameCount = 0;
    frameTime = 0;
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
    values;
    addedValues = 0;
    lastValue = 0;
    mean = 0;
    dirty = true;
    constructor(windowSize = 32) {
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
    name;
    constructor(name) {
      if (name == null) throw new Error("name cannot be null.");
      this.name = name;
    }
  }
  spine2.Attachment = Attachment;
  class VertexAttachment extends Attachment {
    static nextID = 0;
    /** The unique ID for this attachment. */
    id = (VertexAttachment.nextID++ & 65535) << 11;
    /** The bones which affect the {@link #getVertices()}. The array entries are, for each vertex, the number of bones affecting
     * the vertex followed by that many bone indices, which is the index of the bone in {@link Skeleton#bones}. Will be null
     * if this attachment has no weights. */
    bones;
    /** The vertex positions in the bone's coordinate system. For a non-weighted attachment, the values are `x,y`
     * entries for each vertex. For a weighted attachment, the values are `x,y,weight` entries for each bone affecting
     * each vertex. */
    vertices;
    /** The maximum number of world vertex values that can be output by
     * {@link #computeWorldVertices()} using the `count` parameter. */
    worldVerticesLength = 0;
    /** Deform keys for the deform attachment are also applied to this attachment. May be null if no deform keys should be applied. */
    deformAttachment = this;
    constructor(name) {
      super(name);
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
  }
  spine2.VertexAttachment = VertexAttachment;
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
    color = new spine2.Color(1, 1, 1, 1);
    constructor(name) {
      super(name);
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
    /** Clipping is performed between the clipping polygon's slot and the end slot. Returns null if clipping is done until the end of
     * the skeleton's rendering. */
    endSlot;
    // Nonessential.
    /** The color of the clipping polygon as it was in Spine. Available only when nonessential data was exported. Clipping polygons
     * are not usually rendered at runtime. */
    color = new spine2.Color(0.2275, 0.2275, 0.8078, 1);
    // ce3a3aff
    constructor(name) {
      super(name);
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
    region;
    /** The name of the texture region for this attachment. */
    path;
    /** The UV pair for each vertex, normalized within the texture region. */
    regionUVs;
    /** The UV pair for each vertex, normalized within the entire texture.
     *
     * See {@link #updateUVs}. */
    uvs;
    /** Triplets of vertex indices which describe the mesh's triangulation. */
    triangles;
    /** The color to tint the mesh. */
    color = new spine2.Color(1, 1, 1, 1);
    /** The width of the mesh's image. Available only when nonessential data was exported. */
    width;
    /** The height of the mesh's image. Available only when nonessential data was exported. */
    height;
    /** The number of entries at the beginning of {@link #vertices} that make up the mesh hull. */
    hullLength;
    /** Vertex index pairs describing edges for controling triangulation. Mesh triangles will never cross edges. Only available if
     * nonessential data was exported. Triangulation is not performed at runtime. */
    edges;
    parentMesh;
    tempColor = new spine2.Color(0, 0, 0, 0);
    constructor(name) {
      super(name);
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
    /** The lengths along the path in the setup pose from the start of the path to the end of each Bezier curve. */
    lengths;
    /** If true, the start and end knots are connected. */
    closed = false;
    /** If true, additional calculations are performed to make calculating positions along the path more accurate. If false, fewer
     * calculations are performed but calculating positions along the path is less accurate. */
    constantSpeed = false;
    /** The color of the path as it was in Spine. Available only when nonessential data was exported. Paths are not usually
     * rendered at runtime. */
    color = new spine2.Color(1, 1, 1, 1);
    constructor(name) {
      super(name);
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
    x;
    y;
    rotation;
    /** The color of the point attachment as it was in Spine. Available only when nonessential data was exported. Point attachments
     * are not usually rendered at runtime. */
    color = new spine2.Color(0.38, 0.94, 0, 1);
    constructor(name) {
      super(name);
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
  class RegionAttachment extends spine2.Attachment {
    static OX1 = 0;
    static OY1 = 1;
    static OX2 = 2;
    static OY2 = 3;
    static OX3 = 4;
    static OY3 = 5;
    static OX4 = 6;
    static OY4 = 7;
    static X1 = 0;
    static Y1 = 1;
    static C1R = 2;
    static C1G = 3;
    static C1B = 4;
    static C1A = 5;
    static U1 = 6;
    static V1 = 7;
    static X2 = 8;
    static Y2 = 9;
    static C2R = 10;
    static C2G = 11;
    static C2B = 12;
    static C2A = 13;
    static U2 = 14;
    static V2 = 15;
    static X3 = 16;
    static Y3 = 17;
    static C3R = 18;
    static C3G = 19;
    static C3B = 20;
    static C3A = 21;
    static U3 = 22;
    static V3 = 23;
    static X4 = 24;
    static Y4 = 25;
    static C4R = 26;
    static C4G = 27;
    static C4B = 28;
    static C4A = 29;
    static U4 = 30;
    static V4 = 31;
    /** The local x translation. */
    x = 0;
    /** The local y translation. */
    y = 0;
    /** The local scaleX. */
    scaleX = 1;
    /** The local scaleY. */
    scaleY = 1;
    /** The local rotation. */
    rotation = 0;
    /** The width of the region attachment in Spine. */
    width = 0;
    /** The height of the region attachment in Spine. */
    height = 0;
    /** The color to tint the region attachment. */
    color = new spine2.Color(1, 1, 1, 1);
    /** The name of the texture region for this attachment. */
    path;
    rendererObject;
    region;
    /** For each of the 4 vertices, a pair of <code>x,y</code> values that is the local position of the vertex.
     *
     * See {@link #updateOffset()}. */
    offset = spine2.Utils.newFloatArray(8);
    uvs = spine2.Utils.newFloatArray(8);
    tempColor = new spine2.Color(1, 1, 1, 1);
    constructor(name) {
      super(name);
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
      offset[RegionAttachment.OX1] = localXCos - localYSin;
      offset[RegionAttachment.OY1] = localYCos + localXSin;
      offset[RegionAttachment.OX2] = localXCos - localY2Sin;
      offset[RegionAttachment.OY2] = localY2Cos + localXSin;
      offset[RegionAttachment.OX3] = localX2Cos - localY2Sin;
      offset[RegionAttachment.OY3] = localY2Cos + localX2Sin;
      offset[RegionAttachment.OX4] = localX2Cos - localYSin;
      offset[RegionAttachment.OY4] = localYCos + localX2Sin;
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
      offsetX = vertexOffset[RegionAttachment.OX1];
      offsetY = vertexOffset[RegionAttachment.OY1];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
      offset += stride;
      offsetX = vertexOffset[RegionAttachment.OX2];
      offsetY = vertexOffset[RegionAttachment.OY2];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
      offset += stride;
      offsetX = vertexOffset[RegionAttachment.OX3];
      offsetY = vertexOffset[RegionAttachment.OY3];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
      offset += stride;
      offsetX = vertexOffset[RegionAttachment.OX4];
      offsetY = vertexOffset[RegionAttachment.OY4];
      worldVertices[offset] = offsetX * a + offsetY * b + x;
      worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
    }
    copy() {
      let copy = new RegionAttachment(this.name);
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
  }
  spine2.RegionAttachment = RegionAttachment;
})(spine || (spine = {}));
((spine2) => {
  class JitterEffect {
    jitterX = 0;
    jitterY = 0;
    constructor(jitterX, jitterY) {
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
  class SwirlEffect {
    static interpolation = new spine2.PowOut(2);
    centerX = 0;
    centerY = 0;
    radius = 0;
    angle = 0;
    worldX = 0;
    worldY = 0;
    constructor(radius) {
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
        let theta = SwirlEffect.interpolation.apply(0, radAngle, (this.radius - dist) / this.radius);
        let cos = Math.cos(theta);
        let sin = Math.sin(theta);
        position.x = cos * x - sin * y + this.worldX;
        position.y = sin * x + cos * y + this.worldY;
      }
    }
    end() {
    }
  }
  spine2.SwirlEffect = SwirlEffect;
})(spine || (spine = {}));
var spineNS = spine;
export {
  spineNS as spine
};
