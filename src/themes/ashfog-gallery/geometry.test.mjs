import test from "node:test";
import assert from "node:assert/strict";
import { wrap, relativePosition, galleryGeometry, cardPose } from "./geometry.mjs";

test("looping works in both directions, including many rotations", () => {
  for (const position of [-2401.25, -12, -0.3, 0, 11.9, 12, 2401.25]) {
    assert.ok(wrap(position, 12) >= 0 && wrap(position, 12) < 12);
    assert.ok(Math.abs(wrap(position + 24, 12) - wrap(position, 12)) < 1e-9);
  }
});

test("centered item and neighbors keep the same geometry across the seam", () => {
  assert.equal(relativePosition(0, 0, 12), 0);
  assert.equal(relativePosition(11, 0, 12), -1);
  assert.equal(relativePosition(0, 11, 12), 1);
  for (let index = 0; index < 12; index++) {
    assert.equal(relativePosition(index, .5, 12), relativePosition(index, 12.5, 12));
  }
});

test("the three wall path stays symmetric around the back-wall center", () => {
  const geometry = galleryGeometry(1440);
  const left = cardPose(-2, geometry);
  const right = cardPose(2, geometry);
  assert.equal(left.z, right.z);
  assert.equal(left.x, -right.x);
  assert.equal(left.angle, -right.angle);
  assert.equal(cardPose(0, geometry).wall, "back");
  assert.ok(Math.abs(cardPose(0, geometry).z + geometry.roomDepth) < 5);
  assert.ok(left.angle > 0 && right.angle < 0, "both sides face into the room");
});

test("cards travel from the back wall, around a corner, and onto each side wall", () => {
  const geometry = galleryGeometry(1440);
  const back = cardPose(geometry.backRun * .5 / geometry.slot, geometry);
  const corner = cardPose((geometry.backRun + geometry.cornerRun * .5) / geometry.slot, geometry);
  const side = cardPose((geometry.backRun + geometry.cornerRun + 100) / geometry.slot, geometry);
  assert.equal(back.wall, "back");
  assert.equal(corner.wall, "corner");
  assert.equal(side.wall, "side");
  assert.ok(corner.angle < 0 && corner.angle > -90);
  assert.equal(side.angle, -90);
  assert.ok(back.z < corner.z && corner.z < side.z);
});

test("a wide artwork can occupy two wall segments while crossing either corner", () => {
  const geometry = galleryGeometry(1440);
  const halfArtwork = geometry.cardWidth * .48;
  const atBackCorner = geometry.backRun / geometry.slot;
  const backEdge = cardPose(atBackCorner - halfArtwork / geometry.slot, geometry);
  const cornerEdge = cardPose(atBackCorner + halfArtwork / geometry.slot, geometry);
  assert.equal(backEdge.wall, "back");
  assert.equal(cornerEdge.wall, "corner");
  assert.notEqual(backEdge.angle, cornerEdge.angle);

  const atSideCorner = (geometry.backRun + geometry.cornerRun) / geometry.slot;
  const curvedEdge = cardPose(atSideCorner - halfArtwork / geometry.slot, geometry);
  const sideEdge = cardPose(atSideCorner + halfArtwork / geometry.slot, geometry);
  assert.equal(curvedEdge.wall, "corner");
  assert.equal(sideEdge.wall, "side");
  assert.notEqual(curvedEdge.angle, sideEdge.angle);
});

test("the back wall is distant and the near side-wall exhibits are much larger", () => {
  const geometry = galleryGeometry(1440);
  const back = cardPose(0, geometry);
  const side = cardPose(3, geometry);
  const projectionScale = (z) => geometry.perspective / (geometry.perspective - z);
  assert.ok(back.z < -geometry.perspective);
  assert.ok(side.z > back.z);
  assert.ok(projectionScale(side.z) > projectionScale(back.z) * 2.8);
});

test("responsive poses remain finite and safely in front of the camera", () => {
  for (const width of [320, 390, 590, 700, 1024, 1440, 1920, 3840]) {
    const geometry = galleryGeometry(width);
    for (let distance = -6; distance <= 6; distance += .125) {
      const pose = cardPose(distance, geometry);
      assert.ok([pose.x, pose.z, pose.angle].every(Number.isFinite));
      assert.ok(pose.z < geometry.perspective * .8);
      assert.ok(Math.abs(pose.angle) <= 90);
      const angle = pose.angle * Math.PI / 180;
      const facesCamera = -pose.x * Math.sin(angle) + (geometry.perspective - pose.z) * Math.cos(angle);
      assert.ok(facesCamera > 0, "the actual camera sees the front, even on the near side walls");
      assert.equal(pose.visible, Math.abs(distance) * geometry.slot <= geometry.visible * geometry.slot);
    }
  }
});
