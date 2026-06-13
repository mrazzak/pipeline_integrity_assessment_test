# Automated ILI-to-FEA Validation Summary

## Scope

The validation implemented in the Automated ILI-to-FEA module is a transparent benchmark and verification layer. It is not certification of the browser visualization as a nonlinear finite-element solver.

The module separates:

1. Standards-based and engineering screening calculations used for the governing operating limit.
2. ANN/DNN surrogate predictions used for rapid advisory estimates.
3. Monte Carlo uncertainty propagation used to estimate probability of failure.
4. Strain screening used to flag cases requiring detailed dent assessment.

## Published corrosion-FEA benchmark

The embedded ANN and DNN were fitted to the normalized failure-pressure trends published in Table 4 of Lo, Karuppanan, and Ovinis (2021). The benchmark covers defect depth, length, longitudinal spacing, and axial compressive stress over the paper's stated parameter domain.

| Model | Cases | R-squared | Mean absolute error | MAPE | Maximum error |
|---|---:|---:|---:|---:|---:|
| ANN, 4-8-1 | 29 | 0.99696 | 0.00688 normalized pressure | 1.45% | 3.17% |
| DNN, 4-10-6-1 | 29 | 0.99997 | 0.00039 normalized pressure | 0.08% | 0.57% |

These results are reproduction metrics on published FEA trend data. They are not independent blind-test results. The software flags predictions outside the published input domain and does not allow the surrogate to replace the conservative governing pressure assessment.

The source paper reported:

- FEA predictions within 3.67% of four full-scale burst-test results.
- An ANN unseen-data R-squared of 0.9921.
- ANN prediction errors from -9.39% to +4.63%.

## Reliability integration

The reliability stage samples defect depth, defect length, operating pressure, and surrogate model error. It reports probability of failure, reliability index, and capacity percentiles. Results are advisory because the probability estimate is conditional on:

- the selected probability distributions and coefficients of variation;
- the surrogate's published corrosion domain;
- the assumed independence of sampled variables;
- the inspection sizing and model-form uncertainty entered by the user.

A production reliability assessment should calibrate distributions and correlations from tool qualification, material records, pressure history, excavation measurements, and operator-specific consequence criteria.

## Strain and dent acceptance

The module reports a B31.8-style 6% dent-strain screening comparison and separately reports whether API RP 1183 detailed assessment is required. It does not label a dent "API RP 1183 compliant" from strain alone. API RP 1183 requires broader consideration of dent shape, fatigue, coincident features, material response, pressure history, and uncertainty.

API removed Table 6, Dent Fatigue Life Spectrum Severity Criteria, through Addendum 1 in May 2024 because it was not the most conservative screening method in every case. The module therefore does not use that table as an acceptance shortcut.

## Remaining validation work

Before operational use as a Level 3 FEA system:

- Export the reconstructed mesh to a validated nonlinear solver.
- Complete mesh-convergence studies for pressure, strain, J-integral/CTOD, and crack-front response.
- Validate corrosion, dent, crack, SCC, and mixed-defect models against independent full-scale tests.
- Validate raw MFL/caliper/crack registration and interpolation against laser-scan or excavation geometry.
- Establish operator-approved reliability targets and model bias factors.

## References

1. Lo, M., Karuppanan, S., and Ovinis, M. "Failure Pressure Prediction of a Corroded Pipeline with Longitudinally Interacting Corrosion Defects Subjected to Combined Loadings Using FEM and ANN." *Journal of Marine Science and Engineering* 9(3), 281, 2021. https://doi.org/10.3390/jmse9030281
2. Kiefner, J. F., Vieth, P. H., and Roytman, I. *Continued Validation of RSTRENG*, Final Report, 1996. https://www.osti.gov/biblio/441672
3. American Petroleum Institute. *API Recommended Practice 1183, Assessment and Management of Dents in Pipelines*. https://www.api.org/products-and-services/standards/important-standards-announcements/rp1183
4. American Petroleum Institute. *Addendum 1 to API RP 1183 for Improved Dent Screening*, May 2024. https://www.api.org/products-and-services/standards/important-standards-announcements/addendum-1-rp-1183
5. PHMSA. Gas Transmission Special Permit dent criteria citing the 6% ASME B31.8 strain limit and API RP 1183 assessment. https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/2022-04/2019-0201-Columbia-Gulf-CGT-Class-1-to-3-SP-LA-MS-TN-KY-03-31-2022.pdf
