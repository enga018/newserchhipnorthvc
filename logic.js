/* ============================================================
   Pure record-validation + EXIF logic — single source of truth.

   Shared by index.html (browser) and the test suite (Node).
   In the browser this is loaded as a classic <script>, which
   exposes the functions as globals. In Node it is required as a
   CommonJS module. No dependencies, no build step.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;          // Node / tests
  } else {
    Object.assign(root, api);      // Browser: expose as globals
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  /* Which required fields are missing from a record. The required set
     differs for institutions vs. individual residents. Drives the
     "fix needed" prompts shown to workers. */
  function missingFields(r) {
    const m = [];
    if (r.isInstitution) {
      if (!r.organizationName) m.push("Organization name");
      if (!r.contactPerson) m.push("Contact person");
      if (!r.designation) m.push("Designation");
      if (!r.contact) m.push("Phone number");
    } else {
      if (!r.ownerName) m.push("Owner name");
      if (!r.fatherHusbandName) m.push("Father/Husband name");
      if (!r.contact) m.push("Phone number");
    }
    return m;
  }

  /* Was the property owner absent when surveyed? Trust the stored flag
     for app-saved records; fall back for very old records that predate it. */
  function isRecordAbsent(r) {
    if (typeof r.isAbsent === "boolean") return r.isAbsent;
    if (r.isInstitution) return false;
    return !r.ownerName;
  }

  /* A record needs follow-up if the owner was absent or an admin flagged
     it for correction. Feeds the dashboard "needs follow-up" counts. */
  function needsFollowUp(r) {
    return isRecordAbsent(r) || r.needsCorrection === true;
  }

  /* Read the EXIF orientation tag (0x0112) out of a JPEG so captured
     photos can be rotated upright. Returns 1 (normal) for anything that
     isn't a JPEG with a readable orientation tag. Hand-rolled binary
     parser over the APP1/EXIF segment. */
  function getExifOrientation(arrayBuffer) {
    try {
      const view = new DataView(arrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) return 1; // not a JPEG
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) { // APP1 (EXIF)
          if (view.getUint32(offset + 2, false) !== 0x45786966) return 1; // "Exif"
          const little = view.getUint16(offset + 8, false) === 0x4949;
          const tiffOffset = offset + 8;
          const dirOffset = tiffOffset + view.getUint32(offset + 12, little);
          const entries = view.getUint16(dirOffset, little);
          for (let i = 0; i < entries; i++) {
            const entryOffset = dirOffset + 2 + i * 12;
            if (view.getUint16(entryOffset, little) === 0x0112) {
              return view.getUint16(entryOffset + 8, little);
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
    } catch (e) { /* fall through */ }
    return 1;
  }

  return { missingFields, isRecordAbsent, needsFollowUp, getExifOrientation };
});
