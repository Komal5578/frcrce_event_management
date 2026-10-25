# GCP billing and data ownership review

**Status:** VM retired at the user's direction; owner review still needed for the retained disk and project.

On 2026-10-25, `gcloud` showed the legacy `ce-vm` running in project `college-events-29738` (`us-central1-a`), with a 30 GB disk and reserved static IP `ce-ip`. The VM was deleted with `--keep-disks=all`; the detached `ce-ip` was released. Follow-up inventory showed no Compute VM or reserved address, and the 30 GB disk `ce-vm` remains. Do not delete the disk or project until the billing owner confirms data ownership, backups, retention and disposition.

Please review the current GCP billing account and project before any retirement decision, and reply with:

1. Current and recent VM, disk, snapshot, network, and other project charges.
2. Whether any service or user still depends on the VM or project.
3. Who owns the data and backups, where they are stored, and the approved retention period.
4. Whether backups have been verified and who approves stopping or deleting each resource.
5. A decision to retain, stop, or delete, with the approver and date.

Record the response and observed resource state in `12-VERIFICATION.md`. Keep the legacy FastAPI/GCP files until recovery and rollback value is reviewed.
