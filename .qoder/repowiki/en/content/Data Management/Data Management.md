# Data Management

<cite>
**Referenced Files in This Document**
- [index.html](file://index.html)
- [sw.js](file://sw.js)
- [README.md](file://README.md)
- [package.json](file://package.json)
- [test\logic.test.js](file://test\logic.test.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the data management architecture for the Property Tax Collector application. It covers the Firestore database schema design, data models for properties, households, and users, real-time synchronization, validation and quality controls, export systems (including CSV generation with UTF-8 BOM and formula protection), the correction workflow with audit trails, and operational considerations such as security, backups, and performance for large datasets.

## Project Structure
The application is a single-page, offline-capable web app built with vanilla JavaScript and Firebase. Data is stored in Firestore collections and synchronized in real time. A service worker enables offline caching of static assets.

```mermaid
graph TB
subgraph "Browser"
UI["User Interface<br/>index.html"]
SW["Service Worker<br/>sw.js"]
end
subgraph "Firebase Services"
AUTH["Firebase Authentication"]
DB["Firestore"]
STORAGE["Cloud Storage"]
end
UI --> AUTH
UI --> DB
UI --> STORAGE
SW --> UI
```

**Diagram sources**
- [index.html](file://index.html)
- [sw.js](file://sw.js)

**Section sources**
- [index.html](file://index.html)
- [sw.js](file://sw.js)

## Core Components
- Real-time listeners for records and users collections
- Validation and quality control logic for completeness and correction states
- Export pipeline for CSV and ZIP photo bundles
- Correction workflow with audit trail and verification
- Offline-first caching via service worker

Key implementation references:
- Real-time listeners and rendering: [index.html](file://index.html)
- Validation helpers: [index.html](file://index.html)
- Export functions: [index.html](file://index.html)
- Service worker caching: [sw.js](file://sw.js)

**Section sources**
- [index.html](file://index.html)
- [sw.js](file://sw.js)

## Architecture Overview
The app uses Firestore collections for persistent storage and Firebase Authentication for identity. Workers and admins subscribe to real-time updates for records and users. Data exports are generated client-side and downloaded to the device.

```mermaid
sequenceDiagram
participant Worker as "Worker App"
participant Auth as "Firebase Auth"
participant DB as "Firestore"
participant Admin as "Admin App"
Worker->>Auth : Sign in
Auth-->>Worker : User session
Worker->>DB : Subscribe to records (workerUid)
DB-->>Worker : Snapshot updates
Worker->>DB : Write record (add/update)
DB-->>Worker : Acknowledge
Admin->>DB : Subscribe to records/users
DB-->>Admin : Snapshot updates
Admin->>DB : Update correction flags/status
DB-->>Worker : Correction state changes
```

**Diagram sources**
- [index.html](file://index.html)

**Section sources**
- [index.html](file://index.html)

## Detailed Component Analysis

### Firestore Collections and Schema Design
- records: Stores property records with metadata, geometry, photo, and correction history.
- users: Stores worker/admin profiles and administrative settings.
- settings: Stores app-wide settings (e.g., village council name).

Collections and representative fields:
- records
  - propertyId: string (indexed)
  - propertyType: enum-like string
  - ownerCategory: enum-like string
  - buildingType: enum-like string
  - isAbsent: boolean
  - latitude/longitude: numbers
  - accuracy: number
  - photo: data URL string
  - families: array of objects (headName, contact, members)
  - workerUid/workerEmail/workerName: strings
  - localTimestamp: ISO string
  - timestamp: server timestamp
  - needsCorrection: boolean
  - correctionStatus: enum-like string
  - corrections: array of audit events
  - adminFlagNote, adminFlaggedAt: strings/dates
  - correctionAllowGps/Photo/Details: booleans
  - remarks: string

- users
  - name: string
  - phone: string
  - email: string
  - role: enum-like string
  - createdAt: server timestamp
  - rangeStart/rangeEnd: numbers (optional)

- settings
  - vcName: string

Notes:
- Indexes: Queries filter by workerUid and propertyId; consider adding composite indexes for frequent filters (e.g., workerUid + localTimestamp).
- Security: Access controlled by Firebase Authentication and Firestore Security Rules (not included here).
- Large fields: photo stored as data URL; consider Cloud Storage for larger images in production.

**Section sources**
- [index.html](file://index.html)

### Data Models

#### Property Record Model
- Core identifiers: propertyId, workerUid, localTimestamp
- Classification: propertyType, ownerCategory, buildingType
- Presence: isAbsent flag derived from validation rules
- Location: latitude, longitude, accuracy
- Media: photo (data URL)
- Demographics: families (array of family objects)
- Administrative: needsCorrection, correctionStatus, corrections, adminFlagNote, adminFlaggedAt, correctionAllowGps/Photo/Details
- Metadata: remarks, timestamps

Validation rules:
- GPS and photo required for save
- Owner/institution fields required depending on ownerCategory
- Duplicate detection by propertyId within the collection
- Range enforcement for new records when assigned

Audit trail:
- corrections array captures admin flags and worker fixes with timestamps and permissions

**Section sources**
- [index.html](file://index.html)

#### Household Model
- headName: derived from the first member or tagged Head
- contact: optional phone for the family
- members: array of member objects with name, gender, age, relation

Household statistics:
- Families, population, children (<18), males/females computed from members

**Section sources**
- [index.html](file://index.html)

#### User Model
- name, phone, email, role
- createdAt: server timestamp
- Optional sticker range: rangeStart, rangeEnd

Administrative controls:
- Admin can assign/clear sticker ranges
- Worker profile auto-healing if missing

**Section sources**
- [index.html](file://index.html)

### Real-Time Synchronization
- Worker view subscribes to records filtered by workerUid
- Admin view subscribes to all records and users
- Listeners update cached arrays and trigger UI renders
- Pagination applied for worker lists

```mermaid
sequenceDiagram
participant UI as "UI Layer"
participant DB as "Firestore"
UI->>DB : onSnapshot(records where workerUid)
DB-->>UI : docs[]
UI->>UI : Update cache and render
UI->>DB : onSnapshot(users)
DB-->>UI : users[]
UI->>UI : Update workers list
```

**Diagram sources**
- [index.html](file://index.html)

**Section sources**
- [index.html](file://index.html)

### Data Validation and Quality Control
- Required fields enforced at save time:
  - GPS coordinates and photo presence
  - Owner/institution-specific fields based on ownerCategory
- Absent flag computed from presence of owner/institution details
- Duplicate detection by propertyId
- Range enforcement for new records when a sticker range is assigned
- Edit locks during corrections based on admin permissions

```mermaid
flowchart TD
Start(["Save Record"]) --> CheckGPS["Check GPS present"]
CheckGPS --> GPSOK{"GPS OK?"}
GPSOK --> |No| ErrorGPS["Show error: GPS required"]
GPSOK --> |Yes| CheckPhoto["Check Photo present"]
CheckPhoto --> PhotoOK{"Photo OK?"}
PhotoOK --> |No| ErrorPhoto["Show error: Photo required"]
PhotoOK --> ComputeAbsent["Compute isAbsent based on owner/institution fields"]
ComputeAbsent --> DupCheck["Check duplicate by propertyId"]
DupCheck --> DupOK{"Unique?"}
DupOK --> |No| ErrorDup["Show error: Duplicate ID"]
DupOK --> RangeCheck["If new record: check sticker range"]
RangeCheck --> RangeOK{"Within range?"}
RangeOK --> |No| ErrorRange["Show error: Outside assigned range"]
RangeOK --> Persist["Persist record"]
Persist --> End(["Done"])
ErrorGPS --> End
ErrorPhoto --> End
ErrorDup --> End
ErrorRange --> End
```

**Diagram sources**
- [index.html](file://index.html)

**Section sources**
- [index.html](file://index.html)

### Export System
- CSV export:
  - UTF-8 BOM for Excel compatibility
  - Formula-injection protection by prefixing risky leading characters with '
  - CRLF line endings
  - Dated filename with property-tax- prefix
- Members CSV:
  - One row per family member across filtered records
- Photos ZIP:
  - Client-side generation using JSZip
  - Downloads as dated archive

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant UI as "UI"
participant FS as "Firestore"
participant Zip as "JSZip"
Admin->>UI : Click Export CSV
UI->>FS : Get filtered records
FS-->>UI : Records[]
UI->>UI : Build CSV rows
UI->>UI : Apply BOM, escape, CRLF
UI-->>Admin : Download CSV
Admin->>UI : Click Export Photos
UI->>FS : Get filtered records with photos
FS-->>UI : Records[]
UI->>Zip : Add base64 images
Zip-->>Admin : Download ZIP
```

**Diagram sources**
- [index.html](file://index.html)

**Section sources**
- [index.html](file://index.html)

### Correction Workflow and Audit Trails
- Admin flags records needing correction with notes and allowed redo actions
- Worker updates the record; latest correction marked as fixed
- Admin verifies correction; status updated to verified
- Full audit trail maintained in the corrections array

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Worker as "Worker"
participant DB as "Firestore"
Admin->>DB : Update record needsCorrection + flags
DB-->>Worker : Receive correction state
Worker->>DB : Update record (fix) + set correctionStatus to fixed
DB-->>Admin : Latest correction status
Admin->>DB : Update correctionStatus to verified
DB-->>Worker : Verified status
```

**Diagram sources**
- [index.html](file://index.html)

**Section sources**
- [index.html](file://index.html)

### Data Security Considerations
- Authentication: Firebase Authentication secures access; only authenticated users can write records.
- Authorization: Firestore Security Rules govern read/write permissions (external to this repository).
- Data protection:
  - CSV escaping prevents formula injection
  - Photos exported as ZIP to reduce exposure
  - Worker profile auto-heal ensures continuity

**Section sources**
- [index.html](file://index.html)

### Backup Strategies
- Firestore snapshots and client-side caching provide resilience against transient failures.
- Admin can export all data as CSV and photos as ZIP for off-device backups.
- Reset operation deletes all records and users in batches; use with caution.

**Section sources**
- [index.html](file://index.html)

## Dependency Analysis
- index.html depends on:
  - Firebase SDKs (auth, firestore, storage)
  - JSZip for photo export
  - Local logic for validation and stats
- sw.js depends on:
  - Static asset caching for offline support

```mermaid
graph LR
IDX["index.html"] --> FB["Firebase SDKs"]
IDX --> JZ["JSZip"]
IDX --> LOGIC["Local Logic"]
SW["sw.js"] --> CACHE["Static Assets Cache"]
IDX -.-> SW
```

**Diagram sources**
- [index.html](file://index.html)
- [sw.js](file://sw.js)

**Section sources**
- [index.html](file://index.html)
- [sw.js](file://sw.js)

## Performance Considerations
- Real-time listeners:
  - Use onSnapshot for live updates; unsubscribe before re-binding to prevent duplicates
  - Paginate worker lists to limit DOM and memory footprint
- Export performance:
  - Batch deletions for reset operations
  - Client-side ZIP generation; consider progress feedback for large sets
- Data volume:
  - Consider storing large images in Cloud Storage and saving URLs in Firestore
  - Add indexes for frequent queries (workerUid + localTimestamp, propertyId)
- Offline:
  - Service worker caches core scripts and HTML for reliable startup

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Authentication errors:
  - Verify Firebase config and network connectivity
  - Check user roles and account activation
- Real-time sync issues:
  - Ensure listeners are attached after auth state resolves
  - Confirm Firestore rules permit read/write for the user role
- Export failures:
  - Confirm JSZip is loaded; retry with stable connection
  - For photos, ensure records have photo data URLs
- Correction stuck:
  - Check correctionStatus and corrections array for latest event
  - Admin must verify the latest correction to finalize

**Section sources**
- [index.html](file://index.html)

## Conclusion
The Property Tax Collector app implements a robust, real-time data management system on Firestore with strong validation, correction workflows, and secure exports. The design balances usability with data integrity, enabling efficient field collection and administration. For large deployments, consider Cloud Storage for media, Firestore indexes, and expanded security rules.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Appendix A: Data Model Diagram
```mermaid
erDiagram
RECORDS {
string propertyId
string propertyType
string ownerCategory
string buildingType
boolean isAbsent
number latitude
number longitude
number accuracy
string photo
array families
string workerUid
string workerEmail
string workerName
string localTimestamp
timestamp timestamp
boolean needsCorrection
string correctionStatus
array corrections
string adminFlagNote
string adminFlaggedAt
boolean correctionAllowGps
boolean correctionAllowPhoto
boolean correctionAllowDetails
string remarks
}
USERS {
string uid PK
string name
string phone
string email
string role
timestamp createdAt
number rangeStart
number rangeEnd
}
SETTINGS {
string id PK
string vcName
}
USERS ||--o{ RECORDS : "created"
SETTINGS ||--o{ RECORDS : "referenced_by"
```

**Diagram sources**
- [index.html](file://index.html)

### Appendix B: Test Coverage Highlights
- missingFields: validates required owner/institution fields
- isRecordAbsent: legacy and explicit flags
- needsFollowUp: correction and absence logic
- householdStats: population and gender aggregation
- correctionState: status transitions
- getExifOrientation: JPEG EXIF parsing

**Section sources**
- [test\logic.test.js](file://test\logic.test.js)