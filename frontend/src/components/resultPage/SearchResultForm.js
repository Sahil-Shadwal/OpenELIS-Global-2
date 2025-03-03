import React, { useContext, useEffect, useState, useRef } from "react";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import "../Style.css";
import {
  getFromOpenElisServer,
  postToOpenElisServerJsonResponse,
  convertAlphaNumLabNumForDisplay,
} from "../utils/Utils";
import {
  Form,
  TextInput,
  TextArea,
  Checkbox,
  Button,
  Grid,
  Column,
  DatePicker,
  DatePickerInput,
  Stack,
  Pagination,
  Select,
  SelectItem,
  Loading,
} from "@carbon/react";
import { Copy } from "@carbon/icons-react";
import CustomLabNumberInput from "../common/CustomLabNumberInput";
import DataTable from "react-data-table-component";
import { Formik, Field } from "formik";
import SearchResultFormValues from "../formModel/innitialValues/SearchResultFormValues";
import { AlertDialog, NotificationKinds } from "../common/CustomNotification";
import { NotificationContext } from "../layout/Layout";
import SearchPatientForm from "../patient/SearchPatientForm";
import { ConfigurationContext } from "../layout/Layout";
import config from "../../config.json";

function ResultSearchPage() {
  const [originalResultForm, setOriginalResultForm] = useState({
    testResult: [],
  });
  const [resultForm, setResultForm] = useState(originalResultForm);

  const setResults = (resultForm) => {
    setOriginalResultForm(resultForm);
    setResultForm(resultForm);
  };

  return (
    <>
      <SearchResultForm setResults={setResults} />
      <SearchResults results={resultForm} setResultForm={setResultForm} />
    </>
  );
}

