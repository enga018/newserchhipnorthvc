"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/* The app ships as a single self-contained index.html. To keep one source of
   truth, we pull the pure-logic block straight out of that file (between the
   "BEGIN/END testable logic" markers) and evaluate it in isolation. The tests
   therefore exercise the exact code that goes live. */
function loadLogic() {
  const html = fs.readFileSync(path.join(__dirname, "..", "app", "index.html"), "utf8");
  const m = html.match(/=== BEGIN testable logic ===[\s\S]*?\*\/([\s\S]*?)\/\* === END testable logic ===/);
  if (!m) throw new Error("testable logic block not found in index.html");
  return new Function(
    m[1] + "\nreturn { getExifOrientation, needsFollowUp, missingFields, isRecordAbsent, computeIsAbsent, familyMembersIncomplete, householdStats, correctionState, detailsSnapshotOf, diffDetailsSnapshots };"
  )();
}

const { missingFields, isRecordAbsent, computeIsAbsent, familyMembersIncomplete, needsFollowUp, getExifOrientation, householdStats, correctionState, detailsSnapshotOf, diffDetailsSnapshots } = loadLogic();

// A minimal fully-complete record: owner details filled, one occupied residential
// unit with a fully-filled head member. Used as the baseline for "no gaps" tests.
function completeResidentRecord() {
  return {
    ownerName: "A", fatherHusbandName: "B", contact: "9999999999",
    families: [{ type: "Residential", occupied: true, members: [
      { name: "A", gender: "Male", age: 40, relation: "Self" }
    ]}]
  };
}

/* ---------------- missingFields ---------------- */

test("missingFields: complete resident record has no gaps", () => {
  assert.deepEqual(missingFields(completeResidentRecord()), []);
});

test("missingFields: resident reports the resident-specific fields plus no units", () => {
  assert.deepEqual(missingFields({}), [
    "Owner name", "Father/Husband name", "Phone number", "At least one unit"
  ]);
});

test("missingFields: complete institution has no gaps", () => {
  const r = {
    isInstitution: true,
    organizationName: "Org", contactPerson: "P",
    designation: "Head", contact: "999",
    families: [{ type: "Commercial", occupied: true, label: "Shop" }]
  };
  assert.deepEqual(missingFields(r), []);
});

test("missingFields: institution uses the institution field set, not the resident one", () => {
  assert.deepEqual(missingFields({ isInstitution: true }), [
    "Organization name", "Contact person", "Designation", "Phone number", "At least one unit"
  ]);
});

test("missingFields: reports only the genuinely missing fields", () => {
  const r = { ...completeResidentRecord(), fatherHusbandName: "", contact: "" };
  assert.deepEqual(missingFields(r), ["Father/Husband name", "Phone number"]);
});

test("missingFields: flags an occupied unit with an incomplete member", () => {
  const r = { ...completeResidentRecord(), families: [
    { type: "Residential", occupied: true, members: [{ name: "", gender: "", age: "", relation: "Self" }] }
  ]};
  assert.deepEqual(missingFields(r), ["Family member details"]);
});

test("missingFields: flags a non-residential unit with no label", () => {
  const r = { ...completeResidentRecord(), families: [
    { type: "Commercial", occupied: true, label: "" }
  ]};
  assert.deepEqual(missingFields(r), ["Unit name/label"]);
});

/* ---------------- isRecordAbsent / computeIsAbsent ---------------- */

test("isRecordAbsent: derives live from the data, ignoring any stored flag", () => {
  // A stale/incorrect stored isAbsent must not be trusted — the live data wins either way.
  assert.equal(isRecordAbsent({ ...completeResidentRecord(), isAbsent: true }), false);
  assert.equal(isRecordAbsent({ isAbsent: false }), true);
});

test("isRecordAbsent: institution missing any of its fields is absent", () => {
  assert.equal(isRecordAbsent({ isInstitution: true }), true);
});

