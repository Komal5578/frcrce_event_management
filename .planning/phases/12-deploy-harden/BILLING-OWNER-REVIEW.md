# GCP billing and data ownership review

**Status:** awaiting club billing-owner response. No GCP VM/project shutdown or deletion is authorized by this record.

Please review the current GCP billing account and project before any retirement decision, and reply with:

1. Current and recent VM, disk, snapshot, network, and other project charges.
2. Whether any service or user still depends on the VM or project.
3. Who owns the data and backups, where they are stored, and the approved retention period.
4. Whether backups have been verified and who approves stopping or deleting each resource.
5. A decision to retain, stop, or delete, with the approver and date.

Record the response and observed resource state in `12-VERIFICATION.md`. Keep the legacy FastAPI/GCP files until recovery and rollback value is reviewed.
