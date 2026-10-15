import { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';


// =====================================================
// SERVER URL
// =====================================================

const SERVER_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');
// =====================================================
// IMAGE URL HELPER
// =====================================================

const getImageUrl = (url) => {
    if (!url) return '';

    if (
        url.startsWith('http://') ||
        url.startsWith('https://')
    ) {
        return url;
    }

    return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};


// =====================================================
// REPORT GENERATOR
// =====================================================

export default function ReportGenerator() {

    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    const [selectedStudent, setSelectedStudent] = useState('');

    const [selectedTerm, setSelectedTerm] =
        useState('Term 1');

    const [academicYear, setAcademicYear] =
        useState('2026/2027');

    const [reportData, setReportData] =
        useState(null);
    const [generatedReports, setGeneratedReports] =
    useState([]);
        

    const [schoolInfo, setSchoolInfo] =
        useState({});

    const [teacherRemarks, setTeacherRemarks] =
        useState('');

    const [headteacherRemarks, setHeadteacherRemarks] =
        useState('');

    const [currentReportId, setCurrentReportId] =
        useState(null);

    const [currentReportStatus, setCurrentReportStatus] =
        useState('draft');

    const [savedReports, setSavedReports] = useState([]);    

    const [loading, setLoading] =
        useState(false);

    const [bulkLoading, setBulkLoading] =
        useState(false);

    const [zipLoading, setZipLoading] =
        useState(false);

    const [zipProgress, setZipProgress] =
        useState({
            current: 0,
            total: 0
        });

    const [savingRemarks, setSavingRemarks] =
        useState(false);


        

    // =====================================================
    // LOAD SCHOOL SETTINGS
    // =====================================================

    useEffect(() => {

        const loadSettings = async () => {

            try {

                const res =
                    await api.get('/settings');

                setSchoolInfo(res.data);

                if (res.data.current_term) {
                    setSelectedTerm(
                        res.data.current_term
                    );
                }

                if (res.data.academic_year) {
                    setAcademicYear(
                        res.data.academic_year
                    );
                }

            } catch (err) {

                console.error(
                    'Error loading school settings:',
                    err
                );

            }

        };

        loadSettings();

    }, []);


    // =====================================================
    // LOAD CLASSES
    // =====================================================

    useEffect(() => {

        const loadClasses = async () => {

            try {

                const token =
                    localStorage.getItem(
                        'sms_token'
                    );

                if (!token) {
                    throw new Error(
                        'You are not logged in.'
                    );
                }

                const decodedToken =
                    jwtDecode(token);

                if (!decodedToken.school_id) {
                    throw new Error(
                        'School information is missing from your account.'
                    );
                }

                const schoolId =
                    decodedToken.school_id;

                const res =
                    await api.get(
                        `/auth/classes/${schoolId}`
                    );

                setClasses(res.data);

            } catch (err) {

                console.error(
                    'Error loading classes:',
                    err
                );

                alert(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to load school classes.'
                );

            }

        };

        loadClasses();

    }, []);


    // =====================================================
    // LOAD STUDENTS WHEN CLASS CHANGES
    // =====================================================

    const loadClassStudents = async (className) => {

        setSelectedClass(className);
        setSelectedStudent('');
        setStudents([]);
        setReportData(null);
        setGeneratedReports([]);

        setTeacherRemarks('');
        setHeadteacherRemarks('');
        setCurrentReportId(null);
        setCurrentReportStatus('draft');

        const selectedClassObject =
            classes.find(
                schoolClass =>
                    schoolClass.class_name === className
            );

        setSelectedClassId(
            selectedClassObject?.id || ''
        );

        if (!className) {
            return;
        }

        try {

            const res =
                await api.get(
                    `/students?current_class=${encodeURIComponent(
                        className
                    )}`
                );

            setStudents(res.data);

            // Load persistent reports already saved in the database.
            await loadSavedClassReports(
                className,
                selectedTerm,
                academicYear
            );

        } catch (error) {

            console.error(
                'Error loading students:',
                error
            );

            setStudents([]);

        }

    };


    // =====================================================
    // LOAD ALL SAVED REPORTS FOR THE SELECTED CLASS
    // =====================================================

    const loadSavedClassReports = async (
        className = selectedClass,
        term = selectedTerm,
        year = academicYear
    ) => {

        if (!className || term === 'Full Academic Year' || !year) {
            setSavedReports([]);
            setGeneratedReports([]);
            return [];
        }

        try {

            const res = await api.get(
                `/assessments/reports?class_name=${encodeURIComponent(
                    className
                )}&term=${encodeURIComponent(
                    term
                )}&academic_year=${encodeURIComponent(
                    year
                )}`
            );

            const reports =
                res.data?.reports ||
                res.data ||
                [];

            setSavedReports(reports);
            setGeneratedReports(reports);

            return reports;

        } catch (error) {

            console.error(
                'Error loading saved class reports:',
                error
            );

            setSavedReports([]);
            setGeneratedReports([]);

            return [];
        }
    };


    // Keep the portal list synchronized when class/term/year changes.
    useEffect(() => {

        if (!selectedClass || selectedTerm === 'Full Academic Year') {
            setSavedReports([]);
            setGeneratedReports([]);
            return;
        }

        loadSavedClassReports(
            selectedClass,
            selectedTerm,
            academicYear
        );

    }, [
        selectedClass,
        selectedTerm,
        academicYear
    ]);


    // =====================================================
    // LOAD SAVED REPORT INFORMATION
    // =====================================================

  const loadSavedReport = async (
    studentId,
    term = selectedTerm,
    year = academicYear
) => {
    try {
        const res = await api.get(
    `/assessments/reports?class_name=${encodeURIComponent(
        selectedClass
    )}&term=${encodeURIComponent(
        term
    )}&academic_year=${encodeURIComponent(
        year
    )}`
);

        const reports =
            Array.isArray(res.data?.reports)
                ? res.data.reports
                : Array.isArray(res.data)
                    ? res.data
                    : [];

        const report = reports.find(
            item =>
                Number(item.student_id) ===
                Number(studentId)
        );

        if (!report) {
            setCurrentReportId(null);
            setCurrentReportStatus('draft');
            setTeacherRemarks('');
            setHeadteacherRemarks('');

            return null;
        }

        // Connect the selected preview to its persistent report.
        setCurrentReportId(report.id);

        setCurrentReportStatus(
            report.status || 'draft'
        );

        setTeacherRemarks(
            report.teacher_remark || ''
        );

        setHeadteacherRemarks(
            report.headteacher_remark || ''
        );

        // Synchronize local saved report list.
        setSavedReports(prev => {
            const exists = prev.some(
                item =>
                    Number(item.id) ===
                    Number(report.id)
            );

            if (exists) {
                return prev.map(item =>
                    Number(item.id) ===
                    Number(report.id)
                        ? {
                            ...item,
                            ...report
                        }
                        : item
                );
            }

            return [...prev, report];
        });

        // Synchronize generated report list.
        setGeneratedReports(prev => {
            const exists = prev.some(
                item =>
                    Number(item.id) ===
                    Number(report.id)
            );

            if (exists) {
                return prev.map(item =>
                    Number(item.id) ===
                    Number(report.id)
                        ? {
                            ...item,
                            ...report
                        }
                        : item
                );
            }

            return [...prev, report];
        });

        return report;

    } catch (error) {

        console.error(
            'Error loading saved report:',
            error
        );

        setCurrentReportId(null);

        return null;
    }
};





    // =====================================================
    // GENERATE / REGENERATE INDIVIDUAL REPORT
    // =====================================================

    const generateReport = async () => {

        if (!selectedStudent) {
            alert('Please select a student.');
            return;
        }

        if (!academicYear) {
            alert('Academic year is missing.');
            return;
        }

        if (selectedTerm === 'Full Academic Year') {
            alert(
                'Saved reports are generated per term. Select a term before generating a saved report.'
            );
            return;
        }

        setLoading(true);
        setReportData(null);

        try {

            // Backend creates or updates the persistent student_reports row.
            const generateResponse = await api.post(
                `/assessments/reports/generate/${selectedStudent}`
            );

            const generatedReport =
                generateResponse.data?.report || null;

            if (generatedReport?.id) {
                setCurrentReportId(generatedReport.id);
                setCurrentReportStatus(
                    generatedReport.status || 'draft'
                );
                setTeacherRemarks(
                    generatedReport.teacher_remark || ''
                );
                setHeadteacherRemarks(
                    generatedReport.headteacher_remark || ''
                );
            }

            // Load the complete report preview.
            const url =
                `/assessments/student-report/${selectedStudent}` +
                `?academic_year=${encodeURIComponent(
                    academicYear
                )}` +
                `&term=${encodeURIComponent(selectedTerm)}`;

            const reportResponse = await api.get(url);

            setReportData(reportResponse.data);

            // Reload the persistent report row so remarks/status are current.
            const savedReport = await loadSavedReport(
                selectedStudent,
                selectedTerm,
                academicYear
            );

            if (!savedReport && generatedReport?.id) {
                setCurrentReportId(generatedReport.id);
                setCurrentReportStatus(
                    generatedReport.status || 'draft'
                );
                setTeacherRemarks(
                    generatedReport.teacher_remark || ''
                );
                setHeadteacherRemarks(
                    generatedReport.headteacher_remark || ''
                );
            }

            // Refresh the class report list.
            await loadSavedClassReports(
                selectedClass,
                selectedTerm,
                academicYear
            );

        } catch (error) {

            console.error(
                'Report generation error:',
                error
            );

            alert(
                error.response?.data?.message ||
                'Unable to generate report.'
            );

        } finally {
            setLoading(false);
        }
    };


// =====================================================
// GENERATE ALL REPORTS FOR CLASS
// =====================================================

const generateAllReports = async () => {

    if (!selectedClass) {
        alert('Please select a class first.');
        return;
    }

    if (!selectedClassId) {
        alert(
            'Class ID could not be found. Please reselect the class.'
        );
        return;
    }

    if (selectedTerm === 'Full Academic Year') {
        alert(
            'Bulk saved reports are generated per term. Select Term 1, Term 2, or Term 3.'
        );
        return;
    }

    setBulkLoading(true);

    try {

        const res = await api.post(
            `/assessments/reports/generate-class/${selectedClassId}`
        );

        console.log(
            'Class reports generated:',
            res.data
        );

        // The backend returns the persistent student_reports rows.
        const generated =
            Array.isArray(res.data?.reports)
                ? res.data.reports
                : [];

        // Refresh from the database as the source of truth.
        const reports =
            await loadSavedClassReports(
                selectedClass,
                selectedTerm,
                academicYear
            );

        // If the backend returned reports but the GET is briefly stale,
        // still keep the generated response visible.
        if (reports.length === 0 && generated.length > 0) {
            setSavedReports(generated);
            setGeneratedReports(generated);
        }

        // Refresh current class students.
        const studentsResponse =
            await api.get(
                `/students?current_class=${encodeURIComponent(
                    selectedClass
                )}`
            );

        const refreshedStudents =
            studentsResponse.data || [];

        setStudents(refreshedStudents);

        // If a student is selected, connect the UI to that saved report.
        if (selectedStudent) {

            const sourceReports =
                reports.length > 0
                    ? reports
                    : generated;

            const selectedReport =
                sourceReports.find(
                    report =>
                        Number(report.student_id) ===
                        Number(selectedStudent)
                );

            if (selectedReport) {
                setCurrentReportId(selectedReport.id);
                setCurrentReportStatus(
                    selectedReport.status || 'draft'
                );
                setTeacherRemarks(
                    selectedReport.teacher_remark || ''
                );
                setHeadteacherRemarks(
                    selectedReport.headteacher_remark || ''
                );
            }
        }

        alert(
            `Class reports generated successfully.\n\n` +
            `Class: ${selectedClass}\n` +
            `Students: ${
                res.data.total_students ??
                refreshedStudents.length
            }\n` +
            `Created: ${
                res.data.created_count ?? 0
            }\n` +
            `Updated: ${
                res.data.updated_count ?? 0
            }`
        );

    } catch (error) {

        console.error(
            'Generate all reports error:',
            error
        );

        alert(
            error.response?.data?.message ||
            'Unable to generate all class reports.'
        );

    } finally {
        setBulkLoading(false);
    }
};






// =====================================================
// PREVIEW GENERATED CLASS REPORT
// =====================================================

const previewGeneratedReport = async (studentId) => {

    setSelectedStudent(String(studentId));

    setReportData(null);

    setTeacherRemarks('');
    setHeadteacherRemarks('');

    setCurrentReportId(null);
    setCurrentReportStatus('draft');

    setLoading(true);

    try {

        let url =
            `/assessments/student-report/${studentId}` +
            `?academic_year=${encodeURIComponent(
                academicYear
            )}`;

        if (
            selectedTerm !==
            'Full Academic Year'
        ) {
            url +=
                `&term=${encodeURIComponent(
                    selectedTerm
                )}`;
        }

        console.log(
            'Loading generated report preview:',
            url
        );

        const res = await api.get(url);

        setReportData(res.data);

        // ------------------------------------------------
        // Load the persistent student_reports row.
        // This is what enables Save Remark.
        // ------------------------------------------------

        if (
            selectedTerm !==
            'Full Academic Year'
        ) {

            const savedReport =
                await loadSavedReport(
                    studentId,
                    selectedTerm,
                    academicYear
                );

            console.log(
                'Saved report connected to preview:',
                savedReport
            );

        }

    } catch (error) {

        console.error(
            'Error previewing generated report:',
            error
        );

        console.error(
            'Preview server response:',
            error.response?.data
        );

        alert(
            error.response?.data?.message ||
            'Unable to load report preview.'
        );

        setReportData(null);

    } finally {

        setLoading(false);

    }
};











    // =====================================================
    // SAVE REPORT REMARKS
    // =====================================================

   const saveRemarks = async () => {

    if (!currentReportId) {
        alert(
            'Select a generated student report first.'
        );
        return;
    }

    if (
        !teacherRemarks?.trim() &&
        !headteacherRemarks?.trim()
    ) {
        alert(
            'Please enter a remark before saving.'
        );
        return;
    }

    setSavingRemarks(true);

    try {

       const res = await api.put(
    `/assessments/reports/${currentReportId}`,
            {
                teacher_remark:
                    teacherRemarks?.trim() || '',

                headteacher_remark:
                    headteacherRemarks?.trim() || ''
            }
        );

        const updated =
            res.data?.report ||
            res.data;

        if (!updated?.id) {
            throw new Error(
                'The server did not return the updated report.'
            );
        }

        // Update saved reports
        setSavedReports(prev =>
            prev.map(report =>
                Number(report.id) ===
                Number(updated.id)
                    ? {
                        ...report,
                        ...updated
                    }
                    : report
            )
        );

        // Update generated reports
        setGeneratedReports(prev =>
            prev.map(report =>
                Number(report.id) ===
                Number(updated.id)
                    ? {
                        ...report,
                        ...updated
                    }
                    : report
            )
        );

        // Update current report state
        setCurrentReportId(updated.id);

        setCurrentReportStatus(
            updated.status ||
            currentReportStatus
        );

        setTeacherRemarks(
            updated.teacher_remark || ''
        );

        setHeadteacherRemarks(
            updated.headteacher_remark || ''
        );

        alert(
            'Remarks saved successfully.'
        );

    } catch (error) {

        console.error(
            'Save remarks error:',
            error
        );

        console.error(
            'Server response:',
            error.response?.data
        );

        alert(
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Unable to save remarks.'
        );

    } finally {
        setSavingRemarks(false);
    }
};


    // =====================================================
    // FINALIZE REPORT
    // =====================================================

    const finalizeReport = async () => {

        if (!currentReportId) {

            alert(
                'Generate or load a saved report first.'
            );

            return;
        }

        const confirmed =
            window.confirm(
                'Are you sure you want to finalize this report?'
            );

        if (!confirmed) {
            return;
        }

        setSavingRemarks(true);

        try {

            const res =
                await api.put(
                    `/assessments/reports/${currentReportId}`,
                    {
                        teacher_remark:
                            teacherRemarks,

                        headteacher_remark:
                            headteacherRemarks,

                        status: 'final'
                    }
                );

            const updated =
                res.data?.report ||
                res.data;

            setCurrentReportStatus(
                updated?.status ||
                'final'
            );

            if (updated?.id) {
                setSavedReports(prev =>
                    prev.map(report =>
                        Number(report.id) ===
                        Number(updated.id)
                            ? {
                                ...report,
                                ...updated
                            }
                            : report
                    )
                );

                setGeneratedReports(prev =>
                    prev.map(report =>
                        Number(report.id) ===
                        Number(updated.id)
                            ? {
                                ...report,
                                ...updated
                            }
                            : report
                    )
                );
            }

            alert(
                'Report finalized successfully.'
            );

        } catch (error) {

            console.error(
                'Finalize report error:',
                error
            );

            alert(
                error.response?.data?.message ||
                error.message ||
                'Unable to finalize report.'
            );

        } finally {

            setSavingRemarks(false);

        }
    };


    // =====================================================
    // FORMAT POSITION
    // =====================================================

    const formatPosition = (position) => {

        if (!position) {
            return '-';
        }

        const number =
            Number(position);

        if (
            number % 100 >= 11 &&
            number % 100 <= 13
        ) {

            return `${number}th`;

        }

        switch (
            number % 10
        ) {

            case 1:
                return `${number}st`;

            case 2:
                return `${number}nd`;

            case 3:
                return `${number}rd`;

            default:
                return `${number}th`;

        }
    };


    // =====================================================
    // CREATE PDF FROM DOM ELEMENT
    // =====================================================

    const createPdfFromElement =
        async (element) => {

            const canvas =
                await html2canvas(
                    element,
                    {
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        backgroundColor:
                            '#ffffff'
                    }
                );

            const imgData =
                canvas.toDataURL(
                    'image/png'
                );

            const pdf =
                new jsPDF(
                    'p',
                    'mm',
                    'a4'
                );

            const pdfWidth =
                pdf.internal.pageSize.getWidth();

            const pdfHeight =
                pdf.internal.pageSize.getHeight();

            const imgWidth =
                pdfWidth;

            const imgHeight =
                (canvas.height *
                    imgWidth) /
                canvas.width;

            let heightLeft =
                imgHeight;

            let position = 0;

            pdf.addImage(
                imgData,
                'PNG',
                0,
                position,
                imgWidth,
                imgHeight
            );

            heightLeft -=
                pdfHeight;

            while (
                heightLeft > 0
            ) {

                position -=
                    pdfHeight;

                pdf.addPage();

                pdf.addImage(
                    imgData,
                    'PNG',
                    0,
                    position,
                    imgWidth,
                    imgHeight
                );

                heightLeft -=
                    pdfHeight;
            }

            return pdf;
        };


    // =====================================================
    // DOWNLOAD CURRENT REPORT PDF
    // =====================================================

    const downloadPDF = async () => {

        const input =
            document.getElementById(
                'report-card'
            );

        if (!input) {

            alert(
                'Report preview not found.'
            );

            return;
        }

        try {

            const pdf =
                await createPdfFromElement(
                    input
                );

            const studentName =
                reportData.profile.full_name
                    .replace(
                        /[^a-z0-9]/gi,
                        '_'
                    );

            pdf.save(
                `${studentName}_${academicYear}_Report.pdf`
            );

        } catch (error) {

            console.error(
                'PDF generation error:',
                error
            );

            alert(
                'Unable to generate PDF.'
            );
        }
    };


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    const escapeHtml = (value) => {

        if (
            value === null ||
            value === undefined
        ) {
            return '';
        }

        return String(value)
            .replace(
                /&/g,
                '&amp;'
            )
            .replace(
                /</g,
                '&lt;'
            )
            .replace(
                />/g,
                '&gt;'
            )
            .replace(
                /"/g,
                '&quot;'
            )
            .replace(
                /'/g,
                '&#039;'
            );
    };


    // =====================================================
    // WAIT FOR IMAGES
    // =====================================================

    const waitForImages =
        async (container) => {

            const images =
                Array.from(
                    container.querySelectorAll(
                        'img'
                    )
                );

            await Promise.all(
                images.map(
                    image =>
                        new Promise(
                            resolve => {

                                if (
                                    image.complete
                                ) {

                                    resolve();
                                    return;

                                }

                                image.onload =
                                    resolve;

                                image.onerror =
                                    resolve;

                            }
                        )
                )
            );

            /*
             * Give the browser a moment to
             * finish painting images.
             */

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )
            );
        };


    // =====================================================
    // BUILD ZIP REPORT HTML
    // =====================================================

    const buildZipReportHtml = (
        studentReport,
        savedReport,
        currentSettings,
        term,
        year
    ) => {

        const school =
            studentReport.school ||
            currentSettings ||
            {};

        const profile =
            studentReport.profile ||
            {};

        const report =
            studentReport.report ||
            {};

        const attendance =
            studentReport.attendance ||
            {};

        const marks =
            studentReport.marks ||
            [];

        const teacherRemark =
            savedReport?.teacher_remark ||
            '';

        const headteacherRemark =
            savedReport?.headteacher_remark ||
            '';

        const logoUrl =
            getImageUrl(
                school.logo_url
            );

        const passportUrl =
            getImageUrl(
                profile.passport_photo_url
            );


        const marksHtml =
            marks.length > 0
                ? marks.map(
                    mark => `
                        <tr>
                            <td style="
                                border:1px solid #999;
                                padding:7px;
                                text-align:left;
                            ">
                                ${escapeHtml(
                                    mark.subject
                                )}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:7px;
                                text-align:center;
                            ">
                                ${escapeHtml(
                                    mark.class_score
                                )}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:7px;
                                text-align:center;
                            ">
                                ${escapeHtml(
                                    mark.exam_score
                                )}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:7px;
                                text-align:center;
                                font-weight:bold;
                            ">
                                ${escapeHtml(
                                    mark.total_score
                                )}
                            </td>

                            <td style="
                                border:1px solid #999;
                                padding:7px;
                                text-align:center;
                            ">
                                ${escapeHtml(
                                    formatPosition(
                                        mark.subject_rank
                                    )
                                )}
                            </td>
                        </tr>
                    `
                ).join('')
                : `
                    <tr>
                        <td
                            colspan="5"
                            style="
                                border:1px solid #999;
                                padding:15px;
                                text-align:center;
                            "
                        >
                            No marks recorded for this term.
                        </td>
                    </tr>
                `;


        const classPosition =
            report.class_position
                ? `${formatPosition(
                    report.class_position
                )} / ${
                    report.class_size || '-'
                }`
                : '-';


        const attendancePercentage =
            attendance.percentage ??
            0;


        return `
            <div
                style="
                    width:210mm;
                    min-height:297mm;
                    padding:18mm;
                    background:white;
                    box-sizing:border-box;
                    color:#222;
                    font-family:Arial,sans-serif;
                "
            >

                <!-- SCHOOL HEADER -->

                <div
                    style="
                        text-align:center;
                        border-bottom:3px double #222;
                        padding-bottom:12px;
                    "
                >

                    ${
                        logoUrl
                            ? `
                                <img
                                    src="${escapeHtml(
                                        logoUrl
                                    )}"
                                    alt="School Logo"
                                    crossorigin="anonymous"
                                    style="
                                        width:75px;
                                        height:75px;
                                        object-fit:contain;
                                        margin-bottom:5px;
                                    "
                                />
                            `
                            : ''
                    }

                    <h1
                        style="
                            margin:0;
                            font-size:24px;
                            text-transform:uppercase;
                        "
                    >
                        ${escapeHtml(
                            school.school_name ||
                            'School Name'
                        )}
                    </h1>

                    ${
                        school.motto
                            ? `
                                <p
                                    style="
                                        font-style:italic;
                                        margin:5px 0;
                                    "
                                >
                                    "${escapeHtml(
                                        school.motto
                                    )}"
                                </p>
                            `
                            : ''
                    }

                    <p
                        style="
                            font-size:12px;
                            margin:4px 0;
                        "
                    >
                        ${escapeHtml(
                            school.address || ''
                        )}
                    </p>

                    <p
                        style="
                            font-size:12px;
                            margin:4px 0;
                        "
                    >
                        ${escapeHtml(
                            school.phone || ''
                        )}
                        |
                        ${escapeHtml(
                            school.email || ''
                        )}
                    </p>

                    <h2
                        style="
                            margin:12px 0 0;
                            font-size:18px;
                            letter-spacing:1px;
                        "
                    >
                        STUDENT PROGRESS REPORT
                    </h2>

                </div>


                <!-- STUDENT INFORMATION -->

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-top:18px;
                        padding:12px;
                        border:1px solid #ccc;
                    "
                >

                    <div
                        style="
                            line-height:1.8;
                        "
                    >

                        <div>
                            <strong>
                                Student:
                            </strong>
                            ${escapeHtml(
                                profile.full_name
                            )}
                        </div>

                        <div>
                            <strong>
                                Class:
                            </strong>
                            ${escapeHtml(
                                profile.current_class
                            )}
                        </div>

                        <div>
                            <strong>
                                Academic Year:
                            </strong>
                            ${escapeHtml(
                                report.academic_year ||
                                year
                            )}
                        </div>

                        <div>
                            <strong>
                                Report:
                            </strong>
                            ${escapeHtml(
                                report.term ||
                                term
                            )}
                        </div>

                    </div>


                    ${
                        passportUrl
                            ? `
                                <img
                                    src="${escapeHtml(
                                        passportUrl
                                    )}"
                                    alt="Student"
                                    crossorigin="anonymous"
                                    style="
                                        width:85px;
                                        height:100px;
                                        object-fit:cover;
                                        border:1px solid #555;
                                    "
                                />
                            `
                            : `
                                <div
                                    style="
                                        width:85px;
                                        height:100px;
                                        border:1px solid #aaa;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:10px;
                                        color:#777;
                                        text-align:center;
                                    "
                                >
                                    Passport
                                    <br />
                                    Photo
                                </div>
                            `
                    }

                </div>


                <!-- TERM -->

                <div
                    style="
                        margin-top:20px;
                        background:#343a40;
                        color:white;
                        padding:9px 12px;
                        font-weight:bold;
                    "
                >
                    ${escapeHtml(
                        report.term ||
                        term
                    )}
                </div>


                <!-- MARKS -->

                <table
                    style="
                        width:100%;
                        border-collapse:collapse;
                        margin-top:15px;
                        font-size:13px;
                    "
                >

                    <thead>

                        <tr
                            style="
                                background:#e9ecef;
                            "
                        >

                            <th
                                style="
                                    border:1px solid #999;
                                    padding:7px;
                                "
                            >
                                Subject
                            </th>

                            <th
                                style="
                                    border:1px solid #999;
                                    padding:7px;
                                "
                            >
                                Class
                                <br />
                                /30
                            </th>

                            <th
                                style="
                                    border:1px solid #999;
                                    padding:7px;
                                "
                            >
                                Exam
                                <br />
                                /70
                            </th>

                            <th
                                style="
                                    border:1px solid #999;
                                    padding:7px;
                                "
                            >
                                Total
                                <br />
                                /100
                            </th>

                            <th
                                style="
                                    border:1px solid #999;
                                    padding:7px;
                                "
                            >
                                Position
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${marksHtml}

                    </tbody>

                </table>


                <!-- SUMMARY -->

                <div
                    style="
                        display:grid;
                        grid-template-columns:repeat(4,1fr);
                        gap:8px;
                        margin-top:15px;
                    "
                >

                    <div
                        style="
                            border:1px solid #ccc;
                            padding:10px;
                            text-align:center;
                            background:#fafafa;
                        "
                    >
                        <div
                            style="
                                font-size:11px;
                                color:#666;
                                margin-bottom:4px;
                            "
                        >
                            Total
                        </div>

                        <strong>
                            ${escapeHtml(
                                report.overall_total
                            )}
                        </strong>
                    </div>


                    <div
                        style="
                            border:1px solid #ccc;
                            padding:10px;
                            text-align:center;
                            background:#fafafa;
                        "
                    >
                        <div
                            style="
                                font-size:11px;
                                color:#666;
                                margin-bottom:4px;
                            "
                        >
                            Average
                        </div>

                        <strong>
                            ${escapeHtml(
                                report.overall_average
                            )}
                        </strong>
                    </div>


                    <div
                        style="
                            border:1px solid #ccc;
                            padding:10px;
                            text-align:center;
                            background:#fafafa;
                        "
                    >
                        <div
                            style="
                                font-size:11px;
                                color:#666;
                                margin-bottom:4px;
                            "
                        >
                            Class Position
                        </div>

                        <strong>
                            ${escapeHtml(
                                classPosition
                            )}
                        </strong>
                    </div>


                    <div
                        style="
                            border:1px solid #ccc;
                            padding:10px;
                            text-align:center;
                            background:#fafafa;
                        "
                    >
                        <div
                            style="
                                font-size:11px;
                                color:#666;
                                margin-bottom:4px;
                            "
                        >
                            Attendance
                        </div>

                        <strong>
                            ${escapeHtml(
                                attendancePercentage
                            )}%
                        </strong>
                    </div>

                </div>


                <!-- ATTENDANCE -->

                <div
                    style="
                        margin-top:15px;
                        border:1px solid #ccc;
                        padding:12px;
                    "
                >

                    <strong>
                        Attendance
                    </strong>

                    <div
                        style="
                            margin-top:8px;
                            display:flex;
                            justify-content:space-between;
                        "
                    >

                        <span>
                            School Days:
                            ${escapeHtml(
                                attendance.total_days ??
                                0
                            )}
                        </span>

                        <span>
                            Present:
                            ${escapeHtml(
                                attendance.present_days ??
                                0
                            )}
                        </span>

                        <span>
                            Absent:
                            ${escapeHtml(
                                attendance.absent_days ??
                                0
                            )}
                        </span>

                        <span>
                            Late:
                            ${escapeHtml(
                                attendance.late_days ??
                                0
                            )}
                        </span>

                        <span>
                            ${escapeHtml(
                                attendancePercentage
                            )}%
                        </span>

                    </div>

                </div>


                <!-- REMARKS -->

                <div
                    style="
                        margin-top:25px;
                    "
                >

                    <h3
                        style="
                            border-bottom:1px solid #333;
                            padding-bottom:5px;
                        "
                    >
                        Remarks
                    </h3>


                    <div
                        style="
                            min-height:55px;
                            border:1px solid #ccc;
                            padding:10px;
                            margin-bottom:12px;
                        "
                    >

                        <strong>
                            Teacher's Remarks:
                        </strong>

                        <div
                            style="
                                margin-top:8px;
                            "
                        >
                            ${
                                escapeHtml(
                                    teacherRemark
                                ) || '—'
                            }
                        </div>

                    </div>


                    <div
                        style="
                            min-height:55px;
                            border:1px solid #ccc;
                            padding:10px;
                        "
                    >

                        <strong>
                            Headteacher's Remarks:
                        </strong>

                        <div
                            style="
                                margin-top:8px;
                            "
                        >
                            ${
                                escapeHtml(
                                    headteacherRemark
                                ) || '—'
                            }
                        </div>

                    </div>

                </div>


                <!-- SIGNATURES -->

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        margin-top:55px;
                    "
                >

                    <div
                        style="
                            width:40%;
                            text-align:center;
                        "
                    >

                        <div
                            style="
                                border-top:1px solid #333;
                                padding-top:5px;
                            "
                        >
                            Class Teacher
                        </div>

                    </div>


                    <div
                        style="
                            width:40%;
                            text-align:center;
                        "
                    >

                        <div
                            style="
                                border-top:1px solid #333;
                                padding-top:5px;
                            "
                        >
                            Headteacher
                        </div>

                    </div>

                </div>

            </div>
        `;
    };


    // =====================================================
    // DOWNLOAD SAVED CLASS REPORTS AS ZIP
    // =====================================================

    const downloadClassReportsZip = async () => {

        if (!selectedClass) {
            alert('Please select a class first.');
            return;
        }

        if (!selectedClassId) {
            alert(
                'Class ID could not be found. Please reselect the class.'
            );
            return;
        }

        if (selectedTerm === 'Full Academic Year') {
            alert(
                'ZIP download is currently available for a selected term. Select Term 1, Term 2, or Term 3.'
            );
            return;
        }

        setZipLoading(true);

        try {

            // IMPORTANT:
            // ZIP download does NOT regenerate reports.
            // It downloads reports that are already saved in the portal.
            const savedResponse = await api.get(
                `/reports?class_name=${encodeURIComponent(
                    selectedClass
                )}&term=${encodeURIComponent(
                    selectedTerm
                )}&academic_year=${encodeURIComponent(
                    academicYear
                )}`
            );

            const reports =
                savedResponse.data?.reports ||
                savedResponse.data ||
                [];

            if (!Array.isArray(reports) || reports.length === 0) {
                alert(
                    'No saved class reports are available. Generate the class reports first.'
                );
                return;
            }

            setSavedReports(reports);
            setGeneratedReports(reports);

            setZipProgress({
                current: 0,
                total: reports.length
            });

            const settingsResponse =
                await api.get('/settings');

            const currentSettings =
                settingsResponse.data || schoolInfo;

            const currentTerm =
                currentSettings.current_term ||
                selectedTerm;

            const currentAcademicYear =
                currentSettings.academic_year ||
                academicYear;

            const zip = new JSZip();
            let successfulReports = 0;

            for (
                let index = 0;
                index < reports.length;
                index++
            ) {

                const savedReport = reports[index];

                setZipProgress({
                    current: index + 1,
                    total: reports.length
                });

                let reportElement = null;

                try {

                    const reportResponse =
                        await api.get(
                            `/assessments/student-report/${savedReport.student_id}` +
                            `?academic_year=${encodeURIComponent(
                                currentAcademicYear
                            )}` +
                            `&term=${encodeURIComponent(
                                currentTerm
                            )}`
                        );

                    const studentReport =
                        reportResponse.data;

                    reportElement =
                        document.createElement('div');

                    // Keep the temporary canvas inside the document viewport.
                    // html2canvas is more reliable with this than a huge
                    // negative left offset.
                    reportElement.style.position = 'fixed';
                    reportElement.style.left = '0';
                    reportElement.style.top = '0';
                    reportElement.style.width = '210mm';
                    reportElement.style.background = 'white';
                    reportElement.style.zIndex = '-1';
                    reportElement.style.pointerEvents = 'none';

                    document.body.appendChild(
                        reportElement
                    );

                    reportElement.innerHTML =
                        buildZipReportHtml(
                            studentReport,
                            savedReport,
                            currentSettings,
                            currentTerm,
                            currentAcademicYear
                        );

                    await waitForImages(
                        reportElement
                    );

                    const pdf =
                        await createPdfFromElement(
                            reportElement
                        );

                    const studentName =
                        (
                            savedReport.full_name ||
                            studentReport.profile?.full_name ||
                            `Student_${savedReport.student_id}`
                        ).replace(
                            /[^a-z0-9]/gi,
                            '_'
                        );

                    const fileName =
                        `${studentName}_${currentAcademicYear}_${currentTerm}_Report.pdf`
                            .replace(
                                /[^a-z0-9._-]/gi,
                                '_'
                            );

                    zip.file(
                        fileName,
                        pdf.output('blob')
                    );

                    successfulReports++;

                } catch (studentError) {

                    console.error(
                        `Failed to create report for ${savedReport.full_name || savedReport.student_id}:`,
                        studentError
                    );

                } finally {

                    if (
                        reportElement &&
                        reportElement.parentNode
                    ) {
                        reportElement.parentNode.removeChild(
                            reportElement
                        );
                    }
                }
            }

            if (successfulReports === 0) {
                alert(
                    'No saved student reports could be converted to PDF.'
                );
                return;
            }

            const zipBlob =
                await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: {
                        level: 6
                    }
                });

            const downloadUrl =
                window.URL.createObjectURL(
                    zipBlob
                );

            const link =
                document.createElement('a');

            link.href = downloadUrl;

            link.download =
                `${selectedClass}_${currentTerm}_${currentAcademicYear}_Reports.zip`
                    .replace(
                        /[^a-z0-9._-]/gi,
                        '_'
                    );

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(
                downloadUrl
            );

            alert(
                `${successfulReports} saved report(s) downloaded successfully as a ZIP file.`
            );

        } catch (error) {

            console.error(
                'Class ZIP generation error:',
                error
            );

            alert(
                error.response?.data?.message ||
                error.message ||
                'Unable to download class reports.'
            );

        } finally {

            setZipLoading(false);

            setZipProgress({
                current: 0,
                total: 0
            });
        }
    };



    // =====================================================
    // LOAD SELECTED STUDENT REPORT
    // =====================================================

    const handleStudentChange =
        async (studentId) => {

            setSelectedStudent(
                studentId
            );

            setReportData(null);

            setTeacherRemarks('');
            setHeadteacherRemarks('');

            setCurrentReportId(null);
            setCurrentReportStatus(
                'draft'
            );

            if (!studentId) {
                return;
            }

            /*
             * If the user selects a student,
             * we only load the report.
             *
             * We do not regenerate it automatically.
             */

            setLoading(true);

            try {

                let url =
                    `/assessments/student-report/${studentId}` +
                    `?academic_year=${encodeURIComponent(
                        academicYear
                    )}`;

                if (
                    selectedTerm !==
                    'Full Academic Year'
                ) {

                    url +=
                        `&term=${encodeURIComponent(
                            selectedTerm
                        )}`;

                }

                const res =
                    await api.get(url);

                setReportData(
                    res.data
                );


                /*
                 * Saved remarks are only relevant
                 * to a term report.
                 */

                if (
    selectedTerm !==
    'Full Academic Year'
) {

    // -------------------------------------------------
    // First check reports already loaded in state.
    // -------------------------------------------------

    const localReport =
        savedReports.find(
            report =>
                Number(report.student_id) ===
                Number(studentId)
        );

    if (localReport) {

        setCurrentReportId(
            localReport.id
        );

        setCurrentReportStatus(
            localReport.status || 'draft'
        );

        setTeacherRemarks(
            localReport.teacher_remark || ''
        );

        setHeadteacherRemarks(
            localReport.headteacher_remark || ''
        );

    } else {

        // -------------------------------------------------
        // If not in memory, load it from the database.
        // -------------------------------------------------

        await loadSavedReport(
            studentId,
            selectedTerm,
            academicYear
        );
    }
}

            } catch (error) {

                console.error(
                    'Error loading student report:',
                    error
                );

                /*
                 * The student may not have
                 * generated report data yet.
                 */

                setReportData(null);

            } finally {

                setLoading(false);

            }

        };


    // =====================================================
    // RENDER TERM MARKS
    // =====================================================

    const renderMarksTable =
        (marks) => {

            if (
                !marks ||
                marks.length === 0
            ) {

                return (
                    <div
                        style={{
                            padding: '20px',
                            textAlign: 'center',
                            border:
                                '1px solid #ddd',
                            marginTop:
                                '15px'
                        }}
                    >


                        No marks recorded for this term.
                    </div>
                );

            }


            return (
                <table
                    style={{
                        width: '100%',
                        borderCollapse:
                            'collapse',
                        marginTop:
                            '15px',
                        fontSize:
                            '13px'
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background:
                                    '#e9ecef'
                            }}
                        >

                            <th
                                style={
                                    tableHeader
                                }
                            >
                                Subject
                            </th>

                            <th
                                style={
                                    tableHeader
                                }
                            >
                                Class
                                <br />
                                /30
                            </th>

                            <th
                                style={
                                    tableHeader
                                }
                            >
                                Exam
                                <br />
                                /70
                            </th>

                            <th
                                style={
                                    tableHeader
                                }
                            >
                                Total
                                <br />
                                /100
                            </th>

                            <th
                                style={
                                    tableHeader
                                }
                            >
                                Position
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {marks.map(
                            (
                                mark,
                                index
                            ) => (

                                <tr
                                    key={
                                        index
                                    }
                                >

                                    <td
                                        style={
                                            tableCellLeft
                                        }
                                    >
                                        {
                                            mark.subject
                                        }
                                    </td>

                                    <td
                                        style={
                                            tableCell
                                        }
                                    >
                                        {
                                            mark.class_score
                                        }
                                    </td>

                                    <td
                                        style={
                                            tableCell
                                        }
                                    >
                                        {
                                            mark.exam_score
                                        }
                                    </td>

                                    <td
                                        style={{
                                            ...tableCell,
                                            fontWeight:
                                                'bold'
                                        }}
                                    >
                                        {
                                            mark.total_score
                                        }
                                    </td>

                                    <td
                                        style={
                                            tableCell
                                        }
                                    >
                                        {
                                            formatPosition(
                                                mark.subject_rank
                                            )
                                        }
                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>
            );

        };


    // =====================================================
    // TERM SUMMARY
    // =====================================================

    const renderTermSummary =
        (
            termName,
            termData
        ) => {

            return (
                <div
                    key={
                        termName
                    }
                    style={{
                        marginTop:
                            '25px',
                        breakInside:
                            'avoid'
                    }}
                >

                    <div
                        style={{
                            background:
                                '#343a40',
                            color:
                                'white',
                            padding:
                                '8px 12px',
                            fontWeight:
                                'bold',
                            fontSize:
                                '15px'
                        }}
                    >
                        {
                            termName
                        }
                    </div>


                    {
                        renderMarksTable(
                            termData.marks
                        )
                    }


                    <div
                        style={{
                            display:
                                'grid',
                            gridTemplateColumns:
                                'repeat(4, 1fr)',
                            gap:
                                '8px',
                            marginTop:
                                '15px'
                        }}
                    >

                        <SummaryBox
                            label="Total Score"
                            value={
                                termData.overall_total
                            }
                        />

                        <SummaryBox
                            label="Average"
                            value={
                                termData.overall_average
                            }
                        />

                        <SummaryBox
                            label="Class Position"
                            value={
                                termData.class_position
                                    ? `${formatPosition(
                                        termData.class_position
                                    )} / ${
                                        termData.class_size
                                    }`
                                    : '-'
                            }
                        />

                        <SummaryBox
                            label="Attendance"
                            value={
                                `${termData.attendance.percentage}%`
                            }
                        />

                    </div>


                    <div
                        style={{
                            marginTop:
                                '12px',
                            padding:
                                '10px',
                            border:
                                '1px solid #ddd',
                            fontSize:
                                '12px'
                        }}
                    >

                        <strong>
                            Attendance:
                        </strong>{' '}

                        {
                            termData
                                .attendance
                                .present_days
                        }

                        {' Present, '}

                        {
                            termData
                                .attendance
                                .absent_days
                        }

                        {' Absent, '}

                        {
                            termData
                                .attendance
                                .late_days
                        }

                        {' Late '}

                        (
                        {
                            termData
                                .attendance
                                .total_days
                        }

                        {' school days'}
                        )

                    </div>

                </div>
            );

        };


    // =====================================================
    // FULL YEAR CONTENT
    // =====================================================

    const renderFullYear =
        () => {

            const terms =
                reportData.terms ||
                {};

            const availableTerms =
                Object.keys(
                    terms
                );


            return (
                <>

                    <div
                        style={{
                            marginTop:
                                '25px',
                            padding:
                                '15px',
                            background:
                                '#f1f3f5',
                            border:
                                '1px solid #ddd'
                        }}
                    >

                        <strong>
                            Academic Year:
                        </strong>{' '}

                        {
                            reportData
                                .report
                                .academic_year
                        }

                        <br />

                        <strong>
                            Terms Recorded:
                        </strong>{' '}

                        {
                            availableTerms.length >
                            0
                                ? availableTerms.join(
                                    ', '
                                )
                                : 'None'
                        }

                    </div>


                    {
                        availableTerms.map(
                            termName =>
                                renderTermSummary(
                                    termName,
                                    terms[
                                        termName
                                    ]
                                )
                        )
                    }


                    <div
                        style={{
                            marginTop:
                                '25px',
                            padding:
                                '15px',
                            border:
                                '2px solid #343a40'
                        }}
                    >

                        <h3
                            style={{
                                marginTop:
                                    0
                            }}
                        >
                            Academic Year Summary
                        </h3>


                        <p>
                            <strong>
                                Year Total:
                            </strong>{' '}

                            {
                                reportData
                                    .report
                                    .yearly_total
                            }
                        </p>


                        <p>
                            <strong>
                                Year Average:
                            </strong>{' '}

                            {
                                reportData
                                    .report
                                    .yearly_average
                            }
                        </p>


                        <p>
                            <strong>
                                Total Attendance:
                            </strong>{' '}

                            {
                                reportData
                                    .attendance
                                    .present_days
                            }

                            {' Present / '}

                            {
                                reportData
                                    .attendance
                                    .absent_days
                            }

                            {' Absent / '}

                            {
                                reportData
                                    .attendance
                                    .late_days
                            }

                            {' Late'}

                        </p>


                        <p>
                            <strong>
                                Attendance Percentage:
                            </strong>{' '}

                            {
                                reportData
                                    .attendance
                                    .percentage
                            }%

                        </p>

                    </div>

                </>
            );

        };


    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <div
            style={{
                padding:
                    '30px',
                background:
                    '#f5f6f8',
                minHeight:
                    '100vh'
            }}
        >


     

        <div
    style={{
        marginBottom: '20px'
    }}
>
    <button
        type="button"
        onClick={() => navigate('/dashboard')}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#fff',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
        }}
    >
        ← Back to Dashboard
    </button>
</div>





            <h2>
                📜 Report Generator
            </h2>


            {/* =================================================
                GENERATOR CONTROLS
            ================================================== */}

            <div
                style={{
                    background:
                        'white',
                    padding:
                        '20px',
                    borderRadius:
                        '8px',
                    boxShadow:
                        '0 2px 8px rgba(0,0,0,0.08)',
                    marginBottom:
                        '25px'
                }}
            >

                <div
                    style={{
                        display:
                            'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(180px, 1fr))',
                        gap:
                            '15px'
                    }}
                >

                    {/* CLASS */}

                    <div>

                        <label
                            style={
                                labelStyle
                            }
                        >
                            Class
                        </label>


                        <select
                            value={
                                selectedClass
                            }
                            onChange={
                                e =>
                                    loadClassStudents(
                                        e.target.value
                                    )
                            }
                            style={
                                inputStyle
                            }
                        >

                            <option value="">
                                Select Class
                            </option>


                            {
                                classes.map(
                                    schoolClass => (

                                        <option
                                            key={
                                                schoolClass.id
                                            }
                                            value={
                                                schoolClass.class_name
                                            }
                                        >
                                            {
                                                schoolClass.class_name
                                            }
                                        </option>

                                    )
                                )
                            }

                        </select>

                    </div>


                    {/* STUDENT */}

                    <div>

                        <label
                            style={
                                labelStyle
                            }
                        >
                            Student
                        </label>


                        <select
                            value={
                                selectedStudent
                            }
                            onChange={
                                e =>
                                    handleStudentChange(
                                        e.target.value
                                    )
                            }
                            style={
                                inputStyle
                            }
                            disabled={
                                !selectedClass
                            }
                        >

                            <option value="">
                                Select Student
                            </option>


                            {
                                students.map(
                                    student => (

                                        <option
                                            key={
                                                student.id
                                            }
                                            value={
                                                student.id
                                            }
                                        >
                                            {
                                                student.full_name
                                            }
                                        </option>

                                    )
                                )
                            }

                        </select>

                    </div>


                    {/* TERM */}

                    <div>

                        <label
                            style={
                                labelStyle
                            }
                        >
                            Report
                        </label>


                        <select
                            value={
                                selectedTerm
                            }
                            onChange={
                                e =>
                                    setSelectedTerm(
                                        e.target.value
                                    )
                            }
                            style={
                                inputStyle
                            }
                        >

                            <option value="Term 1">
                                Term 1
                            </option>

                            <option value="Term 2">
                                Term 2
                            </option>

                            <option value="Term 3">
                                Term 3
                            </option>

                            <option value="Full Academic Year">
                                Full Academic Year
                            </option>

                        </select>

                    </div>


                    {/* ACADEMIC YEAR */}

                    <div>

                        <label
                            style={
                                labelStyle
                            }
                        >
                            Academic Year
                        </label>


                        <input
                            value={
                                academicYear
                            }
                            onChange={
                                e =>
                                    setAcademicYear(
                                        e.target.value
                                    )
                            }
                            placeholder="2026/2027"
                            style={
                                inputStyle
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    BULK ACTIONS
                ================================================== */}

                <div
                    style={{
                        marginTop:
                            '20px',
                        padding:
                            '15px',
                        border:
                            '1px solid #ddd',
                        borderRadius:
                            '6px',
                        background:
                            '#f8f9fa'
                    }}
                >

                    <strong>
                        Class Report Actions
                    </strong>


                    <div
                        style={{
                            display:
                                'flex',
                            flexWrap:
                                'wrap',
                            gap:
                                '10px',
                            marginTop:
                                '12px'
                        }}
                    >

                        {/* GENERATE ALL */}

                        <button
                            onClick={
                                generateAllReports
                            }
                            disabled={
                                bulkLoading ||
                                zipLoading ||
                                !selectedClass
                            }
                            style={{
                                padding:
                                    '12px 20px',
                                background:
                                    bulkLoading
                                        ? '#95a5a6'
                                        : '#2c3e50',
                                color:
                                    'white',
                                border:
                                    'none',
                                borderRadius:
                                    '5px',
                                cursor:
                                    bulkLoading ||
                                    !selectedClass
                                        ? 'not-allowed'
                                        : 'pointer',
                                fontWeight:
                                    'bold'
                            }}
                        >
                            {
                                bulkLoading
                                    ? 'Generating All...'
                                    : '📄 Generate All Reports'
                            }
                        </button>


                        {/* ZIP */}

                        <button
                            onClick={
                                downloadClassReportsZip
                            }
                            disabled={
                                zipLoading ||
                                bulkLoading ||
                                !selectedClass
                            }
                            style={{
                                padding:
                                    '12px 20px',
                                background:
                                    zipLoading
                                        ? '#95a5a6'
                                        : '#27ae60',
                                color:
                                    'white',
                                border:
                                    'none',
                                borderRadius:
                                    '5px',
                                cursor:
                                    zipLoading ||
                                    bulkLoading ||
                                    !selectedClass
                                        ? 'not-allowed'
                                        : 'pointer',
                                fontWeight:
                                    'bold'
                            }}
                        >
                            {
                                zipLoading
                                    ? `Creating ZIP ${
                                        zipProgress.current
                                    }/${zipProgress.total}`
                                    : '📦 Download Class Reports ZIP'
                            }
                        </button>

                    </div>


                    <p
                        style={{
                            margin:
                                '12px 0 0',
                            fontSize:
                                '12px',
                            color:
                                '#666'
                        }}
                    >
                        Generate All Reports creates or regenerates
                        the saved reports for every student in the
                        selected class. Regeneration also refreshes
                        the class positions of existing reports.
                    </p>

                </div>



{/* =================================================
    GENERATED CLASS REPORTS
================================================== */}

{
    generatedReports.length > 0 && (

        <div
            style={{
                marginTop: '20px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff'
            }}
        >

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}
            >

                <strong>
                    Generated Class Reports
                </strong>

                <span
                    style={{
                        fontSize: '13px',
                        color: '#666'
                    }}
                >
                    {generatedReports.length} report(s)
                </span>

            </div>


            <div
                style={{
                    overflowX: 'auto'
                }}
            >

                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px'
                    }}
                >

                    <thead>

                        <tr>

                            <th style={tableHeader}>
                                #
                            </th>

                            <th style={tableHeader}>
                                Student
                            </th>

                            <th style={tableHeader}>
                                Position
                            </th>

                            <th style={tableHeader}>
                                Total
                            </th>

                            <th style={tableHeader}>
                                Average
                            </th>

                            <th style={tableHeader}>
                                Status
                            </th>

                            <th style={tableHeader}>
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {generatedReports.map(
                            (report, index) => (

                                <tr
                                    key={
                                        report.id ||
                                        report.student_id
                                    }
                                >

                                    <td style={tableCell}>
                                        {index + 1}
                                    </td>


                                    <td
                                        style={{
                                            ...tableCell,
                                            textAlign: 'left',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {
                                            report.full_name ||
                                            `Student ${report.student_id}`
                                        }
                                    </td>


                                    <td style={tableCell}>
                                        {
                                            report.class_position
                                                ? formatPosition(
                                                    report.class_position
                                                )
                                                : '-'
                                        }

                                        {report.class_position &&
                                            ` / ${
                                                report.class_size ||
                                                '-'
                                            }`
                                        }
                                    </td>


                                    <td style={tableCell}>
                                        {
                                            Number(
                                                report.overall_total ||
                                                0
                                            ).toFixed(2)
                                        }
                                    </td>


                                    <td style={tableCell}>
                                        {
                                            Number(
                                                report.overall_average ||
                                                0
                                            ).toFixed(2)
                                        }
                                    </td>


                                    <td style={tableCell}>

                                        <span
                                            style={{
                                                display:
                                                    'inline-block',
                                                padding:
                                                    '4px 8px',
                                                borderRadius:
                                                    '4px',
                                                background:
                                                    report.status ===
                                                    'final'
                                                        ? '#d5f5e3'
                                                        : '#fcf3cf',
                                                color:
                                                    report.status ===
                                                    'final'
                                                        ? '#196f3d'
                                                        : '#7d6608',
                                                fontWeight:
                                                    'bold',
                                                fontSize:
                                                    '12px'
                                            }}
                                        >
                                            {
                                                report.status ||
                                                'draft'
                                            }
                                        </span>

                                    </td>


                                    <td style={tableCell}>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                previewGeneratedReport(
                                                    report.student_id
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                            style={{
                                                padding:
                                                    '7px 12px',
                                                background:
                                                    '#3498db',
                                                color:
                                                    'white',
                                                border:
                                                    'none',
                                                borderRadius:
                                                    '4px',
                                                cursor:
                                                    loading
                                                        ? 'not-allowed'
                                                        : 'pointer',
                                                fontWeight:
                                                    'bold'
                                            }}
                                        >
                                            {
                                                loading &&
                                                String(
                                                    selectedStudent
                                                ) ===
                                                String(
                                                    report.student_id
                                                )
                                                    ? 'Loading...'
                                                    : '👁 Preview'
                                            }
                                        </button>

                                    </td>

                                </tr>
                            )
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    )
}









                {/* =================================================
                    REMARKS
                ================================================== */}

                <div
                    style={{
                        display:
                            'grid',
                        gridTemplateColumns:
                            '1fr 1fr',
                        gap:
                            '15px',
                        marginTop:
                            '20px'
                    }}
                >

                    <div>

                        <label
                            style={
                                labelStyle
                            }
                        >
                            Teacher's Remarks
                        </label>


                        <textarea
                            value={
                                teacherRemarks
                            }
                            onChange={
                                e =>
                                    setTeacherRemarks(
                                        e.target.value
                                    )
                            }
                            placeholder="Enter teacher's remarks..."
                            rows="4"
                            style={{
                                ...inputStyle,
                                width:
                                    '100%',
                                resize:
                                    'vertical'
                            }}
                        />

                    </div>


                    <div>

                        <label
                            style={
                                labelStyle
                            }
                        >
                            Headteacher's Remarks
                        </label>


                        <textarea
                            value={
                                headteacherRemarks
                            }
                            onChange={
                                e =>
                                    setHeadteacherRemarks(
                                        e.target.value
                                    )
                            }
                            placeholder="Enter headteacher's remarks..."
                            rows="4"
                            style={{
                                ...inputStyle,
                                width:
                                    '100%',
                                resize:
                                    'vertical'
                            }}
                        />

                    </div>

                </div>


                {/* =================================================
                    INDIVIDUAL REPORT ACTIONS
                ================================================== */}

                <div
                    style={{
                        display:
                            'flex',
                        flexWrap:
                            'wrap',
                        gap:
                            '10px',
                        marginTop:
                            '20px'
                    }}
                >

                    {/* GENERATE / REGENERATE */}

                    <button
                        onClick={
                            generateReport
                        }
                        disabled={
                            loading ||
                            bulkLoading ||
                            zipLoading ||
                            !selectedStudent
                        }
                        style={{
                            padding:
                                '12px 25px',
                            background:
                                loading
                                    ? '#95a5a6'
                                    : '#2c3e50',
                            color:
                                'white',
                            border:
                                'none',
                            borderRadius:
                                '5px',
                            cursor:
                                loading ||
                                !selectedStudent
                                    ? 'not-allowed'
                                    : 'pointer',
                            fontWeight:
                                'bold'
                        }}
                    >
                        {
                            loading
                                ? 'Generating...'
                                : currentReportId
                                    ? '🔄 Regenerate Report'
                                    : 'Generate Report'
                        }
                    </button>


                    {/* SAVE REMARKS */}

                    <button
                        onClick={
                            saveRemarks
                        }
                        disabled={
                            savingRemarks ||
                            !currentReportId
                        }
                        style={{
                            padding:
                                '12px 25px',
                            background:
                                savingRemarks
                                    ? '#95a5a6'
                                    : '#3498db',
                            color:
                                'white',
                            border:
                                'none',
                            borderRadius:
                                '5px',
                            cursor:
                                savingRemarks ||
                                !currentReportId
                                    ? 'not-allowed'
                                    : 'pointer',
                            fontWeight:
                                'bold'
                        }}
                    >
                        {
                            savingRemarks
                                ? 'Saving...'
                                : '💾 Save Remarks'
                        }
                    </button>


                    {/* FINALIZE */}

                    <button
                        onClick={
                            finalizeReport
                        }
                        disabled={
                            savingRemarks ||
                            !currentReportId ||
                            currentReportStatus ===
                                'final'
                        }
                        style={{
                            padding:
                                '12px 25px',
                            background:
                                currentReportStatus ===
                                'final'
                                    ? '#7f8c8d'
                                    : '#8e44ad',
                            color:
                                'white',
                            border:
                                'none',
                            borderRadius:
                                '5px',
                            cursor:
                                savingRemarks ||
                                !currentReportId ||
                                currentReportStatus ===
                                    'final'
                                    ? 'not-allowed'
                                    : 'pointer',
                            fontWeight:
                                'bold'
                        }}
                    >
                        {
                            currentReportStatus ===
                            'final'
                                ? '✓ Finalized'
                                : '🔒 Finalize Report'
                        }
                    </button>

                </div>

            </div>


            {/* =================================================
                REPORT PREVIEW
            ================================================== */}

            {
                reportData && (

                    <div>

                        {/* DOWNLOAD PDF */}

                        <button
                            onClick={
                                downloadPDF
                            }
                            style={{
                                marginBottom:
                                    '20px',
                                padding:
                                    '12px 25px',
                                background:
                                    '#e67e22',
                                color:
                                    'white',
                                border:
                                    'none',
                                borderRadius:
                                    '5px',
                                cursor:
                                    'pointer',
                                fontWeight:
                                    'bold'
                            }}
                        >
                            📥 Download PDF Report
                        </button>


                        {/* STATUS */}

                        {
                            currentReportId && (
                                <div
                                    style={{
                                        display:
                                            'inline-block',
                                        marginLeft:
                                            '10px',
                                        marginBottom:
                                            '20px',
                                        padding:
                                            '10px 15px',
                                        borderRadius:
                                            '5px',
                                        background:
                                            currentReportStatus ===
                                            'final'
                                                ? '#d5f5e3'
                                                : '#fcf3cf',
                                        color:
                                            currentReportStatus ===
                                            'final'
                                                ? '#196f3d'
                                                : '#7d6608',
                                        fontWeight:
                                            'bold'
                                    }}
                                >
                                    Status:{' '}
                                    {
                                        currentReportStatus
                                    }
                                </div>
                            )
                        }


                        {/* REPORT CARD */}

                        <div
                            id="report-card"
                            style={{
                                width:
                                    '210mm',
                                minHeight:
                                    '297mm',
                                margin:
                                    '0 auto',
                                padding:
                                    '18mm',
                                background:
                                    'white',
                                boxSizing:
                                    'border-box',
                                color:
                                    '#222',
                                fontFamily:
                                    'Arial, sans-serif'
                            }}
                        >

                            {/* SCHOOL HEADER */}

                            <div
                                style={{
                                    textAlign:
                                        'center',
                                    borderBottom:
                                        '3px double #222',
                                    paddingBottom:
                                        '12px'
                                }}
                            >

                                {
                                    (
                                        reportData
                                            .school
                                            ?.logo_url ||
                                        schoolInfo
                                            .logo_url
                                    ) && (

                                        <img
                                            src={
                                                getImageUrl(
                                                    reportData
                                                        .school
                                                        ?.logo_url ||
                                                    schoolInfo
                                                        .logo_url
                                                )
                                            }
                                            alt="School Logo"
                                            crossOrigin="anonymous"
                                            style={{
                                                width:
                                                    '75px',
                                                height:
                                                    '75px',
                                                objectFit:
                                                    'contain',
                                                marginBottom:
                                                    '5px'
                                            }}
                                        />

                                    )
                                }


                                <h1
                                    style={{
                                        margin:
                                            0,
                                        fontSize:
                                            '24px',
                                        textTransform:
                                            'uppercase'
                                    }}
                                >
                                    {
                                        reportData
                                            .school
                                            ?.school_name ||
                                        schoolInfo
                                            .school_name ||
                                        'School Name'
                                    }
                                </h1>


                                {
                                    (
                                        reportData
                                            .school
                                            ?.motto ||
                                        schoolInfo
                                            .motto
                                    ) && (

                                        <p
                                            style={{
                                                fontStyle:
                                                    'italic',
                                                margin:
                                                    '5px 0'
                                            }}
                                        >
                                            "
                                            {
                                                reportData
                                                    .school
                                                    ?.motto ||
                                                schoolInfo
                                                    .motto
                                            }
                                            "
                                        </p>

                                    )
                                }


                                <p
                                    style={{
                                        fontSize:
                                            '12px',
                                        margin:
                                            '4px 0'
                                    }}
                                >
                                    {
                                        reportData
                                            .school
                                            ?.address ||
                                        schoolInfo
                                            .address
                                    }
                                </p>


                                <p
                                    style={{
                                        fontSize:
                                            '12px',
                                        margin:
                                            '4px 0'
                                    }}
                                >
                                    {
                                        reportData
                                            .school
                                            ?.phone ||
                                        schoolInfo
                                            .phone
                                    }

                                    {' | '}

                                    {
                                        reportData
                                            .school
                                            ?.email ||
                                        schoolInfo
                                            .email
                                    }
                                </p>


                                <h2
                                    style={{
                                        margin:
                                            '12px 0 0',
                                        fontSize:
                                            '18px',
                                        letterSpacing:
                                            '1px'
                                    }}
                                >
                                    STUDENT PROGRESS REPORT
                                </h2>

                            </div>


                            {/* STUDENT INFORMATION */}

                            <div
                                style={{
                                    display:
                                        'flex',
                                    justifyContent:
                                        'space-between',
                                    alignItems:
                                        'center',
                                    marginTop:
                                        '18px',
                                    padding:
                                        '12px',
                                    border:
                                        '1px solid #ccc'
                                }}
                            >

                                <div
                                    style={{
                                        lineHeight:
                                            '1.8'
                                    }}
                                >

                                    <div>

                                        <strong>
                                            Student:
                                        </strong>{' '}

                                        {
                                            reportData
                                                .profile
                                                .full_name
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Class:
                                        </strong>{' '}

                                        {
                                            reportData
                                                .profile
                                                .current_class
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Academic Year:
                                        </strong>{' '}

                                        {
                                            reportData
                                                .report
                                                .academic_year
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Report:
                                        </strong>{' '}

                                        {
                                            selectedTerm
                                        }

                                    </div>

                                </div>


                                {/* PASSPORT PHOTO */}

                                {
                                    reportData
                                        .profile
                                        .passport_photo_url
                                        ? (

                                            <img
                                                src={
                                                    getImageUrl(
                                                        reportData
                                                            .profile
                                                            .passport_photo_url
                                                    )
                                                }
                                                alt="Student"
                                                crossOrigin="anonymous"
                                                style={{
                                                    width:
                                                        '85px',
                                                    height:
                                                        '100px',
                                                    objectFit:
                                                        'cover',
                                                    border:
                                                        '1px solid #555'
                                                }}
                                            />

                                        )
                                        : (

                                            <div
                                                style={{
                                                    width:
                                                        '85px',
                                                    height:
                                                        '100px',
                                                    border:
                                                        '1px solid #aaa',
                                                    display:
                                                        'flex',
                                                    alignItems:
                                                        'center',
                                                    justifyContent:
                                                        'center',
                                                    fontSize:
                                                        '10px',
                                                    color:
                                                        '#777',
                                                    textAlign:
                                                        'center'
                                                }}
                                            >
                                                Passport
                                                <br />
                                                Photo
                                            </div>

                                        )
                                }

                            </div>


                            {/* TERM REPORT */}

                            {
                                reportData
                                    .report
                                    .type ===
                                'term'
                                    ? (

                                        <>

                                            <div
                                                style={{
                                                    marginTop:
                                                        '20px',
                                                    background:
                                                        '#343a40',
                                                    color:
                                                        'white',
                                                    padding:
                                                        '9px 12px',
                                                    fontWeight:
                                                        'bold'
                                                }}
                                            >
                                                {
                                                    reportData
                                                        .report
                                                        .term
                                                }
                                            </div>


                                            {
                                                renderMarksTable(
                                                    reportData
                                                        .marks
                                                )
                                            }


                                            <div
                                                style={{
                                                    display:
                                                        'grid',
                                                    gridTemplateColumns:
                                                        'repeat(4, 1fr)',
                                                    gap:
                                                        '8px',
                                                    marginTop:
                                                        '15px'
                                                }}
                                            >

                                                <SummaryBox
                                                    label="Total"
                                                    value={
                                                        reportData
                                                            .report
                                                            .overall_total
                                                    }
                                                />

                                                <SummaryBox
                                                    label="Average"
                                                    value={
                                                        reportData
                                                            .report
                                                            .overall_average
                                                    }
                                                />

                                                <SummaryBox
                                                    label="Class Position"
                                                    value={
                                                        reportData
                                                            .report
                                                            .class_position
                                                            ? `${formatPosition(
                                                                reportData
                                                                    .report
                                                                    .class_position
                                                            )} / ${
                                                                reportData
                                                                    .report
                                                                    .class_size
                                                            }`
                                                            : '-'
                                                    }
                                                />

                                                <SummaryBox
                                                    label="Attendance"
                                                    value={
                                                        `${reportData.attendance.percentage}%`
                                                    }
                                                />

                                            </div>


                                            {/* ATTENDANCE */}

                                            <div
                                                style={{
                                                    marginTop:
                                                        '15px',
                                                    border:
                                                        '1px solid #ccc',
                                                    padding:
                                                        '12px'
                                                }}
                                            >

                                                <strong>
                                                    Attendance
                                                </strong>


                                                <div
                                                    style={{
                                                        marginTop:
                                                            '8px',
                                                        display:
                                                            'flex',
                                                        justifyContent:
                                                            'space-between'
                                                    }}
                                                >

                                                    <span>
                                                        School Days:{' '}
                                                        {
                                                            reportData
                                                                .attendance
                                                                .total_days
                                                        }
                                                    </span>


                                                    <span>
                                                        Present:{' '}
                                                        {
                                                            reportData
                                                                .attendance
                                                                .present_days
                                                        }
                                                    </span>


                                                    <span>
                                                        Absent:{' '}
                                                        {
                                                            reportData
                                                                .attendance
                                                                .absent_days
                                                        }
                                                    </span>


                                                    <span>
                                                        Late:{' '}
                                                        {
                                                            reportData
                                                                .attendance
                                                                .late_days
                                                        }
                                                    </span>


                                                    <span>
                                                        {
                                                            reportData
                                                                .attendance
                                                                .percentage
                                                        }%
                                                    </span>

                                                </div>

                                            </div>

                                        </>

                                    )
                                    : (

                                        renderFullYear()

                                    )
                            }


                            {/* REMARKS */}

                            <div
                                style={{
                                    marginTop:
                                        '25px'
                                }}
                            >

                                <h3
                                    style={{
                                        borderBottom:
                                            '1px solid #333',
                                        paddingBottom:
                                            '5px'
                                    }}
                                >
                                    Remarks
                                </h3>


                                <div
                                    style={{
                                        minHeight:
                                            '55px',
                                        border:
                                            '1px solid #ccc',
                                        padding:
                                            '10px',
                                        marginBottom:
                                            '12px'
                                    }}
                                >

                                    <strong>
                                        Teacher's Remarks:
                                    </strong>


                                    <div
                                        style={{
                                            marginTop:
                                                '8px'
                                        }}
                                    >
                                        {
                                            teacherRemarks ||
                                            '—'
                                        }
                                    </div>

                                </div>


                                <div
                                    style={{
                                        minHeight:
                                            '55px',
                                        border:
                                            '1px solid #ccc',
                                        padding:
                                            '10px'
                                    }}
                                >

                                    <strong>
                                        Headteacher's Remarks:
                                    </strong>


                                    <div
                                        style={{
                                            marginTop:
                                                '8px'
                                        }}
                                    >
                                        {
                                            headteacherRemarks ||
                                            '—'
                                        }
                                    </div>

                                </div>

                            </div>


                            {/* SIGNATURES */}

                            <div
                                style={{
                                    display:
                                        'flex',
                                    justifyContent:
                                        'space-between',
                                    marginTop:
                                        '55px'
                                }}
                            >

                                <div
                                    style={{
                                        width:
                                            '40%',
                                        textAlign:
                                            'center'
                                    }}
                                >

                                    <div
                                        style={{
                                            borderTop:
                                                '1px solid #333',
                                            paddingTop:
                                                '5px'
                                        }}
                                    >
                                        Class Teacher
                                    </div>

                                </div>


                                <div
                                    style={{
                                        width:
                                            '40%',
                                        textAlign:
                                            'center'
                                    }}
                                >

                                    <div
                                        style={{
                                            borderTop:
                                                '1px solid #333',
                                            paddingTop:
                                                '5px'
                                        }}
                                    >
                                        Headteacher
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>
    );
}


// =====================================================
// SMALL COMPONENTS / STYLES
// =====================================================

function SummaryBox({
    label,
    value
}) {

    return (
        <div
            style={{
                border:
                    '1px solid #ccc',
                padding:
                    '10px',
                textAlign:
                    'center',
                background:
                    '#fafafa'
            }}
        >

            <div
                style={{
                    fontSize:
                        '11px',
                    color:
                        '#666',
                    marginBottom:
                        '4px'
                }}
            >
                {
                    label
                }
            </div>


            <strong>
                {
                    value
                }
            </strong>

        </div>
    );
}


const labelStyle = {
    display:
        'block',

    fontWeight:
        'bold',

    marginBottom:
        '6px',

    fontSize:
        '13px'
};


const inputStyle = {
    width:
        '100%',

    padding:
        '10px',

    border:
        '1px solid #ccc',

    borderRadius:
        '5px',

    boxSizing:
        'border-box',

    background:
        'white'
};


const tableHeader = {
    border:
        '1px solid #999',

    padding:
        '7px',

    textAlign:
        'center'
};


const tableCell = {
    border:
        '1px solid #999',

    padding:
        '7px',

    textAlign:
        'center'
};


const tableCellLeft = {
    border:
        '1px solid #999',

    padding:
        '7px',

    textAlign:
        'left'
};