export function SearchResultForm(props) {
  const { notificationVisible, setNotificationVisible, addNotification } =
    useContext(NotificationContext);

  const [tests, setTests] = useState([]);
  const [analysisStatusTypes, setAnalysisStatusTypes] = useState([]);
  const [sampleStatusTypes, setSampleStatusTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchBy, setSearchBy] = useState({ type: "", doRange: false });
  const [patient, setPatient] = useState({ patientPK: "" });
  const [testSections, setTestSections] = useState([]);
  const [defaultTestSectionId, setDefaultTestSectionId] = useState("");
  const [defaultTestSectionLabel, setDefaultTestSectionLabel] = useState("");
  const [defaultTestId, setDefaultTestId] = useState("");
  const [defaultTestLabel, setDefaultTestLabel] = useState("");
  const [defaultSampleStatusId, setDefaultSampleStatusId] = useState("");
  const [defaultSampleStatusLabel, setDefaultSampleStatusLabel] = useState("");
  const [defaultAnalysisStatusId, setDefaultAnalysisStatusId] = useState("");
  const [defaultAnalysisStatusLabel, setDefaultAnalysisStatusLabel] =
    useState("");
  const [searchFormValues, setSearchFormValues] = useState(
    SearchResultFormValues,
  );
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [pagination, setPagination] = useState(false);
  const [url, setUrl] = useState("");
  const componentMounted = useRef(false);

  const setResultsWithId = (results) => {
    if (results.testResult) {
      var i = 0;
      if (results.testResult) {
        results.testResult.forEach((item) => (item.id = "" + i++));
      }
      props.setResults?.(results);
      setLoading(false);
      if (results.paging) {
        var { totalPages, currentPage } = results.paging;
        if (totalPages > 1) {
          setPagination(true);
          if (parseInt(currentPage) < parseInt(totalPages)) {
            setNextPage(parseInt(currentPage) + 1);
          } else {
            setNextPage(null);
          }
          if (parseInt(currentPage) > 1) {
            setPreviousPage(parseInt(currentPage) - 1);
          } else {
            setPreviousPage(null);
          }
        }
      }
    } else {
      props.setResults?.({ testResult: [] });
      addNotification({
        title: intl.formatMessage({ id: "notification.title" }),
        message: intl.formatMessage({ id: "patient.search.nopatient" }),
        kind: NotificationKinds.warning,
      });
      setNotificationVisible(true);
      setLoading(false);
    }
  };

  const intl = useIntl();

  const loadNextResultsPage = () => {
    setLoading(true);
    getFromOpenElisServer(url + "&page=" + nextPage, setResultsWithId);
  };

  const loadPreviousResultsPage = () => {
    setLoading(true);
    getFromOpenElisServer(url + "&page=" + previousPage, setResultsWithId);
  };

  const getSelectedPatient = (patient) => {
    setNextPage(null);
    setPreviousPage(null);
    setPagination(false);
    setPatient(patient);
  };
  useEffect(() => {
    querySearch(searchFormValues);
  }, [patient]);

  const querySearch = (values) => {
    setLoading(true);
    props.setResults({ testResult: [] });

    let accessionNumber =
      values.accessionNumber !== ""
        ? values.accessionNumber
        : values.startLabNo;
    let labNo =
      accessionNumber !== undefined ? accessionNumber.split("-")[0] : "";
    const endLabNo = values.endLabNo !== undefined ? values.endLabNo : "";
    values.unitType = values.unitType ? values.unitType : "";

    let searchEndPoint =
      "/rest/ReactLogbookResultsByRange?" +
      "labNumber=" +
      labNo +
      "&upperRangeAccessionNumber=" +
      endLabNo +
      "&patientPK=" +
      patient.patientPK +
      "&testSectionId=" +
      values.unitType +
      "&collectionDate=" +
      values.collectionDate +
      "&recievedDate=" +
      values.recievedDate +
      "&selectedTest=" +
      values.testName +
      "&selectedSampleStatus=" +
      values.sampleStatusType +
      "&selectedAnalysisStatus=" +
      values.analysisStatus +
      "&doRange=" +
      searchBy.doRange +
      "&finished=" +
      true;
    setUrl(searchEndPoint);

    getFromOpenElisServer(searchEndPoint, setResultsWithId);
  };

  const handleSubmit = (values) => {
    setNextPage(null);
    setPreviousPage(null);
    setPagination(false);
    querySearch(values);
  };

  const getTests = (tests) => {
    if (componentMounted.current) {
      setTests(tests);
    }
  };

  const getAnalysisStatusTypes = (analysisStatusTypes) => {
    if (componentMounted.current) {
      setAnalysisStatusTypes(analysisStatusTypes);
    }
  };

  const getSampleStatusTypes = (sampleStatusTypes) => {
    if (componentMounted.current) {
      setSampleStatusTypes(sampleStatusTypes);
    }
  };

  const fetchTestSections = (response) => {
    setTestSections(response);
  };

  const submitOnSelect = (e) => {
    setNextPage(null);
    setPreviousPage(null);
    setPagination(false);
    var values = { unitType: e.target.value };
    handleSubmit(values);
  };

  useEffect(() => {
    componentMounted.current = true;
    let testId = new URLSearchParams(window.location.search).get(
      "selectedTest",
    );
    testId = testId ? testId : "";
    getFromOpenElisServer("/rest/test-list", (fetchedTests) => {
      let test = fetchedTests.find((test) => test.id === testId);
      let testLabel = test ? test.value : "";
      setDefaultTestId(testId);
      setDefaultTestLabel(testLabel);
      getTests(fetchedTests);
    });

    let sampleStatusId = new URLSearchParams(window.location.search).get(
      "selectedSampleStatus",
    );
    sampleStatusId = sampleStatusId ? sampleStatusId : "";
    getFromOpenElisServer(
      "/rest/sample-status-types",
      (fetchedSampleStatusTypes) => {
        let sampleStatus = fetchedSampleStatusTypes.find(
          (sampleStatus) => sampleStatus.id === sampleStatusId,
        );
        let sampleStatusLabel = sampleStatus ? sampleStatus.value : "";
        setDefaultSampleStatusId(sampleStatusId);
        setDefaultSampleStatusLabel(sampleStatusLabel);
        getSampleStatusTypes(fetchedSampleStatusTypes);
      },
    );

    let analysisStatusId = new URLSearchParams(window.location.search).get(
      "selectedAnalysisStatus",
    );
    analysisStatusId = analysisStatusId ? analysisStatusId : "";
    getFromOpenElisServer(
      "/rest/analysis-status-types",
      (fetchedAnalysisStatusTypes) => {
        let analysisStatus = fetchedAnalysisStatusTypes.find(
          (analysisStatus) => analysisStatus.id === analysisStatusId,
        );
        let analysisStatusLabel = analysisStatus ? analysisStatus.value : "";
        setDefaultAnalysisStatusId(analysisStatusId);
        setDefaultAnalysisStatusLabel(analysisStatusLabel);
        getAnalysisStatusTypes(fetchedAnalysisStatusTypes);
      },
    );

    let testSectionId = new URLSearchParams(window.location.search).get(
      "testSectionId",
    );
    testSectionId = testSectionId ? testSectionId : "";
    getFromOpenElisServer("/rest/user-test-sections", (fetchedTestSections) => {
      let testSection = fetchedTestSections.find(
        (testSection) => testSection.id === testSectionId,
      );
      let testSectionLabel = testSection ? testSection.value : "";
      setDefaultTestSectionId(testSectionId);
      setDefaultTestSectionLabel(testSectionLabel);
      fetchTestSections(fetchedTestSections);
    });
    if (testSectionId) {
      let values = { unitType: testSectionId };
      querySearch(values);
    }

    let displayFormType = new URLSearchParams(window.location.search).get(
      "type",
    );
    let doRange = new URLSearchParams(window.location.search).get("doRange");
    setSearchBy({
      type: displayFormType,
      doRange: doRange,
    });
  }, []);

  useEffect(() => {
    let accessionNumber = new URLSearchParams(window.location.search).get(
      "accessionNumber",
    );
    if (accessionNumber) {
      let searchValues = {
        ...searchFormValues,
        accessionNumber: accessionNumber,
      };
      setSearchFormValues(searchValues);
      querySearch(searchValues);
    }
    let collectionDate = new URLSearchParams(window.location.search).get(
      "collectionDate",
    );
    let recievedDate = new URLSearchParams(window.location.search).get(
      "recievedDate",
    );
    let selectedTest = new URLSearchParams(window.location.search).get(
      "selectedTest",
    );
    let selectedSampleStatus = new URLSearchParams(window.location.search).get(
      "selectedSampleStatus",
    );
    let selectedAnalysisStatus = new URLSearchParams(
      window.location.search,
    ).get("selectedAnalysisStatus");

    if (
      collectionDate ||
      recievedDate ||
      selectedTest ||
      selectedSampleStatus ||
      selectedAnalysisStatus
    ) {
      let searchValues = {
        ...searchFormValues,
        collectionDate: collectionDate ? collectionDate : "",
        recievedDate: recievedDate ? recievedDate : "",
        testName: selectedTest ? selectedTest : "",
        sampleStatusType: selectedSampleStatus ? selectedSampleStatus : "",
        analysisStatus: selectedAnalysisStatus ? selectedAnalysisStatus : "",
      };
      setSearchFormValues(searchValues);
      querySearch(searchValues);
    }
    setNextPage(null);
    setPreviousPage(null);
    setPagination(false);
  }, [searchBy]);

  return (
    <>
      {notificationVisible === true ? <AlertDialog /> : ""}
      {loading && <Loading></Loading>}
      <Formik
        initialValues={searchFormValues}
        //validationSchema={}
        onSubmit={handleSubmit}
        onChange
        enableReinitialize={true}
      >
        {({
          values,
          //   errors,
          //   touched,
          handleChange,
          setFieldValue,
          //   handleBlur,
          handleSubmit,
        }) => (
          <Form
            onSubmit={handleSubmit}
            onChange={handleChange}
            //onBlur={handleBlur}
          >
            <Stack gap={2}>
              <Grid>
                <Column lg={16}>
                  <h4>
                    <FormattedMessage id="label.button.search" />
                  </h4>
                </Column>
                {searchBy.type === "order" && (
                  <>
                    <Column lg={6}>
                      <Field name="accessionNumber">
                        {({ field }) => (
                          <CustomLabNumberInput
                            placeholder="Enter Accession No."
                            name={field.name}
                            id={field.name}
                            value={values[field.name]}
                            labelText={
                              <FormattedMessage id="search.label.accession" />
                            }
                            onChange={(e, rawValue) => {
                              setFieldValue(field.name, rawValue);
                            }}
                          />
                        )}
                      </Field>
                    </Column>
                    <Column lg={10} />
                  </>
                )}

                {searchBy.type === "range" && (
                  <>
                    <Column lg={6}>
                      <Field name="startLabNo">
                        {({ field }) => (
                          <TextInput
                            placeholder={"Enter LabNo"}
                            name={field.name}
                            id={field.name}
                            defaultValue={values["accessionNumber"]}
                            labelText={
                              <FormattedMessage id="search.label.fromaccession" />
                            }
                          />
                        )}
                      </Field>
                    </Column>
                    <Column lg={6}>
                      <Field name="endLabNo">
                        {({ field }) => (
                          <TextInput
                            placeholder={"Enter LabNo"}
                            name={field.name}
                            id={field.name}
                            labelText={
                              <FormattedMessage id="search.label.toaccession" />
                            }
                          />
                        )}
                      </Field>
                    </Column>
                    <Column lg={4} />
                  </>
                )}

                {searchBy.type === "date" && (
                  <>
                    <Column lg={3}>
                      <Field name="collectionDate">
                        {({ field, form }) => (
                          <DatePicker
                            id={field.name}
                            name={field.name}
                            datePickerType="single"
                            dateFormat="d/m/Y"
                            value={values[field.name]}
                            onChange={(date) =>
                              form.setFieldValue(
                                field.name,
                                new Date(date).toLocaleDateString("fr-FR"),
                              )
                            }
                          >
                            <DatePickerInput
                              labelText={
                                <FormattedMessage id="search.label.collectiondate" />
                              }
                              placeholder="dd/mm/yyyy"
                            />
                          </DatePicker>
                        )}
                      </Field>
                    </Column>
                    <Column lg={3}>
                      <Field name="recievedDate">
                        {({ field, form }) => (
                          <DatePicker
                            id={field.name}
                            name={field.name}
                            datePickerType="single"
                            dateFormat="d/m/Y"
                            value={values[field.name]}
                            onChange={(date) =>
                              form.setFieldValue(
                                field.name,
                                new Date(date).toLocaleDateString("fr-FR"),
                              )
                            }
                          >
                            <DatePickerInput
                              labelText={
                                <FormattedMessage id="search.label.recieveddate" />
                              }
                              placeholder="dd/mm/yyyy"
                            />
                          </DatePicker>
                        )}
                      </Field>
                    </Column>
                    <Column lg={3}>
                      <Field name="testName">
                        {({ field }) => (
                          <Select
                            labelText={
                              <FormattedMessage id="search.label.test" />
                            }
                            name={field.name}
                            id={field.name}
                          >
                            <SelectItem
                              text={defaultTestLabel}
                              value={defaultTestId}
                            />
                            {tests
                              .filter((item) => item.id !== defaultTestId)
                              .map((test, index) => {
                                return (
                                  <SelectItem
                                    key={index}
                                    text={test.value}
                                    value={test.id}
                                  />
                                );
                              })}
                          </Select>
                        )}
                      </Field>
                    </Column>
                    <Column lg={3}>
                      <Field name="analysisStatus">
                        {({ field }) => (
                          <Select
                            labelText={
                              <FormattedMessage id="search.label.analysis" />
                            }
                            name={field.name}
                            id={field.name}
                          >
                            <SelectItem
                              text={defaultAnalysisStatusLabel}
                              value={defaultAnalysisStatusId}
                            />
                            {analysisStatusTypes
                              .filter(
                                (item) => item.id !== defaultAnalysisStatusId,
                              )
                              .map((test, index) => {
                                return (
                                  <SelectItem
                                    key={index}
                                    text={test.value}
                                    value={test.id}
                                  />
                                );
                              })}
                          </Select>
                        )}
                      </Field>
                    </Column>
                    <Column lg={3}>
                      <Field name="sampleStatusType">
                        {({ field }) => (
                          <Select
                            labelText={
                              <FormattedMessage id="search.label.sample" />
                            }
                            name={field.name}
                            id={field.name}
                          >
                            <SelectItem
                              text={defaultSampleStatusLabel}
                              value={defaultSampleStatusId}
                            />
                            {sampleStatusTypes
                              .filter(
                                (item) => item.id !== defaultSampleStatusId,
                              )
                              .map((test, index) => {
                                return (
                                  <SelectItem
                                    key={index}
                                    text={test.value}
                                    value={test.id}
                                  />
                                );
                              })}
                          </Select>
                        )}
                      </Field>
                    </Column>
                    <Column lg={1} />
                  </>
                )}

                {searchBy.type !== "patient" && searchBy.type !== "unit" && (
                  <Column lg={16}>
                    <Button
                      style={{ marginTop: "16px" }}
                      type="submit"
                      id="submit"
                    >
                      <FormattedMessage id="label.button.search" />
                    </Button>
                  </Column>
                )}
              </Grid>
            </Stack>
          </Form>
        )}
      </Formik>
      {searchBy.type === "patient" && (
        <SearchPatientForm
          getSelectedPatient={getSelectedPatient}
        ></SearchPatientForm>
      )}

      {searchBy.type === "unit" && (
        <>
          <Grid>
            <Column lg={6}>
              <Select
                labelText={intl.formatMessage({ id: "search.label.testunit" })}
                name="unitType"
                id="unitType"
                onChange={submitOnSelect}
              >
                <SelectItem
                  text={defaultTestSectionLabel}
                  value={defaultTestSectionId}
                />
                {testSections
                  .filter((item) => item.id !== defaultTestSectionId)
                  .map((test, index) => {
                    return (
                      <SelectItem
                        key={index}
                        text={test.value}
                        value={test.id}
                      />
                    );
                  })}
              </Select>
            </Column>
            <Column lg={10} />
          </Grid>
        </>
      )}

      <>
        {pagination && (
          <Grid>
            <Column lg={12} />
            <Column lg={2}>
              <Button
                type=""
                id="loadpreviousresults"
                onClick={loadPreviousResultsPage}
                disabled={previousPage != null ? false : true}
              >
                <FormattedMessage id="button.label.loadprevious" />
              </Button>
            </Column>
            <Column lg={2}>
              <Button
                type=""
                id="loadnextresults"
                disabled={nextPage != null ? false : true}
                onClick={loadNextResultsPage}
              >
                <FormattedMessage id="button.label.loadnext" />
              </Button>
            </Column>
          </Grid>
        )}
      </>
    </>
  );
}

