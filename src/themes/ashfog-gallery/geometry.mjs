export const wrap = (value, length) => ((value % length) + length) % length;

export function relativePosition(index, position, count) {
  return wrap(index - position + count / 2, count) - count / 2;
}

export function galleryGeometry(width) {
  const mobile = width < 700;
  const unit = mobile ? width / 390 : width / 1440;
  const perspective = (mobile ? 760 : 960) * unit;
  const roomDepth = (mobile ? 1400 : 1800) * unit;
  const roomHalfWidth = (mobile ? 480 : 800) * unit;
  const roomHeight = (mobile ? 1500 : 1750) * unit;
  const sideDepth = (mobile ? 1300 : 2050) * unit;
  const cornerRadius = (mobile ? 120 : 220) * unit;
  const slot = (mobile ? 720 : 900) * unit;
  const backRun = roomHalfWidth - cornerRadius;
  const cornerRun = Math.PI * cornerRadius / 2;
  const pathLength = backRun + cornerRun + sideDepth;

  return {
    mobile,
    unit,
    perspective,
    roomDepth,
    roomHalfWidth,
    roomHeight,
    sideDepth,
    cornerRadius,
    slot,
    backRun,
    cornerRun,
    spacing: slot * perspective / (perspective + roomDepth),
    cardWidth: (mobile ? 400 : 520) * unit,
    artHeight: (mobile ? 540 : 660) * unit,
    labelScale: (mobile ? 1.16 : 1.45) * unit,
    visible: pathLength / slot
  };
}

function rightWallPose(path, geometry) {
  const { backRun, cornerRun, cornerRadius, roomDepth, roomHalfWidth } = geometry;

  if (path <= backRun) {
    return { x: path, z: -roomDepth, angle: 0, wall: "back" };
  }

  if (path <= backRun + cornerRun) {
    const theta = (path - backRun) / cornerRadius;
    return {
      x: backRun + cornerRadius * Math.sin(theta),
      z: -roomDepth + cornerRadius * (1 - Math.cos(theta)),
      angle: -theta * 180 / Math.PI,
      wall: "corner"
    };
  }

  return {
    x: roomHalfWidth,
    z: -roomDepth + cornerRadius + path - backRun - cornerRun,
    angle: -90,
    wall: "side"
  };
}

export function cardPose(distance, geometry) {
  const rawPath = Math.abs(distance) * geometry.slot;
  const path = Math.min(rawPath, geometry.visible * geometry.slot);
  const right = rightWallPose(path, geometry);
  const side = distance < 0 ? -1 : 1;
  const angle = right.angle * side;
  const radians = angle * Math.PI / 180;
  const surfaceOffset = 4 * geometry.unit;

  return {
    x: right.x * side + Math.sin(radians) * surfaceOffset,
    z: right.z + Math.cos(radians) * surfaceOffset,
    angle,
    wall: right.wall,
    visible: rawPath <= geometry.visible * geometry.slot
  };
}