test("isRecordAbsent: resident with no owner name is absent", () => {
  assert.equal(isRecordAbsent({}), true);
  assert.equal(isRecordAbsent(completeResidentRecord()), false);
});

test("isRecordAbsent: a record with zero units is always absent", () => {
  const r = { ownerName: "A", fatherHusbandName: "B", contact: "999", families: [] };
  assert.equal(isRecordAbsent(r), true);
});

test("isRecordAbsent: an occupied residential unit with zero members is absent", () => {
  const r = { ...completeResidentRecord(), families: [
    { type: "Residential", occupied: true, members: [] }
  ]};
  assert.equal(isRecordAbsent(r), true);
});

test("isRecordAbsent: a vacant unit needs no members and doesn't make the record absent", () => {
  const r = { ...completeResidentRecord() };
  r.families.push({ type: "Residential", occupied: false, members: [] });
  assert.equal(isRecordAbsent(r), false);
});

test("isRecordAbsent: an occupied non-residential unit needs a label", () => {
  const r = { ownerName: "A", fatherHusbandName: "B", contact: "999", families: [
    { type: "Commercial", occupied: true, label: "" }
  ]};
  assert.equal(isRecordAbsent(r), true);
  r.families[0].label = "Corner shop";
  assert.equal(isRecordAbsent(r), false);
});

/* ---------------- familyMembersIncomplete ---------------- */

test("familyMembersIncomplete: non-residential units are never checked for members", () => {
  assert.equal(familyMembersIncomplete([{ type: "Commercial", occupied: true, members: [] }]), false);
});

test("familyMembersIncomplete: an occupied residential unit with zero members is incomplete", () => {
  assert.equal(familyMembersIncomplete([{ type: "Residential", occupied: true, members: [] }]), true);
});

/* ---------------- detailsSnapshotOf / diffDetailsSnapshots ---------------- */

test("diffDetailsSnapshots: no snapshot on either side yields no changes", () => {
  assert.deepEqual(diffDetailsSnapshots(null, detailsSnapshotOf(completeResidentRecord())), []);
  assert.deepEqual(diffDetailsSnapshots(detailsSnapshotOf(completeResidentRecord()), null), []);
});

test("diffDetailsSnapshots: identical records report no changes", () => {
  const r = completeResidentRecord();
  assert.deepEqual(diffDetailsSnapshots(detailsSnapshotOf(r), detailsSnapshotOf(r)), []);
});

test("diffDetailsSnapshots: catches a spelling fix a completeness check can't see", () => {
  const before = detailsSnapshotOf({ ...completeResidentRecord(), ownerName: "Ramesh Kumer" });
  const after = detailsSnapshotOf({ ...completeResidentRecord(), ownerName: "Ramesh Kumar" });
  assert.deepEqual(diffDetailsSnapshots(before, after), ['Owner name: "Ramesh Kumer" -> "Ramesh Kumar"']);
});

test("diffDetailsSnapshots: catches a head-of-family member field change", () => {
  const before = detailsSnapshotOf(completeResidentRecord());
  const afterRec = completeResidentRecord();
  afterRec.families[0].members[0].name = "A. Smith";
  const after = detailsSnapshotOf(afterRec);
  assert.deepEqual(diffDetailsSnapshots(before, after), ['Unit 1 member 1 name: "A" -> "A. Smith"']);
});

test("diffDetailsSnapshots: reports added/removed units and members", () => {
  const before = detailsSnapshotOf({ families: [{ type: "Residential", members: [{ name: "A" }] }] });
  const after = detailsSnapshotOf({ families: [
    { type: "Residential", members: [{ name: "A" }, { name: "B" }] },
    { type: "Commercial", label: "Shop" }
  ]});
  const changes = diffDetailsSnapshots(before, after);
  assert.ok(changes.includes("Unit 1 member 2: added (B)"));
  assert.ok(changes.includes("Unit 2: added"));
});

