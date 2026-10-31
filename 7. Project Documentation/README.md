# Project documentation

- [Current academic PDF](<HDI_Project_Documentation.pdf>): the current 22-page project report.
- [Editable Word document](<HDI_Project_Documentation.docx>): the editable source for the current report.
- [Model card](<MODEL_CARD.md>): data provenance, preprocessing, country-separated evaluation and limitations.
- [Current architecture](<../3. Project Design Phase/Solution Architecture.md>), [testing](<../6. Project Testing/Performance Testing.md>) and [deployment](<../8-Project-Demonstration/DEPLOYMENT.md>).

The PDF and Word document replace the previous report and HTML source. Update the Word document and export it to the matching PDF when revising this report. The older `scripts/build-academic-report.mjs` helper generates the previous HTML-based report, not these replacement files.

Keep historical backups separately and privately. Exclude populated `.env` files from shared archives; Git ignore rules do not filter manually created ZIPs.