export function SearchResults(props) {
  const { notificationVisible, addNotification, setNotificationVisible } =
    useContext(NotificationContext);
  const { configurationProperties } = useContext(ConfigurationContext);

  const intl = useIntl();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [acceptAsIs, setAcceptAsIs] = useState([]);
  const [referalOrganizations, setReferalOrganizations] = useState([]);
  const [methods, setMethods] = useState([]);
  const [referralReasons, setReferralReasons] = useState([]);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [rejectedItems, setRejectedItems] = useState({});
  const [validationState, setValidationState] = useState({});
  const saveStatus = "";

  const componentMounted = useRef(false);

  useEffect(() => {
    componentMounted.current = true;

    getFromOpenElisServer(
      "/rest/displayList/REFERRAL_ORGANIZATIONS",
      loadReferalOrganizations,
    );
    getFromOpenElisServer("/rest/displayList/METHODS", loadMethods);
    getFromOpenElisServer(
      "/rest/displayList/REFERRAL_REASONS",
      loadReferalReasons,
    );
    getFromOpenElisServer(
      "/rest/displayList/REJECTION_REASONS",
      loadRejectReasons,
    );
    if (props.results.testResult.length > 0) {
      var defaultRejectedItems = {};
      props.results.testResult.forEach((result) => {
        defaultRejectedItems[result.id] = false;
      });
      setRejectedItems(defaultRejectedItems);
    }
    return () => {
      componentMounted.current = false;
    };
  }, []);

  const loadReferalOrganizations = (values) => {
    if (componentMounted.current) {
      setReferalOrganizations(values);
    }
  };

  const loadMethods = (values) => {
    if (componentMounted.current) {
      setMethods(values);
    }
  };

  const loadReferalReasons = (values) => {
    if (componentMounted.current) {
      setReferralReasons(values);
    }
  };

  const loadRejectReasons = (values) => {
    if (componentMounted.current) {
      setRejectReasons(values);
    }
  };

  const addRejectResult = () => {
    const resultColumn = {
      id: "reject",
      name: intl.formatMessage({ id: "column.name.reject" }),
      cell: (row, index, column, id) => {
        return renderCell(row, index, column, id);
      },
      width: "12rem",
    };

    if (configurationProperties.allowResultRejection == "true") {
      if (columns) {
        const updatedList = [
          ...columns.slice(0, 8),
          resultColumn,
          ...columns.slice(8),
        ];
        columns = updatedList;
      }
    }
  };

  var columns = [
    {
      id: "sampleInfo",
      name: intl.formatMessage({ id: "column.name.sampleInfo" }),
      cell: (row, index, column, id) => {
        return renderCell(row, index, column, id);
      },
      sortable: true,
      selector: (row) => row.accessionNumber,
      width: "16rem",
    },
    {
      id: "testDate",
      name: intl.formatMessage({ id: "column.name.testDate" }),
      selector: (row) => row.testDate,
      sortable: true,
      width: "7rem",
    },

    {
      id: "analyzerResult",
      name: intl.formatMessage({ id: "column.name.analyzerResult" }),
      selector: (row) => row.analysisMethod,
      sortable: true,
      width: "7rem",
    },
    {
      id: "testName",
      name: intl.formatMessage({ id: "column.name.testName" }),
      selector: (row) => row.testName,
      sortable: true,
      width: "8rem",
    },
    {
      id: "normalRange",
      name: intl.formatMessage({ id: "column.name.normalRange" }),
      selector: (row) => row.normalRange,
      sortable: true,
      width: "8rem",
    },
    {
      id: "accept",
      name: intl.formatMessage({ id: "column.name.accept" }),
      cell: (row, index, column, id) => {
        return renderCell(row, index, column, id);
      },
      width: "5rem",
    },
    {
      id: "result",
      name: intl.formatMessage({ id: "column.name.result" }),
      cell: (row, index, column, id) => {
        return renderCell(row, index, column, id);
      },
      width: "10rem",
    },
    {
      id: "currentResult",
      name: intl.formatMessage({ id: "column.name.currentResult" }),
      cell: (row, index, column, id) => {
        return renderCell(row, index, column, id);
      },
      width: "8rem",
    },
    {
      id: "notes",
      name: intl.formatMessage({ id: "column.name.notes" }),
      cell: (row, index, column, id) => {
        return renderCell(row, index, column, id);
      },
      width: "7rem",
    },
  ];

  const renderCell = (row, index, column, id) => {
    let formatLabNum = configurationProperties.AccessionFormat === "ALPHANUM";

    console.debug("renderCell: index: " + index + ", id: " + id);
    switch (column.id) {
      case "sampleInfo":
        // return <input id={"results_" + id} type="text" size="6"></input>
        return (
          <>
            <div>
              <Button
                onClick={async () => {
                  if ("clipboard" in navigator) {
                    return await navigator.clipboard.writeText(
                      row.accessionNumber,
                    );
                  } else {
                    return document.execCommand(
                      "copy",
                      true,
                      row.accessionNumber,
                    );
                  }
                }}
                kind="ghost"
                iconDescription={intl.formatMessage({
                  id: "instructions.copy.labnum",
                })}
                hasIconOnly
                renderIcon={Copy}
              />
            </div>
            <div className="sampleInfo">
              <br></br>
              {(formatLabNum
                ? convertAlphaNumLabNumForDisplay(row.accessionNumber)
                : row.accessionNumber) +
                "-" +
                row.sequenceNumber}
              <br></br>
              {row.patientName} <br></br>
              {row.patientInfo}
              <br></br>
              <br></br>
            </div>
            {row.nonconforming && (
              <picture>
                <img
                  src={config.serverBaseUrl + "/images/nonconforming.gif"}
                  alt="nonconforming"
                  width="20"
                  height="15"
                />
              </picture>
            )}
          </>
        );

      case "accept":
        return (
          <>
            <Field name="forceTechApproval">
              {() => (
                <Checkbox
                  id={"testResult" + row.id + ".forceTechApproval"}
                  name={"testResult[" + row.id + "].forceTechApproval"}
                  labelText=""
                  //defaultChecked={acceptAsIs}
                  onChange={(e) => handleAcceptAsIsChange(e, row.id)}
                />
              )}
            </Field>
          </>
        );

      case "reject":
        return (
          <>
            <Grid>
              <Column lg={16}>
                <Field name="reject">
                  {() => (
                    <Checkbox
                      id={"testResult" + row.id + ".rejected"}
                      name={"testResult[" + row.id + "].rejected"}
                      labelText=""
                      onChange={(e) => handleRejectCheckBoxChange(e, row.id)}
                    />
                  )}
                </Field>
              </Column>
              {rejectedItems[row.id] == true && (
                <Column lg={16}>
                  <Select
                    id={"rejectReasonId" + row.id}
                    name={"testResult[" + row.id + "].rejectReasonId"}
                    //noLabel={true}
                    labelText={"Reason"}
                    onChange={(e) => handleChange(e, row.id)}
                  >
                    {/* {...updateShadowResult(e, this, param.rowId)} */}
                    <SelectItem text="" value="" />
                    {rejectReasons.map((reason, reason_index) => (
                      <SelectItem
                        text={reason.value}
                        value={reason.id}
                        key={reason_index}
                      />
                    ))}
                  </Select>
                </Column>
              )}
            </Grid>
          </>
        );

      case "notes":
        return (
          <>
            <div className="note">
              <TextArea
                id={"testResult" + row.id + ".note"}
                name={"testResult[" + row.id + "].note"}
                //value={props.results.testResult[row.id]?.pastNotes}
                disabled={false}
                type="text"
                labelText=""
                rows={1}
                onChange={(e) => handleChange(e, row.id)}
              ></TextArea>
            </div>
          </>
        );

      case "result":
        switch (row.resultType) {
          case "M":
          case "C":
          case "D":
            return (
              <Select
                className="result"
                id={"resultValue" + row.id}
                name={"testResult[" + row.id + "].resultValue"}
                noLabel={true}
                onChange={(e) => validateResults(e, row.id)}
              >
                {/* {...updateShadowResult(e, this, param.rowId)} */}
                <SelectItem text="" value="" />
                {row.dictionaryResults.map(
                  (dictionaryResult, dictionaryResult_index) => (
                    <SelectItem
                      text={dictionaryResult.value}
                      value={dictionaryResult.id}
                      key={dictionaryResult_index}
                    />
                  ),
                )}
              </Select>
            );

          case "N":
            return (
              <TextInput
                id={"ResultValue" + row.id}
                name={"testResult[" + row.id + "].resultValue"}
                labelText=""
                // type="number"
                style={validationState[row.id]?.style}
                onChange={(e) => {
                  let value = e.target.value;
                  let newValidationState = { ...validationState };
                  let validation = (newValidationState[row.id] =
                    validateNumericResults(value, row));
                  e.target.value = validation.newValue;
                  validation.style = {
                    ...validation?.style,
                    borderColor: validation.isCritical
                      ? "orange"
                      : validation.isInvalid
                      ? "red"
                      : "",
                    background: validation.outsideValid
                      ? "#ffa0a0"
                      : validation.outsideNormal
                      ? "#ffffa0"
                      : "var(--cds-field)",
                  };

                  setValidationState(newValidationState);
                  handleChange(e, row.id);
                  if (
                    validation.isInvalid &&
                    configurationProperties.ALERT_FOR_INVALID_RESULTS
                  ) {
                    alert(
                      intl.formatMessage({
                        id: "result.outOfValidRange.msg",
                      }),
                    );
                  }
                }}
              />
            );

          case "R":
            return (
              <TextArea
                id={"ResultValue" + row.id}
                name={"testResult[" + row.id + "].resultValue"}
                style={{ width: "10px", height: "20px" }}
                labelText=""
                onChange={(e) => handleChange(e, row.id)}
              />
            );

          case "A":
            return (
              <TextArea
                id={"ResultValue" + row.id}
                name={"testResult[" + row.id + "].resultValue"}
                style={{ width: "10px", height: "20px" }}
                labelText=""
                onChange={(e) => handleChange(e, row.id)}
              />
            );

          default:
            return row.resultValue;
        }

      case "currentResult":
        switch (row.resultType) {
          case "M":
          case "C":
          case "D":
            return (
              <>
                {
                  row.dictionaryResults.find(
                    (result) => result.id == row.resultValue,
                  )?.value
                }
              </>
            );

          default:
            return row.resultValue;
        }
      default:
        return;
    }
  };

  const renderReferral = ({ data }) => (
    <>
      <Grid>
        <Column lg={3}>
          <TextArea
            id={"testResult" + data.id + ".pastNotes"}
            name={"testResult[" + data.id + "].pastNotes"}
            value={data.pastNotes}
            disabled={true}
            type="text"
            labelText={intl.formatMessage({
              id: "referral.testresult.pastnote",
            })}
            rows={2}
          ></TextArea>
        </Column>
        <Column lg={2}>
          <Select
            id={"testMethod" + data.id}
            name={"testResult[" + data.id + "].testMethod"}
            labelText={intl.formatMessage({ id: "referral.label.testmethod" })}
            onChange={(e) => handleChange(e, data.id)}
            value={data.method}
          >
            <SelectItem text="" value="" />
            {methods.map((method, method_index) => (
              <SelectItem
                text={method.value}
                value={method.id}
                key={method_index}
              />
            ))}
          </Select>
        </Column>
        <Column lg={3}>
          <Select
            id={"referralReason" + data.id}
            name={"testResult[" + data.id + "].referralReason"}
            // noLabel={true}
            labelText={intl.formatMessage({ id: "referral.label.reason" })}
            onChange={(e) => handleChange(e, data.id)}
          >
            {/* {...updateShadowResult(e, this, param.rowId)} */}
            <SelectItem text="" value="" />
            {referralReasons.map((reason, reason_index) => (
              <SelectItem
                text={reason.value}
                value={reason.id}
                key={reason_index}
              />
            ))}
          </Select>
        </Column>
        <Column lg={3}>
          <Select
            id={"institute" + data.id}
            name={"testResult[" + data.id + "].institute"}
            // noLabel={true}
            labelText={intl.formatMessage({ id: "referral.label.institute" })}
            onChange={(e) => handleChange(e, data.id)}
          >
            {/* {...updateShadowResult(e, this, param.rowId)} */}

            <SelectItem text="" value="" />
            {referalOrganizations.map((org, org_index) => (
              <SelectItem text={org.value} value={org.id} key={org_index} />
            ))}
          </Select>
        </Column>
        <Column lg={3}>
          <Select
            id={"testToPerform" + data.id}
            name={"testResult[" + data.id + "].testToPerform"}
            // noLabel={true}
            labelText={intl.formatMessage({
              id: "referral.label.testtoperform",
            })}
            onChange={(e) => handleChange(e, data.id)}
          >
            {/* {...updateShadowResult(e, this, param.rowId)} */}

            <SelectItem text={data.testName} value={data.id} />
          </Select>
        </Column>
        <Column lg={2}>
          <DatePicker
            datePickerType="single"
            id={"sentDate_" + data.id}
            name={"testResult[" + data.id + "].sentDate_"}
            onChange={(date) => handleDatePickerChange(date, data.id)}
          >
            <DatePickerInput
              placeholder="mm/dd/yyyy"
              labelText={intl.formatMessage({ id: "referral.label.sentdate" })}
              id="date-picker-single"
            />
          </DatePicker>
        </Column>
      </Grid>
    </>
  );
  const validateResults = (e, rowId) => {
    console.debug("validateResults:" + e.target.value);
    // e.target.value;
    handleChange(e, rowId);
  };

  const validateNumericResults = (value, row) => {
    //ignore < or > from the analyser on validation
    var greaterThanOrLessThan = "";
    if (("" + value).startsWith("<") || ("" + value).startsWith(">")) {
      greaterThanOrLessThan = value.charAt(0);
    }
    var actualValue = ("" + value).replace(/[<>]/g, "");
    let validation = {
      isInvalid: false,
      outsideNormal: false,
      isCritical: false,
      isBlank: false,
      isNaN: false,
      outsideValid: false,
      newValue: value,
    };
    //commented out for now
    let isSpecialCase = "XXXX" == actualValue.toUpperCase();
    validation = { ...validation, ...validateNumberFormat(value, row) };

    // resultBox.style.borderColor = validFormat ? "" : "red";

    // if( isSpecialCase ){
    //   resultBox.title = "";
    //   value = greaterThanOrLessThan + actualValue.toUpperCase();
    //   resultBox.style.borderColor = "";
    //   resultBox.style.background = "#ffffff";
    //   $("valid_" + row).value = true;
    //   return;
    // }
    if (validation.isNaN) {
      return { ...validation };
    } else if (
      row.lowCritical != row.highCritical &&
      actualValue > row.lowCritical &&
      actualValue < row.highCritical
    ) {
      return { ...validation, isCritical: true };
    } else if (
      row.lowerAbnormalRange != row.upperAbnormalRange &&
      (actualValue < row.lowerAbnormalRange ||
        actualValue > row.upperAbnormalRange)
    ) {
      return { ...validation, isInvalid: true, outsideValid: true };
      // resultBox.style.background = "#ffa0a0";
      // resultBox.title = "En dehors de la plage valide"; //FIXME: Uses hardcoded French labels. Switch to refer to resource file.
      // $("valid_" + row).value = false;
      // if( outOfValidRangeMsg ){
      //   alert( outOfValidRangeMsg);
      // }
    } else if (
      row.lowerNormalRange != row.upperNormalRange &&
      (actualValue < row.lowerNormalRange || actualValue > row.upperNormalRange)
    ) {
      return { ...validation, outsideNormal: true };
      // resultBox.style.background = "#ffffa0";
      // resultBox.title = "En dehors de la plage normale"; //FIXME: Uses hardcoded French labels. Switch to refer to resource file.
      // $("valid_" + row).value = true;
    } else {
      return { ...validation, outsideNormal: false };
      // resultBox.style.background = "#ffffff";
      // resultBox.title = "";
      // $("valid_" + row).value = true;
    }
  };

  const validateNumberFormat = (value, row) => {
    //ignore < or > from the analyser on validation
    var greaterThanOrLessThan = "";
    if (("" + value).startsWith("<") || ("" + value).startsWith(">")) {
      greaterThanOrLessThan = value.charAt(0);
    }
    var actualValue = ("" + value).replace(/[<>]/g, "");

    let validation = { isInvalid: false };
    if (!actualValue) {
      return { ...validation, isInvalid: true, isBlank: true };
      // resultBox.title = "";
      // resultBox.style.background = "#ffffff";
      // $("valid_" + row).value = false;
      // return true;
    }

    if (actualValue.trim() == ".") {
      validation = {
        ...validation,
        newValue: greaterThanOrLessThan + "0.0",
      };
    }

    if (isNaN(actualValue)) {
      return { ...validation, isInvalid: true, isNaN: true };
      // $("valid_" + row).value = false;
      // return false;
    }

    if (!isNaN(row.significantDigits)) {
      validation = {
        ...validation,
        newValue:
          greaterThanOrLessThan +
          Math.round(actualValue, row.significantDigits),
      };
    }

    return validation;
  };

  const handleChange = (e, rowId) => {
    const { name, id, value } = e.target;
    console.debug(
      "handleChange:" + id + ":" + name + ":" + value + ":" + rowId,
    );
    // setState({value: e.target.value})
    console.debug("State updated to ", e.target.value);
    var form = { ...props.results };
    var jp = require("jsonpath");
    jp.value(form, name, value);
    var isModified = "testResult[" + rowId + "].isModified";
    jp.value(form, isModified, "true");
    props.setResultForm(form);
  };

  const handleRejectCheckBoxChange = (e, rowId) => {
    const { name, checked } = e.target;
    var form = props.results;
    var jp = require("jsonpath");
    jp.value(form, name, checked);
    var shadowRejected = "testResult[" + rowId + "].shadowRejected";
    jp.value(form, shadowRejected, checked);
    var isModified = "testResult[" + rowId + "].isModified";
    jp.value(form, isModified, "true");

    var allrejectedItems = { ...rejectedItems };
    allrejectedItems[rowId] = checked;
    setRejectedItems(allrejectedItems);

    addNotification({
      title: intl.formatMessage({ id: "notification.title" }),
      message: intl.formatMessage({ id: "result.reject.warning" }),
      kind: NotificationKinds.warning,
    });
    if (checked) {
      setNotificationVisible(true);
    }
  };

  const handleDatePickerChange = (date, rowId) => {
    console.debug("handleDatePickerChange:" + date);
    const d = new Date(date).toLocaleDateString("fr-FR");
    var form = props.results;
    var jp = require("jsonpath");
    jp.value(form, "testResult[" + rowId + "].sentDate_", d);
    var isModified = "testResult[" + rowId + "].isModified";
    jp.value(form, isModified, "true");
  };

  const handleAcceptAsIsChange = (e, rowId) => {
    console.debug("handleAcceptAsIsChange:" + acceptAsIs[rowId]);
    handleChange(e, rowId);
    if (acceptAsIs[rowId] == undefined) {
      alert(intl.formatMessage({ id: "result.acceptasis.warning" }));
      addNotification({
        title: intl.formatMessage({ id: "notification.title" }),
        message: intl.formatMessage({ id: "result.acceptasis.warning" }),
        kind: NotificationKinds.warning,
      });
      setNotificationVisible(true);
    }
    var newAcceptAsIs = acceptAsIs;
    newAcceptAsIs[rowId] = !acceptAsIs[rowId];
    setAcceptAsIs(newAcceptAsIs);
  };

  const handleSave = (values) => {
    console.debug("handleSave:" + values);
    values.status = saveStatus;
    var searchEndPoint = "/rest/ReactLogbookResultsUpdate";
    props.results.testResult.forEach((result) => {
      result.reportable = result.reportable === "N" ? false : true;
      delete result.result;
    });
    postToOpenElisServerJsonResponse(
      searchEndPoint,
      JSON.stringify(props.results),
      setResponse,
    );
  };

  const setResponse = (resp) => {
    console.debug("setStatus" + JSON.stringify(resp));
    if (resp) {
      addNotification({
        title: intl.formatMessage({ id: "notification.title" }),
        message: createMesssage(resp),
        kind: NotificationKinds.success,
      });
    } else {
      addNotification({
        title: intl.formatMessage({ id: "notification.title" }),
        message: intl.formatMessage({ id: "error.save.msg" }),
        kind: NotificationKinds.error,
      });
    }
    setNotificationVisible(true);
  };

  const createMesssage = (resp) => {
    var message = "";
    if (resp.reflex.length > 0) {
      message +=
        intl.formatMessage({ id: "reflexTests" }) +
        ": " +
        resp.reflex.join(", ");
    }
    if (resp.calculated.length > 0) {
      message +=
        intl.formatMessage({ id: "calculatedTests" }) +
        ": " +
        resp.calculated.join(", ");
    }
    if (message === "") {
      message += intl.formatMessage({ id: "success.save.msg" });
    }
    return message;
  };

  const handlePageChange = (pageInfo) => {
    if (page != pageInfo.page) {
      setPage(pageInfo.page);
    }
    if (pageSize != pageInfo.pageSize) {
      setPageSize(pageInfo.pageSize);
    }
  };

  return (
    <>
      {notificationVisible === true ? <AlertDialog /> : ""}
      {addRejectResult()}
      <>
        {props.results?.testResult?.length > 0 && (
          <Grid style={{ marginTop: "20px" }} className="gridBoundary">
            <Column lg={3} />
            <Column lg={7}>
              <picture>
                <img
                  src={config.serverBaseUrl + "/images/nonconforming.gif"}
                  alt="nonconforming"
                  width="25"
                  height="20"
                />
              </picture>
              <b>
                {" "}
                <FormattedMessage id="validation.label.nonconform" />
              </b>
            </Column>
          </Grid>
        )}
        <Formik
          initialValues={SearchResultFormValues}
          //validationSchema={}
          onSubmit
          onChange
        >
          {({
            // values,
            // errors,
            // touched,
            handleChange,
            //handleBlur,
            // handleSubmit,
          }) => (
            <Form
              onChange={handleChange}
              //onBlur={handleBlur}
            >
              <DataTable
                data={props.results?.testResult?.slice(
                  (page - 1) * pageSize,
                  page * pageSize,
                )}
                columns={columns}
                isSortable
                expandableRows
                expandableRowsComponent={renderReferral}
              ></DataTable>
              <Pagination
                onChange={handlePageChange}
                page={page}
                pageSize={pageSize}
                pageSizes={[10, 20, 50, 100]}
                totalItems={props.results?.testResult?.length}
              ></Pagination>

              <Button type="button" id="submit" onClick={handleSave}>
                <FormattedMessage id="label.button.save" />
              </Button>
            </Form>
          )}
        </Formik>
      </>
    </>
  );
}

export default injectIntl(ResultSearchPage);