test("familyMembersIncomplete: a vacant residential unit is skipped regardless of members", () => {
  assert.equal(familyMembersIncomplete([{ type: "Residential", occupied: false, members: [] }]), false);
});

/* ---------------- needsFollowUp ---------------- */

test("needsFollowUp: a complete present record needs nothing", () => {
  assert.equal(needsFollowUp({ ...completeResidentRecord(), needsCorrection: false }), false);
});

test("needsFollowUp: an incomplete record needs follow-up", () => {
  assert.equal(needsFollowUp({}), true);
});

test("needsFollowUp: admin-flagged corrections need follow-up even if otherwise complete", () => {
  assert.equal(needsFollowUp({ ...completeResidentRecord(), needsCorrection: true }), true);
});

/* ---------------- householdStats ---------------- */

test("householdStats: missing/empty families is all zeros", () => {
  const zero = { families: 0, population: 0, males: 0, females: 0, children: 0, adults: 0, childMales: 0, childFemales: 0, adultMales: 0, adultFemales: 0, familySizes: [] };
  assert.deepEqual(householdStats({}), zero);
  assert.deepEqual(householdStats({ families: [] }), zero);
});

test("householdStats: counts families, population and gender split", () => {
  const r = { families: [
    { headName: "A", members: [
      { name: "A", gender: "Male", age: 40, relation: "Head" },
      { name: "B", gender: "Female", age: 38, relation: "Spouse" },
    ]},
    { headName: "C", members: [
      { name: "C", gender: "Female", age: 25, relation: "Head" },
    ]},
  ]};
  const s = householdStats(r);
  assert.equal(s.families, 2);
  assert.equal(s.population, 3);
  assert.equal(s.males, 1);
  assert.equal(s.females, 2);
  assert.equal(s.adultMales, 1);
  assert.equal(s.adultFemales, 2);
  assert.equal(s.childMales, 0);
  assert.equal(s.childFemales, 0);
  assert.deepEqual(s.familySizes, [2, 1]);
});

test("householdStats: child boundary is age < 18 (17 child, 18 adult)", () => {
  const r = { families: [{ members: [
    { name: "kid", gender: "Male", age: 17 },
    { name: "adult", gender: "Female", age: 18 },
    { name: "baby", gender: "Female", age: 0 },
  ]}]};
  const s = householdStats(r);
  assert.equal(s.children, 2); // 17 and 0
  assert.equal(s.adults, 1);   // 18
  assert.equal(s.childMales, 1); // 17yo male
  assert.equal(s.childFemales, 1); // 0yo female
  assert.equal(s.adultMales, 0);
  assert.equal(s.adultFemales, 1); // 18yo female
  assert.deepEqual(s.familySizes, [3]);
});

test("householdStats: blank/unknown gender is not counted in gender totals", () => {
  const r = { families: [{ members: [
    { name: "A", gender: "", age: 30 },
    { name: "B", age: 25 },
    { name: "C", gender: "", age: 20 },
  ]}]};
  const s = householdStats(r);
  assert.equal(s.population, 3);
  assert.equal(s.males, 0);
  assert.equal(s.females, 0);
  assert.equal(s.adultMales, 0);
  assert.equal(s.adultFemales, 0);
  assert.equal(s.childMales, 0);
  assert.equal(s.childFemales, 0);
  assert.deepEqual(s.familySizes, [3]);
});

test("householdStats: blank/unknown age counts as neither child nor adult", () => {
  const r = { families: [{ members: [
    { name: "x", gender: "Male", age: "" },
    { name: "y", gender: "Female" },
  ]}]};
  const s = householdStats(r);
  assert.equal(s.population, 2);
  assert.equal(s.children, 0);
  assert.equal(s.adults, 0);
  assert.equal(s.childMales, 0);
  assert.equal(s.childFemales, 0);
  assert.equal(s.adultMales, 0);
  assert.equal(s.adultFemales, 0);
  assert.equal(s.males, 1);
  assert.equal(s.females, 1);
  assert.deepEqual(s.familySizes, [2]);
});

