## 1. Specification and Validation Prep

- [x] 1.1 Finalize the static-layout safety rule and turret lead-margin wording in the change specs
- [x] 1.2 Identify the authored content categories that count as static elements for overlap validation

## 2. Implementation

- [x] 2.1 Add static-element overlap checks to stage authoring validation
- [x] 2.2 Update shooter gating so bullets and firing audio can begin within the configured lead margin
- [x] 2.3 Adjust any authored stage layouts that fail the new safety rule

## 3. Verification

- [x] 3.1 Add regression fixtures for overlapping static elements and a safe adjacent layout
- [x] 3.2 Add regression coverage for turret lead-margin behavior, including a live viewport probe
- [x] 3.3 Run build and playtest validation and record the results