test("householdStats: occupied residential unit with zero members doesn't count as a household", () => {
  const r = { families: [
    { type: "Residential", occupied: true, members: [] },
    { type: "Residential", occupied: true, members: [{ name: "A", gender: "Male", age: 25 }] },
  ]};
  const s = householdStats(r);
  assert.equal(s.families, 1);
  assert.equal(s.population, 1);
  assert.deepEqual(s.familySizes, [1]);
});

/* ---------------- correctionState ---------------- */

test("correctionState: clean record is none", () => {
  assert.equal(correctionState({}), "none");
});

test("correctionState: legacy needsCorrection reads as pending", () => {
  assert.equal(correctionState({ needsCorrection: true }), "pending");
});

test("correctionState: explicit statuses pass through", () => {
  assert.equal(correctionState({ correctionStatus: "pending" }), "pending");
  assert.equal(correctionState({ correctionStatus: "fixed" }), "fixed");
  assert.equal(correctionState({ correctionStatus: "verified" }), "verified");
});

test("correctionState: a verified record is no longer pending even if legacy flag lingers", () => {
  assert.equal(correctionState({ correctionStatus: "verified", needsCorrection: false }), "verified");
});

/* ---------------- getExifOrientation ---------------- */

/* Build a minimal JPEG containing an APP1/EXIF segment whose IFD0 has a
   single Orientation tag (0x0112) set to the given value. */
function makeJpegWithOrientation(orientation, little = true) {
  const buf = new ArrayBuffer(34);
  const v = new DataView(buf);
  v.setUint16(0, 0xFFD8, false);          // SOI
  v.setUint16(2, 0xFFE1, false);          // APP1 marker
  v.setUint16(4, 0x0000, false);          // segment length (parser ignores it for EXIF)
  v.setUint32(6, 0x45786966, false);      // "Exif"
  v.setUint16(10, 0x0000, false);         // "\0\0"
  // TIFF header begins at byte 12
  v.setUint16(12, little ? 0x4949 : 0x4D4D, false); // byte order ("II" / "MM")
  v.setUint16(14, 0x002A, little);        // TIFF magic
  v.setUint32(16, 8, little);             // offset to IFD0 (relative to TIFF start)
  // IFD0 at byte 20
  v.setUint16(20, 1, little);             // one directory entry
  v.setUint16(22, 0x0112, little);        // tag: Orientation
  v.setUint16(24, 3, little);             // type: SHORT
  v.setUint32(26, 1, little);             // count
  v.setUint16(30, orientation, little);   // value
  return buf;
}

test("getExifOrientation: reads a little-endian orientation tag", () => {
  assert.equal(getExifOrientation(makeJpegWithOrientation(6, true)), 6);
});

test("getExifOrientation: reads a big-endian orientation tag", () => {
  assert.equal(getExifOrientation(makeJpegWithOrientation(8, false)), 8);
});

test("getExifOrientation: normal orientation (1) round-trips", () => {
  assert.equal(getExifOrientation(makeJpegWithOrientation(1, true)), 1);
});

test("getExifOrientation: non-JPEG data falls back to 1", () => {
  const buf = new Uint8Array([0x89, 0x50, 0x4E, 0x47]).buffer; // PNG signature
  assert.equal(getExifOrientation(buf), 1);
});

test("getExifOrientation: a JPEG with no EXIF segment falls back to 1", () => {
  // SOI + APP0 (JFIF) segment of length 2, then nothing
  const buf = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x02]).buffer;
  assert.equal(getExifOrientation(buf), 1);
});

test("getExifOrientation: truncated/garbage buffer falls back to 1 without throwing", () => {
  assert.equal(getExifOrientation(new Uint8Array([0xFF, 0xD8]).buffer), 1);
  assert.equal(getExifOrientation(new ArrayBuffer(0)), 1);
});
